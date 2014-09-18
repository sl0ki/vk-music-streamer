var injectScript = function(filename, callback) {
	var oHead = document.getElementsByTagName('HEAD').item(0);
	var oScript= document.createElement("script");
	oScript.type = "text/javascript";
	oScript.src = filename;
	oScript.onload = callback;
	oHead.appendChild(oScript);
};

var injectCssFile = function(filename) {
	var oHead = document.getElementsByTagName('HEAD').item(0);
	var oLink = document.createElement("link");
	oLink.href = filename
	oLink.type = "text/css";
	oLink.rel = "stylesheet";
	oHead.appendChild(oLink);
};

injectScript('//rawgit.com/sl0ki/vk-music-streamer/master/server/public/extension/socket.io.js');
injectScript('//rawgit.com/sl0ki/vk-music-streamer/master/server/public/extension/broadcaster.js');
injectCssFile('//rawgit.com/sl0ki/vk-music-streamer/master/server/public/extension/broadcaster.css');


