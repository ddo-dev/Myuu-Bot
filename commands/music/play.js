const {Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const Youtube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const { youtubeAPI } = require('../../auth.json');
const youtube = new Youtube(youtubeAPI);

module.exports = class PlayCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'play',
            memberName: 'play',
            group: 'music',
            description: 'Play and song or playlist from youtube',
            guildOnly: true,
            clientPermissions: ['SPEAK', 'CONNECT'],
            args: [
                {
                    key:'query',
                    prompt: 'What song would you like to listen to?',
                    type: 'string',
                    validate: query => 
                        query.length > 0 && query.length < 200
                }
            ]
            
        });
    }

    async run(message, { query }) {
        var voiceChannel = message.member.voice.channel;
        if(!voiceChannel) return message.say('Join a channel and try again');

        try {
            const videos = await youtube.searchVideos(query, 1);
            //console.log(videos);
            if (videos.length < 1) {
                return message.say(
                    `Couldn't find song please try again`
                    );
            }
            message.say(`searching for ${query} ${videos.length}`);

          //var songEmbed = await message.say({ video.title });

          try{
              //console.log(videos);
              var video = await youtube.getVideoByID(videos[0].id);
          } catch(err) {
              console.error(err);
              return message.say(
                  `Error trying to get ID from youtube ${video}`
              );
          }

          try{
              const url = `https://www.youtube.com/watch?v=${video.raw.id}`;
              const title = video.title;
              let duration = this.formatDuration(video.duration);
              const thumbnail = video.thumbnails.high.url;
              if(duration == '00:00') duration = 'Live Stream';
              const song = {
                  url,
                  title,
                  duration,
                  thumbnail,
                  voiceChannel
              };

              message.guild.musicData.queue.push(song);
              
              if (message.guild.musicData.isPlaying == false) {
                  message.guild.musicData.isPlaying = true;
                  this.playSong(message.guild.musicData.queue, message);
              } else if (message.guild.musicData.isPlaying == true) {
                  return message.say(`${song.title} added to queue`);
              }
                  
          } catch (err) {
              console.error(err);
              return message.say('Something broke during video request');
          }

      } catch (err) {
        console.error(err);
        return message.say('mass failure');
      }
    }

    playSong(queue, message) {
        let voiceChannel;
        queue[0].voiceChannel
            .join() // join the user's voice channel
            .then(connection => {
            const dispatcher = connection
                .play(
                ytdl(queue[0].url, { // pass the url to .ytdl()
                    quality: 'highestaudio',
                    // download part of the song before playing it
                    // helps reduces stuttering
                    highWaterMark: 1024 * 1024 * 10
                })
                )
                .on('start', () => {
                // the following line is essential to other commands like skip
                message.guild.musicData.songDispatcher = dispatcher;
                voiceChannel = queue[0].voiceChannel;
                // display the current playing song as a nice little embed
                const videoEmbed = new MessageEmbed()
                    .setThumbnail(queue[0].thumbnail) // song thumbnail
                    .setColor('#e9f931')
                    .addField('Now Playing:', queue[0].title)
                    .addField('Duration:', queue[0].duration);
                // also display next song title, if there is one in queue
                if (queue[1]) videoEmbed.addField('Next Song:', queue[1].title);
                message.say(videoEmbed); // send the embed to chat
                return queue.shift(); //  dequeue the song
                })
                .on('finish', () => { // this event fires when the song has ended
                if (queue.length >= 1) { // if there are more songs in queue
                    return this.playSong(queue, message); // continue playing
                } else { // else if there are no more songs in queue
                    message.guild.musicData.isPlaying = false;
                    return voiceChannel.leave(); // leave the voice channel
                }
                })
                .on('error', e => {
                message.say('Cannot play song');
                message.guild.musicData.queue.length = 0;
                message.guild.musicData.isPlaying = false;
                message.guild.musicData.nowPlaying = null;
                console.error(e);
                return voiceChannel.leave();
                });
            })
            .catch(e => {
            console.error(e);
            return voiceChannel.leave();
            });
        }

        formatDuration(durationObj) {
        const duration = `${durationObj.hours ? durationObj.hours + ':' : ''}${
            durationObj.minutes ? durationObj.minutes : '00'
        }:${
            durationObj.seconds < 10
            ? '0' + durationObj.seconds
            : durationObj.seconds
            ? durationObj.seconds
            : '00'
        }`;
        return duration;
        }
}



