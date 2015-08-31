var c = require('irc-colors').global();
var config = require('../settings.json');
var whitelisted = require('./whitelist.js').whitelisted;
var rpc = require('node-json-rpc');

var INSTANCE = 'WM';
var enabled = true;
var options = config.wm;

var layouts = [
  'mono',
  'pip',
  'grid',
  'tile',
  'wide'
];

var handlers = {
  "wm( h| help)?$" : help,
  "wm (next|next layout)$" : whitelisted( nextLayout ),
  "wm (cycle|cycle layout)$" : whitelisted( cycleLayout ),
  "wm on$" : whitelisted( on ),
  "wm off$" : whitelisted( off ),
  "wm (\\S+)$" : whitelisted( setLayout )
};

exports.handleMessage = function(channel, who, message) {

  // first do a general filter to save us a lot of redundant work
  if(!message.match(RegExp(config.delimiter+"wm"))) {
    return message;
  }

  for(var h in handlers) {
    regex =  RegExp(config.delimiter + h, "i");
    var match = regex.exec(message);
    if(match) {
      return handlers[h](channel, who, message, match);
    }
  }
  return message;
}

exports.status = function() {
  if(enabled){
    return '[WM ON]'.irc.white.bggreen.bold();
  }else{
    return '[WM OFF]'.irc.black.bgred();
  }
}

function help(channel, who, message, match) {
  var msg = '[WINDOW MANAGER]'.irc.white.bggreen.bold() + ' next|cycle|' + layouts.join('|');
  channel.say(msg);
  return null;
}

function on(channel, who, message, match) {
  enabled = true;
  return null;
}

function off(channel, who, message, match) {
  enabled = false;
  return null;
}

function nextLayout(channel, who, message, match) {
  if(!enabled) {
    return message;
  }
  //attempt to connect to window manager and give it JSON RPC command
  var client = new rpc.Client(options);
  client.call(
    {"jsonrpc": "2.0", "method": "nextLayout", "params": [], "id": 0},
    function (err, res) {
      if (err) { console.log(err); }
      else { console.log(res); }
    }
  );
  return null;
}
function cycleLayout(channel, who, message, match) {
  if(!enabled) {
    return message;
  }
  //attempt to connect to window manager and give it JSON RPC command
  var client = new rpc.Client(options);
  client.call(
    {"jsonrpc": "2.0", "method": "cycleLayout", "params": [], "id": 0},
    function (err, res) {
      if (err) { console.log(err); }
      else { console.log(res); }
    }
  );
  return null;
}

function setLayout(channel, who, message, match) {
  if(!enabled) {
    return message;
  }
  var layout = match[1];
  if(layouts.indexOf(layout) < 0) {
     return null;
  }
  var client = new rpc.Client(options);
  client.call(
    {"jsonrpc": "2.0", "method": "setLayout", "params": [layout], "id": 0},
    function (err, res) {
      if (err) { console.log(err); }
      else { console.log(res); }
    }
  );

  return null;
}
