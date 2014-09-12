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

var clients = {};

/*** SocketIO Events Bus ***/

io.on('connection', function (socket) {

  //function dump_

  //* On Broadcater connect
  socket.on('broadcast', function(bid) {
    if (!clients[bid]) {
      clients[bid] = { l: {} };
    };
    socket.bid = bid; 
    socket.type = 'b';
    socket.info = {};
    clients[bid].b = socket;
    //Send "start" signal to listeners
    _.forEach(clients[bid].l, function(l) {
      l.emit('start');
    });    
    console.log('New Broadcaster: ' + bid);
  });

  //* On Listener connect
  socket.on('listen', function(data) {
    var bid = data.bid;
    var lid = data.uid;

    if (!clients[bid]) {
      clients[bid] = { l: {} };
    };
    socket.bid = bid; 
    socket.lid = lid;
    socket.type = 'l';    
    clients[bid].l[lid] = socket; 
    //Send "start" signal to listeners
    if (clients[bid].b) {
      var info = _.clone(clients[bid].b.info, false);
      if (info.action != 'pause') {
        info.time = Math.round((new Date().getTime() - info.currentTime) / 1000) + info.time;
      }
      socket.emit('start', info);
    }
    console.log('New Listener: ' + lid);
  });

  //* (NEW) Transfer command message
  socket.on('message', function (obj) {
    console.log('Command: ' + obj.action);
    console.log( 'Info: ' + JSON.stringify(obj.info));
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
    if (socket.type == 'l') {
      var bid = socket.bid;
      var lid = socket.lid;
      delete clients[bid].l[lid];
      console.log('Listener disconnect :' + lid);
    }

    if (socket.type == 'b') {
      var bid = socket.bid;
      delete clients[bid].b;
      //Send "stop" signal to listeners
      _.forEach(clients[bid].l, function(l) {
        l.emit('stop');
      });
      console.log('Broadcaster disconnect :' + bid);
    } 

    if (clients[bid]) if((clients[bid].b === undefined) && (Object.keys(clients[bid].l).length === 0)) {
      delete clients[bid]; 
      console.log('Remove peer :' + bid);
    }
  });
  /*** End SocketIO Events Bus ***/

});

