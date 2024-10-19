import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { GenConstants } from '@/common/constant/gen';
import { addDateRangeConditions, buildQueryCondition, formatDate, nowDateTime, toPascalCase } from '@/common/utils';
import { PrismaService } from '@/module/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import archiver from 'archiver';
import { isNotEmpty } from 'class-validator';
import { Response } from 'express';
import { camelCase, kebabCase, toLower, upperFirst } from 'lodash';
import { queryDataBaseDto } from './dto/queryDatabaseDto';
import { queryGenTableDto } from './dto/queryGenTableDto';
import { getControllerTemplate } from './gen-template/nestjs/controller';
import { getDtoTemplate } from './gen-template/nestjs/dto';
import { getModuleTemplate } from './gen-template/nestjs/module';
import { getServiceTemplate } from './gen-template/nestjs/service';
import { getSqlTemplate } from './gen-template/nestjs/sql';
import { getPrismaSeedData } from './gen-template/prisma/data';
import { getVueTemplate } from './gen-template/vue';
import { getApiTemplate } from './gen-template/vue/api';
import { ColumnInfo, Table } from './types';

@Injectable()
export class GenService {
  constructor(private readonly prisma: PrismaService, private readonly configService: ConfigService) {}

  // 查询生成表数据
  async listTable(q: queryGenTableDto) {
    const conditions = {
      tableName: () => ({ contains: q.tableName }),
      tableComment: () => ({ contains: q.tableComment }),
    };

    const queryCondition = buildQueryCondition<queryGenTableDto, Prisma.GenTableWhereInput>(q, conditions);

    // 对于时间范围的特殊处理，保持不变以确保逻辑的准确性
    if (isNotEmpty(q.params.beginTime) && isNotEmpty(q.params.endTime)) {
      queryCondition.createTime = {
        gte: q.params.beginTime,
        lte: q.params.endTime,
      };
    }

    const dataRange: Record<string, [string, string]> = {
      createTime: ['beginTime', 'endTime'],
    };

    addDateRangeConditions(queryCondition, q, dataRange);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.genTable.findMany({
        skip: (q.pageNum - 1) * q.pageSize,
        take: q.pageSize,
        where: queryCondition,
        orderBy: {
          updateTime: 'desc',
        },
      }),
      this.prisma.genTable.count({
        where: queryCondition,
      }),
    ]);

    return { rows, total };
  }

  // 查询db数据库列表
  async listDbTable(q: queryDataBaseDto) {
    const params = [];
    let baseSql = `
      FROM information_schema.tables
      WHERE table_schema = (select database())
        AND table_name NOT LIKE 'qrtz_%'
        AND table_name NOT LIKE 'gen_%'
        AND table_name NOT IN (select table_name from gen_table)
    `;

    if (isNotEmpty(q.tableName)) {
      baseSql += ' AND table_name LIKE CONCAT("%", ?,"%") ';
      params.push(q.tableName);
    }

    if (isNotEmpty(q.tableComment)) {
      baseSql += ' AND table_comment LIKE CONCAT("%", ?,"%") ';
      params.push(q.tableComment);
    }

    const sql = `
      SELECT table_name AS tableName, table_comment AS tableComment, create_time AS createTime, update_time AS updateTime
      ${baseSql}
      ORDER BY create_time DESC, update_time DESC
      LIMIT ${(q.pageNum - 1) * q.pageSize}, ${q.pageSize}
    `;

    const sqlCount = `
      SELECT COUNT(*) AS total
      ${baseSql}
    `;

    const [rows, totalResult] = await this.prisma.$transaction([
      this.prisma.$queryRawUnsafe<Table[]>(sql, ...params),
      this.prisma.$queryRawUnsafe<{ total: number }[]>(sqlCount, ...params),
    ]);

    const formattedRows = rows.map(v => ({
      ...v,
      createTime: formatDate(v.createTime),
      updateTime: formatDate(v.updateTime),
    }));

    return {
      rows: formattedRows,
      total: Number(totalResult[0]?.total ?? 0),
    };
  }

  // 修改代码生成信息
  async updateGenTable(info: any) {
    if (!info) { throw new BadRequestException('请传入数据！'); }

    // 处理 options 字段
    if (info.params?.parentMenuId) {
      info.options = JSON.stringify({ parentMenuId: info.params.parentMenuId });
    }

    // 准备 columns 数据，移除不需要的属性并设置更新信息
    const columns = info.columns?.map(column => ({
      ...column,
      updateTime: nowDateTime(),
      updateBy: 'admin',
      // 使用解构和 rest 操作符移除不需要的属性
      pk: undefined,
      increment: undefined,
      required: undefined,
      insert: undefined,
      edit: undefined,
      list: undefined,
      query: undefined,
    }));

    // 准备更新 genTable 的数据，移除不需要的属性
    const { tableId, columns: _, dicts, tableColumns, columnsKey, parentMenuId, BusinessName, pkName, UpperPkName, pkColumn, dictsNoSymbol, params, ...updateData } = info;

    // 使用事务处理更新操作
    return this.prisma.$transaction(async (prisma) => {
      await prisma.genTable.update({
        where: { tableId },
        data: updateData,
      });
      // 批量更新 columns，如果 columnId 存在
      await Promise.all(columns.map(column =>
        prisma.genTableColumn.update({
          where: { columnId: column.columnId },
          data: column,
        })));
    });
  }

  // 导入表
  async importTable(tableNames: string[]) {
    if (!tableNames?.length) { return null; }
    return this.prisma.$transaction(async (prisma) => {
      // 获取表的基本信息
      const tableList: Table[] = await this.selectDbTableListByNames(tableNames);

      for (const table of tableList) {
        const tableName = table.tableName;
        const baseClassName = tableName.replace(new RegExp(this.configService.get('gen.tablePrefix').join('|')), '');
        const className = this.configService.get('gen.autoRemovePre') ? toPascalCase(baseClassName) : toPascalCase(tableName);

        // 初始化table表信息，并插入数据库
        let tableInfo = {
          ...table,
          className,
          packageName: this.configService.get('gen.packageName'), // 生成模块路径
          moduleName: this.configService.get('gen.moduleName'), // 子系统名，模块下的目录
          businessName: tableName.slice(tableName.lastIndexOf('_') + 1), // 生成业务名
          tableComment: table.tableComment?.trim() || table.tableName,
          functionName: table.tableComment?.trim() || table.tableName, // 生成功能名
          functionAuthor: this.configService.get('gen.author'), // 作者
          tplWebType: 'element-plus',
          tplCategory: 'crud',
          genType: '0',
          genPath: '/',
          createBy: 'admin',
          updateBy: 'admin',
          createTime: nowDateTime(),
          updateTime: nowDateTime(),
        };

        // 插入表信息
        tableInfo = await prisma.genTable.create({
          data: tableInfo,
        });

        // 获取表的列信息，初始化并插入数据库
        const tableColumn: any = await this.getTableColumnInfo(tableName);
        const columnData = tableColumn.map((column) => {
          this.initTableColumn(column, tableInfo);
          column.sort = Number(column.sort);
          return column;
        });

        await prisma.genTableColumn.createMany({
          data: columnData,
        });
      }
    });
  }

  // 删除表数据
  async delTable(ids: number[]) {
    return this.prisma.$transaction(async (prisma) => {
      // 删除tableColumn表信息
      await prisma.genTableColumn.deleteMany({
        where: {
          tableId: {
            in: ids,
          },
        },
      });
      // 删除table表信息
      await prisma.genTable.deleteMany({
        where: {
          tableId: {
            in: ids,
          },
        },
      });

      return true;
    });
  }

  // 生成代码压缩包
  async genCode(tableNames: string[], res: Response) {
    try {
      // eslint-disable-next-line no-console
      console.log('代码生成中...', tableNames.join(','));

      this.cleanTempDirectory();

      for (const tableName of tableNames) {
        const info = await this.getTableInfoByTableName(tableName);
        this.prepareTableInfo(info);
        const data = this.prepareTemplateData(info);
        const paths = this.prepareFilePaths(data);
        this.writeFiles(paths, data);
      }

      // eslint-disable-next-line no-console
      console.log('代码生成完毕！');
      this.sendResponse(res);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
      res.end();
    }
  }

  // 预览生成代码
  async previewTable(tableId: number) {
    const info = await this.getTableInfoById(tableId);

    const data = this.prepareTemplateData(info);

    return {
      'gen-template/nestjs/service.ts.vm': getServiceTemplate(data),
      'gen-template/nestjs/module.ts.vm': getModuleTemplate(data),
      'gen-template/nestjs/controller.ts.vm': getControllerTemplate(data),
      'gen-template/nestjs/dto.ts.vm': getDtoTemplate(data),
      'gen-template/vue/index.vue.vm': getVueTemplate(data).replace(/(\n\s*\n)+/g, '\n'),
      'gen-template/js/api.js.vm': getApiTemplate(data),
      'gen-template/sql/sql.vm': getSqlTemplate(data),
      'gen-template/prisma/data.ts.vm': getPrismaSeedData(data),
    };
  }

  cleanTempDirectory() {
    const tempPath = join(__dirname, 'temp');
    if (existsSync(tempPath)) {
      try {
        rmSync(tempPath, { recursive: true });
      } catch (e) {
      // eslint-disable-next-line no-console
        console.log(e);
      }
    }
  }

  prepareTableInfo(info) {
    info.columns.forEach((v) => {
      v.columnComment = v.columnComment || v.columnName;
    });
  }

  prepareTemplateData(info) {
    return {
      ...info,
      modelName: camelCase(info.tableName),
      modelName1: toPascalCase(info.tableName),
      filename: kebabCase(info.tableName),
      entityName: camelCase(info.className),
      columnNames: JSON.stringify(info.columns?.map(v => v.columnComment || v.columnName) || []),
      hasCreateTime: info.columnsKey.includes('create_time'),
      hasUpdateTime: info.columnsKey.includes('update_time'),
      hasBaseDomain: info.columnsKey.includes('create_time')
        && info.columnsKey.includes('update_time')
        && info.columnsKey.includes('create_by')
        && info.columnsKey.includes('update_by'),
    };
  }

  prepareFilePaths(data) {
    return {
      servicePath: join(__dirname, `temp/nestjs/${data.filename}.service.ts`),
      controllerPath: join(__dirname, `temp/nestjs/${data.filename}.controller.ts`),
      dtoPath: join(__dirname, `temp/nestjs/${data.filename}.dto.ts`),
      vuePath: join(__dirname, `temp/vue/${data.businessName}/index.vue`),
      apiPath: join(__dirname, `temp/vue/${data.businessName}.js`),
      sqlPath: join(__dirname, `temp/${data.businessName}.sql`),
      modulePath: join(__dirname, `temp/nestjs/${data.filename}.module.ts`),
      dataPath: join(__dirname, 'temp/prisma/data.ts'),
    };
  }

  writeFiles(paths, data) {
    writeFile(paths.servicePath, getServiceTemplate(data));
    writeFile(paths.controllerPath, getControllerTemplate(data));
    writeFile(paths.dtoPath, getDtoTemplate(data));
    writeFile(paths.modulePath, getModuleTemplate(data));
    writeFile(paths.vuePath, getVueTemplate(data).replace(/(\n\s*\n)+/g, '\n'));
    writeFile(paths.apiPath, getApiTemplate(data));
    writeFile(paths.sqlPath, getSqlTemplate(data));
    writeFile(paths.dataPath, getPrismaSeedData(data));
  }

  sendResponse(res) {
    res.setHeader('content-type', 'application/octet-stream;charset=UTF-8');
    res.setHeader('content-disposition', 'attachment;filename="code.zip"');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Transfer-Encoding', 'chunked');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    archive.directory(join(__dirname, 'temp'), false);
    archive.on('error', (err) => {
    // eslint-disable-next-line no-console
      console.log(err);
      res.end();
    });
    res.on('close', () => res.end());
    archive.finalize();
  }

  // 同步数据库,  我们导入了需要生成代码的数据表，但是我们更改了数据库的结构（比如删除了一些字段，和添加了一些字段），同步更新表数据
  async synchDb(tableName: string) {
    return this.prisma.$transaction(async (prisma) => {
      const table = await this.getTableInfoByTableName(tableName);
      if (!table) { throw new BadRequestException('同步数据失败，原表结构不存在！'); }

      const tableColumns = table.tableColumns;
      const columns = await this.getTableColumnInfo(tableName) as Array<ColumnInfo & {
        columnId: number
        dictType: string
        queryType: string
        isList: string
      }>; // 假设 ColumnType 是你定义的类型
      if (!columns || !columns.length) { throw new BadRequestException('同步数据失败，原表结构不存在！'); }

      const tableColumnMap = tableColumns.reduce((acc, v) => ({ ...acc, [v.columnName]: v }), {});
      const updatePromises = columns.map((column) => {
        this.initTableColumn(column, table);
        column.sort = Number(column.sort); // 假设这是正确的属性

        if (tableColumnMap[column.columnName]) {
          const prevColumn = tableColumnMap[column.columnName];
          column.columnId = prevColumn.columnId;
          if (column.isList === '1') {
            column.dictType = prevColumn.dictType;
            column.queryType = prevColumn.queryType;
          }
          return prisma.genTableColumn.update({
            where: { columnId: column.columnId },
            data: column,
          });
        } else {
          return prisma.genTableColumn.create({ data: column });
        }
      });

      await Promise.all(updatePromises);

      const delColumns = tableColumns
        .filter(v => !columns.some(z => z.columnName === v.columnName))
        .map(v => v.columnId);

      if (delColumns.length > 0) {
        await prisma.genTableColumn.deleteMany({
          where: { columnId: { in: delColumns } },
        });
      }
    });
  }

  // 批量获取表的基本信息（包含注释）
  selectDbTableListByNames(names: string[]) {
    if (!names.length) { return null; }

    // 创建参数占位符
    const placeholders = names.map(() => '?').join(',');

    // 构建SQL查询
    const query = `
      select table_name as tableName, table_comment as tableComment, create_time as createTime, update_time as updateTime 
      from information_schema.tables
      where table_schema = (select database())
      and table_name NOT LIKE 'qrtz_%' and table_name NOT LIKE 'gen_%'
      and table_name NOT IN (select table_name from gen_table)
      and table_name IN (${placeholders})
    `;

    // 使用参数化查询执行
    return this.prisma.$queryRawUnsafe<Table[]>(query, ...names);
  }

  // 根据表名获取表的字段信息以及注释
  async getTableColumnInfo(tableName: string) {
    if (!tableName) { return null; }
    return this.prisma.$queryRaw<
      ColumnInfo[]
    >`select column_name as columnName, (case when (is_nullable = 'no' && column_key != 'PRI')  
    then '1' else '0' end) as isRequired, (case when column_key = 'PRI' then '1' else '0' end) as isPk,
     ordinal_position as sort, column_comment as columnComment, (case when extra = 'auto_increment' then '1' else '0' end) 
    as isIncrement, column_type as columnType from information_schema.columns  
    where table_schema = (select database()) and table_name = ${tableName} order by ordinal_position`;
  }

  // 根据id查询表详细信息
  async getTableInfoById(id: number) {
    const tableInfo = await this.prisma.genTable
      .findFirst({
        where: { tableId: id },
        include: { tableColumns: true },
      });

    if (!tableInfo) { return null; }

    const tableColumns = tableInfo.tableColumns.map(this.processColumn);
    const { dicts, dictsNoSymbol } = this.extractDicts(tableColumns);
    const pkColumn = tableColumns.find(v => v.pk && v.increment) || tableColumns[0];
    const options = JSON.parse(tableInfo.options || '{}');
    const parentMenuId = +options.parentMenuId || 0;

    return {
      ...tableInfo,
      dicts,
      dictsNoSymbol,
      columns: tableColumns,
      columnsKey: JSON.stringify(tableColumns.map(v => v.columnName)),
      parentMenuId,
      BusinessName: upperFirst(tableInfo.businessName),
      pkColumn,
      pkName: pkColumn.javaField,
      UpperPkName: upperFirst(pkColumn.javaField),
    };
  }

  // 根据表名查询表详细信息
  async getTableInfoByTableName(tableName: string) {
    const tableInfo = await this.prisma.genTable
      .findFirst({
        where: { tableName },
        include: { tableColumns: true },
      });
    if (!tableInfo) { return null; }

    const tableColumns = tableInfo.tableColumns.map(this.processColumn);
    const { dicts, dictsNoSymbol } = this.extractDicts(tableColumns);
    const pkColumn = tableColumns.find(column => !!+column.isPk && !!+column.isIncrement) || tableColumns[0];

    const options = JSON.parse(tableInfo.options || '{}');
    const parentMenuId = options.parentMenuId ? +options.parentMenuId : 0;

    return {
      ...tableInfo,
      dicts,
      dictsNoSymbol,
      columns: tableColumns,
      columnsKey: JSON.stringify(tableColumns.map(column => column.columnName)),
      parentMenuId,
      BusinessName: upperFirst(tableInfo.businessName),
      pkColumn,
      pkName: pkColumn.javaField,
      UpperPkName: upperFirst(pkColumn.javaField),
    };
  }

  // 处理列信息的公共方法
  private processColumn(column) {
    const { isPk, isIncrement, isRequired, isInsert, isEdit, isList, isQuery } = column;
    return {
      ...column,
      pk: !!+isPk,
      increment: !!+isIncrement,
      required: !!+isRequired,
      insert: !!+isInsert,
      edit: !!+isEdit,
      list: !!+isList,
      query: !!+isQuery,
    };
  }

  // 处理字典信息的公共方法
  private extractDicts(columns) {
    const dicts = [];
    columns.forEach((column) => {
      if (column.dictType) {
        dicts.push(`"${column.dictType}"`);
      }
    });
    return {
      dicts: dicts.join(','),
      dictsNoSymbol: dicts.join(',').replace(/"|'/g, ''),
    };
  }

  // 初始化表列的字段信息
  initTableColumn(column, table) {
    const columnName = column.columnName;
    const dataType = column.columnType;
    const lowerColumnName = toLower(columnName);

    column.tableId = table.tableId;
    column.javaField = camelCase(columnName);
    column.javaType = GenConstants.TYPE_STRING;
    column.queryType = GenConstants.QUERY_EQ;
    column.createBy = column.createBy || 'admin';
    column.columnComment = column.columnComment || column.columnName;
    column.createTime = column.createTime || nowDateTime();
    column.updateBy = 'admin';
    column.updateTime = nowDateTime();
    column.isInsert = GenConstants.REQUIRE;

    // 根据数据类型设置字段属性
    if (arraysContains(GenConstants.COLUMNTYPE_TEXT, dataType)) {
      column.htmlType = GenConstants.HTML_TEXTAREA;
    } else if (arraysContains(GenConstants.COLUMNTYPE_STR, dataType)) {
      const len = getColumnLength(dataType);
      column.htmlType = len >= 500 ? GenConstants.HTML_TEXTAREA : GenConstants.HTML_INPUT;
    } else if (arraysContains(GenConstants.COLUMNTYPE_TIME, dataType)) {
      column.javaType = GenConstants.TYPE_DATE;
      column.htmlType = GenConstants.HTML_DATETIME;
    } else if (arraysContains(GenConstants.COLUMNTYPE_NUMBER, dataType)) {
      column.htmlType = GenConstants.HTML_INPUT;
      column.javaType = GenConstants.TYPE_NUMBER;
    }

    // 设置编辑字段
    if (!arraysContains(GenConstants.COLUMNNAME_NOT_EDIT, columnName) && column.isPk != 1) {
      column.isEdit = GenConstants.REQUIRE;
    }

    // 设置列表字段
    if (!arraysContains(GenConstants.COLUMNNAME_NOT_LIST, columnName) && column.isPk != 1) {
      column.isList = GenConstants.REQUIRE;
    }

    // 设置查询字段
    if (!arraysContains(GenConstants.COLUMNNAME_NOT_QUERY, columnName) && column.isPk != 1 && column.htmlType != GenConstants.HTML_TEXTAREA) {
      column.isQuery = GenConstants.REQUIRE;
    }

    // 根据列名设置字段属性
    if (lowerColumnName.includes('name')) {
      column.queryType = GenConstants.QUERY_LIKE;
    }
    if (lowerColumnName.includes('status')) {
      column.htmlType = GenConstants.HTML_RADIO;
    } else if (lowerColumnName.includes('type') || lowerColumnName.includes('sex')) {
      column.htmlType = GenConstants.HTML_SELECT;
    } else if (lowerColumnName.includes('time') || lowerColumnName.includes('_date') || lowerColumnName.includes('Date')) {
      column.htmlType = GenConstants.HTML_DATETIME;
      column.queryType = GenConstants.QUERY_BETWEEN;
    } else if (lowerColumnName.includes('image')) {
      column.htmlType = GenConstants.HTML_IMAGE_UPLOAD;
    } else if (lowerColumnName.includes('file')) {
      column.htmlType = GenConstants.HTML_FILE_UPLOAD;
    } else if (lowerColumnName.includes('content')) {
      column.htmlType = GenConstants.HTML_EDITOR;
    }
  }

  /** @desc 运行任意sql */
  excute(sql: string) {
    const sqls = sql.split(';').filter(v => !!v.trim());
    return this.prisma.$transaction(async (db) => {
      const res = [];
      for (const sql of sqls) {
        res.push(sql.includes('select')
          ? await db.$queryRawUnsafe(sql)
          : await db.$executeRawUnsafe(sql));
      }
      return res;
    });
  }
}

/** 检查数据中是有某个值在str中包含 */
function arraysContains(arr = [], str = '') {
  return arr.some(v => v.includes(str) || str.includes(v));
}

/** 获取数据库varchar（）括号的长度 */
function getColumnLength(str = '') {
  if (str.includes('(')) {
    return +str.slice(str.indexOf('(') + 1, str.indexOf(')'));
  } else {
    return 0;
  }
}

/** 递归创建目录 */
function mkdir(dir) {
  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  } catch {}
}

/** 写入文件数据，并且同时创建目录 */
function writeFile(p, data) {
  mkdir(dirname(p));
  writeFileSync(p, data);
}
