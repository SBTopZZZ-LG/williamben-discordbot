require("dotenv").config();

const { exec } = require("child_process");

// Executable scripts
const toh = require("./src/Utils/toh");
const nq = require("./src/Utils/nq");
const quicksort = require("./src/Utils/quicksort");
const poll = require("./src/Utils/poll");

// Link shortener
const turl = require("turl");

const {
    ActivityType,
    PresenceUpdateStatus,
    EmbedBuilder,
    ActionRowBuilder,
    SelectMenuBuilder,
    SelectMenuOptionBuilder,
} = require("discord.js");

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
const discordLoginTimeout = 60000; // 1 minute
const facts = require("./src/Configs/facts").facts;
const catchText = require("./src/Configs/catches.json").catches;

// Sleep
const sleep = require("./src/Utils/sleep");

// Setup Express Routes
const app = require("./src/Scripts/express")(PORT);
app.use(require("./src/Routes/home"));
app.use(
    require("./src/Routes/post/fact")(async () => {
        try {
            (await client.channels.fetch(targetChannelId)).send(
                `<@${targetUserId}>, Here's a fact for you!\n${
                    facts[Math.floor(Math.random() * facts.length)]
                }`
            );
        } catch (e) {
            console.error(e);
        }
    })
);
app.use(require("./src/Routes/util/nq"));
app.use(require("./src/Routes/util/qs"));
app.use(require("./src/Routes/util/toh"));

// Connect to discord
const client = require("./src/Scripts/discord.connect");
let to = setTimeout(() => exec("kill 1", () => {}), discordLoginTimeout);

// Bot Commands
const wbb_help = /^wbb! *help *$/;
const wbb_toh = /^wbb! *toh *(?<size>\d{1,2}) *$/;
const wbb_nq = /^wbb! *nq *(?<size>\d{1,2}) *$/;
const wbb_qs = /^wbb! *qs *(?<payload>(?:(?:-?\d| )+|\w+)) *$/;
const wbb_poll =
    /^wbb!poll *(?<timeoutMode>e|t=\d+[hms]|c=\d+) +"(?<title>.+[^\\])" *\((?<options>.+)\) *$/;
const _wbb_poll_timeoutMode_e = /e/;
const _wbb_poll_timeoutMode_t = /t=(?<value>\d+)(?<mode>[hms])/;
const _wbb_poll_timeoutMode_c = /c=(?<count>\d+)/;
const _wbb_poll_options = /"((?:[^"]|\\")+[^\\])"/g;
const wbb_delete = /^wbb! *delete *$/;

// Command evaluate
const { evalRegex } = require("./src/Utils/cmd");

// Add error listener to avoid abnormal runtime terminations
client.on("error", console.error);

