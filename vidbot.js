var irc = require('irc');
var config = require('./settings.json');
var whitelist = require('./lib/whitelist');

//plugins
var plugins = [
  require('./lib/whitelist.js'),
  require('./lib/youtube.js')
  ]

// Command line arguments
// if(process.argv.length<3) {
//   console.error("USAGE: vidbot <input video file or url>");
// }


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
  if(!whitelist.isWhitelisted(from)) {
    console.log(from + "not whitelisted.");
    return message;
  }
  var message = msg;
  var arrayLength = plugins.length;
  for (var i = 0; i < arrayLength; i++) {
    message = plugins[i].handleMessage(channel, from, msg);
    if(!message) {
      return message;
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



