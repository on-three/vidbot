var Mpv = require('./mpv.js')
var c = require('irc-colors').global();
var config = require('../settings.json');
var showList = require('../shows.json');
var whitelisted = require('./whitelist.js').whitelisted;
var modlisted = require('./whitelist.js').modlisted;
var soundSystem = require('./sound.js');
var unirest = require('unirest');

var bind = function(thisValue, func) {
  return function() {
    return func.apply(thisValue, arguments);
  }
}
function Shows(settings) {
  this.settings = settings;
  this.showList = showList;
  this.prefix = settings.prefix;
  this.INSTANCE = settings.instance;
  this.display = settings.display;
  this.enabled = true;
  this.mpv = null;
  this.youtubeStartEvent = soundSystem.subscribe('youtubeStart', null);
  this.youtubeStopEvent = soundSystem.subscribe('youtubeEnd', null);
  this.showsData = {};

  // TODO: inflate the show list with current regexes
  // i.e. look through each show's subgroups and if they have
  // regexes, use those to add system files to the corresponding
  // show lists.

  this.handlers = {
    "$" : bind(this, this.filename),
    //"y (h|help)$" : help,
    "( )?(f|file|filename)$" : bind(this, this.filename),
    "( )?(t|time)$" : bind(this, this.time),
    "( start)?$" : whitelisted(this, this.start),
    "( stop)?$" : whitelisted(this, this.stop),
    " (pause on|pause)$" : whitelisted(this, this.pause),
    " (pause off|unpause)$" : whitelisted(this, this.unpause),
    " (mute on|mute)$" : whitelisted(this, this.mute),
    " (mute off|unmute)$" : whitelisted(this, this.unmute),
    " (q|quit)$" : whitelisted(this, this.quit),
    " (wipe|next)$" : whitelisted(this, this.wipe),

    //" wipe all$" : whitelisted(this, this.wipeAll),
    " on$" : whitelisted(this, this.on),
    " off$" : whitelisted(this, this.off),
    " subs (on|off)$" : whitelisted(this, this.subs),
    " subs (\\d)$" : whitelisted(this, this.subtitleTrack),
    " audio (\\d)$" : whitelisted(this, this.subtitleTrack),
    ' seek ([+-]?[0-9]{1,9})$' : whitelisted(this, this.seekSeconds),
    //" (\\S+)$" : whitelisted(this, this.playFile)
  };
}

Shows.prototype.getNextEpisode = function() {
  // Choose a random show
  // we do this iteratively as maybe due to flaws in the list
  // or regexes we might from time to time end up with a show with
  // no episodes
  var nextEpisode = null;
  while(nextEpisode == null)
  {
    var showNames = Object.keys(this.showList);
    function shuffle(o){
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    }
    shuffle(showNames);
    var nextShowName = showNames[0];
    if(!this.showsData.hasOwnProperty(nextShowName)) {
      this.showsData[nextShowName] = {};
    }
    console.log("next show name: ", nextShowName);
    var nextShow = this.showList[nextShowName];

    // Choose the next subgroup (usually "season x")
    var subgroups = Object.keys(nextShow);
    for(var i=0;i<subgroups.length;i++) {
      console.log("subgroup name: ", subgroups[i]);
    }
    if(!this.showsData[nextShowName].hasOwnProperty('currentSubgroupIndex')) {
      this.showsData[nextShowName].currentSubgroupIndex = -1;
    }
    this.showsData[nextShowName].currentSubgroupIndex++;
    console.log('incremented nextshow to: ' + this.showsData[nextShowName].currentSubgroupIndex);
    if(this.showsData[nextShowName].currentSubgroupIndex >= subgroups.length) {
      this.showsData[nextShowName].currentSubgroupIndex = 0;
    }
    console.log("next subgroup name: ", subgroups[this.showsData[nextShowName].currentSubgroupIndex]);
    var nextSubgroup = nextShow[subgroups[this.showsData[nextShowName].currentSubgroupIndex]];

    // Choose the next episode in that subgroup
    if(!this.showsData[nextShowName].hasOwnProperty('currentEpisode')) {
      this.showsData[nextShowName].currentEpisode = -1;
    }
    this.showsData[nextShowName].currentEpisode++;
    console.log('incrementd episode to ', this.showsData[nextShowName].currentEpisode);
    if(this.showsData[nextShowName].currentEpisode >= nextSubgroup['episodes'].length) {
      this.showsData[nextShowName].currentEpisode = 0;
    }
    nextEpisode = nextSubgroup["episodes"][this.showsData[nextShowName].currentEpisode];
  }
  console.log("next episode: ", nextEpisode);
  return nextEpisode;
}

