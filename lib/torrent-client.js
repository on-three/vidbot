var torrentStream = require('torrent-stream');
var c = require('irc-colors').global();
var config = require('../settings.json');
var spawn = require('child_process').spawn;
var mpv = require('mpv.js');

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
  this.channel = channel;
  this.torrentFilename = torrentFilename;
  this.fileSelector = fileSelector;
  this.onTorrentPlay = onTorrentPlay;
  this.onTorrentLoaded = onTorrentLoaded;
  this.onTorrentEnd = onTorrentEnd;
  this.mpv = null;
  this.progress = null;
  this.f = null;

  this.engine = torrentStream(this.torrentFilename, settings.config);
  this.filename = '';

  this.writeToMPV = function() {
    if(this.mpv) {
      that.mpv.stdin.write(chunk);
    }
  }

  this.engine.on('ready', function() {
      that.f = that.fileSelector.selectFile(that.engine.files);
      /*
      f structure:
      {
        name: 'my-filename.txt',
        path: 'my-folder/my-filename.txt',
        length: 424242
      }
      */
      if(that.f) {
        //that.mpv = spawn('mpv', ['-', ' --title="'+ that.f.name +'"'], { stdio: ['pipe', 1, 2, 'ipc']});
        //that.mpv.stdout.pipe(process.stdout);

        that.mpv = new Mpv(that.settings.mpv, that.f.name, channel);)
        that.stream = that.f.createReadStream();
        that.stream.pipe(that.mpv.stdin);

        // hook up a progress monitor on data arrival
        that.stream.on('data', function(chunk){
          if(!that.progress) {
            that.progress = new progressBar(that.f.length);
            // got our first data, so start torrent playing
            // nad notify clients
            that.onTorrentPlay();
          }
          if(that.progress) {
            that.progress.addBytes(chunk.length);
            var p = that.progress.getProgressString();
            console.log(p);
          }
          if(that.progress.complete()) {
            // All torrent data loaded so stop the engine and notify clients.
            that.onTorrentLoaded();
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


module.exports = TorrentClient;
