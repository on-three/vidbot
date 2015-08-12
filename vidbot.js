var mpv = require('./lib/mpv.js').Mpv;

if(process.argv.length<3) {
  console.error("USAGE: vidbot <input video file or url>");
}
var vid = process.argv[2]

var m = new mpv(vid,null);
setTimeout(m.time_remaining, 5000);
setTimeout(m.time_remaining, 10000);