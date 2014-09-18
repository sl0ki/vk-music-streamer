var express = require('express');
var _ = require('lodash');
var vkApi = require('./vkApi');

var app = express();
app.use('/', express.static(__dirname + '/public/'));
var server = app.listen(8081);
var io = require("socket.io")(server);

//* Get Broadcasters list 
app.get('/broadcasters.js', function(req, res) {
  var response = function(array) {
    var string = JSON.stringify(array);
    string =  'var broadcasters = '+ string;
    res.send(string);
  };

  var arr = [];
  for (client in clients) {
    arr.push(client);    
  }
  if (!arr.length) return response([]);

  // arr = ['32587609', '87274210', '26730845', '28548097'];
  vk = new vkApi();
  var params = {
    user_ids: arr.join(','),
    fields: 'photo_200',
  };
  vk.request('users.get', params, function(err, data) {
    if(!err) {
      var result = [];
      for(key in data) {
        var obj = {};
        obj.id = data[key].id;
        var peer = clients[obj.id];
        if (!peer) continue;
        if (!peer.b) continue;
        obj.photo = data[key].photo_200;
        obj.listeners = Object.keys(peer.l).length;
        obj.listen = peer.b.info.name + ' - ' + peer.b.info.artist;
        result.push(obj);
      }
      response(result);
    } else {
      res.send(500, 'VK API ERROR!');
    }
  });
});

/********************/

var clients = {};

/*** SocketIO Events Bus ***/

io.on('connection', function (socket) {

  //* On Broadcater connect
  socket.on('broadcast', function(bid) {
    if (!clients[bid]) {
      clients[bid] = { l: {} };
    } else if (clients[bid].b) {
      // Disconnect prev broadcaster
      clients[bid].b.bid = null;
      clients[bid].b.disconnect();
    }
    socket.bid = bid; 
    socket.type = 'b';
    socket.info = {};
    clients[bid].b = socket;

    console.log('New Broadcaster: ' + bid);
  });

  //* On Listener connect
  socket.on('listen', function(data) {
    var bid = data.bid;
    var lid = data.uid;

    if (!clients[bid]) {
      clients[bid] = { l: {} };
    } else if (clients[bid].l[lid]) { 
      // Abbort connection if listener exist
      return socket.disconnect();
    }

    socket.bid = bid; 
    socket.lid = lid;
    socket.type = 'l';    
    clients[bid].l[lid] = socket; 

    //Send "Load" signal to listeners
    if (clients[bid].b) {
      var info = _.clone(clients[bid].b.info, false);
      if (info.action != 'pause') {
        info.time = Math.round((new Date().getTime() - info.currentTime) / 1000) + info.time;
      }
      socket.emit('message', {
        action: 'load',
        info: info,
      });
    }
    console.log('New Listener: ' + lid);
  });

  //* Transfer command message
  socket.on('message', function (obj) {
    console.log('Command: ' + obj.action);
    // Add info field
    socket.info = obj.info;
    socket.info.action = obj.action;
    socket.info.currentTime = new Date().getTime();
    // Send To All Listeners
    _.forEach(clients[socket.bid].l, function(l) {
      l.emit('message', obj);
    });    
  });

  //* On Someone Disconect
  socket.on('disconnect', function () {
    if(!socket.bid) return;

    var bid = socket.bid;

    //On Listener Disconnect
    if (socket.type == 'l') {
      var lid = socket.lid;
      delete clients[bid].l[lid];
      console.log('Listener disconnect :' + lid);
    }

    //On Broadcaster Disconnect
    if (socket.type == 'b') {
      delete clients[bid].b;
      //Send "stop" signal to All Listeners
      _.forEach(clients[bid].l, function(l) {
        l.emit('stop');
      });
      console.log('Broadcaster disconnect :' + bid);
    } 

    // If peer empty then delete
    if((clients[bid].b === undefined) && (Object.keys(clients[bid].l).length === 0)) {
      delete clients[bid]; 
      console.log('Remove peer :' + bid);
    }
  });
  /*** End SocketIO Events Bus ***/

});

