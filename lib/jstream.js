var Mpv = require('./mpv.js')
var c = require('irc-colors').global();
var config = require('../settings.json');
var whitelisted = require('./whitelist.js').whitelisted;
var modlisted = require('./whitelist.js').modlisted;
var soundSystem = require('./sound.js');

var mpv = null;
var enabled = true;
var settings = config.jstream
var PREFIX = 'jstream';

var youtubeStartEvent = soundSystem.subscribe('youtubeStart',
  function(){_mute();}
);
var youtubeStopEvent = soundSystem.subscribe('youtubeEnd',
  function(){_unmute();}
);

var handlers = {
  //"jstream (h|help)$" : help,
  "( start)?$" : whitelisted( start ),
  " (q|quit|wipe|stop)$" : whitelisted( quit ),
  " (m|mute)$" : whitelisted( mute ),
  " (u|unmute)$" : whitelisted( unmute ),
};

exports.handleMessage = function(channel, who, message) {

  // first do a general filter to save us a lot of redundant work
  if(!message.match(RegExp(config.delimiter + PREFIX, "i"))) {
    return message;
  }

  for(var h in handlers) {
    regex =  RegExp(config.delimiter + PREFIX + h, "i");
    var match = regex.exec(message);
    if(match) {
      return handlers[h](channel, who, message, match);
    }
  }
  return message;
}

exports.status = function() {
  if(mpv) {
    return '[JSTREAM PLAYING]'.irc.yellow.bggreen.bold();
  }else if(enabled){
    return '[JSTREAM ON]'.irc.white.bggreen.bold();
  }
  return '[JSTREAM OFF]'.irc.black.bgred();
}

function on(channel, who, message, match) {
  enabled = true;
  return null;
}

function off(channel, who, message, match) {
  enabled = false;
  if(mpv) {
    quit(channel, who, message, match);
  }
  return null;
}

function start(channel, who, message, match) {
  if(!enabled) {
    return message;
  }
  if(mpv) {
    return null;
  }else{
    mpv = new Mpv(settings, settings.url, channel);
    mpv.onComplete = function X() {
      mpv=null;
    };
  }
  return null;
}
function quit(channel, who, message, match) {
  if(mpv) {
    mpv.quit();
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

function _mute() {
  if(mpv) {
    mpv.mute(true);
  }
}

function _unmute() {
  if(mpv) {
    mpv.mute(false);
  }
}

function mute(channel, who, message, match) {
  _mute();
  return null;
}

function unmute(channel, who, message, match) {
  _unmute();
  return null;
}

function onYoutubeStart(args) {
  mute();
}

function onYoutubeEnd(args) {
  unmute();
}
