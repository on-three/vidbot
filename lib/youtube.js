var Mpv = require('./mpv.js')
var c = require('irc-colors').global();
var config = require('../settings.json');

var mpv = null;
var currentFile = null;
var INSTANCE = 'YOUTUBE';
var enabled = true;
var queue = [];

handlers = {
  "y$" : filename,
  //"y (h|help)$" : help,
  "y( )?(f|filename)$" : filename,
  "y( )?(t|time)$" : time,
  "y (pause on|pause)$" : pause,
  "y (pause off|unpause)$" : unpause,
  "y (mute on|mute)$" : mute,
  "y (mute off|unmute)$" : unmute,
  "y (q|quit|wipe|next)$" : quit,
  "y wipe all$" : wipeAll,
  "y on$" : on,
  "y off$" : off,
  "y subs (on|off)$" : subs,
  "y subs (\d)$" : subtitleTrack,
  "y audio (\d)$" : audioTrack,
  "y (\\S+)$" : playFile
};

exports.handleMessage = function(channel, who, message) {

  // first do a general filter to save us a lot of redundant work
  if(!message.match(RegExp(config.delimiter+"y"))) {
    return message;
  }

  for(var h in handlers) {
    regex =  RegExp(config.delimiter + h, "i");
    var match = regex.exec(message);
    if(match) {
      return handlers[h](channel, who, message, match);
    }
  }
  return message;
}

exports.status = function() {
  if(mpv) {
    return '[YOUTUBE PLAYING]'.irc.white.bggreen.bold();
  }else if(enabled){
    return '[YOUTUBE ON]'.irc.white.bggreen.bold();
  }
  return '[YOUTUBE OFF]'.irc.black.bgred();
}

function on(channel, who, message, match) {
  enabled = true;
}

function off(channel, who, message, match) {
  enabled = false;
  if(mpv) {
    quit(channel, who, message, match);
  }
}

function playFile(channel, who, message, match) {
  if(!enabled) {
    return;
  }
  var filename = match[1];
  if(mpv) {
    queue.push(filename);
    return;
  }else{
    mpv = new Mpv(INSTANCE, filename, channel);
    currentFile = filename;
    mpv.onComplete = function X() {
      if(queue.length) {
        var f = queue.shift();
        mpv = new Mpv(INSTANCE, f, channel);
        mpv.onComplete = X;
        currentFile = f;
      }else{
        mpv=null;
        currentFile=null;
      }
    };
  }
}
function quit(channel, who, message, match) {
  if(mpv) {
    mpv.quit();
  }else{
    //idleOrBusy(channel);
  }
}

function wipeAll(channel, who, message, match) {
  queue = [];
  quit();
}

function filename(channel, who, message, match) {
  if(mpv) {
    mpv.filename(channel);
  }else{
    //idleOrBusy(channel);
  }
}

function time(channel, who, message, match) {
  if(mpv) {
    mpv.timeRemaining(channel);
  }else{
    //idleOrBusy(channel);
  }
}

function pause(channel, who, message, match) {
  var on = true;
  if(mpv) {
    mpv.pause(on);
  }else{
    //idleOrBusy(channel);
  }
}

function unpause(channel, who, message, match) {
  var on = false;
  if(mpv) {
    mpv.pause(on);
  }else{
    //idleOrBusy(channel);
  }
}

function mute(channel, who, message, match) {
  var on = true;
  if(mpv) {
    mpv.mute(on);
  }else{
    //idleOrBusy(channel);
  }
}

function unmute(channel, who, message, match) {
  var on = false;
  if(mpv) {
    mpv.mute(on);
  }else{
    //idleOrBusy(channel);
  }
}

function subs(channel, who, message, match) {
  var arg = match[1];
  var on = true;
  if(arg=='off'){on=false;}
  if(mpv) {
    mpv.subs(on);
  }else{
    //idleOrBusy(channel);
  }
}

function subtitleTrack(channel, who, message, match) {
  var id = match[1];
  if(mpv) {
    mpv.subtitleTrack(channel, id);
  }
}

function audioTrack(channel, who, message, match) {
  var id = match[1];
  if(mpv) {
    mpv.audioTrack(channel, id);
  }
}
