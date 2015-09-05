var Mpv = require('./mpv.js')
var c = require('irc-colors').global();
var config = require('../settings.json');
var whitelisted = require('./whitelist.js').whitelisted;
var modlisted = require('./whitelist.js').modlisted;
var soundSystem = require('./sound.js');

var mpv = null;
var INSTANCE = 'YOUTUBE';
var enabled = true;
var queue = [];
var settings = config.youtube

var youtubeStartEvent = soundSystem.subscribe('youtubeStart', null);
var youtubeStopEvent = soundSystem.subscribe('youtubeEnd', null);

var handlers = {
  "y$" : filename,
  //"y (h|help)$" : help,
  "y( )?(f|filename)$" : filename,
  "y( )?(t|time)$" : time,
  "y (pause on|pause)$" : whitelisted( pause ),
  "y (pause off|unpause)$" : whitelisted( unpause ),
  "y (mute on|mute)$" : whitelisted( mute ),
  "y (mute off|unmute)$" : whitelisted( unmute ),
  "y (q|quit|wipe|next)$" : whitelisted( quit ),
  "y wipe all$" : whitelisted( wipeAll ),
  "y on$" : whitelisted( on ),
  "y off$" : whitelisted( off ),
  "y subs (on|off)$" : whitelisted( subs ),
  "y subs (\\d)$" : whitelisted( subtitleTrack ),
  "y audio (\\d)$" : whitelisted( audioTrack ),
  'y seek ([+-]?[0-9]{1,9})$' : whitelisted( seekSeconds ),
  "y (\\S+)$" : whitelisted( playFile )
};

exports.handleMessage = function(channel, who, message) {

  // first do a general filter to save us a lot of redundant work
  if(!message.match(RegExp(config.delimiter+"y", "i"))) {
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
    var queueDesc = '';
    if(queue.length) {
      queueDesc = ' (' + queue.length.toString() + ' queued)';
    }
    var playingDesc = '[YOUTUBE PLAYING]' + queueDesc;
    return playingDesc.irc.yellow.bggreen.bold();
  }else if(enabled){
    return '[YOUTUBE ON]'.irc.white.bggreen.bold();
  }
  return '[YOUTUBE OFF]'.irc.black.bgred();
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

function playFile(channel, who, message, match) {
  if(!enabled) {
    return message;
  }
  var filename = match[1];
  if(mpv) {
    queue.push(filename);
    return null;
  }else{
    mpv = new Mpv(settings, filename, channel);
    if(youtubeStartEvent) {
      youtubeStartEvent.invoke(null);
    }
    mpv.onComplete = function X() {
      if(queue.length) {
        var f = queue.shift();
        mpv = new Mpv(settings, f, channel);
        mpv.onComplete = X;
      }else{
        mpv=null;
        if(youtubeStopEvent) {
          youtubeStopEvent.invoke(null);
        }
      }
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

function wipeAll(channel, who, message, match) {
  queue = [];
  quit(channel, who, message, match);
  return null;
}

function filename(channel, who, message, match) {
  if(mpv) {
    mpv.filename(channel);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

function time(channel, who, message, match) {
  if(mpv) {
    mpv.timeRemaining(channel);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

function pause(channel, who, message, match) {
  var on = true;
  if(mpv) {
    mpv.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

function unpause(channel, who, message, match) {
  var on = false;
  if(mpv) {
    mpv.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

function mute(channel, who, message, match) {
  var on = true;
  if(mpv) {
    mpv.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

function unmute(channel, who, message, match) {
  var on = false;
  if(mpv) {
    mpv.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
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
  return null;
}

function subtitleTrack(channel, who, message, match) {
  var id = match[1];
  if(mpv) {
    mpv.subtitleTrack(channel, id);
  }
  return null;
}

function audioTrack(channel, who, message, match) {
  var id = match[1];
  if(mpv) {
    mpv.audioTrack(channel, id);
  }
  return null;
}

function seekSeconds(channel, who, message, match) {
  var s = match[1];
  if(mpv) {
    mpv.seekSeconds(channel, s);
  }
  return null;
}
