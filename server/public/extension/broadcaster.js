
//* Local Storage Wrapper Object

lStorage = {
  get: function(key) {
    return localStorage.getItem(key);
  },
  set: function(key, value) {
    return localStorage.setItem(key, value);
  }
};


//* VK Player Injection Class

vkPlayer = function() {

  var played = false;
  var audioId = null;
  var events = [];

  this.initHooks = function() {
    console.log('Init Player Hooks!');

    /* play - pause hooks*/
    audioPlayer.operate_  =  audioPlayer.operate;
    audioPlayer.operate = function(a1, a2, a3) {
      var oldAudioId = audioId;
      audioId = a1;
      if (a1 == currentAudioId() && audioPlayer.player.paused() == false) { 
        played = false;
        event('pause');
        return audioPlayer.operate_(a1, a2, a3);
      }
      played = true;
      // Change src callback
      if (oldAudioId != a1) {
        audioPlayer.curTime = 0;
        event('load');
      } else {
        event('play');
      }
      return audioPlayer.operate_(a1, a2, a3);
    };

    /* rewind callback*/
    audioPlayer.getPrPos_ = audioPlayer.getPrPos;
    audioPlayer.getPrPos = function(a1, a2) {
      var res = audioPlayer.getPrPos_(a1, a2);
      if (a1.type == 'mousedown') {
        // Calculate new current time
        audioPlayer.curTime = Math.round(audioPlayer.duration * res / 100);
        event('rewind');
      };
      return res;
    };
    if (audioPlayer.id) {
      audioId = audioPlayer.id;
      played = true;
      event('load');
    }
  };

  this.on = function(name, callback) {
    if (callback === undefined) return events[name];
    events[name] = callback;
  };

  var getStatus = function() {
    var song = audioPlaylist[audioId];
    var status = {
      duration: song[3],
      source: song[2],
      time: audioPlayer.curTime,
      played: played,
      artist: song[5],
      name: song[6],
    }
    return status;
  };

  function event(name) {
    console.log('e1');
    if (!events[name]) return;
    if (typeof(audioPlaylist) != 'undefined') if (audioPlaylist[audioId]) {
      console.log('e2');
      return events[name](getStatus());      
    } 
    setTimeout(function() {
      console.log('e3');
      events[name](getStatus());      
    }, 1000);
  };

}

//* Broadcaster Class

var  Broadcaster = function() {

  var url = window.location.protocol + '//radi0.me';
  var socket;
  var bEvents = [];
  var connected = false;

  var closeSocket = function() {
    if (socket) {
      oldSocket = socket;
      socket = null;
      oldSocket.disconnect();
    }    
  };

  this.stop = function() {
    closeSocket();
  }

  this.connect = function (uid) {
    closeSocket();
    socket = io.connect(url, {'forceNew': true });

    socket.on('connect', function () { 
      connected = true;
      socket.emit('broadcast', uid); 
      if (bEvents['connect']) return bEvents['connect']();
    });

    socket.on("disconnect", function() {
      connected = false;
      if (bEvents['disconnect']) return bEvents['disconnect']();
    });
  }

  this.isConnected = function() {
    return connected;
  }

  this.send = function (action, info) {
    if (!connected) return;
    var obj = {
      action: action,      
      info: info,
    };
    socket.emit('message', obj);
  }

  this.on = function (name, callback) {
    if (callback === undefined) return bEvents[name];
    bEvents[name] = callback;
  }  
}

/**********************************************/

var broadcaster = new Broadcaster();
var vkPl = new vkPlayer();

//* Init events 

var sendAfterConnect = function(info) {
  if ((broadcaster).on('connect')) return;

  broadcaster.connect(vk.id);
  broadcaster.on('connect', function() {
    broadcaster.on('connect', null);
    broadcaster.send('load', info);
  });  
}

vkPl.on('load', function(info) {
  console.log('Load event');
  console.log(info);
  if (!broadcaster.isConnected()) {
    sendAfterConnect(info);
  } else {
    broadcaster.send('load', info);
  }
});

vkPl.on('play', function(info) {
  console.log('Play event');
  if (!broadcaster.isConnected()) {
    sendAfterConnect(info);
  } else {
    broadcaster.send('play', info);
  }
});

vkPl.on('pause', function(info) {
  console.log('Pause event');
  broadcaster.send('pause', info);
});

vkPl.on('rewind', function(info) {
  console.log('Rewind event');
  broadcaster.send('rewind', info);
});

//* Inject HTML Code  (Button)

var timer = setInterval(function() {
  if (typeof currentAudioId() !== "undefined") {
    clearTimeout(timer);
    vkPl.initHooks();
	};
}, 500);