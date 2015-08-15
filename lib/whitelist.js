var config = require('../settings.json');
var c = require('irc-colors').global();

var INSTANCE = 'WHITELIST';
function name() {
  var n = '['+INSTANCE+']';
  return n.irc.green.bold();
}

var WHITELIST_REGEX = /^\.\.whitelist$/i;
var ON_REGEX = /^\.\.whitelist on$/i;
var OFF_REGEX = /^\.\.whitelist off$/i;
var MODS_REGEX = /^\.\.whitelist mods$/i;

var whitelist = config.whitelist;
var modlist = config.modlist;

var whitelistIsOn = false;
var modlistIsOn = false;

var handleMessage = function(channel, who, message) {

  console.log('whitelist handle message');
  if(message.match(WHITELIST_REGEX)){
    //filename(channel);
    return null;
  }else if(message.match(ON_REGEX)) {
    whitelistOn(channel, who);
    return null;
  }else if(message.match(OFF_REGEX)) {
    whitelistOff(channel, who);
    return null;
  }else if(message.match(MODS_REGEX)) {
    whitelistMods(channel, who);
  }
  return message;
}

var isModlisted = function(who) {
  return modlist.indexOf(who)>=0;
}

var isWhitelisted = function(who) {
  if(modlistIsOn) {
    return isModlisted(who);
  }else if(whitelistIsOn) {
    return isModlisted(who) || whitelist.indexOf(who)>=0;
  }else{
    return true;
  }
}
var whitelistOn = function(channel, who) {
  if(!isModlisted(who)) {
    return;
  }
  whitelistIsOn = true;
  modlistIsOn = false;
  channel.say(name()+ ' is ' + 'ON'.irc.yellow.bold());
}
var whitelistOff = function(channel, who) {
  if(!isModlisted(who)) {
    return;
  }
  whitelistIsOn = false;
  modlistIsOn = false;
  channel.say(name()+ ' is ' + 'OFF'.irc.green.bold());
}
var whitelistMods = function(channel, who) {
  if(!isModlisted(who)) {
    return;
  }
  whitelistIsOn = true;
  modlistIsOn = true;
  channel.say(name()+ ' is ' + 'MODS'.irc.red.bold());
}
var status = function(channel) {
  if(modlistIsOn) {
    return '[WHITELIST MODS]'.irc.yellow.bgred.bold();
  }else if(whitelistIsOn) {
    return '[WHITELIST ON]'.irc.black.bgred();
  }else{
    return '[WHITELIST OFF]'.irc.white.bggreen.bold();
  }
}

exports.handleMessage = handleMessage;
exports.isModlisted = isModlisted;
exports.isWhitelisted = isWhitelisted;
exports.whitelistOn = whitelistOn;
exports.whitelistOff = whitelistOff;
exports.whitelistMods = whitelistMods;
exports.status = status;