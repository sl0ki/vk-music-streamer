
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
  var source = null;

  var playCallback = null;
  var pauseCallback = null;
  var rewindCallback = null;
  var changeSourceCallback = null;

  this.initHooks = function() {

    console.log('Init Player Hooks!');

    /* play - pause hooks*/
    audioPlayer.operate_  =  audioPlayer.operate;
    audioPlayer.operate = function(a1, a2, a3) {
      if (a1 == currentAudioId() && audioPlayer.player.paused() == false) { 
        played = false;
        if (pauseCallback != null) {
          pauseCallback();
        }
        return audioPlayer.operate_(a1, a2, a3);
      }
      played = true;
      var src = audioPlayer.getSongInfoFromDOM(a1)[2];
      // Change src callback
      if (src != source) {
        source = src;
        if (changeSourceCallback) {
          changeSourceCallback(source);
        }
      }
      if (playCallback) {
        playCallback();
      }
      return audioPlayer.operate_(a1, a2, a3);
    };

    /* rewind callback*/
    audioPlayer.getPrPos_ = audioPlayer.getPrPos;
    audioPlayer.getPrPos = function(a1, a2) {
      var res = audioPlayer.getPrPos_(a1, a2);
      if (a1.type == 'mousedown') {
        if (rewindCallback) {
          rewindCallback(Math.round(res * 100) / 10000);
        } 
      };
      return res;
    };
  };

  this.getPosition = function() {
    return (Math.round(audioPlayer.curTime / audioPlayer.duration * 10000)) / 10000;
  }
  this.onPlay = function(callback) {
    playCallback = callback;
  };
  this.onPause = function(callback) {
    pauseCallback = callback;
  };
  this.onRewind = function(callback) {
    rewindCallback = callback;
  };
  this.onChangeSrc = function(callback) {
    changeSourceCallback = callback;
  };
  this.getSource = function() {
    return source;
  };
  this.getStatus = function() {
    var status = {
      time: (Math.round(audioPlayer.curTime / audioPlayer.duration * 10000)) / 10000,
      src: source,
      played: played,
      // TODO Add Song Name
    }
    return status;
  }
}

//* Broadcaster Class

var  Broadcaster = function() {

  var url = 'http://92.63.109.20:8081';
  var socket;
  var bEvents = [];

  var closeSocket = function() {
    type = null;
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
      socket.emit('broadcast', uid); 
    });

    socket.on('send', function (obj) {
      if (bEvents[obj.name]) {
        bEvents[obj.name](obj.data);
      }
    }); 
  }

  this.send = function (name, data) {
    var obj = {
      type: 'b',
      name: name,      
      data: data,
    };
    socket.emit('send', obj);
  }

  this.on = function (name, callback) {
    bEvents[name] = callback;
  }  
}

/**********************************************/

var broadcaster = new Broadcaster();
var vkPl = new vkPlayer();

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
        rBtnClick();
      }
  	}  
  }, 500);  
});


//* Button On/Off Radio
function rBtnClick() {
  var rBtn = $('#radio');
  if (rBtn.hasClass('ready')) {;
    rBtn.removeClass('ready').addClass('bcast');
    StartBroadcast();
  } else {
    rBtn.removeClass('bcast').addClass('ready');
    StopBroadcast();
  }
}

function StartBroadcast() {

  vkPl.onChangeSrc(function(src) {
    broadcaster.send('change', src);
  });
  vkPl.onPause(function() {
    broadcaster.send('pause');
  });
  vkPl.onPlay(function() {
    broadcaster.send('play');
  });      
  vkPl.onRewind(function(pos) {
    broadcaster.send('rewind', pos);
  });            
  broadcaster.on('get_status', function() {
    broadcaster.send('status', vkPl.getStatus());
  });

  broadcaster.connect(vk.id);

  lStorage.set('radio_stream', 'on');
}

function StopBroadcast() {
  broadcaster.stop();
  lStorage.set('radio_stream', 'off');
}
