const {CommandoClient} = require('discord.js-commando');
const {Structures} = require('discord.js');
const path = require('path');
const { prefix, token } = require('./auth.json');

Structures.extend('Guild', Guild => {
    class MusicGuild extends Guild {
        constructor(client, data) {
            super(client, data);
            this.musicData = {
                queue: [],
                isPlaying: false,
                songDispatcher: null
            };
        }
    }
    return MusicGuild;
});
const client =new CommandoClient({
    commandPrefix: prefix,
    owner: '237835182713995264',
    unknownCommandResponse: false
});

client.registry
    .registerDefaultTypes()
    .registerGroups([
        ['music', 'Music Command Group']
    ])
    .registerDefaultGroups()
    .registerDefaultCommands()
    .registerCommandsIn(path.join(__dirname, 'commands'));

    client.once('ready', () => {
        console.log(`logged in as ${client.user.tag}!`);
})

client.on('message', message => {
    if (message.content === `${prefix} marco`) {
        message.reply('Polo');
    }
});

client.login(token);