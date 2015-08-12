var M = require('./lib/mpv.js');

var channel = function(something) {
  console.log(something);
}

if(process.argv.length<3) {
  console.error("USAGE: vidbot <input video file or url>");
}
var vid = process.argv[2]

//var m = new mpv(vid, channel);
//m.test();
//setTimeout(m.time_remaining, 5000);
//setTimeout(m.filename, 10000);
//setTimeout(m.pause, 15000);

var m = new M(vid, channel);
setTimeout(function(){m.time_remaining();}, 5000);
setTimeout(function(){m.filename();}, 6000);
setTimeout(function(){m.pause(true);}, 7000);
setTimeout(function(){m.pause(false);}, 8000);
setTimeout(function(){m.mute(true);}, 9000);
setTimeout(function(){m.mute(false);}, 10000);
setTimeout(function(){m.quit();}, 15000);


