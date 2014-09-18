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

var host = '//radi0.me';

injectScript(host + '/socket.io/socket.io.js');
injectScript(host + '/extension/broadcaster.js');
injectCssFile(host + '/extension/broadcaster.css');

