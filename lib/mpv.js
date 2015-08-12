var spawn = require('child_process').spawn;
var net = require('net');



var Mpv = function(file, outstream) {
  var that = this;
  this.file = file;
  //this is meant to represent what we write output to
  //either a log or IRC channel or both
  this.outstream = outstream;
  this.onComplete = null;
  this.proc = spawn('mpv', [this.file, '--input-unix-socket=/tmp/mpvsocket'], { stdio: 'inherit' });
  this.proc.on('exit', function (code) {
   console.log('Child process exited with exit code ' + code);
   //that.proc = null;
   //if(that.onComplete) {
   //   that.onComplete();
   //}
  });
};

Mpv.prototype.stop = function() {
  //if(this.proc) {
    client.write('{ "command": ["quit"] }\n');
  //}
};
Mpv.prototype.time_remaining = function() {
  
    console.log("invoking time_remaining");
    var client = net.connect({path: '/tmp/mpvsocket'}, function() {
      console.log('Connected');
      client.write('{ "command": ["get_property", "time-remaining"] }\n');
      client.on('data', function(data) {
      console.log('Received: ' + data);
      client.destroy(); // kill client after server's response 
      });
    })
}

Mpv.prototype.pause = function(on) {
  if(this.proc) {
    //{ "command": ["set_property", "pause", on] }
  }
}
Mpv.prototype.mute = function() {
  if(this.proc) {
    //{ "command": ["set_property", "mute", on] }
  }
}

Mpv.prototype.filename = function() {
//client.write('{ "command": ["get_property", "filename"] }\n');
}

exports.Mpv = Mpv;






