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
      
      if (errorMessage) {
        feedbackToast({
          message: errorCode !== undefined ? ErrCodeMap[errorCode] || errorMessage : errorMessage,
          error: errorMessage,
        })
      }
      return Promise.reject(data)
    }
    return data
  },
  (err) => {
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
