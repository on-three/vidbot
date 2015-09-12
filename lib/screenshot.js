/*
FILE: screenshot.js
AUTHOR: on-three
EMAIL: on.three.email@gmail.com
DESC: Just catch IRC messages and kick off a stream
screenshot via json to a remote server.
*/
var config = require('../settings.json');
var c = require('irc-colors').global();
var unirest = require('unirest');

var settings = config.screenshot;
var coolingOff = false;

var handlers = {
  "$" : doScreenshot
  //"y (h|help)$" : help
}

function handleMessage(channel, who, message) {

  for(var h in handlers) {
    regex =  RegExp(config.delimiter + settings.prefix + h, "i");
    var match = regex.exec(message);
    if(match) {
      return handlers[h](channel, who, message, match);
    }
  }
  return message;
}

function doScreenshot(channel, who, message, match) {
  if(coolingOff) {
    return null;
  }
  unirest.post(settings.scrape.url)
    .header('content-type', 'application/json')
    .auth({
      user: settings.scrape.user,
      pass: settings.scrape.password,
      sendImmediately: true})
    .send({ "channel": channel.name, "nick": who, "url": config.stream.url })
    .end(function (response) {console.log("****",response.body,"****");});
  coolingOff = true;
  //end the cooloff after N seconds
  setTimeout(function(){coolingOff = false;channel.say("[SCREENSHOT] cooloff over.")}, settings.cooloff_ms);
  return null;
}

function status() {
  return "";
}

exports.handleMessage = handleMessage;
exports.status = status;
