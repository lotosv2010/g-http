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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * 封装的目的是封装公共的拦截器，每一个实例也可以有单独的自己的拦截器
 * 创建一个单独的实例，每次请求都是使用这个方法来创建实例
 */
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
      return res;
    } : _options$errorControl,
        _options$dataControl = options.dataControl,
        dataControl = _options$dataControl === undefined ? function (res) {
      return res;
    } : _options$dataControl;

    this.timeout = 6000; // 超时时间
    this.baseURL = url;
    this.headers = _extends({ 'Content-Type': 'application/json' }, headers);
    this.errorControl = errorControl;
    this.dataControl = dataControl;
  }
  // 合并选项


  _createClass(Http, [{
    key: 'mergeOptions',
    value: function mergeOptions(options) {
      return _extends({
        timeout: this.timeout,
        baseURL: this.baseURL,
        headers: this.headers
      }, options);
    }
    // 添加拦截器

  }, {
    key: 'setInterceptor',
    value: function setInterceptor(instance) {
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
    key: 'request',
    value: function request(options) {
      // 合并选项
      var opts = this.mergeOptions(options);
      // 创建实例
      var instance = _axios2.default.create();
      // 添加拦截器
      this.setInterceptor(instance);
      // 当调用Axios.request 时，内部会创建一个Axios实例，并且给这个实例传入配置属性
      return instance(opts);
    }
  }, {
    key: 'send',
    value: function send(url, method, data, options) {
      var _this = this;

      var _options$cache = options.cache,
          cache = _options$cache === undefined ? false : _options$cache,
          _options$query = options.query,
          query = _options$query === undefined ? {} : _options$query,
          _options$mock = options.mock,
          mock = _options$mock === undefined ? false : _options$mock;

      var key = '' + url + JSON.stringify(data);
      var opts = {
        url: url,
        method: method,
        data: method === 'post' && data || null,
        params: method === 'get' && _extends({}, data) || _extends({}, query)
      };
      method === 'get' && this.getCache(key, cache);
      return new Promise(function (resolve, reject) {
        _this.request(opts).then(function (res) {
          var result = _this.dataControl(res);
          method === 'get' && _this.saveCache(key, cache, result);
          resolve(result);
        }).catch(function (err) {
          return reject(_this.errorControl(err));
        });
      });
    }
  }, {
    key: 'saveCache',
    value: function saveCache(key, cache, result) {
      cache && localStorage.setItem(key, JSON.stringify(result));
    }
  }, {
    key: 'getCache',
    value: function getCache(key, cache) {
      var cacheData = localStorage.getItem(key);
      if (cacheData && cache) return Promise.resolve(JSON.parse(cacheData));
    }
  }, {
    key: 'get',
    value: function get(url) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      return this.send(url, 'get', data, options);
    }
  }, {
    key: 'post',
    value: function post(url) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      return this.send(url, 'post', data, options);
    }
  }]);

  return Http;
}();

exports.default = Http;