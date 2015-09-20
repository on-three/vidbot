/*
  FILE: torrent2.js
  AUTHOR: on_three
  EMAIL: on.three.email@gmail.com
  DESC: IRC plugin to control a torrent client
*/

var TorrentClient = require('./torrent-client.js')
var c = require('irc-colors').global();
var config = require('../settings.json');
var whitelisted = require('./whitelist.js').whitelisted;
var modlisted = require('./whitelist.js').modlisted;
var soundSystem = require('./sound.js');

/*
  Functor that returns the largest torrent file
  provided an input torrent-stream filelist.
  Torrent-stream file objects have the following
  structure:
  // {
  //   name: 'my-filename.txt',
  //   path: 'my-folder/my-filename.txt',
  //   length: 424242
  // }
*/
var largestFileSelector = function() {
  //return largest file in the torrent.
  this.selectFile = function (filelist) {
    filelist.sort( function(a, b) {
      return b.length - a.length;
    });
    return filelist[0];
  };


}

/*
  Functor to return the Nth filename in a torrent.
  Will returnn null for improper values of N.
*/
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

/*
  Functor to merely print (speak in IRC channel) info
  regarding a torrent.
  Shows largest filename and how many files in the torrent.
*/
var torrentInfo = function(channel, INSTANCE) {
  // get largest file in the torrent
  this.selectFile = function (filelist) {
    var n = filelist.length;
    filelist.sort( function(a, b) {
      return b.length - a.length;
    });
    var instance = "[" + INSTANCE + "]";
    channel.say(instance.irc.white.bggreen.bold() + " target: " + filelist[0].name + " among " + n + " files. ")
    return null;
  };
}

/*
  Functor to show info on the Nth file within a torrent.
*/
var nthTorrentInfo = function(channel, INSTANCE, n) {
  // get largest file in the torrent
  this.selectFile = function (filelist) {
    var instance = "[" + INSTANCE + "]";
    if( n < 0 || n >= filelist.length) {
      channel.say(instance + " improper filenumber. Torrent only has " + filelist.length.toString() + " files.");
    }else{
      channel.say(instance.irc.white.bggreen.bold() + " target: " + filelist[n].name + ". File " + n + " of " + filelist.length.toString() + ". ")
    }
    return null;
  };
}


var bind = function(func, thisValue) {
  return function() {
    return func.apply(thisValue, arguments);
  }
}

function Torrent(settings) {
  this.settings = settings;
  this.prefix = settings.prefix;
  this.INSTANCE = settings.instance;
  this.display = settings.display;
  this.enabled = true;
  this.torrentClient = null;

  //this.queue = [];
  //this.youtubeStartEvent = soundSystem.subscribe('youtubeStart', null);
  //this.youtubeStopEvent = soundSystem.subscribe('youtubeEnd', null);

  this.handlers = {
    "$" : bind(this, this.filename),
    //"y (h|help)$" : help,
    "( )?(f|file|filename)$" : bind(this, this.filename),
    "( )?(t|time)$" : bind(this, this.time),
    " (pause on|pause)$" : whitelisted(this, this.pause),
    " (pause off|unpause)$" : whitelisted(this, this.unpause),
    " (mute on|mute)$" : whitelisted(this, this.mute),
    " (mute off|unmute)$" : whitelisted(this, this.unmute),
    " (q|quit|wipe|next)$" : whitelisted(this, this.quit),
    //" wipe all$" : whitelisted(WIPEALL),
    " on$" : whitelisted(this, this.on),
    " off$" : whitelisted(this, this.off),
    " subs (on|off)$" : whitelisted(this, this.subs),
    " subs (\\d)$" : whitelisted(this, this.subtitleTrack),
    " audio (\\d)$" : whitelisted(this, this.audioTrack),
    ' seek ([+-]?[0-9]{1,9})$' : whitelisted(this, this.seek),
    " \\? (\\S+)$" : whitelisted(this, this.getTorrentInfo),
    " \\?(\\d) (\\S+)$" : whitelisted(this, this.getSpecificTorrentInfo),
    " (\\S+)$" : whitelisted(this, this.startTorrent),
    " (\\d) (\\S+)$" : whitelisted(this, this.startTorrentN)
  };
}

Torrent.prototype.handleMessage = function(channel, who, message) {

  // first do a general filter to save us a lot of redundant work
  if(!message.match(RegExp(config.delimiter + this.prefix, "i"))) {
    return message;
  }

  for(var h in this.handlers) {
    regex =  RegExp(config.delimiter + this.prefix + h, "i");
    var match = regex.exec(message);
    if(match) {
      return this.handlers[h](channel, who, message, match);
    }
  }
  return message;
}

