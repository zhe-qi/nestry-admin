export function getServiceTemplate(data: Record<string, any>) {
  const { className, functionName, UpperPkName, columnNames, modelName1, entityName, BusinessName, pkName, pkColumn, columns } = data;

  const createQueryCondition = () => {
    return columns.map((column) => {
      const { queryType, javaField } = column;
      let condition = '';
      if (column.query) {
        switch (queryType) {
            case 'EQ':
              condition = `if (isNotEmpty(q["${javaField}"])) { queryCondition.${javaField} = { equals: q.${javaField} } }`;
              break;
            case 'NE':
              condition = `if (isNotEmpty(q["${javaField}"])) { queryCondition.${javaField} = { not: q.${javaField} } }`;
              break;
            case 'GT':
              condition = `if (isNotEmpty(q["${javaField}"])) { queryCondition.${javaField} = { gt: q.${javaField} } }`;
              break;
            case 'GTE':
              condition = `if (isNotEmpty(q["${javaField}"])) { queryCondition.${javaField} = { gte: q.${javaField} } }`;
              break;
            case 'LT':
              condition = `if (isNotEmpty(q["${javaField}"])) { queryCondition.${javaField} = { lt: q.${javaField} } }`;
              break;
            case 'LTE':
              condition = `if (isNotEmpty(q["${javaField}"])) { queryCondition.${javaField} = { lte: q.${javaField} } }`;
              break;
            case 'LIKE':
              condition = `if (isNotEmpty(q["${javaField}"])) { queryCondition.${javaField} = { contains: q.${javaField} } }`;
              break;
            case 'BETWEEN':
              condition = `if (isNotEmpty(q.params.begin${javaField}) && isNotEmpty(q.params.end${javaField})) { queryCondition.${javaField} = { lte: q.params.end${javaField}, gte: q.params.begin${javaField} } }`;
              break;
        }
      }
      return condition;
    }).filter(Boolean).join('\n    ');
  };

  const handleEmptyFields = (_isUpdate = false) => {
    return columns.map((column) => {
      if ((column.columnName !== pkColumn.columnName || !pkColumn.increment) && column.columnName !== 'uuid') {
        return `if (isEmpty(${entityName}["${column.javaField}"])) { delete ${entityName}["${column.javaField}"]; }`;
      }
      return '';
    }).filter(Boolean).join('\n    ');
  };

  return `import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/module/prisma/prisma.service';
import { Response } from 'express';
import { exportTable } from '@/common/utils/export';
import { Query${className}Dto, Create${className}Dto, Update${className}Dto } from './dto';
import { Prisma } from '@prisma/client';
import { isNotEmpty, isEmpty } from 'class-validator';

@Injectable()
export class ${className}Service {
  constructor(private prisma: PrismaService) {}

  /** @description 查询${functionName}所有 */
  async select${BusinessName}All() {
    return this.prisma.${modelName1}.findMany();
  }

  /** @description 分页查询${functionName}列表 */
  async select${BusinessName}List(q: Query${className}Dto) {
    let queryCondition: Prisma.${modelName1}WhereInput = {};
    ${createQueryCondition()}
    return {
      rows: await this.prisma.${modelName1}.findMany({
        skip: (q.pageNum - 1) * q.pageSize,
        take: q.pageSize,
        where: queryCondition,
      }),
      total: await this.prisma.${modelName1}.count({
        where: queryCondition,
      }),
    };
  }

  /** @description 查询${functionName}详情 */
  async select${BusinessName}By${UpperPkName}(${pkName}: ${pkColumn.javaType.toLowerCase()}) {
    return this.prisma.${modelName1}.findUnique({
      where: { ${pkName} },
    });
  }

  /** @description 新增${functionName} */
  async add${BusinessName}(${entityName}: Create${className}Dto) {
    ${handleEmptyFields()}
    return await this.prisma.${modelName1}.create({
      data: ${entityName},
    });
  }

  /** @description 修改${functionName} */
  async update${BusinessName}(${entityName}: Update${className}Dto) {
    ${handleEmptyFields(true)}
    return await this.prisma.${modelName1}.update({
      where: { ${pkName}: ${entityName}.${pkName} },
      data: ${entityName},
    });
  }

  /** @description 批量删除${functionName} */
  async delete${BusinessName}By${UpperPkName}s(${pkName}s: ${pkColumn.javaType.toLowerCase()}[]) {
    return this.prisma.${modelName1}.deleteMany({
      where: { ${pkName}: { in: ${pkName}s } },
    });
  }

  /** @description 单个删除${functionName} */
  async delete${BusinessName}By${UpperPkName}(${pkName}: ${pkColumn.javaType.toLowerCase()}) {
    return this.prisma.${modelName1}.delete({
      where: { ${pkName} },
    });
  }

  /** @description 导出${functionName}所有数据为xlsx */
  async export${BusinessName}(res: Response) {
    let title = ${columnNames};
    let data = (await this.prisma.${modelName1}.findMany()).map(v => Object.values(v));
    data.unshift(title);
    exportTable(data, res);
  }
}`;
}
