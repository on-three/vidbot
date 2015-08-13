var Mpv = require('./mpv.js')
var c = require('irc-colors').global();

var mpv = null;
var currentFile = null;

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
  }else if(message.match(/^\.\.y pause$/i)) {
    console.log('GOT A MATCH pause');
    return null;
  }else if(message.match(/^\.\.y quit$/i)) {
    console.log('GOT A MATCH in quit');
    quit(channel)
    return null;
  }else if(message.match(/^\.\.y mute$/i)) {
    console.log('GOT A MATCH in mute');
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
    mpv = new Mpv(filename, channel);
    currentFile = filename;
    mpv.onComplete = function(){mpv=null;currentFile=null;};
    channel.say("YOUTUBE:".irc.green() + " playing "+filename.irc.bold());
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