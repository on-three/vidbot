var torrent = require("./lib/torrent-client.js");


// Single command line argument is torrent file url or magnet link
if(process.argv.length != 3) {
  console.error("usage: node torentTest.js <url or magnet link to torrent>");
  return -1;
}
var torrentFilename = process.argv[2];
console.log("Fetching torrent: ", torrentFilename);

var Channel = function(name, client) {
  this.client = client;
  this.name = name;
  this.say = function(something) {
    console.log(something);
  }
  this.log = function(something) {
    console.log(something);
  }
}
var channel = new Channel('TORRENTTEST', null)

var settings = {
    options : {
    connections: 100,     // Max amount of peers to be connected to.
    uploads: 10,          // Number of upload slots.
    tmp: '/tmp',          // Root folder for the files storage.
                          // Defaults to '/tmp' or temp folder specific to your OS.
                          // Each torrent will be placed into a separate folder under /tmp/torrent-stream/{infoHash}
    //path: '/tmp/my-file', // Where to save the files. Overrides `tmp`.
    verify: true,         // Verify previously stored data before starting
                          // Defaults to true
    dht: true,            // Whether or not to use DHT to initialize the swarm.
                          // Defaults to true
    tracker: true        // Whether or not to use trackers from torrent file or magnet link
                          // Defaults to true
    // trackers: [
    //     'udp://tracker.openbittorrent.com:80',
    //     'udp://tracker.ccc.de:80'
    // ]
                          // Allows to declare additional custom trackers to use
                          // Defaults to empty
    //storage: myStorage()  // Use a custom storage backend rather than the default disk-backed one
  }
};

var largestFileSelector = function() {
  //return largest file in the torrent.
  this.selectFile = function (filelist) {
    filelist.sort( function(a, b) {
      return b.length - a.length;
    });
    //filelist.sort(selectFile);
    for(var i=0;i<filelist.length; ++i) {
      console.log("value: ",i," is ", filelist[i].name);
    }
    console.log("larget file to be downloaded is: ", filelist[0].name);
    return filelist[0];
  };

  // {
  //   name: 'my-filename.txt',
  //   path: 'my-folder/my-filename.txt',
  //   length: 424242
  // }
}

var nthFileSelector = function(n) {
  //return largest file in the torrent.
  var n = n;
    this.selectFile = function(filelist) {
    if(n < 1 || n > filelist.length) {
      return null;
    }
    return filelist[n-1];
  };
}

var fileLister = function() {
  //return largest file in the torrent.
  var n = n;
  this.selectFile = function(filelist) {
    filelist.forEach(function(file) {
      console.log('filename:', file.name);
    });
    return null;
  }
}

var onTorrentPlay = function() {
  console.log("onTorrentPlay");
}

var onTorrentLoaded = function() {
  console.log("onTorrentLoaded");
}

var onTorrentEnd = function() {
  console.log("onTorrentEnd");
}

var client = torrent(settings,
                      channel,
                        torrentFilename,
                        new largestFileSelector(),
                        //new fileLister(),
                        //new nthFileSelector(5),
                        onTorrentPlay,
                        onTorrentLoaded,
                        onTorrentEnd);

// while(true) {
//
// }
