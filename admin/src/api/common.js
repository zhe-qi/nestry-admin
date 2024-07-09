import request from '@/utils/request'

// 获取用户详细信息
export function uploadFile(data) {
  return request({
    url: '/common/upload',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}