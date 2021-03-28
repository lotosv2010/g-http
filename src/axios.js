import axios from 'axios'
import codeMessage from './error'
import LRU from 'lru-cache'
import md5 from 'md5'
/**
 * 封装的目的是封装公共的拦截器，每一个实例也可以有单独的自己的拦截器
 * 创建一个单独的实例，每次请求都是使用这个方法来创建实例
 */

const cacheMap = new LRU({
  max: 50, maxAge: 1000 * 60 * 60
})
const timeout = Symbol('timeout');
const baseURL = Symbol('baseURL');
const header = Symbol('headers');
const errorCtl = Symbol('errorCtl');
const dataCtl = Symbol('dataCtl');
const mergeOptions = Symbol('mergeOptions');
const setInterceptor = Symbol('setInterceptor');
const request = Symbol('request');
const send = Symbol('send');
const saveCache = Symbol('saveCache');
const getCache = Symbol('getCache');
const commonParams = Symbol('commonParams');
class Http {
  constructor(options = {}) {
    const { 
      url = '/',
      headers = {},
      errorControl = (res) => true,
      dataControl = (res) => res
    } = options
    this[timeout] = 5000 // 超时时间
    this[baseURL] = url
    this[header] = { 'Content-Type': 'application/json', ...headers }
    this[errorCtl] = errorControl
    this[dataCtl] = dataControl
  }
  // 合并选项
  [mergeOptions](options) {
    return {
      timeout: this[timeout],
      baseURL: this[baseURL],
      ...options,
      headers: {
        ...this[header],
        ...options.headers
      }
    }
  }
  // 添加拦截器
  [setInterceptor](instance) {
    instance.interceptors.request.use(config => {
      return config
    }, err => {
      return Promise.reject(err)
    })

    instance.interceptors.response.use(
      res => {
        const { status, data } = res
        if (status === 200) {
          return Promise.resolve(data)
        }
      },
      err => {
        // 错误码统一处理
        const statusText = codeMessage[err.response.status] || '服务端异常。'
        return Promise.reject(statusText)
      }
    )
  }
  [request](options) {
    // 合并选项
    const opts = this[mergeOptions](options)
    // 创建实例
    let instance = null
    if(!instance) {
      instance = axios.create()
    }
    // 添加拦截器
    this[setInterceptor](instance)
    // 当调用Axios.request 时，内部会创建一个Axios实例，并且给这个实例传入配置属性
    return instance(opts)
  }
  [send](url, method, data, options) {
    const { cache = false, query = {}, mock = false } = options
    const key = `${url}${JSON.stringify(data)}`
    const opts = {
      url,
      method,
      data: method === 'post' && { ...data, ...this[commonParams]} || null,
      params: method === 'get' && { ...data, ...this[commonParams] } || { ...query }
    }
    method === 'get' && this[getCache](key, cache)
    return new Promise((resolve, reject) => {
      const errFn = this[errorCtl]
      this[request](opts).then((res) => {
        const result = this[dataCtl](res)
        if(typeof errFn === 'function') {
          const { success = true, message = 'errorControl return value is wrong' } = errFn(res)
          method === 'get' && this[saveCache](key, cache, result)
          success === false ? resolve(result) : reject(message)
        } else {
          reject('error: errorControl is not a function!')
        }
      }).catch(err => {
        if(typeof errFn === 'function') {
          reject(errFn(err))
        } else {
          reject('error: errorControl is not a function!')
        }
      })
    })
  }
  [saveCache](key, cache, result) {
    const k = md5(key)
    cache && cacheMap.set(k, JSON.stringify(result))
  }
  [getCache](key, cache) {
    const k = md5(key)
    const cacheData = cacheMap.get(k)
    if(cacheData && cache) return Promise.resolve(JSON.parse(cacheData))
  }
  setCommonParams(params = {}) {
    this[commonParams] = params
  }
  get(url, data = {}, options = {}) {
    return this[send](url, 'get', data, options)
  }
  post(url, data = {},  options = {}) {
    return this[send](url, 'post', data, options)
  }
}

export default Http

