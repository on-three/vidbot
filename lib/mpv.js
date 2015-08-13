var spawn = require('child_process').spawn;
var net = require('net');
var c = require('irc-colors').global();


function Mpv(file, ch) {
  var that = this;
  this.file = file;
  //this is meant to represent what we write output to
  //either a log or IRC channel or both
  this.channel = ch;
  this.onComplete = null;
  this.proc = spawn('mpv', [this.file, '--input-unix-socket=/tmp/mpvsocket'], { stdio: 'inherit' });
  this.proc.on('exit', function (code) {
   console.log('Child process exited with exit code ' + code);
   that.proc = null;
   if(that.onComplete) {
      console.log("************FIRING MPV ONCOMPLETE*****")
      that.onComplete();
   }
  });
};

function mpv_send(command, onSuccess, onFailure) {
    var client = net.connect({path: '/tmp/mpvsocket'}, function() {
      client.write(command);
      client.on('data', function(data) {
        o = JSON.parse(data);
        onSuccess(o);
        client.destroy(); // kill client after server's response 
      });
      client.on('error', function(data) {
        o = JSON.parse(data);
        onFailure(o);
        client.destroy(); // kill client after server's response 
      });
    }) 
}

Mpv.prototype.quit = function() {
  var that = this;
  var onSuccess = function(response) {
    that.channel.say(response.toString());
  }
  var onFailure = function(response) {
    that.channel.say(response.toString());
  }
  mpv_send('{ "command": ["quit"] }\n',
    onSuccess,
    onFailure);
};

Mpv.prototype.timeRemaining = function() {
  var that = this;
  var onSuccess = function(response) {
    if(response.error=="success") {
      var time_s = response.data;
      var minutes = Math.floor(time_s / 60);
      that.channel.say('YOUTUBE:'.irc.green()+ ' '+minutes.toString().irc.bold()+" minutes left.");
    }
  }
  var onFailure = function(response) {
    that.channel.say(response.toString());
  }
  mpv_send('{ "command": ["get_property", "time-remaining"] }\n',
    onSuccess,
    onFailure);
}

Mpv.prototype.pause = function(on) {
  var that = this;
  var onSuccess = function(response) {
    that.channel.say(response.toString());
  }
  var onFailure = function(response) {
    that.channel.say(response.toString());
  }
  mpv_send('{ "command": ["set_property", "pause", '+ on +'] }\n',
    onSuccess,
    onFailure);
}

Mpv.prototype.mute = function(on) {
  var that = this;
  var onSuccess = function(response) {
    that.channel.say(response.toString());
  }
  var onFailure = function(response) {
    that.channel.say(response.toString());
  }
  mpv_send('{ "command": ["set_property", "mute", '+ on +'] }\n',
    onSuccess,
    onFailure);
}

Mpv.prototype.filename = function() {
  var that = this;
  var onSuccess = function(response) {
    if(response.error=="success") {
      var filename = response.data;
      that.channel.say('YOUTUBE:'.irc.green()+' playing '+filename.irc.bold());
    }
    
  }
  var onFailure = function(response) {
    that.channel.say(response.toString());
  }
  mpv_send('{ "command": ["get_property", "media-title"] }\n',
    onSuccess,
    onFailure);
}

module.exports = Mpv;
