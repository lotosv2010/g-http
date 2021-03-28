import axios from 'axios'
import codeMessage from './error'
import LRU from 'lru-cache'
import md5 from 'md5'
/**
 * 封装的目的是封装公共的拦截器，每一个实例也可以有单独的自己的拦截器
 * 创建一个单独的实例，每次请求都是使用这个方法来创建实例
 */

const cacheMap = new LRU({
  max: 500, maxAge: 1000 * 60 * 60
})
const timeout = Symbol('timeout');
const baseURL = Symbol('baseURL');
const headers = Symbol('headers');
const errorControl = Symbol('errorControl');
const dataControl = Symbol('dataControl');
const mergeOptions = Symbol('mergeOptions');
const setInterceptor = Symbol('setInterceptor');
const request = Symbol('request');
const send = Symbol('send');
const saveCache = Symbol('saveCache');
const getCache = Symbol('getCache');
class Http {
  constructor(options = {}) {
    const { 
      url = '/',
      headers = {},
      errorControl = (res) => res,
      dataControl = (res) => res
    } = options
    this[timeout] = 5000 // 超时时间
    this[baseURL] = url
    this[headers] = { 'Content-Type': 'application/json', ...headers }
    this[errorControl] = errorControl
    this[dataControl] = dataControl
  }
  // 合并选项
  [mergeOptions](options) {
    return {
      timeout: this[timeout],
      baseURL: this[baseURL],
      ...options,
      headers: {
        ...this[headers],
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
    const instance = axios.create()
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
      data: method === 'post' && data || null,
      params: method === 'get' && { ...data } || { ...query }
    }
    method === 'get' && this[getCache](key, cache)
    return new Promise((resolve, reject) => {
      this[request](opts).then((res) => {
        const result = this[dataControl](res)
        method === 'get' && this[saveCache](key, cache, result)
        resolve(result)
      }).catch(err => reject(this[errorControl](err)))
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
  get(url, data = {}, options = {}) {
    return this[send](url, 'get', data, options)
  }
  post(url, data = {},  options = {}) {
    return this[send](url, 'post', data, options)
  }
}

export default Http

