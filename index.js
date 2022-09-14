require("dotenv").config();

// Sleep
const sleep = require("./src/Utils/sleep");

// Connect to discord
require("./src/Scripts/discord.connect")().then(async client => {
    // Start express
    const express = require("express");
    const app = express();

    app.use(express.json());
    app.use(require("cors")());

    // Routes
    app.use(require("./src/Routes/home"));

    // Listen
    app.listen(process.env.PORT, () => console.log(`Express server up! Port=${process.env.PORT}`));

    // Constants
    const targetUserId = "432065639637581834";
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
    ];
    (await client.channels.fetch("1019593729402740829")).send(`Hello Senpai <@${targetUserId}>!`);
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
