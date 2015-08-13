var Mpv = require('./mpv.js')

var mpv = null;

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

function playFile(filename, channel) {
  if(mpv) {
    //channel.say("we already playing something..");
    return;
  }else{
    mpv = new Mpv(filename, channel);
    mpv.onComplete = function(){mpv=null;};
    channel.say("YOUTUBE: playing "+filename);
  }
}
function quit(channel) {
  if(mpv) {
    mpv.quit();
    //channel.say("YOUTUBE: quitting video");
  }else{
    channel.say("Not playing anything");
  }
}

function filename(channel) {
  if(mpv) {
    mpv.filename(channel);
  }else{
    channel.say("not playing anything...");
  }
}

function time(channel) {
  if(mpv) {
    mpv.timeRemaining(channel);
  }else{
    //channel.say("not playing...");
  }
}