client.once("ready", async () => {
    // Cancel timeout
    clearTimeout(to);

    console.log("Discord login success");

    // Set activity
    client.user.setPresence({
        activities: [{ name: "The Man", type: ActivityType.Listening }],
        status: PresenceUpdateStatus.DoNotDisturb,
    });

    // Presence
    // Send alert
    // (await client.channels.fetch(targetChannelId2)).send(`I must notify fellow users about <@${targetUserId}>'s presence. After all, he is The Man, right?'`).then(msg => msg.react('👍'));

    let lastPresenceUpdated = 0;
    client.on("presenceUpdate", async (oldPresence, newPresence) => {
        try {
            // if someone else has updated their status, just return
            if (newPresence.userId !== targetUserId) return;
            // if it's not the status that has changed, just return
            if (oldPresence && oldPresence.status === newPresence.status)
                return;
            // if the new status is invisible, just return
            // if (newPresence.status === 'invisible') return;
            // if presence update is fired one after another, just return
            if (Date.now() - lastPresenceUpdated < presenceUpdateMinDuration)
                return;

            if (newPresence.status === "online")
                (await client.channels.fetch(targetChannelId2))
                    .send("🚨 The Man is online. 🗿")
                    .then(async (msg) => {
                        await msg.react("🚨");
                    });
            else if (newPresence.status === "dnd")
                (await client.channels.fetch(targetChannelId2))
                    .send("🚨 The Man is online but DnD... 🗿👍")
                    .then(async (msg) => {
                        await msg.react("🚨");
                        await msg.react("👍");
                    });
            else if (newPresence.status === "offline")
                (await client.channels.fetch(targetChannelId2))
                    .send("🚨 The Man is offline. 🗿💤")
                    .then(async (msg) => {
                        await msg.react("🚨");
                        await msg.react("💤");
                    });
            else
                (await client.channels.fetch(targetChannelId2))
                    .send("🚨 The Man has... vanished? 🗿⁉️")
                    .then(async (msg) => {
                        await msg.react("🚨");
                        await msg.react("⁉️");
                    });
            lastPresenceUpdated = Date.now();
        } catch (e) {
            console.error(e);
        }
    });

    client.on("messageDelete", async (md) => {
        if (md.author.id === client.user.id) {
            if (poll.fetchSession(md.id) != null) {
                // Poll has been deleted
                poll.deleteSession(md.id);
            }
        }
    });

    client.on("interactionCreate", async (ic) => {
        if (ic.customId === "vote_component") {
            // Poll
            if (!ic.isSelectMenu()) return;

            const msgid = ic.message.id;
            const session = poll.fetchSession(msgid);
            if (!session) return;

            if (
                Date.now() - session.createdTimestamp >=
                session.timeoutTimeoutDuration
            )
                return;

            if (ic.user.id in session.globalVoters) {
                return ic.reply({
                    content: "You have already casted your vote!",
                    ephemeral: true,
                });
            }

            // Defer reply
            await ic.deferReply();

            const emoji = ic.values[0];
            session.options[emoji].votesCasted.push(ic.user.id);
            session.globalVoters[ic.user.id] = {
                name: ic.user.username,
            };
            session.globalVotersCount += 1;

            // Update message
            let updateSkip = false;
            if (
                session.timeoutMode.mode === "c" &&
                session.globalVotersCount >= session.timeoutMode.count
            ) {
                updateSkip = true;
                session.timeoutCallback();
            } else {
                if (session.timeoutMode.mode === "e") {
                    let count = ic.message.guild.members.cache.filter(
                        (m) => !m.user.bot
                    ).size;
                    if (session.globalVotersCount >= count) {
                        updateSkip = true;
                        session.timeoutCallback();
                    }
                }
            }

            if (!updateSkip) {
                ic.message.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("0xefaa42")
                            .setTitle(session.title)
                            .setDescription(
                                `\`\`\`${Object.keys(session.options)
                                    .map(
                                        (emoji) =>
                                            `${emoji} ▶ ${session.options[emoji].option}`
                                    )
                                    .join("\n")}\`\`\`\n`
                            )
                            .setFooter(
                                session.globalVotersCount === 0
                                    ? {}
                                    : {
                                          text: `${(session.globalVotersCount >
                                          6
                                              ? Object.keys(
                                                    session.globalVoters
                                                ).slice(0, 6)
                                              : Object.keys(
                                                    session.globalVoters
                                                )
                                          )
                                              .map(
                                                  (globalVoter) =>
                                                      session.globalVoters[
                                                          globalVoter
                                                      ].name
                                              )
                                              .join(", ")}${
                                              session.globalVotersCount > 6
                                                  ? ` and ${
                                                        session.globalVotersCount -
                                                        6
                                                    } other people`
                                                  : ""
                                          } have casted their vote(s)!`,
                                      }
                            ),
                    ],
                });
            }

            ic.message
                .reply(`<@${ic.user.id}> has casted a vote.`)
                .then(async (msg) => {
                    await sleep(5000);

                    try {
                        if (
                            msg.deletable &&
                            (await msg.channel.messages.fetch(msg.id))
                        )
                            msg.delete();
                    } catch (e) {}
                });
        }

        try {
            await ic.deleteReply();
        } catch (e) {}
    });

    client.on("messageCreate", async (mc) => {
        if (mc.author.bot) return;

        if (mc.channel.type === "dm") return;

        if (wbb_help.test(mc.content)) {
            try {
                mc.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("0xefaa42")
                            .setAuthor({ name: "WilliamBenBot" })
                            .setTitle("wbb! Commands")
                            .setDescription(
                                "Here you can find all the wbb! commands to make me do many things for you!"
                            )
                            .addFields(
                                {
                                    name: "toh <count>",
                                    value: "```Compute the Tower of Hanoi for <count> number of discs.\nLimitations: 1 < count < 10\n\nExample: wbb!toh 3\n```",
                                },
                                {
                                    name: "nq <size>",
                                    value: "```Compute the N-Queens for a board of size <size>.\nLimitations: 1 <= size < 10\n\nExample: wbb!nq 4```",
                                },
                                {
                                    name: 'poll <timeoutMode> "<title>" (<options>)',
                                    value:
                                        "```Initiate a Poll of given topic <title>, and present given choices <options> to all users.\n\n" +
                                        "<timeoutMode> ▶️ The mode selected that remarks the end of the poll lifecycle.\nPossible timeout modes are as listed:\n\t1. e ▶️ Specifies that the poll ends when every user in the guild has casted a vote\n\t2. t=<duration> ▶️ Specifies that the poll ends after specified amount of time <duration> (ex: t=10m)\nLimitations: 15s <= duration <= 30m\n\t3. c=<count> ▶️ Specifies that the poll ends when the specified <count> number of votes has been reached (ex: c=5)\nLimitations: 1 < count\n\n" +
                                        '<options> ▶️ Array of choices seperated by some whitespace and enclosed in double quotes\nLimitations: 0 < len(options) < 15, time duration for non-timed polls is 10 minutes\n\nExample: wbb!poll c=10 "Are you WilliamBen?" ("Yes" "Nah" "I might be")```',
                                },
                                {
                                    name: "delete",
                                    value: "```Proceeds to delete the referenced message that:\n1. Was authored by WilliamBenBot, and\n2. Message is deletable```",
                                }
                            ),
                    ],
                });
            } catch (e) {
                console.error(e);
            }

            return;
        } else if (wbb_toh.test(mc.content)) {
            // Tower of Hanoi
            try {
                const { size } = evalRegex(wbb_toh, mc.content);
                if (size <= 1 || size > 9)
                    return mc.reply(
                        "Size must be at least 2 and at most 9! 😡"
                    );

                /* Deprecated
				const resultPath = await toh(size);
                await mc.channel.send({
                    files: [
                        {
                            attachment: resultPath,
                            name: "toh.txt",
                        },
                    ],
                }); */

                const link =
                    "https://williamben-discordbot.sbtopzzzlg.repl.co/util/toh?payload=" +
                    size;

                turl.shorten(link)
                    .then((newLink) => mc.reply(newLink))
                    .catch(() => mc.reply(link));
            } catch (e) {
                console.error(e);
                mc.reply(
                    "Sorry, your request could not be processed due to an internal error! 🙁"
                );
            }

            return;
        } else if (wbb_nq.test(mc.content)) {
            // N Queens
            try {
                const { size } = evalRegex(wbb_nq, mc.content);
                if (size < 1 || size > 9)
                    return mc.reply(
                        "Size must be at least 1 and at most 9! 😡"
                    );

                /* Deprecated
				const resultPath = await nq(size);
                await mc.channel.send({
                    files: [
                        {
                            attachment: resultPath,
                            name: "nq.txt",
                        },
                    ],
                }); */

                const link =
                    "https://williamben-discordbot.sbtopzzzlg.repl.co/util/nq?payload=" +
                    size;

                turl.shorten(link)
                    .then((newLink) => mc.reply(newLink))
                    .catch(() => mc.reply(link));
            } catch (e) {
                mc.reply(
                    "Sorry, your request could not be processed due to an internal error! 🙁"
                );
                console.error(e);
            }

            return;
        } else if (wbb_qs.test(mc.content)) {
            // Quicksort
            try {
                const { payload } = evalRegex(wbb_qs, mc.content);

                /* Deprecated
				const resultPath = await quicksort(payload);
                await mc.channel.send({
                    files: [
                        {
                            attachment: resultPath,
                            name: "qs.txt",
                        },
                    ],
                }); */

                const link =
                    "https://williamben-discordbot.sbtopzzzlg.repl.co/util/qs?payload=" +
                    encodeURIComponent(payload);

                turl.shorten(link)
                    .then((newLink) => mc.reply(newLink))
                    .catch(() => mc.reply(link));
            } catch (e) {
                mc.reply(
                    "Sorry, your request could not be processed due to an internal error! 🙁"
                );
                console.error(e);
            }

            return;
        } else if (wbb_poll.test(mc.content)) {
            // Poll
            try {
                let { timeoutMode, title, options } = evalRegex(
                    wbb_poll,
                    mc.content
                );
                title = title.split('\\"').join('"');
                let timeoutMode2 = {
                    mode: -1,
                };
                if (_wbb_poll_timeoutMode_e.test(timeoutMode))
                    timeoutMode2.mode = "e";
                else if (_wbb_poll_timeoutMode_t.test(timeoutMode)) {
                    const { value, mode } = evalRegex(
                        _wbb_poll_timeoutMode_t,
                        timeoutMode
                    );
                    const numValue = {
                        h: parseInt(value, 10) * 3600,
                        m: parseInt(value, 10) * 60,
                        s: parseInt(value, 10),
                    }[mode];
                    if (numValue < 15)
                        // 15 seconds min.
                        return mc.reply(
                            "Time duration cannot be any lesser than 15 seconds! 😡"
                        );
                    else if (numValue > 1800)
                        // 30 mins max.
                        return mc.reply(
                            "Time duration cannot be any greater than 30 minutes! 😡"
                        );

                    timeoutMode2 = {
                        mode: "t",
                        durationInSeconds: numValue,
                    };
                } else if (_wbb_poll_timeoutMode_c.test(timeoutMode)) {
                    const { count } = evalRegex(
                        _wbb_poll_timeoutMode_c,
                        timeoutMode
                    );
                    const numCount = parseInt(count, 10);
                    if (numCount <= 1)
                        return mc.reply(
                            "Max. count cannot be any lesser than two users! 😡"
                        );

                    timeoutMode2 = {
                        mode: "c",
                        count: numCount,
                    };
                }

                const optionsList = options
                    .match(_wbb_poll_options)
                    .map((option) =>
                        option
                            .slice(1, option.length - 1)
                            .split('\\"')
                            .join('"')
                    );

                if (optionsList.length === 0)
                    return mc.reply("There cannot be zero options! 😡");

                const msg = await mc.channel.send(`Quick poll incoming!`);
                const session = poll.createSession(
                    title,
                    optionsList,
                    timeoutMode2,
                    () => {
                        msg.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("0xefaa42")
                                    .setTitle(session.title)
                                    .setDescription(
                                        `\`\`\`${Object.keys(session.options)
                                            .map(
                                                (emoji) =>
                                                    `(${
                                                        session.globalVotersCount ===
                                                        0
                                                            ? 0
                                                            : Math.round(
                                                                  (session
                                                                      .options[
                                                                      emoji
                                                                  ].votesCasted
                                                                      .length /
                                                                      session.globalVotersCount) *
                                                                      100
                                                              )
                                                    } %) ${emoji} ▶ ${
                                                        session.options[emoji]
                                                            .option
                                                    }`
                                            )
                                            .join("\n")}\`\`\`\n`
                                    )
                                    .setFooter(
                                        session.globalVoters.length === 0
                                            ? {}
                                            : {
                                                  text: `This poll lasted for about ${
                                                      Date.now() -
                                                          session.createdTimestamp <
                                                      60000
                                                          ? `${Math.round(
                                                                (Date.now() -
                                                                    session.createdTimestamp) /
                                                                    1000
                                                            )} second(s)!`
                                                          : Date.now() -
                                                                session.createdTimestamp <
                                                            3600000
                                                          ? `${Math.round(
                                                                (Date.now() -
                                                                    session.createdTimestamp) /
                                                                    60000
                                                            )} minute(s)!`
                                                          : `${Math.fround(
                                                                (Date.now() -
                                                                    session.createdTimestamp) /
                                                                    3600000
                                                            )} hour(s)!`
                                                  }`,
                                              }
                                    ),
                            ],
                            components: [],
                        });
                    }
                );
                if (!session || !poll.saveSession(msg.id, session)) {
                    msg.delete();
                    return mc.reply(
                        "Sorry, but an internal error occurred! :("
                    );
                }

                await sleep(500);

                await msg.edit({
                    content: "**Quick Poll**",
                    embeds: [
                        new EmbedBuilder()
                            .setColor("0xefaa42")
                            .setTitle(title)
                            .setDescription(
                                `\`\`\`${Object.keys(session.options)
                                    .map(
                                        (emoji) =>
                                            `${emoji} ▶ ${session.options[emoji].option}`
                                    )
                                    .join("\n")}\`\`\``
                            ),
                    ],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new SelectMenuBuilder({
                                custom_id: "vote_component",
                                customId: "vote_component",
                                placeholder: "Vote",
                            }).addOptions(
                                ...Object.keys(session.options).map((emoji) =>
                                    new SelectMenuOptionBuilder()
                                        .setDefault(false)
                                        .setLabel(
                                            `${emoji} ▶ ${session.options[emoji].option}`
                                        )
                                        .setValue(emoji)
                                )
                            )
                        ),
                    ],
                });
            } catch (e) {
                mc.reply(
                    "Sorry, your request could not be processed due to an internal error! 🙁"
                );
                console.error(e);
            }

            return;
        } else if (wbb_delete.test(mc.content) && mc.reference) {
            // Delete a bot message
            try {
                const msg = await mc.channel.messages.fetch(
                    mc.reference.messageId
                );
                if (msg.author.id !== client.user.id)
                    // Not posted by WilliamBenBot
                    return mc.reply("Cannot delete other user's messages! 🙁");

                if (msg.deletable) msg.delete();
                else mc.reply("Message cannot be deleted! 🙁");
            } catch (e) {
                console.error(e);
            }
        }

        if (mc.author.id !== targetUserId) return;

        try {
            const msg = mc.content
                .toString()
                .split(" ")
                .join()
                .split("\n")
                .join()
                .toLowerCase();

            for (const catch1 of catchText)
                for (const text of catch1.texts)
                    if (msg.includes(text)) {
                        for (const emoji of catch1.emojis) {
                            await mc.react(emoji);
                            await sleep(150);
                        }

                        if (catch1.mustRepeat) break;
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