Torrent.prototype.status = function() {
  if(this.torrentClient) {
    //var queueDesc = '';
    // if(this.queue.length) {
    //   queueDesc = ' (' + this.queue.length.toString() + ' queued)';
    // }
    var playingDesc = '[' + this.INSTANCE +' PLAYING]';// + queueDesc;
    return playingDesc.irc.yellow.bggreen.bold();
  }else if(this.enabled){
    var s = '[' + this.INSTANCE + ' ON]';
    return s.irc.white.bggreen.bold();
  }
  var s = '[' + this.INSTANCE +' OFF]';
  return s.irc.black.bgred();
}

Torrent.prototype.on = function(channel, who, message, match) {
  this.enabled = true;
  return null;
}

Torrent.prototype.off = function(channel, who, message, match) {
  this.enabled = false;
  if(this.torrentClient) {
    this.quit(channel, who, message, match);
  }
  return null;
}

Torrent.prototype.playFile = function(channel, torrentFilename, selector) {
  var that = this;
  if(!this.enabled) {
    return message;
  }
  this.torrentClient = new TorrentClient(this.settings,
                            channel,
                            torrentFilename,
                            selector,
                            function(){console.log("on torrent start");},
                            function(){console.log("on torrent loaded");},
                            function(){console.log("on torrent END"); that.torrentclient=null;});
}

Torrent.prototype.startTorrent = function(channel, who, message, match) {
  var torrentFilename = match[1];
  if(torrentFilename.length<1) {
    return message;
  }
  console.log("startTorrent with filename: ", torrentFilename);
  this.playFile(channel, torrentFilename, new largestFileSelector());
  return null;
}

Torrent.prototype.startTorrentN = function(channel, who, message, match) {
  var n = match[1];
  var torrentFilename = match[2];
  if(torrentFilename.length<1 || n<1) {
    return message;
  }
  this.playFile(channel, torrentFilename, new nthFileSelector(n));
  return null;
}


Torrent.prototype.quit = function(channel, who, message, match) {
  if(this.torrentclient) {
    this.torrentClient.quit();
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.wipeAll = function(channel, who, message, match) {
  this.queue = [];
  this.quit(channel, who, message, match);
  return null;
}

Torrent.prototype.filename = function(channel, who, message, match) {
  if(this.torrentClient) {
    this.torrentClient.filename(channel);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.time = function(channel, who, message, match) {
  if(this.torrentClient) {
    this.torrentClient.timeRemaining(channel);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.pause = function(channel, who, message, match) {
  var on = true;
  if(this.torrentClient) {
    this.torrentClient.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.unpause = function(channel, who, message, match) {
  var on = false;
  if(this.torrentClient) {
    this.torrentClient.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.mute = function(channel, who, message, match) {
  var on = true;
  if(this.torrentClient) {
    this.torrentClient.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.unmute = function(channel, who, message, match) {
  var on = false;
  if(this.torrentClient) {
    this.torrentClient.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.subs = function(channel, who, message, match) {
  var arg = match[1];
  var on = true;
  if(arg=='off'){on=false;}
  if(this.torrentClient) {
    this.torrentClient.subs(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Torrent.prototype.subtitleTrack = function(channel, who, message, match) {
  var id = match[1];
  if(this.torrentClient) {
    this.torrentClient.subtitleTrack(channel, id);
  }
  return null;
}

Torrent.prototype.audioTrack = function(channel, who, message, match) {
  var id = match[1];
  if(this.torrentClient) {
    this.torrentClient.audioTrack(channel, id);
  }
  return null;
}

Torrent.prototype.seekSeconds = function(channel, who, message, match) {
  var s = match[1];
  if(this.torrentClient) {
    this.torrentClient.seekSeconds(channel, s);
  }
  return null;
}

Torrent.prototype.getTorrentInfo = function(channel, who, message, match) {
  var that = this;
  var torrent = match[1];
  // Just instantiate a torrent client, but don't keep a ref to it
  // It will just clean itself up after the provided file selection Functor
  // returns null (download no file).
  var client = new TorrentClient(this.settings,
                          channel,
                          torrent,
                          new torrentInfo(channel, this.settings.instance),
                          null,
                          null,
                          null);
  return null;
}

Torrent.prototype.getSpecificTorrentInfo = function(channel, who, message, match) {
  var that = this;
  var n = match[1];
  var torrent = match[2];

  // Just instantiate a torrent client, but don't keep a ref to it
  // It will just clean itself up after the provided file selection Functor
  // returns null (download no file).
  var client = new TorrentClient(this.settings,
                          channel,
                          torrent,
                          new nthTorrentInfo(channel, this.settings.instance, n),
                          null,
                          null,
                          null);
}

module.exports = Torrent;
