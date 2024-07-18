/* eslint-disable no-template-curly-in-string */

export function getVueTemplate(data: Record<string, any>) {
  const {
    functionName,
    moduleName,
    businessName,
    columns,
    subTable,
    dicts,
    dictsNoSymbol,
    BusinessName,
    pkColumn,
  } = data;

  const subclassName = subTable ? subTable.businessName : '';
  const subClassName = subclassName.charAt(0).toUpperCase() + subclassName.slice(1);
  const subTableFkclassName = subTable ? subTable.foreignKey : '';

  return `<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
${columns.map((column) => {
    if (column.query) {
      const dictType = column.dictType;
      const AttrName = column.javaField.charAt(0).toUpperCase() + column.javaField.slice(1);
      const parentheseIndex = column.columnComment.indexOf('（');
      const comment = parentheseIndex !== -1 ? column.columnComment.substring(0, parentheseIndex) : column.columnComment;

      if (column.htmlType === 'input') {
        return `
      <el-form-item label="${comment}" prop="${column.javaField}">
        <el-input
          v-model="queryParams.${column.javaField}"
          placeholder="请输入${comment}"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>`;
      } else if ((column.htmlType === 'select' || column.htmlType === 'radio') && dictType) {
        return `
      <el-form-item label="${comment}" prop="${column.javaField}">
        <el-select v-model="queryParams.${column.javaField}" placeholder="请选择${comment}" clearable>
          <el-option
            v-for="dict in ${dictType}"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>`;
      } else if (column.htmlType === 'datetime' && column.queryType !== 'BETWEEN') {
        return `
      <el-form-item label="${comment}" prop="${column.javaField}">
        <el-date-picker clearable
          v-model="queryParams.${column.javaField}"
          type="date"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择${comment}">
        </el-date-picker>
      </el-form-item>`;
      } else if (column.htmlType === 'datetime' && column.queryType === 'BETWEEN') {
        return `
      <el-form-item label="${comment}" style="width: 308px">
        <el-date-picker
          v-model="daterange${AttrName}"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>`;
      }
    }
    return '';
  }).join('')}
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['${moduleName}:${businessName}:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['${moduleName}:${businessName}:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['${moduleName}:${businessName}:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['${moduleName}:${businessName}:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="${businessName}List" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
${columns.map((column) => {
    const javaField = column.javaField;
    const parentheseIndex = column.columnComment.indexOf('（');
    const comment = parentheseIndex !== -1 ? column.columnComment.substring(0, parentheseIndex) : column.columnComment;

    if (column.pk) {
      return `
      <el-table-column label="${comment}" align="center" prop="${javaField}" />`;
    } else if (column.list && column.htmlType === 'datetime') {
      return `
      <el-table-column label="${comment}" align="center" prop="${javaField}" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.${javaField}, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>`;
    } else if (column.list && column.htmlType === 'imageUpload') {
      return `
      <el-table-column label="${comment}" align="center" prop="${javaField}" width="100">
        <template #default="scope">
          <image-preview :src="scope.row.${javaField}" :width="90" :height="90"/>
        </template>
      </el-table-column>`;
    } else if (column.list && column.htmlType === 'fileUpload') {
      return `
      <el-table-column label="${comment}" align="center" prop="${javaField}" width="240">
        <template #default="scope">
          <FileList :fileList="scope.row.${javaField}" />
        </template>
      </el-table-column>`;
    } else if (column.list && column.dictType) {
      if (column.htmlType === 'checkbox') {
        return `
      <el-table-column label="${comment}" align="center" prop="${javaField}">
        <template #default="scope">
          <dict-tag :options="${column.dictType}" :value="scope.row.${javaField} ? scope.row.${javaField}.split(',') : []"/>
        </template>
      </el-table-column>`;
      } else {
        return `
      <el-table-column label="${comment}" align="center" prop="${javaField}">
        <template #default="scope">
          <dict-tag :options="${column.dictType}" :value="scope.row.${javaField}"/>
        </template>
      </el-table-column>`;
      }
    } else if (column.list && javaField) {
      return `
      <el-table-column label="${comment}" align="center" prop="${javaField}" />`;
    }
    return '';
  }).join('')}
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['${moduleName}:${businessName}:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['${moduleName}:${businessName}:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改${functionName}对话框 -->
    <el-dialog :title="title" v-model="open" width="clamp(350px,90%,600px)" append-to-body>
      <el-form ref="${businessName}Ref" :model="form" :rules="rules" label-width="100px">
${columns.map((column) => {
    const field = column.javaField;
    if (column.insert && !column.pk && (column.usableColumn || !column.superColumn)) {
      const parentheseIndex = column.columnComment.indexOf('（');
      const comment = parentheseIndex !== -1 ? column.columnComment.substring(0, parentheseIndex) : column.columnComment;
      const dictType = column.dictType;

      if (column.htmlType === 'input') {
        return `
        <el-form-item label="${comment}" prop="${field}">
          <el-input v-model="form.${field}" placeholder="请输入${comment}" />
        </el-form-item>`;
      } else if (column.htmlType === 'imageUpload') {
        return `
        <el-form-item label="${comment}" prop="${field}">
          <image-upload v-model="form.${field}"/>
        </el-form-item>`;
      } else if (column.htmlType === 'fileUpload') {
        return `
        <el-form-item label="${comment}" prop="${field}">
          <file-upload v-model="form.${field}"/>
        </el-form-item>`;
      } else if (column.htmlType === 'editor') {
        return `
        <el-form-item label="${comment}">
          <editor v-model="form.${field}" :min-height="192"/>
        </el-form-item>`;
      } else if (column.htmlType === 'select' && dictType) {
        return `
        <el-form-item label="${comment}" prop="${field}">
          <el-select v-model="form.${field}" placeholder="请选择${comment}">
            <el-option
              v-for="dict in ${dictType}"
              :key="dict.value"
              :label="dict.label"
              :value="${column.javaType === 'Integer' || column.javaType === 'Long' ? 'parseInt(dict.value)' : 'dict.value'}"
            ></el-option>
          </el-select>
        </el-form-item>`;
      } else if (column.htmlType === 'checkbox' && dictType) {
        return `
        <el-form-item label="${comment}" prop="${field}">
          <el-checkbox-group v-model="form.${field}">
            <el-checkbox
              v-for="dict in ${dictType}"
              :key="dict.value"
              :label="dict.value">
              {{dict.label}}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>`;
      } else if (column.htmlType === 'radio' && dictType) {
        return `
        <el-form-item label="${comment}" prop="${field}">
          <el-radio-group v-model="form.${field}">
            <el-radio
              v-for="dict in ${dictType}"
              :key="dict.value"
              :label="${column.javaType === 'Integer' || column.javaType === 'Long' ? 'parseInt(dict.value)' : 'dict.value'}"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>`;
      } else if (column.htmlType === 'datetime') {
        return `
        <el-form-item label="${comment}" prop="${field}">
          <el-date-picker clearable
            v-model="form.${field}"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择${comment}">
          </el-date-picker>
        </el-form-item>`;
      } else if (column.htmlType === 'textarea') {
        return `
        <el-form-item label="${comment}" prop="${field}">
          <el-input v-model="form.${field}" type="textarea" placeholder="请输入内容" />
        </el-form-item>`;
      }
    }
    return '';
  }).join('')}
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="${BusinessName}">
  import { list${BusinessName}, get${BusinessName}, del${BusinessName}, add${BusinessName}, update${BusinessName} } from "@/api/${moduleName}/${businessName}";

  const { proxy } = getCurrentInstance();
  ${dicts ? `const { ${dictsNoSymbol} } = proxy.useDict(${dicts});` : ''}

  const ${businessName}List = ref([]);
  ${subTable ? 'const ${subclassName}List = ref([]);' : ''}
  const open = ref(false);
  const loading = ref(true);
  const showSearch = ref(true);
  const ids = ref([]);
  ${subTable ? `const checked${subClassName} = ref([]);` : ''}
  const single = ref(true);
  const multiple = ref(true);
  const total = ref(0);
  const title = ref("");
  ${columns.map(column => column.htmlType === 'datetime' && column.queryType === 'BETWEEN' ? `const daterange${column.javaField.charAt(0).toUpperCase() + column.javaField.slice(1)} = ref([]);` : '').join('')}

  const data = reactive({
    form: {},
    queryParams: {
      pageNum: 1,
      pageSize: 10,
      ${columns.map(column => column.query ? `${column.javaField}: null` : '').filter(Boolean).join(',\n      ')}
    },
    rules: {
      ${columns.map(column => column.required ? `${column.javaField}: [{ required: true, message: "${column.columnComment.split('（')[0]}不能为空", trigger: "${column.htmlType === 'select' || column.htmlType === 'radio' ? 'change' : 'blur'}" }]` : '').filter(Boolean).join(',\n      ')}
    }
  });

  const { queryParams, form, rules } = toRefs(data);

  /** 查询${functionName}列表 */
  function getList() {
    loading.value = true;
    ${columns.some(column => column.htmlType === 'datetime' && column.queryType === 'BETWEEN') ? 'queryParams.value.params = {};' : ''}
    ${columns.map(column => column.htmlType === 'datetime' && column.queryType === 'BETWEEN'
    ? `if (daterange${column.javaField.charAt(0).toUpperCase() + column.javaField.slice(1)}.value) {
      queryParams.value.params["begin${column.javaField.charAt(0).toUpperCase() + column.javaField.slice(1)}"] = daterange${column.javaField.charAt(0).toUpperCase() + column.javaField.slice(1)}.value[0];
      queryParams.value.params["end${column.javaField.charAt(0).toUpperCase() + column.javaField.slice(1)}"] = daterange${column.javaField.charAt(0).toUpperCase() + column.javaField.slice(1)}.value[1];
    }`
    : '').join('')}
    list${BusinessName}(queryParams.value).then(response => {
      ${businessName}List.value = response.rows;
      total.value = response.total;
      loading.value = false;
    });
  }

  // 取消按钮
  function cancel() {
    open.value = false;
    reset();
  }

  // 表单重置
  function reset() {
    form.value = {
      ${columns.map(column => column.htmlType === 'checkbox' ? `${column.javaField}: []` : `${column.javaField}: null`).join(',\n      ')}
    };
    ${subTable ? '${subclassName}List.value = [];' : ''}
    proxy.resetForm("${businessName}Ref");
  }

  /** 搜索按钮操作 */
  function handleQuery() {
    queryParams.value.pageNum = 1;
    getList();
  }

  /** 重置按钮操作 */
  function resetQuery() {
    ${columns.map(column => column.htmlType === 'datetime' && column.queryType === 'BETWEEN' ? `daterange${column.javaField.charAt(0).toUpperCase() + column.javaField.slice(1)}.value = [];` : '').join('')}
    proxy.resetForm("queryRef");
    handleQuery();
  }

  // 多选框选中数据
  function handleSelectionChange(selection) {
    ids.value = selection.map(item => item.${pkColumn.javaField});
    single.value = selection.length !== 1;
    multiple.value = !selection.length;
  }

  /** 新增按钮操作 */
  function handleAdd() {
    reset();
    open.value = true;
    title.value = "添加${functionName}";
  }

  /** 修改按钮操作 */
  function handleUpdate(row) {
    reset();
    const _${pkColumn.javaField} = row.${pkColumn.javaField} || ids.value;
    get\${BusinessName}(_${pkColumn.javaField}).then(response => {
      form.value = response.data;
      ${columns.map(column => column.htmlType === 'checkbox' ? `form.value.${column.javaField} = form.value.${column.javaField}.split(",");` : '').join('')}
      ${subTable ? '${subclassName}List.value = response.data.${subclassName}List;' : ''}
      open.value = true;
      title.value = "修改${functionName}";
    });
  }

  /** 提交按钮 */
  function submitForm() {
    proxy.$refs["${businessName}Ref"].validate(valid => {
      if (valid) {
        ${columns.map(column => column.htmlType === 'checkbox' ? `form.value.${column.javaField} = form.value.${column.javaField}.join(",");` : '').join('')}
        ${subTable ? 'form.value.${subclassName}List = ${subclassName}List.value;' : ''}
        if (form.value.${pkColumn.javaField} != null) {
          update${BusinessName}(form.value).then(response => {
            proxy.$modal.msgSuccess("修改成功");
            open.value = false;
            getList();
          });
        } else {
          add${BusinessName}(form.value).then(response => {
            proxy.$modal.msgSuccess("新增成功");
            open.value = false;
            getList();
          });
        }
      }
    });
  }

  /** 删除按钮操作 */
  function handleDelete(row) {
    const _${pkColumn.javaField}s = row.${pkColumn.javaField} || ids.value;
    proxy.$modal.confirm('是否确认删除${functionName}编号为"' + _${pkColumn.javaField}s + '"的数据项？').then(function() {
      return del${BusinessName}(_${pkColumn.javaField}s);
    }).then(() => {
      getList();
      proxy.$modal.msgSuccess("删除成功");
    }).catch(() => {});
  }

  ${subTable
    ? `
  /** ${subTable.functionName}序号 */
  function row${subClassName}Index({ row, rowIndex }) {
    row.index = rowIndex + 1;
  }

  /** ${subTable.functionName}添加按钮操作 */
  function handleAdd${subClassName}() {
    let obj = {};
    ${subTable.columns.map(column => column.pk || column.javaField === subTableFkclassName ? '' : column.list && column.javaField ? `obj.${column.javaField} = "";` : '').filter(Boolean).join('\n    ')}
    ${subclassName}List.value.push(obj);
  }

  /** ${subTable.functionName}删除按钮操作 */
  function handleDelete${subClassName}() {
    if (checked${subClassName}.value.length === 0) {
      proxy.$modal.msgError("请先选择要删除的${subTable.functionName}数据");
    } else {
      const ${subclassName}s = ${subclassName}List.value;
      const checked${subClassName}s = checked${subClassName}.value;
      ${subclassName}List.value = ${subclassName}s.filter(function(item) {
        return checked${subClassName}s.indexOf(item.index) === -1;
      });
    }
  }

  /** 复选框选中数据 */
  function handle${subClassName}SelectionChange(selection) {
    checked${subClassName}.value = selection.map(item => item.index);
  }
  `
    : ''}

  /** 导出按钮操作 */
  function handleExport() {
    proxy.download('${moduleName}/${businessName}/export', {
      ...queryParams.value
    }, ${businessName}_${new Date().getTime()}.xlsx);
  }

  getList();
</script>
`;
}
