export function getApiTemplate(data: Record<string, any>) {
  const {
    functionName,
    modelName1,
    entityName,
    BusinessName,
    pkColumn,
  } = data;

  return `import request from '@/utils/request'

/**@description 查询${functionName}列表 */
export function list${BusinessName}(query) {
  return request({
    url: '/${modelName1}/${entityName}/list',
    method: 'get',
    params: query
  })
}

/**@description 查询${functionName}详细 */
export function get${BusinessName}(${pkColumn.javaField}) {
  return request({
    url: '/${modelName1}/${entityName}/' + ${pkColumn.javaField},
    method: 'get'
  })
}

/**@description 新增${functionName} */
export function add${BusinessName}(data) {
  return request({
    url: '/${modelName1}/${entityName}',
    method: 'post',
    data: data
  })
}

/**@description 修改${functionName} */
export function update${BusinessName}(data) {
  return request({
    url: '/${modelName1}/${entityName}',
    method: 'put',
    data: data
  })
}

/**@description 删除${functionName} */
export function del${BusinessName}(${pkColumn.javaField}) {
  return request({
    url: '/${modelName1}/${entityName}/' + ${pkColumn.javaField},
    method: 'delete'
  })
}
`;
}
