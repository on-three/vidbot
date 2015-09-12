var irc = require('irc');
var config = require('./settings.json');
var whitelist = require('./lib/whitelist');
var YoutubePlayer = require('./lib/youtube.js');
var Torrent = require('./lib/torrent.js');
var Webms = require('./lib/webms.js');

var yt1 = new YoutubePlayer(config.youtube);
//var yt2 = new YoutubePlayer(config.youtube2);
var torrent = new Torrent(config.torrent);
var webms = new Webms(config.webms);

//plugins
var plugins = [
  require('./lib/whitelist.js'),
  require('./lib/jstream.js'),
  yt1,
  //yt2,
  torrent,
  webms,
  require('./lib/screenshot.js')
  //require('./lib/wm.js')
  ]

// Command line arguments
// if(process.argv.length<3) {
//   console.error("USAGE: vidbot <input video file or url>");
// }

var PRIMARY_REGEX = RegExp(config.delimiter, "i");
var STATUS_REGEX = RegExp(config.delimiter+"status$", "i");

var Channel = function(name, client) {
  this.client = client;
  this.name = name;
  this.say = function(something) {
    client.say(name, something);
  }
  this.log = function(something) {
    console.log(something);
  }
}

function handleMessage(channel, from, msg) {
  // for performance, just check if this is message is
  // remotely of interest
  // if(!msg.match(PRIMARY_REGEX)) {
  //   return msg;
  // }

  if(whitelist.isBlacklisted(from)) {
    console.log(from + " BLACKLISTED.");
    return message;
  }

  if(msg.match(STATUS_REGEX)) {
    status(channel, from, msg);
    return null;
  }

  var message = msg;
  var arrayLength = plugins.length;
  for (var i = 0; i < arrayLength; i++) {
    message = plugins[i].handleMessage(channel, from, msg);
    if(!message) {
      break;
    }
  }
  return message;
}

var bot = new irc.Client(config.server, config.nick, {
    channels: [config.channel],
    port: config.port,
});

var channel = new Channel(config.channel, bot);

bot.addListener('pm', function (from, message) {
    console.log(from + ' => ME: ' + message);
});

bot.addListener('error', function(message) {
    console.log('error: ', message);
});

bot.addListener('pm', function(nick, message) {
    console.log('Got private message from %s: %s', nick, message);
});

bot.addListener('join', function(c, who) {
    console.log('%s has joined %s', who, c);
});

bot.addListener('part', function(c, who, reason) {
    console.log('%s has left %s: %s', who, c, reason);
});

bot.addListener('kick', function(c, who, by, reason) {
    console.log('%s was kicked from %s by %s: %s', who, c, by, reason);
});

bot.addListener('message'+config.channel, function (from, message) {
    console.log(from + ' => '+ config.channel+' ' + message);
    handleMessage(channel, from, message);
});

function status(channel, from , msg) {
  var statusString = '[STATUS]'.irc.green.bold();
  for(i=0;i<plugins.length;++i) {
    plugin = plugins[i];
    statusString += (' ' + plugin.status());
  }
  channel.say(statusString);
}
