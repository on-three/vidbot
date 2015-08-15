var spawn = require('child_process').spawn;
var net = require('net');
var c = require('irc-colors').global();


function Mpv(instanceName, file, ch) {
  var that = this;
  this.file = file;
  this.INSTANCE = instanceName;
  this.name = function() {
    var str = '[' + this.INSTANCE + ']';
    return str.irc.green.bold();
  }
  //this is meant to represent what we write output to
  //either a log or IRC channel or both
  this.channel = ch;
  this.onComplete = null;
  this.proc = spawn('mpv', [this.file, '--input-unix-socket=/tmp/mpvsocket_'+this.INSTANCE], { stdio: 'inherit' });
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
    that.channel.say(that.name()+' pause '+ that.on.toString().irc.bold());
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
    that.channel.say(that.name()+' mute '+ that.on.toString().irc.bold());
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

module.exports = Mpv;
