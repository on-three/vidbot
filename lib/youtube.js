var Mpv = require('./mpv.js')
var c = require('irc-colors').global();

var mpv = null;
var currentFile = null;
var INSTANCE = 'YOUTUBE';

exports.handleMessage = function(channel, who, message) {
  console.log("attempting to handle in youtube :" + who + " :" + message);
  var re = /(chapter \d+(\.\d)*)/;

  if(message.match(/^\.\.y$/i)){
    console.log('GOT A MATCH in youtube');
    return null;
  }else if(message.match(/^\.\.y filename$/i)) {
    console.log('GOT A MATCH filename');
    filename(channel);
    return null;
  }else if(message.match(/^\.\.y time$/i)) {
    console.log('GOT A MATCH time');
    time(channel);
    return null;
  }else if(message.match(/^\.\.y pause (on|off)$/i)) {
    console.log('GOT A MATCH pause');
    var regex = /^\.\.y pause (?:on|off)$/i
    var match = regex.exec(message);
    //pause(match[1])
    return null;
  }else if(message.match(/^\.\.y quit$/i)) {
    console.log('GOT A MATCH in quit');
    quit(channel)
    return null;
  }else if(message.match(/^\.\.y mute (on|off)$/i)) {
    console.log('GOT A MATCH in mute');
    var regex = /^\.\.y mute (?:on|off)$/i
    var match = regex.exec(message);
    //mute(match[1])
    return null;
  }else if(message.match(/^\.\.y (\S+)$/i)) {
    var regex = /^\.\.y (\S+)$/i
    var match = regex.exec(message);
    console.log('trying to play file...' + match[1]);
    playFile(match[1], channel);
    return null;
  }
  return message; //swallowed message. No one else gets a crack at it.
}

function idleOrBusy(channel) {
  if(currentFile) {
    channel.say("I'm currently trying to play URL "+currentFile)
  }else{
    channel.say("I'm not playing anything.");
  }
}

function playFile(filename, channel) {
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

