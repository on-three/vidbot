var Mpv = require('./mpv.js')
var c = require('irc-colors').global();
var config = require('../settings.json');
var whitelisted = require('./whitelist.js').whitelisted;
var modlisted = require('./whitelist.js').modlisted;
var soundSystem = require('./sound.js');
var unirest = require('unirest');

var bind = function(func, thisValue) {
  return function() {
    console.log("invoking BIND");
    return func.apply(thisValue, arguments);
  }
}

function YoutubePlayer(settings) {
  this.settings = settings;
  this.prefix = settings.prefix;
  this.INSTANCE = settings.instance;
  this.display = settings.display;
  this.enabled = true;
  this.mpv = null;
  this.queue = [];
  this.youtubeStartEvent = soundSystem.subscribe('youtubeStart', null);
  this.youtubeStopEvent = soundSystem.subscribe('youtubeEnd', null);

  this.handlers = {
    "$" : this.filename,
    //"y (h|help)$" : help,
    "( )?(f|file|filename)$" : this.filename,
    "( )?(t|time)$" : this.time,
    " (pause on|pause)$" : whitelisted(this, this.pause),
    " (pause off|unpause)$" : whitelisted(this, this.unpause),
    " (mute on|mute)$" : whitelisted(this, this.mute),
    " (mute off|unmute)$" : whitelisted(this, this.unmute),
    " (q|quit|wipe|next)$" : whitelisted(this, this.quit),
    " wipe all$" : whitelisted(this, this.wipeAll),
    " on$" : whitelisted(this, this.on),
    " off$" : whitelisted(this, this.off),
    " subs (on|off)$" : whitelisted(this, this.subs),
    " subs (\\d)$" : whitelisted(this, this.subtitleTrack),
    " audio (\\d)$" : whitelisted(this, this.subtitleTrack),
    ' seek ([+-]?[0-9]{1,9})$' : whitelisted(this, this.seek),
    " (\\S+)$" : whitelisted(this, this.playFile)
  };
}

YoutubePlayer.prototype.handleMessage = function(channel, who, message) {

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

YoutubePlayer.prototype.status = function() {
  if(this.mpv) {
    var queueDesc = '';
    if(this.queue.length) {
      queueDesc = ' (' + this.queue.length.toString() + ' queued)';
    }
    var playingDesc = '[' + this.INSTANCE +' PLAYING]' + queueDesc;
    return playingDesc.irc.yellow.bggreen.bold();
  }else if(this.enabled){
    var s = '[' + this.INSTANCE + ' ON]';
    return s.irc.white.bggreen.bold();
  }
  var s = '[' + this.INSTANCE +' OFF]';
  return s.irc.black.bgred();
}

YoutubePlayer.prototype.on = function(channel, who, message, match) {
  this.enabled = true;
  return null;
}

YoutubePlayer.prototype.off = function(channel, who, message, match) {
  this.enabled = false;
  if(this.mpv) {
    this.quit(channel, who, message, match);
  }
  return null;
}

YoutubePlayer.prototype.playFile = function(channel, who, message, match) {
  var that = this;
  if(!this.enabled) {
    return message;
  }
  var filename = match[1];
  if(this.mpv) {
    this.queue.push(filename);
    return null;
  }else{
    this.mpv = new Mpv(this.settings, filename, channel);
    if(this.youtubeStartEvent) {
      this.youtubeStartEvent.invoke(null);
    }
    this.sendScrapedURL(channel.name, who, filename);

    this.mpv.onComplete = function X() {
      if(that.queue.length) {
        var f = that.queue.shift();
        that.mpv = new Mpv(that.settings, f, channel);
        that.mpv.onComplete = X;
        that.sendScrapedURL(channel.name, who, filename);
      }else{
        that.mpv=null;
        if(that.youtubeStopEvent) {
          that.youtubeStopEvent.invoke(null);
        }
      }
    };
  }
  return null;
}
YoutubePlayer.prototype.quit = function(channel, who, message, match) {
  if(this.mpv) {
    this.mpv.quit();
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

YoutubePlayer.prototype.wipeAll = function(channel, who, message, match) {
  this.queue = [];
  this.quit(channel, who, message, match);
  return null;
}

YoutubePlayer.prototype.filename = function(channel, who, message, match) {
  if(this.mpv) {
    this.mpv.filename(channel);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

YoutubePlayer.prototype.time = function(channel, who, message, match) {
  if(this.mpv) {
    this.mpv.timeRemaining(channel);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

YoutubePlayer.prototype.pause = function(channel, who, message, match) {
  var on = true;
  if(this.mpv) {
    this.mpv.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

YoutubePlayer.prototype.unpause = function(channel, who, message, match) {
  var on = false;
  if(this.mpv) {
    this.mpv.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

YoutubePlayer.prototype.mute = function(channel, who, message, match) {
  console.log("YOUTUBE MUTE INVOKED.");
  var on = true;
  if(this.mpv) {
    this.mpv.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

YoutubePlayer.prototype.unmute = function(channel, who, message, match) {
  var on = false;
  if(this.mpv) {
    this.mpv.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

YoutubePlayer.prototype.subs = function(channel, who, message, match) {
  var arg = match[1];
  var on = true;
  if(arg=='off'){on=false;}
  if(this.mpv) {
    this.mpv.subs(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

YoutubePlayer.prototype.subtitleTrack = function(channel, who, message, match) {
  var id = match[1];
  if(this.mpv) {
    this.mpv.subtitleTrack(channel, id);
  }
  return null;
}

YoutubePlayer.prototype.audioTrack = function(channel, who, message, match) {
  var id = match[1];
  if(this.mpv) {
    this.mpv.audioTrack(channel, id);
  }
  return null;
}

YoutubePlayer.prototype.seekSeconds = function(channel, who, message, match) {
  var s = match[1];
  if(this.mpv) {
    this.mpv.seekSeconds(channel, s);
  }
  return null;
}

// Send urls to a remote host
YoutubePlayer.prototype.sendScrapedURL = function (channel, nick, url) {

  unirest.post(this.settings.scrape.url)
    .header('content-type', 'application/json')
    .auth({
      user: this.settings.scrape.user,
      pass: this.settings.scrape.password,
      sendImmediately: true})
    .send({ "channel": channel, "nick": nick, "url": url })
    .end(function (response) {console.log("****",response.body,"****");});
}

module.exports = YoutubePlayer;
