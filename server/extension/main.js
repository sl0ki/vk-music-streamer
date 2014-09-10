
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

  var url = 'http://92.63.109.20:8081';
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
    });

    socket.on("disconnect", function() {
      connected = false;
    });
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
    bEvents[name] = callback;
  }  
}

/**********************************************/

var broadcaster = new Broadcaster();
var vkPl = new vkPlayer();

//* Init events 

vkPl.on('play', function(info) {
  console.log('Play event');
  console.log(info);
  broadcaster.send('play', info);
});
vkPl.on('pause', function(info) {
  console.log('Pause event');
  console.log(info);
  broadcaster.send('pause', info);
});
vkPl.on('rewind', function(info) {
  console.log('Rewind event');
  console.log(info);
  broadcaster.send('rewind', info);
});
vkPl.on('load', function(info) {
  console.log('Load event');
  console.log(info);
  broadcaster.send('load', info);
});

//* Inject HTML Code  (Button)

jQuery(document).ready(function() {
  var timer = setInterval(function() {
    if (typeof currentAudioId() !== "undefined") {

      clearTimeout(timer);

      vkPl.initHooks();

      var button = jQuery('<div id="radio" class="radio ready"></div>');
      button.click(rBtnClick);
      jQuery("body").append(button);

      if (lStorage.get('radio_stream') == 'on') {
        //rBtnClick();
        broadcaster.connect(vk.id);
      }
  	}  
  }, 500);  
});

//* Button On/Off Radio

function rBtnClick() {
  var rBtn = $('#radio');
  if (rBtn.hasClass('ready')) {
    rBtn.removeClass('ready').addClass('bcast');
    lStorage.set('radio_stream', 'on');
    broadcaster.connect(vk.id);
  } else {
    rBtn.removeClass('bcast').addClass('ready');
    lStorage.set('radio_stream', 'off');
    broadcaster.stop();
  }
}