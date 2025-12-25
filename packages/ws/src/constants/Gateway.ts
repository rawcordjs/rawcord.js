/**
 * Discord Gateway Intent Bitmasks
 * Source: Discord API specification
 */
export const GatewayIntentBits = Object.freeze({
  Guilds: 1 << 0,                       // 1
  GuildMembers: 1 << 1,                 // 2 (PRIVILEGED)
  GuildModeration: 1 << 2,              // 4 (a.k.a. GuildBans)
  GuildEmojisAndStickers: 1 << 3,       // 8
  GuildIntegrations: 1 << 4,            // 16
  GuildWebhooks: 1 << 5,                // 32
  GuildInvites: 1 << 6,                 // 64
  GuildVoiceStates: 1 << 7,             // 128
  GuildPresences: 1 << 8,               // 256 (PRIVILEGED)
  GuildMessages: 1 << 9,                // 512
  GuildMessageReactions: 1 << 10,       // 1024
  GuildMessageTyping: 1 << 11,          // 2048
  DirectMessages: 1 << 12,              // 4096
  DirectMessageReactions: 1 << 13,      // 8192
  DirectMessageTyping: 1 << 14,         // 16384
  MessageContent: 1 << 15,              // 32768 (PRIVILEGED)
  GuildScheduledEvents: 1 << 16,        // 65536
  AutoModerationConfiguration: 1 << 20, // 1048576
  AutoModerationExecution: 1 << 21      // 2097152
} as const);

export type GatewayIntentBits =
  typeof GatewayIntentBits[keyof typeof GatewayIntentBits];
