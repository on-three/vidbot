# vidbot
IRC bot to drive media players for streaming

# Installation
TBD

#Setup
Edit the settings.json file to point the bot to the proper irc server, port and channel.

# Running
Currently run via command:
```
node vidbot.js
```

#Commands
Commands are grouped by plugin. The following are availabe:

##.status
Show bot plugin status (which plugins are turned on etc.)
```
.status
```

##.whitelist
Turn bot whitelist to one of three levels: ON, OFF and MODS. Edit the settings.json file to add members to these lists. When turned on, the bot wil ignore any nick not in the given list.
Only members of the MODS whitelist can ever change the whitelist level.

```.whitelist on```

```.whitelist off```

```.whitelist mods```

##.y (mpv+youtube-dl)
Play videos as supported by mpv using the youtube-dl frontend. This enables urls far beyond just youtube.
Simple mpv controls are exposed for sub commands:
* ```.y on``` Turns the youtube player on
* ```.y off``` Turns the player off
* ```.y <url>``` Plays a given file or pushes it into the playlist if a video is currently playing
* ```.y f|filename``` Returns the title of the currently played video
* ```.y t|time``` Returns the remaining time (in minutes) for the current playing file.
* ```.y next|wipe|quit``` End the current video and go to the next if there is another in the playlist.
* ```.y wipe all``` Kill the player, dropping all current playlist entries.
* ```.y pause|pause on``` Pause the player.
* ```.y unpause|pause off``` Unpause the player.
* ```.y mute|mute on``` Mute the player.
* ```.y unmute|mute off``` Unmute the player.
* ```.y subs on``` Turn subtitles on.
* ```.y subs off``` Turn subtitles off.
* ```.y subs <number>``` Use subtitle track <number>.
* ```.y audio <number>``` Use audio track <number>
