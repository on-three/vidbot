# vidbot
IRC bot to drive media players for streaming

# Installation
I've provided a package.json which should be updated with the latest node.js dependencies. To install these locally, run the following from the git repository root:
```
npm install
```

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
* ```.status``` Show bot plugins status.

##.whitelist
Turn bot whitelist to one of three levels: ON, OFF and MODS. Edit the settings.json file to add members to these lists. When turned on, the bot wil ignore any nick not in the given list.
Only members of the MODS whitelist can ever change the whitelist level.

* ```.whitelist on```
* ```.whitelist off```
* ```.whitelist mods```

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
* ```.y seek <(+-)seconds>``` Seek forward or back in the file X seconds. Negative numbers indicate backwards seek. <number>

##.torrent (peerflix+mpv)
Play an irc posted torrent file or magnet link via peerflix.
* ```.torrent <file>``` Play the file
* All other commands available to .y above should be available once the video starts.


##.webms
Play posted webms and gif urls atop current stream. Urls are matched in the chat so no direct commands necessary.
* ```.webms on``` Turn webms functionality on if not already on.
* ```.webms off``` Turn webms off.
* ```.wipe``` Wipe all currently playing webms.
