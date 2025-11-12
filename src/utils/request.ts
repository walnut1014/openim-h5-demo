import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { getChatUrl } from './storage'
import { feedbackToast } from './common'
import { ErrCodeMap } from '@/constants/errcode'

type ErrorData = {
  errCode?: number
  errMsg?: string
  code?: number
  message?: string
}

const serves = axios.create({
  baseURL: getChatUrl(),
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
})

serves.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {}
    config.headers.operationID = uuidv4()
    return config
  },
  (err) => Promise.reject(err),
)

serves.interceptors.response.use(
  (res) => {
    const data = res.data
    // 支持两种响应格式：errCode 和 code
    const isSuccess = (data.errCode !== undefined && data.errCode === 0) || 
                      (data.code !== undefined && data.code === 200)
    
    if (!isSuccess) {
      const errData = data as ErrorData
      const errorMessage = errData.errMsg || errData.message || '请求失败'
      const errorCode = errData.errCode || errData.code
      
      // 优先使用后台返回的错误消息，如果没有则使用错误码映射
      const displayMessage = errorMessage || (errorCode !== undefined ? ErrCodeMap[errorCode] : '请求失败')
      
      feedbackToast({
        message: displayMessage,
        error: displayMessage,
      })
      
      return Promise.reject(data)
    }
    return data
  },
  (err) => {
    // 检查是否是 HTTP 错误响应
    if (err.response && err.response.data) {
      const data = err.response.data
      
      // 处理业务错误
      const errorMessage = data.errMsg || data.message || '请求失败'
      const errorCode = data.errCode || data.code
      const displayMessage = errorMessage || (errorCode !== undefined ? ErrCodeMap[errorCode] : '请求失败')
      
      feedbackToast({
        message: displayMessage,
        error: displayMessage,
      })
      
      return Promise.reject(data)
    }
    
    // 处理网络错误等
    if (err.message.includes('timeout')) {
      console.log('timeout', err)
    }
    if (err.message.includes('Network Error')) {
      console.log('Network Error', err)
    }
    return Promise.reject(err)
  },
)

export default serves
