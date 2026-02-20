// ═══════════════════════════════════════════════════════════════
// 🗄️ MODELS — Schemas MongoDB
// ═══════════════════════════════════════════════════════════════
import mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({
    guildId:       { type: String, required: true, unique: true },
    allowedChannels: { type: [String], default: [] },
    bannedChannels:  { type: [String], default: [] },
    adminRole:     { type: String, default: null },
    logChannel:    { type: String, default: null },
    channelAIs:    { type: Object, default: {} },
    customIAs:     { type: Object, default: {} },
    tags:          { type: Object, default: {} },
    voiceConfig: {
        coinsPerMin: { type: Number, default: 10 },
        minMinutes:  { type: Number, default: 1 },
        xpPerMin:    { type: Number, default: 5 }
    },
    welcomeConfig: {
        enabled:   { type: Boolean, default: false },
        channelId: { type: String,  default: null },
        message:   { type: String,  default: 'Bem-vindo ao servidor, {user}!' }
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
    userId:    String,
    guildId:   String,
    xp:        { type: Number,   default: 0 },
    level:     { type: Number,   default: 1 },
    coins:     { type: Number,   default: 0 },
    reputation:{ type: Number,   default: 0 },
    bio:       { type: String,   default: 'Pela integridade da mente e a força da verdade.' },
    profileColor: { type: String, default: '#0099ff' },
    badges:    { type: [String], default: [] },
    marriedTo: { type: String,   default: null },
    messages:  { type: Number,   default: 0 },
    voiceMinutes: { type: Number, default: 0 },
    iaMessages:{ type: Number,   default: 0 },
    voiceJoinTime: { type: Number, default: 0 },
    lastDaily: { type: Number,   default: 0 },
    lastWork:  { type: Number,   default: 0 },
    lastCrime: { type: Number,   default: 0 },
    lastRob:   { type: Number,   default: 0 },
    lastRepTime: { type: Number, default: 0 },
    crimeCount:{ type: Number,   default: 0 },
    robSuccess:{ type: Number,   default: 0 },
    totalDonated: { type: Number, default: 0 },
    donationChain: { type: [String], default: [] },
    lastDonationTime: { type: Number, default: 0 },
    wasBankrupt: { type: Boolean, default: false },
    bankruptTimestamp: { type: Number, default: 0 },
    vipUntil:  { type: Number,   default: 0 },
    inventory: { type: [String], default: [] },
    totalSpent:{ type: Number,   default: 0 },
    gambleWinStreak: { type: Number, default: 0 },
    gambleLossStreak:{ type: Number, default: 0 },
    coinflipWins: { type: Number, default: 0 },
    slotsJackpots:{ type: Number, default: 0 },
    rouletteWins: { type: Number, default: 0 },
    robotBehaviorCount: { type: Number, default: 0 },
    vStreak:   { type: Number,   default: 0 },
    repSameTargetStreak: { type: Number, default: 0 },
    lastRepTarget: { type: String, default: null },
    imagineCount: { type: Number, default: 0 },
    analyzeCount: { type: Number, default: 0 },
});

const MemorySchema = new mongoose.Schema({
    channelId: String,
    messages:  { type: [Object], default: [] }
});

// Schema para emails temporários do usuário
const TempEmailSchema = new mongoose.Schema({
    userId:    { type: String, required: true },
    accountId: { type: String, required: true },
    address:   { type: String, required: true },
    password:  { type: String, required: true },
    token:     { type: String, default: null },
    createdAt: { type: Date, default: Date.now, expires: '24h' }, // ← auto-deleta em 24h
});

export const Config    = mongoose.model('Config',    ConfigSchema);
export const User      = mongoose.model('User',      UserSchema);
export const Memory    = mongoose.model('Memory',    MemorySchema);
export const TempEmail = mongoose.model('TempEmail', TempEmailSchema);
