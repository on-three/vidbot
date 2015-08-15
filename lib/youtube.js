var Mpv = require('./mpv.js')
var c = require('irc-colors').global();

var mpv = null;
var currentFile = null;
var INSTANCE = 'YOUTUBE';
var enabled = true;

var Y_REGEX = /^\.\.y$/i;
var HELP_REGEX = /^\.\.y (h|help)$/i;
var FILENAME_REGEX = /^\.\.y( )?(f|filename)$/i;
var TIME_REGEX = /^\.\.y( )?(t|time)$/i;
var PAUSE_REGEX = /^\.\.y pause (on|off)$/i;
var MUTE_REGEX = /^\.\.y mute (on|off)$/i;
var QUIT_REGEX = /^\.\.y (q|quit)$/i;
var PLAY_REGEX = /^\.\.y (\S+)$/i;
var ON_REGEX = /^\.\.y on$/i;
var OFF_REGEX = /^\.\.y off$/i;

exports.handleMessage = function(channel, who, message) {
  console.log("attempting to handle in youtube :" + who + " :" + message);
  //var re = /(chapter \d+(\.\d)*)/;

  if(message.match(Y_REGEX)){
    filename(channel);
    return null;
  }else if(message.match(ON_REGEX)) {
    on(channel);
    return null;
  }else if(message.match(OFF_REGEX)) {
    off(channel);
    return null;
  }else if(message.match(FILENAME_REGEX)) {
    filename(channel);
    return null;
  }else if(message.match(TIME_REGEX)) {
    time(channel);
    return null;
  }else if(message.match(PAUSE_REGEX)) {
    var match = PAUSE_REGEX.exec(message);
    //pause(match[1])
    return null;
  }else if(message.match(QUIT_REGEX)) {
    quit(channel)
    return null;
  }else if(message.match(MUTE_REGEX)) {
    var match = MUTE_REGEX.exec(message);
    //mute(match[1])
    return null;
  }else if(message.match(PLAY_REGEX)) {
    var match = PLAY_REGEX.exec(message);
    console.log('trying to play file...' + match[1]);
    playFile(match[1], channel);
    return null;
  }
  return message; //swallowed message. No one else gets a crack at it.
}

function idleOrBusy(channel) {
  if(currentFile) {
    //channel.say("I'm currently trying to play URL "+currentFile)
  }else{
    //channel.say("I'm not playing anything.");
  }
}

function on(channel) {
  enabled = true;
}

function off(channel) {
  enabled = false;
  if(mpv) {
    quit(channel);
  }
}

function playFile(filename, channel) {
  if(!enabled) {
    return;
  }
  if(mpv) {
    idleOrBusy(channel);
    return;
  }else{
    mpv = new Mpv(INSTANCE, filename, channel);
    currentFile = filename;
    mpv.onComplete = function(){mpv=null;currentFile=null;};
  }
}
function quit(channel) {
  if(mpv) {
    mpv.quit();
  }else{
    idleOrBusy(channel);
  }
}

function filename(channel) {
  if(mpv) {
    mpv.filename(channel);
  }else{
    idleOrBusy(channel);
  }
}

function time(channel) {
  if(mpv) {
    mpv.timeRemaining(channel);
  }else{
    idleOrBusy(channel);
  }
}

function pause(channel, arg) {
  var on = true;
  if(arg=='off'){on=false;}
  if(mpv) {
    mpv.pause(on);
  }else{
    idleOrBusy(channel);
  }
}

function mute(channel, arg) {
  var on = true;
  if(arg=='off'){on=false;}
  if(mpv) {
    mpv.mute(on);
  }else{
    idleOrBusy(channel);
  }
}

exports.status = function() {
  if(mpv) {
    return '[YOUTUBE PLAYING]'.irc.white.bggreen.bold();
  }else if(enabled){
    return '[YOUTUBE ON]'.irc.white.bggreen.bold();
  }
  return '[YOUTUBE OFF]'.irc.black.bgred();
}
