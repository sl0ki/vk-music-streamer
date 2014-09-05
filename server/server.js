var express = require('express');
var _ = require('lodash');
var vkApi = require('./vkApi');

var app = express();
app.use(express.static(__dirname + '/'));
var server = app.listen(8081);
var io = require("socket.io")(server);

//* Get Broadcasters list 
app.get('/broadcasters.js', function(req, res) {
  var arr = [];
  for (key in broadcasters) {
    arr.push(key);    
  }
  vk = new vkApi();
  var params = {
    user_ids: arr.join(','),
    fields: 'photo_200',
  };
  vk.request('users.get', params, function(err, data) {
    if(!err) {
      res.send(data);
    } else {
      res.send(500, 'VK API ERROR!');
    }
  });
});

/********************/

var broadcasters = [];

/*** SocketIO Events Bus ***/

io.on('connection', function (socket) {

  //* On Broadcater connect
  socket.on('broadcast', function(uid){
    socket.uid = uid;
    socket.type = 'broadcast';
    broadcasters[uid] = { 
      socket: socket,
      listeners: [],
    };
    console.log('New Broadcaster: ' + uid);
  });

  //* On Listener connect
  socket.on('listen', function(data) {
    if (!broadcasters[data.bid]) return;
    socket.uid = data.uid;
    socket.type = 'listen';
    broadcasters[data.bid].listeners[data.uid] = {
      socket: socket
    };
    broadcasters[data.bid].socket.emit('give_status');
    console.log('New Listener: ' + data.uid);
  });

  //* Transfer command message
  socket.on('send', function (obj) {
    console.log('Command: ' + obj.name);
    if (obj.type == 'b') {
      broadcasters[socket.uid].listeners.forEach(function (listner) {
        listner.socket.emit('send', obj);
        //* Update broadcaster player status
      });      
    }
    if (obj.type == 'l') {
      broadcasters.forEach(function (b) {
        if (b.listeners[socket.uid]) {
          b.socket.emit('send', obj);
        }
      })
    }    
  });

  //* On Someone Disconect
  socket.on('disconnect', function () {
    console.log('Disconect - ' + socket.uid);
    if (socket.type == 'broadcast') {
      broadcasters[socket.uid].listeners.forEach(function(listner) {
        //* If Broadcaster disconecr send pause signal to all listeners
        listner.socket.emit('send', {
          type: 'b',
          name: 'pause',
        });
      });
      // TODO delete user
    }
    if (socket.type == 'listen') {
      // TODO Find and delete       
    }    
  });
  /*** SocketIO Events Bus ***/

});

