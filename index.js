require("dotenv").config();

const { exec } = require("child_process");
const toh = require("./src/Utils/toh");

const { ActivityType, PresenceUpdateStatus } = require("discord.js");

// Constants
const PORT = process.env.PORT || 3000;
const targetUserId = process.env.TARGET_USER_ID;
const targetChannelId = process.env.TARGET_CHANNEL_ID;
const targetChannelId2 = process.env.TARGET_CHANNEL_ID2;
if (!targetUserId || !targetChannelId || !targetChannelId2) {
  console.error("Cannot get env variables!");
  process.exit(-1);
}
const presenceUpdateMinDuration = 20000; // 20 seconds
const facts = require("./src/Configs/facts").facts;
const catchText = require("./src/Configs/catches.json").catches;

// Sleep
const sleep = require("./src/Utils/sleep");

// Start express
const express = require("express");
const app = express();

app.use(express.json());
app.use(require("cors")());

// Routes
app.use(require("./src/Routes/home"));
app.use(require("./src/Routes/post/fact")(async () => {
  try {
    (await client.channels.fetch(targetChannelId)).send(`<@${targetUserId}>, Here's a fact for you!\n${facts[Math.floor(Math.random() * facts.length)]}`);
  } catch (e) {
    console.error(e);
  }
}));

// Listen
app.listen(PORT, () => console.log(`Express server up! Port=${PORT}`));

// Connect to discord
const client = require("./src/Scripts/discord.connect");
let to = setTimeout(() => exec("kill 1", () => { }), 60000);

client.once('ready', async () => {
  // Cancel timeout
  clearTimeout(to);

  console.log("Discord login success");

  // Set activity
  client.user.setPresence({ activities: [{ name: 'The Man', type: ActivityType.Listening }], status: PresenceUpdateStatus.DoNotDisturb });

  // Presence
  // Send alert
  // (await client.channels.fetch(targetChannelId2)).send(`I must notify fellow users about <@${targetUserId}>'s presence. After all, he is The Man, right?'`).then(msg => msg.react('👍'));

  let lastPresenceUpdated = 0;
  client.on('presenceUpdate', async (oldPresence, newPresence) => {
    try {
      // if someone else has updated their status, just return
      if (newPresence.userId !== targetUserId) return;
      // if it's not the status that has changed, just return
      if (oldPresence && oldPresence.status === newPresence.status) return;
      // if the new status is invisible, just return
      // if (newPresence.status === 'invisible') return;
      // if presence update is fired one after another, just return
      if (Date.now() - lastPresenceUpdated < presenceUpdateMinDuration) return;

      if (newPresence.status === "online")
        (await client.channels.fetch(targetChannelId2)).send("🚨 The Man is online. 🗿").then(async msg => {
          await msg.react('🚨');
        });
      else if (newPresence.status === "dnd")
        (await client.channels.fetch(targetChannelId2)).send("🚨 The Man is online but DnD... 🗿👍").then(async msg => {
          await msg.react('🚨');
          await msg.react('👍');
        });
      else if (newPresence.status === "offline")
        (await client.channels.fetch(targetChannelId2)).send("🚨 The Man is offline. 🗿💤").then(async msg => {
          await msg.react('🚨');
          await msg.react('💤');
        });
      else
        (await client.channels.fetch(targetChannelId2)).send("🚨 The Man has... vanished? 🗿⁉️").then(async msg => {
          await msg.react('🚨');
          await msg.react('⁉️');
        });
      lastPresenceUpdated = Date.now();
    } catch (e) {
      console.error(e);
    }
  });

  client.on('messageCreate', async (mc) => {
    if (mc.author.bot)
      return;

    if (mc.content.trim().startsWith("wbb!")) {
      try {
        if (mc.content.trim().substring(4).startsWith("toh")) {
          // Tower of Hanoi
          const n = parseInt(mc.content.trim().substring(7));
          if (n <= 1 || n >= 9)
            return mc.reply("Size must be at least 2 and at most 9! 😡");

          const resultPath = await toh(n);
          await mc.channel.send({
            files: [{
              attachment: resultPath,
              name: 'toh.txt',
            }],
          });
        }
      } catch (e) {
        console.error(e);
      }

      return;
    }

    if (mc.author.id !== targetUserId)
      return;

    try {
      const msg = mc.content.toString().split(" ").join().split("\n").join().toLowerCase();

      for (const catch1 of catchText)
        for (const text of catch1.texts)
          if (msg.includes(text)) {
            for (const emoji of catch1.emojis) {
              await mc.react(emoji);
              await sleep(150);
            }

            if (catch1.mustRepeat)
              break;
            return;
          }

      // Message sent by WilliamBen
      mc.channel.send(mc.content.toString());
    } catch (e) {
      console.error(e);
    }
  });
});

client.login(process.env.TOKEN);
