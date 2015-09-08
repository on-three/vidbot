var spawn = require('child_process').spawn;
var net = require('net');
var c = require('irc-colors').global();

var psTree = require('ps-tree');

var kill = function (pid, signal, callback) {
    signal   = signal || 'SIGKILL';
    callback = callback || function () {};
    var killTree = true;
    if(killTree) {
        psTree(pid, function (err, children) {
            [pid].concat(
                children.map(function (p) {
                    return p.PID;
                })
            ).forEach(function (tpid) {
                try { process.kill(tpid, signal) }
                catch (ex) { }
            });
            callback();
        });
    } else {
        try { process.kill(pid, signal) }
        catch (ex) { }
        callback();
    }
};


function Peerflix(settings, file, ch) {
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
  var peerflixSettings = [this.file];
  if(settings.peerflix) {
    Array.prototype.push.apply(peerflixSettings, settings.peerflix);
  }
  this.proc = spawn('peerflix', peerflixSettings, { stdio: 'inherit', env: env });
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

Peerflix.prototype.mpv_send = function(command, onSuccess, onFailure) {
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
      console.error("PEERFLIX MPV_SEND ERROR");
      client.destroy(); // kill client after server's response
    });

}

Peerflix.prototype.quit = function() {
  var that = this;
  console.log("PEERFLIX QUIT INVOKED.");
  var onSuccess = function(response) {
    //that.channel.say(response.toString());
    console.log("SENDING QUIT SIGNALS");
    kill(that.proc.pid);
    if(that.onComplete) {
       that.onComplete();
    }
  }
  var onFailure = function(response) {
    that.channel.log("["+that.INSTANCE+"] quit onFailure");
    kill(that.proc.pid);
    if(that.onComplete) {
       that.onComplete();
    }
  }
  this.mpv_send('{ "command": ["quit"] }\n',
    onSuccess,
    onFailure);
  kill(that.proc.pid);
};

Peerflix.prototype.timeRemaining = function() {
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

Peerflix.prototype.pause = function(on) {
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

Peerflix.prototype.mute = function(on) {
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

Peerflix.prototype.filename = function() {
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
  console.log("seding mpv a request for filename...");
  this.mpv_send('{ "command": ["get_property", "media-title"] }\n',
    onSuccess,
    onFailure);
}

Peerflix.prototype.subs = function(on) {
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

Peerflix.prototype.audioTrack = function(channel, id) {
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

Peerflix.prototype.subtitleTrack = function(channel, id) {
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

Peerflix.prototype.seekSeconds = function(channel, s) {
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

module.exports = Peerflix;
