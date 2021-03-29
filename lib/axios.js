'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _error = require('./error');

var _error2 = _interopRequireDefault(_error);

var _lruCache = require('lru-cache');

var _lruCache2 = _interopRequireDefault(_lruCache);

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * 封装的目的是封装公共的拦截器，每一个实例也可以有单独的自己的拦截器
 * 创建一个单独的实例，每次请求都是使用这个方法来创建实例
 */

var cacheMap = new _lruCache2.default({
  max: 50, maxAge: 1000 * 60 * 60
});
var timeout = Symbol('timeout');
var baseURL = Symbol('baseURL');
var header = Symbol('headers');
var errorCtl = Symbol('errorCtl');
var dataCtl = Symbol('dataCtl');
var mergeOptions = Symbol('mergeOptions');
var setInterceptor = Symbol('setInterceptor');
var request = Symbol('request');
var send = Symbol('send');
var saveCache = Symbol('saveCache');
var getCache = Symbol('getCache');
var commonParams = Symbol('commonParams');

var Http = function () {
  function Http() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Http);

    var _options$url = options.url,
        url = _options$url === undefined ? '/' : _options$url,
        _options$headers = options.headers,
        headers = _options$headers === undefined ? {} : _options$headers,
        _options$errorControl = options.errorControl,
        errorControl = _options$errorControl === undefined ? function (res) {
      return true;
    } : _options$errorControl,
        _options$dataControl = options.dataControl,
        dataControl = _options$dataControl === undefined ? function (res) {
      return res;
    } : _options$dataControl;

    this[timeout] = 5000; // 超时时间
    this[baseURL] = url;
    this[header] = _extends({ 'Content-Type': 'application/json' }, headers);
    this[errorCtl] = errorControl;
    this[dataCtl] = dataControl;
  }
  // 合并选项


  _createClass(Http, [{
    key: mergeOptions,
    value: function value(options) {
      return _extends({
        timeout: this[timeout],
        baseURL: this[baseURL]
      }, options, {
        headers: _extends({}, this[header], options.headers)
      });
    }
    // 添加拦截器

  }, {
    key: setInterceptor,
    value: function value(instance) {
      instance.interceptors.request.use(function (config) {
        return config;
      }, function (err) {
        return Promise.reject(err);
      });

      instance.interceptors.response.use(function (res) {
        var status = res.status,
            data = res.data;

        if (status === 200) {
          return Promise.resolve(data);
        }
      }, function (err) {
        // 错误码统一处理
        var statusText = _error2.default[err.response.status] || '服务端异常。';
        return Promise.reject(statusText);
      });
    }
  }, {
    key: request,
    value: function value(options) {
      // 合并选项
      var opts = this[mergeOptions](options);
      // 创建实例
      var instance = null;
      if (!instance) {
        instance = _axios2.default.create();
      }
      // 添加拦截器
      this[setInterceptor](instance);
      // 当调用Axios.request 时，内部会创建一个Axios实例，并且给这个实例传入配置属性
      return instance(opts);
    }
  }, {
    key: send,
    value: function value(url, method, data, options) {
      var _this = this;

      var _options$cache = options.cache,
          cache = _options$cache === undefined ? false : _options$cache,
          _options$query = options.query,
          query = _options$query === undefined ? {} : _options$query,
          _options$mock = options.mock,
          mock = _options$mock === undefined ? false : _options$mock;

      var key = (0, _md2.default)('' + url + JSON.stringify(data));
      var opts = {
        url: url,
        method: method,
        data: method === 'post' && _extends({}, data, this[commonParams]) || null,
        params: method === 'get' && _extends({}, data, this[commonParams]) || _extends({}, query)
      };
      method === 'get' && this[getCache](key, cache);
      return new Promise(function (resolve, reject) {
        var errFn = _this[errorCtl];
        if (typeof errFn !== 'function') return reject('error: errorControl is not a function!');
        _this[request](opts).then(function (res) {
          var _errFn = errFn(res),
              _errFn$error = _errFn.error,
              error = _errFn$error === undefined ? true : _errFn$error,
              _errFn$errorMsg = _errFn.errorMsg,
              errorMsg = _errFn$errorMsg === undefined ? 'error: errorControl return value is wrong' : _errFn$errorMsg;

          method === 'get' && _this[saveCache](key, cache, result);
          error ? reject(errorMsg) : resolve(result);
        }).catch(function (err) {
          reject(err);
        });
      });
    }
  }, {
    key: saveCache,
    value: function value(key, cache, result) {
      cache && cacheMap.set(key, JSON.stringify(result));
    }
  }, {
    key: getCache,
    value: function value(key, cache) {
      if (cache) {
        var cacheData = cacheMap.get(key);
        return cacheData && Promise.resolve(JSON.parse(cacheData));
      }
    }
  }, {
    key: 'setCommonParams',
    value: function setCommonParams() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this[commonParams] = params;
    }
  }, {
    key: 'get',
    value: function get(url) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      return this[send](url, 'get', data, options);
    }
  }, {
    key: 'post',
    value: function post(url) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      return this[send](url, 'post', data, options);
    }
  }]);

  return Http;
}();

exports.default = Http;