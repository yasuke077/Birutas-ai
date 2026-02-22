// ═══════════════════════════════════════════════════════════════
// 🗄️ MODELS — Schemas MongoDB
// ═══════════════════════════════════════════════════════════════
import mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({
    guildId:         { type: String, required: true, unique: true },
    allowedChannels: { type: [String], default: [] },
    bannedChannels:  { type: [String], default: [] },
    adminRole:       { type: String, default: null },
    botOwnerId:      { type: String, default: null }, // Dono exclusivo do bot no servidor
    logChannel:      { type: String, default: null },
    channelAIs:      { type: Object, default: {} },
    customIAs:       { type: Object, default: {} },
    tags:            { type: Object, default: {} },
    tagUsage:        { type: Object, default: {} }, // contador de uso de tags
    voiceConfig: {
        coinsPerMin:  { type: Number, default: 10 },
        xpPerMin:     { type: Number, default: 5 },
        minMinutes:   { type: Number, default: 1 }
    },
    welcomeConfig: {
        enabled:   { type: Boolean, default: false },
        channelId: { type: String, default: null },
        message:   { type: String, default: 'Bem-vindo ao servidor, {user}!' }
    },
    economyConfig: {
        dailyAmount: { type: Number, default: 500 },
        workMin:     { type: Number, default: 100 },
        workMax:     { type: Number, default: 400 },
        crimeMin:    { type: Number, default: 500 },
        crimeMax:    { type: Number, default: 1500 }
    }
}, { minimize: false });

const UserSchema = new mongoose.Schema({
    userId:   { type: String, required: true },
    guildId:  { type: String, required: true },
    // Nível
    xp:       { type: Number, default: 0 },
    level:    { type: Number, default: 1 },
    xpCooldown: { type: Number, default: 0 }, // timestamp do último ganho de XP
    // Economia
    coins:    { type: Number, default: 0 },
    // Perfil
    reputation:   { type: Number, default: 0 },
    bio:          { type: String,  default: 'Pela integridade da mente e a força da verdade.' },
    profileColor: { type: String,  default: '#0099ff' },
    bannerUrl:    { type: String,  default: null }, // imagem de fundo custom
    badges:       { type: [String], default: [] },
    marriedTo:    { type: String,  default: null },
    marryDate:    { type: Number,  default: 0 },
    // Tracking
    messages:     { type: Number, default: 0 },
    voiceMinutes: { type: Number, default: 0 },
    voiceJoinTime:{ type: Number, default: 0 },
    iaMessages:   { type: Number, default: 0 },
    imagineCount: { type: Number, default: 0 },
    analyzeCount: { type: Number, default: 0 },
    // Cooldowns
    lastDaily:    { type: Number, default: 0 },
    lastWork:     { type: Number, default: 0 },
    lastCrime:    { type: Number, default: 0 },
    lastRob:      { type: Number, default: 0 },
    lastRep:      { type: Number, default: 0 },
    // Streaks e badges complexas
    vipUntil:              { type: Number,   default: 0 },
    inventory:             { type: [String], default: [] },
    totalSpent:            { type: Number,   default: 0 },
    totalDonated:          { type: Number,   default: 0 },
    donationChain:         { type: [String], default: [] },
    lastDonationTime:      { type: Number,   default: 0 },
    robSuccess:            { type: Number,   default: 0 },
    crimeCount:            { type: Number,   default: 0 },
    gambleLossStreak:      { type: Number,   default: 0 },
    gambleWinStreak:       { type: Number,   default: 0 },
    slotsJackpots:         { type: Number,   default: 0 },
    coinflipWins:          { type: Number,   default: 0 },
    rouletteWins:          { type: Number,   default: 0 },
    jokenpoWins:           { type: Number,   default: 0 },
    wasBankrupt:           { type: Boolean,  default: false },
    bankruptTimestamp:     { type: Number,   default: 0 },
    lastRepTargetId:       { type: String,   default: null },
    repSameTargetStreak:   { type: Number,   default: 0 },
    richDaysStreak:        { type: Number,   default: 0 },
    lastRichCheck:         { type: Number,   default: 0 },
    robotBehaviorCount:    { type: Number,   default: 0 },
    isV:                   { type: Boolean,  default: false },
    vStreak:               { type: Number,   default: 0 },
    lastMessageTimestamp:  { type: Number,   default: 0 },
    nightActivityCount:    { type: Number,   default: 0 },
    warnings:              { type: [Object], default: [] },
    giveawaysWon:          { type: Number,   default: 0 },
    giveawaysCreated:      { type: Number,   default: 0 },
    lastPobreza:           { type: Number,   default: 0 },
});

const MemorySchema = new mongoose.Schema({
    channelId: { type: String, required: true, unique: true },
    messages:  { type: [Object], default: [] }
});

// E-mail temporário — auto-deleta em 24h
const TempEmailSchema = new mongoose.Schema({
    userId:    { type: String, required: true, unique: true },
    accountId: { type: String, required: true },
    address:   { type: String, required: true },
    password:  { type: String, required: true },
    token:     { type: String, default: null },
    createdAt: { type: Date, default: Date.now, expires: '24h' }, // TTL automático
});

export const Config    = mongoose.model('Config',    ConfigSchema);
export const User      = mongoose.model('User',      UserSchema);
export const Memory    = mongoose.model('Memory',    MemorySchema);
export const TempEmail = mongoose.model('TempEmail', TempEmailSchema);
