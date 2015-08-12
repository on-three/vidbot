var spawn = require('child_process').spawn;
var net = require('net');


function Mpv(file, ch) {
  var that = this;
  this.file = file;
  //this is meant to represent what we write output to
  //either a log or IRC channel or both
  this.channel = ch;
  //this.onComplete = null;
  this.proc = spawn('mpv', [this.file, '--input-unix-socket=/tmp/mpvsocket'], { stdio: 'inherit' });
  this.proc.on('exit', function (code) {
   console.log('Child process exited with exit code ' + code);
   that.proc = null;
   //if(that.onComplete) {
   //   that.onComplete();
   //}
  });
};

function mpv_send(command, onSuccess, onFailure) {
    var client = net.connect({path: '/tmp/mpvsocket'}, function() {
      client.write(command);
      client.on('data', function(data) {
        onSuccess(data.toString());
        client.destroy(); // kill client after server's response 
      });
      client.on('error', function(data) {
        onFailure(data.toString());
        client.destroy(); // kill client after server's response 
      });
    }) 
}

Mpv.prototype.quit = function() {
  mpv_send('{ "command": ["quit"] }\n',
    this.channel,
    this.channel);
};

Mpv.prototype.time_remaining = function() {
  mpv_send('{ "command": ["get_property", "time-remaining"] }\n',
    this.channel,
    this.channel);
}

Mpv.prototype.pause = function(on) {
  mpv_send('{ "command": ["set_property", "pause", '+ on +'] }\n',
    this.channel,
    this.channel);
}

Mpv.prototype.mute = function(on) {
  mpv_send('{ "command": ["set_property", "mute", '+ on +'] }\n',
    this.channel,
    this.channel);
}

Mpv.prototype.filename = function() {
  mpv_send('{ "command": ["get_property", "filename"] }\n',
    this.channel,
    this.channel);
}

module.exports = Mpv;






