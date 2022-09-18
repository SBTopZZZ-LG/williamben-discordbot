// Constants
const sessionTimeout = 600000; // 10 minutes
const sessions = {
    "<pollid>": {
        "createdTimestamp": "<timestamp>",
        "title": "<title>",
        "options": {
            "<emoji>": {
                "option": "<option>",
                "votesCasted": [
                    "<userid>",
                ],
            },
        },
        "timeoutMode": {
            "mode": "<modeid>",
        },
        "timeoutTimeoutDuration": "<duration>",
        "timeoutVar": "<timeoutVariable>",
        "timeoutCallback": "<callback>",
        "globalVoters": {
            "<userid>": {
                "name": "<username>",
            },
        },
        "globalVotersCount": "<globalVotersCount>",
    },
};
const emojis = ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭'];

module.exports = {
    sessionTimeout,
    saveSession: (msgid, session) => {
        if ("createdTimestamp" in session && "title" in session && "options" in session && "timeoutMode" in session && "timeoutVar" in session && session.timeoutVar === 1) {
            // Compute timeoutTimeoutDuration
            if (session.timeoutMode.mode === 'e')
                session.timeoutTimeoutDuration = sessionTimeout;
            else if (session.timeoutMode.mode === 't')
                session.timeoutTimeoutDuration = session.timeoutMode.durationInSeconds * 1000;
            else if (session.timeoutMode.mode === 'c')
                session.timeoutTimeoutDuration = sessionTimeout;

            session.timeoutVar = setTimeout(() => {
                try {
                    session.timeoutCallback();
                } finally {
                    delete sessions[msgid];
                    sessions[msgid] = null;
                }
            }, session.timeoutTimeoutDuration);

            session.createdTimestamp = Date.now();
            sessions[msgid] = session;
            return true;
        }

        return false;
    },
    createSession: (title, options, timeoutMode, timeoutCallback) => {
        if (options.length > emojis.length || options.length === 0)
            return null;

        const sessionOptions = {};
        options.forEach((option, index) => sessionOptions[emojis[index]] = {
            option,
            votesCasted: [],
        });

        const session = {
            createdTimestamp: 0,
            title,
            options: sessionOptions,
            timeoutMode,
            timeoutTimeoutDuration: 0,
            timeoutVar: 1,
            timeoutCallback,
            globalVoters: {},
            globalVotersCount: 0,
        };
        return session;
    },
    deleteSession: (msgid) => {
        if (!(msgid in sessions))
            return;

        clearTimeout(sessions[msgid].timeoutVar);

        delete sessions[msgid];
        sessions[msgid] = null;
    },
    fetchSession: (msgid) => {
        return sessions[msgid] ?? null;
    },
};