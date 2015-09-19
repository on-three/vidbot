var torrentStream = require('torrent-stream');
var c = require('irc-colors').global();
var config = require('../settings.json');
var spawn = require('child_process').spawn;


function TorrentClient( settings,
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

  this.engine = torrentStream(this.torrentFilename);
  that.chunks = []

  this.writeToMPV = function() {
    if(this.mpv) {
      that.mpv.stdin.write(chunk);
    }
  }

  this.engine.on('ready', function() {
      var f = that.fileSelector.selectFile(that.engine.files);
      if(f) {
        that.mpv = spawn('mpv', ['-'], { stdio: ['pipe', 1, 2, 'ipc']});
        //that.mpv.stdout.pipe(process.stdout);
        that.stream = f.createReadStream();
        that.stream.pipe(that.mpv.stdin);
      }else{
        console.log("no file to be downloaded.");
        that.engine.destroy(null);
      }
  });
}

TorrentClient.prototype.quit = function() {

}


module.exports = TorrentClient;