Shows.prototype.handleMessage = function(channel, who, message) {

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

Shows.prototype.status = function() {
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

Shows.prototype.on = function(channel, who, message, match) {
  this.enabled = true;
  return null;
}

Shows.prototype.off = function(channel, who, message, match) {
  this.enabled = false;
  if(this.mpv) {
    this.quit(channel, who, message, match);
  }
  return null;
}

Shows.prototype.start = function(channel, who, message, match) {
  var that = this;
  if(!this.enabled || this.mpv){
    return null;
  }

  // start er up with a new episode
  var episode = this.getNextEpisode();
  this.mpv = new Mpv(this.settings, episode, channel);
  if(this.youtubeStartEvent) {
    this.youtubeStartEvent.invoke(null);
  }
  //this.sendScrapedURL(channel.name, who, filename);

  this.mpv.onComplete = function X() {
    var f = that.getNextEpisode();
    that.mpv = new Mpv(that.settings, f, channel);
    that.mpv.onComplete = X;
    //that.sendScrapedURL(channel.name, who, filename);
  }
  return null;
}

Shows.prototype.stop = function(channel, who, message, match) {
  this.quit(channel, who, message, match);
}

Shows.prototype.wipe = function(channel, who, message, match) {
  if(this.mpv) {
    this.mpv.quit();
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

// Shows.prototype.playFile = function(channel, who, message, match) {
//   var that = this;
//   if(!this.enabled) {
//     return message;
//   }
//   var filename = match[1];
//   if(this.mpv) {
//     this.queue.push(filename);
//     return null;
//   }else{
//     this.mpv = new Mpv(this.settings, filename, channel);
//     if(this.youtubeStartEvent) {
//       this.youtubeStartEvent.invoke(null);
//     }
//     this.sendScrapedURL(channel.name, who, filename);
//
//     this.mpv.onComplete = function X() {
//       if(that.queue.length) {
//         var f = that.queue.shift();
//         that.mpv = new Mpv(that.settings, f, channel);
//         that.mpv.onComplete = X;
//         that.sendScrapedURL(channel.name, who, filename);
//       }else{
//         that.mpv=null;
//         if(that.youtubeStopEvent) {
//           that.youtubeStopEvent.invoke(null);
//         }
//       }
//     };
//   }
//   return null;
// }

Shows.prototype.quit = function(channel, who, message, match) {
  if(this.mpv) {
    // remove the onComplete callback that will show the next show.
    this.mpv.onComplete = null;
    this.mpv.quit();
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Shows.prototype.filename = function(channel, who, message, match) {
  if(this.mpv) {
    this.mpv.filename(channel);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Shows.prototype.time = function(channel, who, message, match) {
  if(this.mpv) {
    this.mpv.timeRemaining(channel);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Shows.prototype.pause = function(channel, who, message, match) {
  var on = true;
  if(this.mpv) {
    this.mpv.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Shows.prototype.unpause = function(channel, who, message, match) {
  var on = false;
  if(this.mpv) {
    this.mpv.pause(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Shows.prototype.mute = function(channel, who, message, match) {
  var on = true;
  if(this.mpv) {
    this.mpv.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Shows.prototype.unmute = function(channel, who, message, match) {
  var on = false;
  if(this.mpv) {
    this.mpv.mute(on);
  }else{
    //idleOrBusy(channel);
  }
  return null;
}

Shows.prototype.subs = function(channel, who, message, match) {
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

Shows.prototype.subtitleTrack = function(channel, who, message, match) {
  var id = match[1];
  if(this.mpv) {
    this.mpv.subtitleTrack(channel, id);
  }
  return null;
}

Shows.prototype.audioTrack = function(channel, who, message, match) {
  var id = match[1];
  if(this.mpv) {
    this.mpv.audioTrack(channel, id);
  }
  return null;
}

Shows.prototype.seekSeconds = function(channel, who, message, match) {
  var s = match[1];
  if(this.mpv) {
    this.mpv.seekSeconds(channel, s);
  }
  return null;
}

// Send urls to a remote host
Shows.prototype.sendScrapedURL = function (channel, nick, url) {

  unirest.post(this.settings.scrape.url)
    .header('content-type', 'application/json')
    .auth({
      user: this.settings.scrape.user,
      pass: this.settings.scrape.password,
      sendImmediately: true})
    .send({ "channel": channel, "nick": nick, "url": url })
    .end(function (response) {console.log("****",response.body,"****");});
}

module.exports = Shows;
