const { Client, GatewayIntentBits, Partials } = require("discord.js");
const config = require("../Configs/discord.json");

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
    ],
});

module.exports = async () => {
    await client.login(config.TOKEN);
    return client;
};
