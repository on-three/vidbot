var spawn = require('child_process').spawn;
var net = require('net');
var c = require('irc-colors').global();


function Mpv(settings, file, ch) {
  var that = this;
  this.file = file;
  this.settings = settings;
  this.INSTANCE = settings.instance;
  this.name = function() {
    var str = '[' + this.INSTANCE + ']';
    return str.irc.green.bold();
  }
  //this is meant to represent what we write output to
  //either a log or IRC channel or both
  this.channel = ch;
  this.onComplete = null;
  var env = Object.create( process.env );
  // if(settings.display) {
  //   env.DISPLAY = settings.display;
  // }
  // Also pass through any applicaiton specific settings we might have
  var mpvSettings = [this.file, '--input-unix-socket=/tmp/mpvsocket_'+this.INSTANCE, '--mute=no'];
  if(settings.mpv) {
    Array.prototype.push.apply(mpvSettings, settings.mpv);
  }
  if(this.file === '-') {
    this.proc = spawn('mpv', mpvSettings, { stdio: ['pipe', 1, 2, 'ipc']});
    this.stdin = this.proc.stdin;
  } else {
    this.proc = spawn('mpv', mpvSettings, { stdio: 'inherit', env: env });
  }
  this.proc.on('exit', function (code) {
    if(code) {
      that.channel.say(that.name()+ ' file "'+that.file+'" was fucked aniki.');
    }
   that.proc = null;
   if(that.onComplete) {
      that.onComplete();
   }
  });
  this.proc.on('error', function (err) {
   that.proc = null;
   if(that.onComplete) {
      that.onComplete();
   }
  });
};

Mpv.prototype.mpv_send = function(command, onSuccess, onFailure) {
    var that = this;
    var client = net.connect({path: '/tmp/mpvsocket_'+this.INSTANCE}, function() {
      client.write(command);
      client.on('data', function(data) {
        try {
          var msgs = data.toString().split('\n');
          for(m in msgs) {
            console.log(msgs[m].toString());
            o = JSON.parse(msgs[m].toString());
            if(o.error && o.error=="success") {
              onSuccess(o);
            }
          }
        }catch(err){
          that.channel.log("Caught JSON parsing error in mpv_send.");
        }
        client.destroy(); // kill client after server's response
      })
    });
    client.on('error', function(data) {
      //o = JSON.parse(data);
      //onFailure(o);
      client.destroy(); // kill client after server's response
    });
}

Mpv.prototype.quit = function() {
  var that = this;
  var onSuccess = function(response) {
    //that.channel.say(response.toString());
  }
  var onFailure = function(response) {
    that.channel.log("["+that.INSTANCE+"] quit onFailure");
  }
  this.mpv_send('{ "command": ["quit"] }\n',
    onSuccess,
    onFailure);
};

Mpv.prototype.timeRemaining = function() {
  var that = this;
  var onSuccess = function(response) {
    if(response.error=="success") {
      var time_s = response.data;
      var minutes = Math.floor(time_s / 60);
      that.channel.say(that.name()+ ' '+minutes.toString().irc.bold()+" minutes left.");
    }
  }
  var onFailure = function(response) {
    that.channel.log("["+that.INSTANCE+"] timeRemaining onFailure");
  }
  this.mpv_send('{ "command": ["get_property", "time-remaining"] }\n',
    onSuccess,
    onFailure);
}

Mpv.prototype.pause = function(on) {
  var that = this;
  var onSuccess = function(response) {
    //that.channel.say(that.name()+' pause '+ that.on.toString().irc.bold());
  }
  var onFailure = function(response) {
    that.channel.log("["+that.INSTANCE+"] pause onFailure");
  }
  this.mpv_send('{ "command": ["set_property", "pause", '+ on +'] }\n',
    onSuccess,
    onFailure);
}

Mpv.prototype.mute = function(on) {
  var that = this;
  this.on = on;
  var onSuccess = function(response) {
    //that.channel.say(that.name()+' mute '+ that.on.toString().irc.bold());
  }
  var onFailure = function(response) {
    that.channel.log("["+that.INSTANCE+"] mute onFailure");
  }
  this.mpv_send('{ "command": ["set_property", "mute", '+ on +'] }\n',
    onSuccess,
    onFailure);
}

Mpv.prototype.filename = function() {
  var that = this;
  var onSuccess = function(response) {
    if(response.error=="success") {
      var filename = response.data;
      that.channel.say(that.name()+' playing '+filename.irc.bold());
    }

  }
  var onFailure = function(response) {
    that.channel.log("["+that.INSTANCE+"] filename onFailure");
  }
  this.mpv_send('{ "command": ["get_property", "media-title"] }\n',
    onSuccess,
    onFailure);
}

Mpv.prototype.subs = function(on) {
  var that = this;
  var onSuccess = function(response) {
    //that.channel.say(that.name()+' pause '+ that.on.toString().irc.bold());
  }
  var onFailure = function(response) {
    that.channel.log("["+that.INSTANCE+"] subs onFailure");
  }
  this.mpv_send('{ "command": ["set_property", "sub-visibility", '+ on.toString() +'] }\n',
    onSuccess,
    onFailure);
}

Mpv.prototype.audioTrack = function(channel, id) {
  var that = this;
  var onSuccess = function(response) {
    //that.channel.say(that.name()+' pause '+ that.on.toString().irc.bold());
  }
  var onFailure = function(response) {
    that.channel.log("["+that.INSTANCE+"] aid onFailure");
  }
  var sendString = '{ "command": ["set_property", "aid", ' + id.toString() +' ] }\n'
  this.mpv_send(sendString,
    onSuccess,
    onFailure);
}

Mpv.prototype.subtitleTrack = function(channel, id) {
  var that = this;
  var onSuccess = function(response) {
    //that.channel.say(that.name()+' pause '+ that.on.toString().irc.bold());
  }
  var onFailure = function(response) {
    that.channel.log("["+that.INSTANCE+"] sid onFailure");
  }
  var sendString = '{ "command": ["set_property", "sid", ' + id.toString() +' ] }\n'
  this.mpv_send(sendString,
    onSuccess,
    onFailure);
}

Mpv.prototype.seekSeconds = function(channel, s) {
  var that = this;
  var onSuccess = function(response) {
    //that.channel.say(that.name()+' pause '+ that.on.toString().irc.bold());
  }
  var onFailure = function(response) {
    that.channel.log("["+that.INSTANCE+"] sid onFailure");
  }
  var sendString = '{ "command": ["seek", ' + s +' ] }\n'
  this.mpv_send(sendString,
    onSuccess,
    onFailure);
}

module.exports = Mpv;
