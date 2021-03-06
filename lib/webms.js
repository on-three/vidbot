/*
NAME: webms.js
AUTHOR: on_three
email: on.three.email@gmail.command
DATE: Sunday, Sept 6th 2015
DESC: node.js reimplimentation of IRC bot webms plugin.
  Looks for URLS in incoming IRC posts and plays certain
  playable urls (webms, images) atop a video stream via
  mpv.
*/

var Mpv = require('./mpv.js')
var c = require('irc-colors').global();
var config = require('../settings.json');
var whitelisted = require('./whitelist.js').whitelisted;
var modlisted = require('./whitelist.js').modlisted;
var soundSystem = require('./sound.js');
var unirest = require('unirest');

var bind = function(func, thisValue) {
  return function() {
    return func.apply(thisValue, arguments);
  }
}

function Webms(settings) {
  this.settings = settings;
  this.prefix = settings.prefix;
  this.INSTANCE = settings.instance;
  this.display = settings.display;
  this.enabled = true;
  this.mpvs = [];
  for(var i = 0; i<settings.screens.length;++i) {
    this.mpvs.push(null);
  }
  this.queue = [];

  var QUIT_REGEX = config.delimiter + this.prefix +" (q|quit|wipe|next)$";
  var WIPE_REGEX = config.delimiter + "(wipe)$";
  var ON_REGEX = config.delimiter + this.prefix +" on$";
  var OFF_REGEX = config.delimiter + this.prefix +" off$";
  var PLAY_REGEX = "((http\\S+)\\.(webm|gif|mp3|mp4|jpg|jpeg|png|webp))";

  this.handlers = {}
    //"$" : FILENAME,
    //"y (h|help)$" : help,
   this.handlers[QUIT_REGEX] = whitelisted(this, this.wipeAll),
   this.handlers[WIPE_REGEX] = whitelisted(this, this.wipeAll),
   this.handlers[ON_REGEX] = whitelisted(this, this.on),
   this.handlers[OFF_REGEX] = whitelisted(this, this.off),
   this.handlers[PLAY_REGEX] = whitelisted(this, this.play)
}

Webms.prototype.wipeAll = function(channel, who, message, match) {
  for(var i = 0; i<this.mpvs.length;++i) {
    if(this.mpvs[i]) {
      this.mpvs[i].quit();
    }
  }
}

Webms.prototype.play = function(channel, who, message, match) {
  var that = this;
  var filename = match[1];
  if(!this.enabled) {
    return message;
  }
  //Look for a position in our mpvs array where we can play this webm
  for(var i = 0; i<this.mpvs.length;++i) {
    if(this.mpvs[i]) {
      continue;
    }
    //found a spot we can play this video. so play it.
    // to do so we need to set up some custom settings
    var s = this.settings.screens[i];
    var mpv = new Mpv(s, filename, channel);
    mpv.onComplete = function X() {
      that.mpvs[i]=null;
    }
    this.mpvs[i] = mpv;

    // send the scraped data to website
    this.sendScrapedURL(channel.name, who, filename);

    return null;
  }
  return message;
}

Webms.prototype.handleMessage = function(channel, who, message) {

  // first do a general filter to save us a lot of redundant work
  // if(!message.match(RegExp(config.delimiter + this.prefix, "i"))) {
  //   return message;
  // }

  for(var h in this.handlers) {
    regex =  RegExp(h, "i");
    var match = regex.exec(message);
    if(match) {
      return this.handlers[h](channel, who, message, match);
    }
  }
  return message;
}

Webms.prototype.status = function() {
  if(this.enabled){
    var s = '[' + this.INSTANCE + ' ON]';
    return s.irc.white.bggreen.bold();
  }
  var s = '[' + this.INSTANCE +' OFF]';
  return s.irc.black.bgred();
}

Webms.prototype.on = function(channel, who, message, match) {
  this.enabled = true;
  return null;
}

Webms.prototype.off = function(channel, who, message, match) {
  this.enabled = false;
  this.wipeAll(channel, who, message, match);
  return null;
}

// Send urls to a remote host
Webms.prototype.sendScrapedURL = function (channel, nick, url) {

  unirest.post(this.settings.scrape.url)
    .header('content-type', 'application/json')
    .auth({
      user: this.settings.scrape.user,
      pass: this.settings.scrape.password,
      sendImmediately: true})
    .send({ "channel": channel, "nick": nick, "url": url })
    .end(function (response) {console.log("****",response.body,"****");});
}

module.exports = Webms;
