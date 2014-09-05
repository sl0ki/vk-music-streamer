var querystring = require('querystring');
var https = require('https');

var Api = function() {
  this.version = '5.24';
  this.url = 'https://api.vk.com/method/';
  this.token = '';

  this.request = function(method, data, callback) {
    var data = data || {};
    data.access_token = this.token;
    data.v = this.version;
    var url = this.url + method + '?' + querystring.stringify(data);

    var onRecive = function(response) {
      var data = '';
      response.on('data', function(chunk) {
        data += chunk;
      });
      response.on('end', function() {
        var obj = JSON.parse(data);
        callback(obj.error, obj.response);
      });
    };

    https.get(url, onRecive);
  }

};

module.exports = Api;