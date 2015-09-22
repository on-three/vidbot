var torrentStream = require('torrent-stream');
var c = require('irc-colors').global();
var config = require('../settings.json');
var spawn = require('child_process').spawn;
var Mpv = require('./mpv.js');

function humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + 'B';
    }
    var units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+units[u];
}


function progressBar(totalBytes) {
  var that = this;
  this.totalBytes = totalBytes;
  this.bytesCollected = 0;
  this.updateTimer = setInterval(function(){that.doUpdate();}, 1000);

  var WINDOW_SIZE = 11;
  this.queue = [];

  this.complete = function() {
    return this.bytesCollected >= this.totalBytes;
  }

  this.doUpdate = function() {
    this.updateQueue(this.bytesCollected);
  }

  this.updateQueue = function (newValue) {
    this.queue.push(newValue);
    if (this.queue.length > WINDOW_SIZE)
        this.queue.shift();
    }

  this.getAverageValue = function(){
      if (this.queue.length < WINDOW_SIZE) {
          return 0;
      }
      var sum = 0;
      for (var i = this.queue.length - 1; i > 1; i--) {
        // since this queue records one second snapshots of
        // total bytes read, we need differences between Each
        // sample to estimate bytes/sec
          sum += (this.queue[i] - this.queue[i-1]);
      }
      var avgBps = sum / (this.queue.length-1);
      return humanFileSize(avgBps, true);
  };

  this.addBytes = function(numBytes) {
    this.bytesCollected += numBytes;
  };
  this.getProgressString = function() {
    var kBps = this.getAverageValue();
    var dataRead = humanFileSize(this.bytesCollected, true);
    var dataTotal = humanFileSize(this.totalBytes, true);
    var progressPercent = 100.0 * (this.bytesCollected/this.totalBytes);
    var progressPercentStr = parseFloat(Math.round(progressPercent * 100) / 100).toFixed(2);
    return "(" + dataRead + "/"
      + dataTotal + ") "
      + progressPercentStr + "% @" + kBps.toString()+'ps';
  }
}


function TorrentClient( settings,
                        channel,
                        torrentFilename,
                        fileSelector,
                        onTorrentPlay,
                        onTorrentLoaded,
                        onTorrentEnd) {
  var that = this;
  this.settings = settings;
  this.torrentFilename = torrentFilename;
  this.fileSelector = fileSelector;
  this.onTorrentPlay = onTorrentPlay;
  this.onTorrentLoaded = onTorrentLoaded;
  this.onTorrentEnd = onTorrentEnd;
  this.mpv = null;
  this.progress = null;
  this.f = null;

  try {
    this.engine = torrentStream(this.torrentFilename);
  } catch(err) {
    channel.say(settings.instance + " problem with that torrent file aniki.");
    return null;
  }

  this.engine.on('ready', function() {
      that.f = that.fileSelector.selectFile(that.engine.files);

      if(that.f) {
        console.log("going to download file: ",that.f.name);
        that.mpv = new Mpv(that.settings, '-', channel);

        that.stream = that.f.createReadStream();
        if(that.stream == null) {
          console.log("STREAM UNDEFINED.");
        }
        that.stream.pipe(that.mpv.stdin);
        that.stream.onComplete = function() {
          that.mpv = null;
          if(that.onTorrentEnd) {
            that.onTorrentEnd();
          }
        }
        // hook up a progress monitor on data arrival
        that.stream.on('data', function(chunk){
          if(!that.progress) {
            that.progress = new progressBar(that.f.length);
            // got our first data, so start torrent playing
            // nad notify clients
            if(that.onTorrentPlay) {
              that.onTorrentPlay();
            }
          }
          if(that.progress) {
            that.progress.addBytes(chunk.length);
            var p = that.progress.getProgressString();
            console.log(p);
          }
          if(that.progress.complete()) {
            // All torrent data loaded so stop the engine and notify clients.
            if(that.onTorrentLoaded) {
              that.onTorrentLoaded();
            }
          }

        });
      }else{
        console.log("no file to be downloaded.");
        that.engine.destroy(null);
      }
  });
}

TorrentClient.prototype.quit = function() {

}

TorrentClient.prototype.quit = function(channel, who, message, match) {
  if(this.mpv) {
    this.mpv.quit();
  }
  if(this.engine) {
    this.engine.destroy();
  }
  return null;
}

// TorrentClient.prototype.wipeAll = function(channel, who, message, match) {
//   this.queue = [];
//   this.quit(channel, who, message, match);
//   return null;
// }

TorrentClient.prototype.filename = function() {
  if(this.engine && this.f) {
    return this.f.name;
  }else{
    return null;
  }
  // if(this.peerflix) {
  //   this.peerflix.filename(channel);
  // }else{
  //   //idleOrBusy(channel);
  // }
  return null;
}

TorrentClient.prototype.time = function(channel, who, message, match) {
  if(this.mpv) {
    this.mpv.timeRemaining(channel);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

TorrentClient.prototype.pause = function(on) {
  if(this.mpv) {
    this.mpv.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

TorrentClient.prototype.unpause = function(on) {
  if(this.mpv) {
    this.mpv.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

TorrentClient.prototype.mute = function(on) {
  if(this.mpv) {
    this.mpv.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

TorrentClient.prototype.unmute = function(on) {
  if(this.mpv) {
    this.mpv.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

TorrentClient.prototype.subs = function(on) {
  if(this.mpv) {
    this.mpv.subs(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

TorrentClient.prototype.subtitleTrack = function(channel, id) {
  if(this.mpv) {
    this.mpv.subtitleTrack(channel, id);
  }
  return null;
}

TorrentClient.prototype.audioTrack = function(channel, id) {
  if(this.mpv) {
    this.mpv.audioTrack(channel, id);
  }
  return null;
}

TorrentClient.prototype.seekSeconds = function(channel, s) {
  if(this.mpv) {
    this.mpv.seekSeconds(channel, s);
  }
  return null;
}


module.exports = TorrentClient;
