//** 

function AppViewModel() {
    var self = this;

    var source = broadcasters;
    var data = circles(source);

    self.shadow = ko.observable(false);
    self.wrapSize = ko.observable(data.wrap);
    self.bc = ko.mapping.fromJS(data.array);

    self.play = function() {
        this.listeners(this.listeners() + 1);
        this.played(true);
        self.shadow(true);
        startListen(this.id());
    };
 
    self.pause = function() {
        this.played(false);
        self.shadow(false);
        this.listeners(this.listeners() - 1);
        stopListen();
    };
}

function init() {
  ko.applyBindings(new AppViewModel());
}



/////////

var circles = function(input) {

  _.each(input, function(item) {
    item.origin = _.clone(item);
  });       
  var root = {
     "name": "cluster",
     "children": input,
  };     

  var diameter = 1000;
  var format = d3.format(",d");

  var pack = d3.layout.pack()
      .size([diameter, diameter])
      .value(function(d) { return d.listeners + 1;});

  var svg = d3.select("body").append("svg")
      .attr("width", 0)
      .attr("height", 0)
      .append("g");

  var res = [];
  var first = true;
  var node = svg.datum(root).selectAll(".node")
    .data(pack.nodes)
    .enter().append("g")
    .attr("transform", function(d) {
        if (!first) {
            var obj = _.clone(d.origin);
            obj.played = false;
            obj.left = d.x - d.r;
            obj.top = d.y - d.r;
            obj.size = d.r * 2;
            res.push(obj);            
        }
        first = false;
        return "translate(" + d.x + "," + d.y + ")"; 
     });

  // My calculate Rect
  var k = 250 / _.max(res, function(item) { return item.size; }).size;
  _.each(res, function(item) {
      item.size = Math.round(item.size*k) - 25;
      item.top = Math.round(item.top*k);
      item.left = Math.round(item.left*k);
  });
  wrapSize = Math.round(diameter * k);
  console.log(res);
  return {
    array: res,
    wrap: wrapSize, 
  };
}



/////////////////////////////////////->>>

//* HTML5 PLayer Class

html5Player = function() {
 
  var source = null;
  var audio = document.createElement('audio');

  this.getSource = function() {
    return source;
  }
  this.load = function(src, position) {
    source = src;
    position = position || 0.0;
    audio.setAttribute("src", src);
    audio.addEventListener('loadedmetadata', function(){
        audio.currentTime = position;
        audio.removeEventListener('loadedmetadata');
    });
  };

  this.play = function(src) {
    audio.play();
  };
  
  this.pause = function() {
    if (source) {
      audio.pause();
    }
  };
  this.volume = function(percents) {
    audio.volume = percents;
  };
  this.rewind = function(position) {
    audio.currentTime = position;
  };
};

//* Listener Class

var Listener = function() {
  var url = 'http://radi0.me';
  var socket;
  var events = [];
  var uid = Math.round(Math.random() * 1000000);

  var closeSocket = function() {
    if (socket) {
      oldSocket = socket;
      oldSocket.disconnect();
      delete socket;
    }    
  };

  this.stop = function() {
    closeSocket();
  } 

  this.connect = function (bid) {
    closeSocket();
    socket = io.connect(url, {'forceNew': true });

    socket.on('connect', function () {
      socket.emit('listen', {'uid': uid, 'bid': bid});
      console.log('connect'); 
      if (events['connect']) return events['connect']();
    });

    socket.on('disconnect', function() {
      console.log('disconnect');  
      if (events['disconnect']) return events['disconnect']();
    }); 

    socket.on('stop', function() {
      console.log('stop');  
      if (events['stop']) return events['stop']();  
    })  

    socket.on('message', function (res) {
      console.log(res);
      if (events[res.action]) return events[res.action](res.info); 
    }); 
  };

  this.on = function (name, callback) {
    if (callback === undefined) return events[name];
    events[name] = callback;
  }
}

/******************************************/

var listener = new Listener();
var player = new html5Player();

function startListen(uid) {

  listener.connect(uid);

  listener.on('load', function(info) {
    player.load(info.source, info.time);
    if (info.played) {
      player.play();
    }
  });
    
  listener.on('play', function() {
    player.play();
  });

  listener.on('pause', function() {
    player.pause();
  });

  listener.on('rewind', function(info) {
    player.rewind(info.time);
  });     

  listener.on('stop', function(pos) {
    player.pause();
  });       

  listener.on('disconnect', function(pos) {
    player.pause();
  });     
};

function stopListen(uid) {
  listener.stop();
};

