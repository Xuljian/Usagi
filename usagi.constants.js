exports.USAGI_CONSTANTS = {
    BOT_DATA: {
        CLIENT_ID: "",
        BOT_TOKEN: "",
        EMBED_COLOR_HEX: null,
        COMMAND_PREFIX: "#!"
    },

    MAX_IMAGE_UPLOAD_SIZE: 262144,
    BOT_DUMP_PATH: '',
    
    PERMISSIONS: {
        CREATE_INSTANT_INVITE: 0x00000001,
        KICK_MEMBERS: 0x00000002,
        BAN_MEMBERS: 0x00000004,
        ADMINISTRATOR: 0x00000008,
        MANAGE_CHANNELS: 0x00000010,
        MANAGE_GUILD: 0x00000020,
        ADD_REACTIONS: 0x00000040,
        VIEW_AUDIT_LOG: 0x00000080,
        PRIORITY_SPEAKER: 0x00000100,
        STREAM: 0x00000200,
        VIEW_CHANNEL: 0x00000400,
        SEND_MESSAGES: 0x00000800,
        SEND_TTS_MESSAGES: 0x00001000,
        MANAGE_MESSAGES: 0x00002000,
        EMBED_LINKS: 0x00004000,
        ATTACH_FILES: 0x00008000,
        READ_MESSAGE_HISTORY: 0x00010000,
        MENTION_EVERYONE: 0x00020000,
        USE_EXTERNAL_EMOJIS: 0x00040000,
        VIEW_GUILD_INSIGHTS: 0x00080000,
        CONNECT: 0x00100000,
        SPEAK: 0x00200000,
        MUTE_MEMBERS: 0x00400000,
        DEAFEN_MEMBERS: 0x00800000,
        MOVE_MEMBERS: 0x01000000,
        USE_VAD: 0x02000000,
        CHANGE_NICKNAME: 0x04000000,
        MANAGE_NICKNAMES: 0x08000000,
        MANAGE_ROLES: 0x10000000,
        MANAGE_WEBHOOKS: 0x20000000,
        MANAGE_EMOJIS: 0x40000000,
    },

    INTENTS: {
        GUILDS: 1 << 0,
        //- GUILD_CREATE
        //- GUILD_UPDATE
        //- GUILD_DELETE
        //- GUILD_ROLE_CREATE
        //- GUILD_ROLE_UPDATE
        //- GUILD_ROLE_DELETE
        //- CHANNEL_CREATE
        //- CHANNEL_UPDATE
        //- CHANNEL_DELETE
        //- CHANNEL_PINS_UPDATE

        GUILD_MEMBERS: 1 << 1,
        //- GUILD_MEMBER_ADD
        //- GUILD_MEMBER_UPDATE
        //- GUILD_MEMBER_REMOVE

        GUILD_BANS: 1 << 2,
        //- GUILD_BAN_ADD
        //- GUILD_BAN_REMOVE

        GUILD_EMOJIS: 1 << 3,
        //- GUILD_EMOJIS_UPDATE

        GUILD_INTEGRATIONS: 1 << 4,
        //- GUILD_INTEGRATIONS_UPDATE

        GUILD_WEBHOOKS: 1 << 5,
        //- WEBHOOKS_UPDATE

        GUILD_INVITES: 1 << 6,
        //- INVITE_CREATE
        //- INVITE_DELETE

        GUILD_VOICE_STATES: 1 << 7,
        //- VOICE_STATE_UPDATE

        GUILD_PRESENCES: 1 << 8,
        //- PRESENCE_UPDATE

        GUILD_MESSAGES: 1 << 9,
        //- MESSAGE_CREATE
        //- MESSAGE_UPDATE
        //- MESSAGE_DELETE
        //- MESSAGE_DELETE_BULK

        GUILD_MESSAGE_REACTIONS: 1 << 10,
        //- MESSAGE_REACTION_ADD
        //- MESSAGE_REACTION_REMOVE
        //- MESSAGE_REACTION_REMOVE_ALL
        //- MESSAGE_REACTION_REMOVE_EMOJI

        GUILD_MESSAGE_TYPING: 1 << 11,
        //- TYPING_START

        DIRECT_MESSAGES: 1 << 12,
        //- MESSAGE_CREATE
        //- MESSAGE_UPDATE
        //- MESSAGE_DELETE
        //- CHANNEL_PINS_UPDATE

        DIRECT_MESSAGE_REACTIONS: 1 << 13,
        //- MESSAGE_REACTION_ADD
        //- MESSAGE_REACTION_REMOVE
        //- MESSAGE_REACTION_REMOVE_ALL
        //- MESSAGE_REACTION_REMOVE_EMOJI

        DIRECT_MESSAGE_TYPING: 1 << 14,
        //- TYPING_START
    },

    allIntents: function () {
        var bit = 0;
        for (var key in this.INTENTS) {
            if (Object.prototype.hasOwnProperty.call(this.INTENTS, key)) {
                bit += this.INTENTS[key];
            }
        }
        return bit;
    }
}
