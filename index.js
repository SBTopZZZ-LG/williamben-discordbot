require("dotenv").config();

const { ActivityType, PresenceUpdateStatus } = require("discord.js");

// Sleep
const sleep = require("./src/Utils/sleep");

// Connect to discord
require("./src/Scripts/discord.connect")().then(async client => {
  // Set activity
  client.user.setPresence({ activities: [{ name: 'The Man', type: ActivityType.Listening }], status: PresenceUpdateStatus.DoNotDisturb });

  // Start express
  const express = require("express");
  const app = express();

  app.use(express.json());
  app.use(require("cors")());

  // Facts
  const facts = require("./src/Configs/facts").facts;

  // Constants
  const targetUserId = process.env.TARGET_USER_ID;
  const targetChannelId = process.env.TARGET_CHANNEL_ID;
  const targetChannelId2 = process.env.TARGET_CHANNEL_ID2;
  if (!targetUserId || !targetChannelId || !targetChannelId2) {
    console.error("Cannot get env variables!");
    process.exit(-1);
  }

  const presenceUpdateMinDuration = 20000; // 20 seconds
  const catchText = [
    {
      texts: ["lmao"],
      emojis: [
        "😂",
        "🇱",
        "🇲",
        "🇦",
        "🇴",
      ],
      mustRepeat: false,
    },
    {
      texts: ["lmfao"],
      emojis: [
        "🤣",
        "🇱",
        "🇲",
        "🇫",
        "🇦",
        "🇴",
      ],
      mustRepeat: false,
    },
    {
      texts: ["rofl"],
      emojis: [
        "😂",
        "🇷",
        "🇴",
        "🇫",
        "🇱",
      ],
      mustRepeat: false,
    },
    {
      texts: ["lol", "xd"],
      emojis: [
        "😂",
      ],
      mustRepeat: true,
    },
    {
      texts: ["lawde", "lode", "laude", "lodu", "lavdya"],
      emojis: [
        "🥒",
      ],
      mustRepeat: true,
    },
    {
      texts: ["tru", "true", "sahi", "correct", "barobar"],
      emojis: [
        "🇹",
        "🇷",
        "🇺",
        "👍",
      ],
      mustRepeat: true,
    },
    {
      texts: ["bsdk"],
      emojis: [
        "🇧",
        "🇸",
        "🇩",
        "🇰",
      ],
      mustRepeat: true,
    },
    {
      texts: ["randi"],
      emojis: [
        "🇷",
        "🇦",
        "🇳",
        "🇩",
        "🇮",
      ],
      mustRepeat: true,
    }
  ];

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
  app.listen(process.env.PORT || 3000, () => console.log(`Express server up! Port=${process.env.PORT || 3000}`));

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
    if (mc.author.bot || mc.author.id !== targetUserId)
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
}).catch(err => {
  console.error(err);
  process.exit();
});
