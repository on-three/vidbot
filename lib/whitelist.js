var config = require('../settings.json');
var c = require('irc-colors').global();

var INSTANCE = 'WHITELIST';
function name() {
  var n = '['+INSTANCE+']';
  return n.irc.green.bold();
}

var WHITELIST_REGEX = RegExp(config.delimiter+"whitelist", "i");
var ON_REGEX = RegExp(config.delimiter+"whitelist on$", "i");
var OFF_REGEX = RegExp(config.delimiter+"whitelist off$", "i");
var MODS_REGEX = RegExp(config.delimiter+"whitelist mods$", "i");

var whitelist = config.whitelist;
var modlist = config.modlist;
var blacklist = config.blacklist;

var whitelistIsOn = false;
var modlistIsOn = false;

var handleMessage = function(channel, who, message, match) {

  if(!message.match(WHITELIST_REGEX)){
    return message;
  }
  if(message.match(ON_REGEX)) {
    whitelistOn(channel, who, message, match);
    return null;
  }else if(message.match(OFF_REGEX)) {
    whitelistOff(channel, who, message, match);
    return null;
  }else if(message.match(MODS_REGEX)) {
    whitelistMods(channel, who, message, match);
  }
  return message;
}

var isModlisted = function(who) {
    console.log("isWhitelisted invoked on person " + who);
  return modlist.indexOf(who)>=0;
}

var isWhitelisted = function(who) {
  console.log("isWhitelisted invoked on person " + who);
  if(modlistIsOn) {
    return isModlisted(who);
  }else if(whitelistIsOn) {
    var wl = isModlisted(who) || whitelist.indexOf(who)>=0;
    if(wl) {
      return true;
    }else{
      return false;
    }
  }else{
    return true;
  }
}

var isBlacklisted = function(who) {
  return blacklist.indexOf(who)>=0;
}

var whitelistOn = function(channel, who, message, match) {
  if(!isModlisted(who)) {
    return;
  }
  whitelistIsOn = true;
  modlistIsOn = false;
  channel.say(name()+ ' is ' + 'ON'.irc.yellow.bold());
}
var whitelistOff = function(channel, who, message, match) {
  if(!isModlisted(who)) {
    return;
  }
  whitelistIsOn = false;
  modlistIsOn = false;
  channel.say(name()+ ' is ' + 'OFF'.irc.green.bold());
}
var whitelistMods = function(channel, who, message, match) {
  if(!isModlisted(who)) {
    return;
  }
  whitelistIsOn = true;
  modlistIsOn = true;
  channel.say(name()+ ' is ' + 'MODS'.irc.red.bold());
}
var status = function() {
  if(modlistIsOn) {
    return '[WHITELIST MODS]'.irc.yellow.bgred.bold();
  }else if(whitelistIsOn) {
    return '[WHITELIST ON]'.irc.black.bgred();
  }else{
    return '[WHITELIST OFF]'.irc.white.bggreen.bold();
  }
}

// Function decorator to filter out users not whitelisted (when enabled)
var whitelisted = function(thisValue, f) {
  // assume we're decorating a method following the input pattern:
  // channel, who, message, match
  return function() {
    if(isWhitelisted(arguments[1])) {
      return f.apply(thisValue, arguments);
    }else{
      return arguments[2];
    }
  }
}

// Function decorator to filter out users not modlisted (when enabled)
var modlisted = function(thisValue, f) {
  // assume we're decorating a method following the input pattern:
  // channel, who, message, match
  return function() {
    if(isModlisted(arguments[1])) {
      return f.apply(thisValue, arguments);
    }else{
      return arguments[2];
    }
  }
}

exports.handleMessage = handleMessage;
exports.isModlisted = isModlisted;
exports.isWhitelisted = isWhitelisted;
exports.isBlacklisted = isBlacklisted;
exports.whitelistOn = modlisted( whitelistOn );
exports.whitelistOff = modlisted( whitelistOff );
exports.whitelistMods = modlisted( whitelistMods );
exports.modlisted = modlisted;
exports.whitelisted = whitelisted;
exports.status = status;
