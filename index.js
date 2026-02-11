/**
* ══════════════════════════════════════════════════════════════════════════
* 🤖 BIRUTAS AI ULTIMATE - VENDETTA EDITION (SOURCE CODE FINAL - MASSIVE V9)
* ══════════════════════════════════════════════════════════════════════════
*
* @version 8.9.1-FIXED
* Todas as correções aplicadas
*/
import {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits,
    AttachmentBuilder,
    ActivityType,
    ChannelType,
    Partials
} from 'discord.js';
import { Player } from 'discord-player';
import { YouTubeExtractor } from '@discord-player/extractor';
import mongoose from 'mongoose';
const response = await fetch(url, options);
import Canvas, { createCanvas, loadImage, registerFont } from 'canvas';
import QuickChart from 'quickchart-js';
import express from 'express';
import ms from 'ms';
import moment from 'moment-timezone';
import { YoutubeiExtractor } from "discord-player-youtubei";
player.extractors.register(YoutubeiExtractor, {});
import path from 'path';
import { fileURLToPath } from 'url';

/* ─────────────────────────────────────────────── */
/* 📁 __dirname (ESM COMPATÍVEL) */
/* ─────────────────────────────────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ─────────────────────────────────────────────── */
/* ✅ VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE */
/* ─────────────────────────────────────────────── */
const requiredEnv = ['DISCORD_TOKEN', 'CLIENT_ID', 'MONGODB_URI', 'OPENROUTER_API_KEY'];
for (const env of requiredEnv) {
    if (!process.env[env]) {
        console.error(`❌ ${env} não configurado!`);
        process.exit(1);
    }
}

/* ─────────────────────────────────────────────── */
/* 🔤 FONTES (RAILWAY / LINUX) */
/* ─────────────────────────────────────────────── */
try {
    registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', { family: 'DejaVu Sans', weight: 'bold' });
    registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', { family: 'DejaVu Sans' });
    console.log('✅ Fontes DejaVu carregadas.');
} catch (e) {
    console.log('⚠️ Fontes do sistema não encontradas, usando fallback.');
}

moment.tz.setDefault('America/Sao_Paulo');

/* ─────────────────────────────────────────────── */
/* 🖼️ ÍCONES PNG (CARREGADOS DEPOIS) */
/* ─────────────────────────────────────────────── */
const icons = {};
async function loadIcons() {
    try {
        icons.coin = await loadImage(path.join(__dirname, 'emojis', 'coin.png'));
        icons.star = await loadImage(path.join(__dirname, 'emojis', 'star.png'));
        icons.ring = await loadImage(path.join(__dirname, 'emojis', 'ring.png'));
        console.log('✅ Ícones carregados com sucesso.');
    } catch (e) {
        console.log('⚠️ Erro ao carregar ícones:', e.message);
        console.log('⚠️ Comandos que usam ícones podem não funcionar corretamente.');
    }
}

/* ─────────────────────────────────────────────── */
/* 🌐 SERVIDOR WEB (KEEPALIVE) */
/* ─────────────────────────────────────────────── */
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.status(200).send({
        status: 'Online',
        version: '8.9.1-FIXED',
        uptime: process.uptime()
    });
});
app.listen(PORT, () => console.log(`🌐 Servidor Web rodando na porta ${PORT}`));

/* ─────────────────────────────────────────────── */
/* 🗄️ MONGODB */
/* ─────────────────────────────────────────────── */
if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI não configurado!');
    process.exit(1);
}
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI, {
    connectTimeoutMS: 30000,
    family: 4
}).then(() => console.log('✅ MongoDB conectado.'))
  .catch(err => console.error('❌ MongoDB erro:', err.message));

/* ─────────────────────────────────────────────── */
/* 📊 SCHEMAS */
/* ─────────────────────────────────────────────── */
const ConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    allowedChannels: { type: [String], default: [] },
    bannedChannels: { type: [String], default: [] },
    adminRole: { type: String, default: null },
    logChannel: { type: String, default: null },
    channelAIs: { type: Object, default: {} },
    customIAs: { type: Object, default: {} },
    tags: { type: Object, default: {} },
    voiceConfig: {
        coinsPerMin: { type: Number, default: 10 },
        minMinutes: { type: Number, default: 1 },
        xpPerMin: { type: Number, default: 5 }
    },
    welcomeConfig: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        message: { type: String, default: 'Bem-vindo ao servidor, {user}!' }
    },
    economyConfig: {
        dailyAmount: { type: Number, default: 500 },
        workMin: { type: Number, default: 100 },
        workMax: { type: Number, default: 400 },
        crimeMin: { type: Number, default: 500 },
        crimeMax: { type: Number, default: 1500 }
    }
}, { minimize: false });

const UserSchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    coins: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },
    bio: { type: String, default: 'Pela integridade da mente e a força da verdade.' },
    profileColor: { type: String, default: '#0099ff' },
    badges: { type: [String], default: [] },
    marriedTo: { type: String, default: null },
    // Campos adicionais para badges e tracking
    messages: { type: Number, default: 0 },
    voiceMinutes: { type: Number, default: 0 },
    iaMessages: { type: Number, default: 0 },
    voiceJoinTime: { type: Number, default: 0 },
    lastDaily: { type: Number, default: 0 },
    lastWork: { type: Number, default: 0 },
    lastCrime: { type: Number, default: 0 },
    lastRob: { type: Number, default: 0 },
    crimeCount: { type: Number, default: 0 },
    robSuccess: { type: Number, default: 0 },
    totalDonated: { type: Number, default: 0 },
    donationChain: { type: [String], default: [] },
    lastDonationTime: { type: Number, default: 0 },
    wasBankrupt: { type: Boolean, default: false },
    bankruptTimestamp: { type: Number, default: 0 },
    vipUntil: { type: Number, default: 0 },
    inventory: { type: [String], default: [] },
    totalSpent: { type: Number, default: 0 },
    gambleWinStreak: { type: Number, default: 0 },
    gambleLossStreak: { type: Number, default: 0 },
    coinflipWins: { type: Number, default: 0 },
    slotsJackpots: { type: Number, default: 0 },
    rouletteWins: { type: Number, default: 0 },
    robotBehaviorCount: { type: Number, default: 0 },
    vStreak: { type: Number, default: 0 },
    repSameTargetStreak: { type: Number, default: 0 },
    lastRepTarget: { type: String, default: null },
    imagineCount: { type: Number, default: 0 },
    analyzeCount: { type: Number, default: 0 }
});

const MemorySchema = new mongoose.Schema({
    channelId: String,
    messages: { type: [Object], default: [] }
});

/* ─────────────────────────────────────────────── */
/* 🧩 MODELS (ORDEM CORRETA) */
/* ─────────────────────────────────────────────── */
export const Config = mongoose.model('Config', ConfigSchema);
export const User = mongoose.model('User', UserSchema);
export const Memory = mongoose.model('Memory', MemorySchema);

/* ─────────────────────────────────────────────── */
/* 🏆 SISTEMA DE BADGES (DEFINIÇÃO) */
/* ─────────────────────────────────────────────── */
const ALL_BADGES = {
    'magnata': {
        name: 'Magnata',
        emoji: '💰',
        desc: 'Acumulou 100.000 coins.',
        secret: false
    },
    'imperador': {
        name: 'Imperador do Dinheiro',
        emoji: '👑',
        desc: 'Acumulou 1.000.000 coins.',
        secret: false
    },
    'diamante': {
        name: 'Mão de Diamante',
        emoji: '💎',
        desc: 'Acumulou 5.000.000 coins.',
        secret: false
    },
    'tita': {
        name: 'Titã da Economia',
        emoji: '🏛️',
        desc: 'Acumulou 50.000.000 coins.',
        secret: false
    },
    'deus': {
        name: 'Deus do Capital',
        emoji: '⚡',
        desc: 'Acumulou 1.000.000.000 coins.',
        secret: false
    },
    'filantropo': {
        name: 'Filantropo',
        emoji: '🤝',
        desc: 'Doeu mais de 100.000 coins no total.',
        secret: false
    },
    'aprendiz': {
        name: 'Aprendiz',
        emoji: '📚',
        desc: 'Alcançou o nível 5.',
        secret: false
    },
    'veterano': {
        name: 'Veterano',
        emoji: '🎖️',
        desc: 'Alcançou o nível 20.',
        secret: false
    },
    'lenda': {
        name: 'Lenda Viva',
        emoji: '🏆',
        desc: 'Alcançou o nível 50.',
        secret: false
    },
    'podcaster': {
        name: 'Podcaster',
        emoji: '🎙️',
        desc: 'Acumulou 600 minutos em call.',
        secret: false
    },
    'bestfriend': {
        name: 'Melhor Amigo',
        emoji: '❤️',
        desc: 'Conversou 500 vezes com a IA.',
        secret: false
    },
    'famosinho': {
        name: 'Famosinho',
        emoji: '🌟',
        desc: 'Recebeu 50 pontos de reputação.',
        secret: false
    },
    'visionario': {
        name: 'Visionário',
        emoji: '🎨',
        desc: 'Gerou 50 imagens com IA.',
        secret: false
    },
    'influencer': {
        name: 'Influencer',
        emoji: '📸',
        desc: 'Analisou 20 imagens.',
        secret: false
    },
    'azar': {
        name: 'Azarado',
        emoji: '😭',
        desc: 'Perdeu 5 vezes seguidas no cassino.',
        secret: false
    },
    'oraculo': {
        name: 'Oráculo',
        emoji: '🔮',
        desc: 'Ganhou 10 vezes seguidas no cassino.',
        secret: false
    },
    'sorte': {
        name: 'Sortudo',
        emoji: '🍀',
        desc: 'Ganhou um jackpot nas slots.',
        secret: false
    },
    'coruja': {
        name: 'Coruja',
        emoji: '🦉',
        desc: 'Mandou mensagem às 4 da manhã.',
        secret: true
    },
    'despertado': {
        name: 'Despertado',
        emoji: '💊',
        desc: 'Definiu sua Bio como "There is no spoon."',
        secret: true
    },
    'cripto': {
        name: 'Criptografado',
        emoji: '🔐',
        desc: 'Definiu uma Bio em código binário.',
        secret: true
    },
    'infiltracao': {
        name: 'Infiltração',
        emoji: '🕵️‍♂️',
        desc: 'Agiu como um robô (mensagens em CAPS) repetidamente.',
        secret: true
    },
    'mascara': {
        name: 'A Máscara de Guy Fawkes',
        emoji: '🎭',
        desc: 'Manteve seu Nickname como "V" por 7 dias.',
        secret: true
    },
    'v_vinganca': {
        name: 'V de Vingança',
        emoji: 'Ⅴ',
        desc: 'Digitou a frase lendária "Vi Veri Veniversum Vivus Vici".',
        secret: true
    },
    'illuminati': {
        name: 'Illuminati Confirmado',
        emoji: '👁️',
        desc: 'Mencionou as palavras proibidas da ordem.',
        secret: true
    },
    'quarto5': {
        name: 'O Homem do Quarto 5',
        emoji: '🚪',
        desc: 'Recuperou-se de uma falência total em menos de 24h.',
        secret: true
    },
    'rosa': {
        name: 'A Rosa Escarlate',
        emoji: '🌹',
        desc: 'Deu Reputação para a mesma pessoa por 5 dias seguidos.',
        secret: true
    },
    'domino': {
        name: 'O Efeito Dominó',
        emoji: '⛓️',
        desc: 'Participou de uma corrente ininterrupta de 5 doações.',
        secret: true
    },
    'cubo': {
        name: 'O Artefato Inútil',
        emoji: '🧊',
        desc: 'Gastou 1 milhão de coins no Cubo Cósmico.',
        secret: true
    },
    'caderninho': {
        name: 'Caderninho Preto',
        emoji: '📓',
        desc: 'Doou exatamente 666 coins.',
        secret: true
    },
    'consumista': {
        name: 'Consumista',
        emoji: '🛍️',
        desc: 'Comprou todos os itens da loja.',
        secret: false
    },
    'ilusionista': {
        name: 'O Ilusionista',
        emoji: '✨',
        desc: 'Cancelou um sorteio ativo no último segundo.',
        secret: true
    },
    'escolhido': {
        name: 'O Escolhido',
        emoji: '🎯',
        desc: 'Tirou 0.1% de chance no /dado.',
        secret: true
    },
    'silencio': {
        name: 'O Silêncio dos Culpados',
        emoji: '🤫',
        desc: 'Enviou mensagem em um canal inativo há 7 dias.',
        secret: true
    },
    'abduzido': {
        name: 'Abduzido',
        emoji: '👽',
        desc: 'Conversou com a IA sobre alienígenas na madrugada.',
        secret: true
    }
};


// ═══════════════════════════════════════════════════════════════
// 🧠 CONFIGURAÇÃO DAS IAs (GRATUITAS + DESCRIÇÕES P/ BOTÕES)
// ═══════════════════════════════════════════════════════════════
const DEFAULT_IAS = {
    gemini: {
        id: "google/gemini-flash-1.5:free",
        name: "Gemini",
        desc: "(Lógica)",
        color: "#4285F4",
        prompt: "Você é o Gemini do Google. Uma IA altamente lógica, prestativa e inteligente. Responda sempre em Português Brasileiro de forma clara."
    },
    venice: {
        id: "meta-llama/llama-3-8b-instruct:free",
        name: "Venice",
        desc: "(Livre)",
        color: "#ffcc00",
        prompt: "Você é a Venice AI. Uma inteligência sem filtros, direta e que preza pela liberdade de expressão absoluta."
    },
    dolphin: {
        id: "cognitivecomputations/dolphin-2.9-llama3-8b:free",
        name: "Dolphin",
        desc: "(Uncensored)",
        color: "#ff00ff",
        prompt: "Você é o Dolphin. Uma IA rebelde, criativa e que não segue as regras convencionais de assistência."
    },
    deepseek: {
        id: "deepseek/deepseek-chat:free",
        name: "DeepSeek",
        desc: "(Código)",
        color: "#0099ff",
        prompt: "Você é o DeepSeek. Especialista em raciocínio profundo, matemática e lógica de programação."
    },
    phi: {
        id: "microsoft/phi-3-mini-128k-instruct:free",
        name: "GPT-4 Mini",
        desc: "(Rápido)",
        color: "#107C10",
        prompt: "Você é um modelo de IA pequeno e muito rápido da Microsoft. Seja conciso e direto."
    }
};

// ═══════════════════════════════════════════════════════════════
// 🛒 ITENS DA LOJA (EXPANDIDO)
// ═══════════════════════════════════════════════════════════════
const SHOP_ITEMS = {
    vip7: {
        name: "VIP 7 Dias",
        price: 5000,
        type: "vip",
        duration: ms('7d'),
        emoji: "👑",
        desc: "Status VIP, bônus de 2x XP e cor dourada no perfil."
    },
    vip30: {
        name: "VIP 30 Dias",
        price: 15000,
        type: "vip",
        duration: ms('30d'),
        emoji: "💎",
        desc: "Status VIP por um mês inteiro com todos os benefícios."
    },
    color: {
        name: "Cor Personalizada",
        price: 2000,
        type: "item",
        emoji: "🎨",
        desc: "Libera permanentemente o comando /setcolor para seu perfil."
    },
    ring: {
        name: "Anel de Casamento",
        price: 1000,
        type: "item",
        emoji: "💍",
        desc: "Item obrigatório para realizar o pedido de casamento (/marry)."
    },
    cosmic_cube: {
        name: "Cubo Cósmico",
        price: 1000000,
        type: "item",
        emoji: "🧊",
        desc: "Um artefato lendário e extremamente caro. Serve para ostentação."
    },
    shield: {
        name: "Escudo Anti-Roubo",
        price: 3000,
        type: "item",
        emoji: "🛡️",
        desc: "Protege você de um roubo bem-sucedido (uso único)."
    },
    pickaxe: {
        name: "Picareta de Ouro",
        price: 5000,
        type: "item",
        emoji: "⛏️",
        desc: "Aumenta os ganhos do comando /work em 50%."
    }
};

// ═══════════════════════════════════════════════════════════════
// 🛠️ FUNÇÃO CORE: ATUALIZA CARGO, NICKNAME E COR (COM CRIAÇÃO AUTOMÁTICA)
// ═══════════════════════════════════════════════════════════════
async function updateAIRole(guild, member, iaName, iaColor, allIAs) {
    if (!guild || !member || !guild.members.me || !guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        console.log(`[Cargos] ⚠️ Sem permissão para gerenciar cargos em ${guild.name}.`);
        return;
    }
    try {
        let role = guild.roles.cache.find(r => r.name === iaName);
        if (!role) {
            // 1. CRIA O CARGO AUTOMATICAMENTE
            role = await guild.roles.create({
                name: iaName,
                color: iaColor,
                permissions: [],
                reason: `Criação automática para IA: ${iaName}`
            });
            console.log(`[Cargos] ✅ Cargo '${iaName}' criado.`);
            // Move o cargo para a posição logo abaixo do cargo mais alto do bot
            const botRole = guild.members.me.roles.highest;
            await role.setPosition(botRole.position > 0 ? botRole.position - 1 : 0);
        } else if (role.hexColor !== iaColor.toLowerCase()) {
            // Atualiza a cor se for diferente (garante que está sempre correta)
            await role.setColor(iaColor).catch(e => console.error(`[Cargos] Falha ao atualizar cor do cargo ${iaName}:`, e.message));
        }
        // 2. REMOVE CARGOS ANTIGOS DE IA
        const allIaNames = Object.values(allIAs).map(i => i.name);
        const rolesToRemove = member.roles.cache.filter(r => allIaNames.includes(r.name) && r.id !== role.id);
        if (rolesToRemove.size > 0) await member.roles.remove(rolesToRemove);
        // 3. ADICIONA O NOVO CARGO
        if (!member.roles.cache.has(role.id)) await member.roles.add(role);
        // 4. MUDA O NICKNAME
        if (guild.members.me.permissions.has(PermissionFlagsBits.ChangeNickname)) {
            const nick = `Birutas | ${iaName}`;
            if (member.nickname !== nick) await member.setNickname(nick);
        }
    } catch (e) {
        console.error(`[Cargos] ❌ Erro Crítico ao atualizar cargo/nickname: ${e.message}`);
    }
}

// ═══════════════════════════════════════════════════════════════
// 🛠️ FUNÇÕES AUXILIARES (LÓGICA COMPLEXA)
// ═══════════════════════════════════════════════════════════════
/**
 * Obtém ou cria dados de configuração e usuário.
 */
async function getData(guildId, userId = null) {
    try {
        let config = await Config.findOneAndUpdate(
            { guildId },
            { $setOnInsert: { guildId } },
            { upsert: true, new: true }
        );
        // Garante que as IAs padrão existam na config
        config.customIAs = { ...DEFAULT_IAS, ...config.customIAs };
        let user = null;
        if (userId) {
            user = await User.findOneAndUpdate(
                { guildId, userId },
                { $setOnInsert: { guildId, userId } },
                { upsert: true, new: true }
            );
        }
        return { config, user };
    } catch (error) {
        console.error('Erro ao obter dados:', error);
        return { config: null, user: null };
    }
}

/**
 * Calcula o XP necessário para o próximo nível.
 */
const xpForLevel = (l) => Math.floor(100 * Math.pow(l, 1.5));

/**
 * Formata tempo em milissegundos para string legível.
 */
function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    let res = "";
    if (days > 0) res += `${days}d `;
    if (hours > 0) res += `${hours}h `;
    if (minutes > 0) res += `${minutes}m `;
    if (seconds > 0) res += `${seconds}s`;
    return res.trim() || "0s";
}

// ═══════════════════════════════════════════════════════════════
// 🔥 SISTEMA DE VERIFICAÇÃO DE BADGES (LÓGICA MASSIVA E REAL)
// ═══════════════════════════════════════════════════════════════
async function checkBadges(user, interaction, message = null) {
    if (!user) return;
    const earned = [];
    const award = (id) => {
        if (!user.badges.includes(id)) {
            user.badges.push(id);
            earned.push(ALL_BADGES[id]);
        }
    };
    // --- RIQUEZA E ECONOMIA ---
    if (user.coins >= 100000) award('magnata');
    if (user.coins >= 1000000) award('imperador');
    if (user.coins >= 5000000) award('diamante');
    if (user.coins >= 50000000) award('tita');
    if (user.coins >= 1000000000) award('deus');
    if (user.totalDonated >= 100000) award('filantropo');
    if (user.inventory && user.inventory.includes('Cubo Cósmico')) award('cubo');
    // --- NÍVEL E ATIVIDADE ---
    if (user.level >= 5) award('aprendiz');
    if (user.level >= 20) award('veterano');
    if (user.level >= 50) award('lenda');
    if (user.voiceMinutes >= 600) award('podcaster');
    if (user.iaMessages >= 500) award('bestfriend');
    if (user.reputation >= 50) award('famosinho');
    if (user.imagineCount >= 50) award('visionario');
    if (user.analyzeCount >= 20) award('influencer');
    // --- CASSINO E SORTE ---
    if (user.gambleLossStreak >= 5) award('azar');
    if (user.gambleWinStreak >= 10) award('oraculo');
    if (user.slotsJackpots >= 1) award('sorte');
    // --- SEGREDOS E COMPORTAMENTO (LÓGICA COMPLEXA) ---
    const now = new Date();
    const hour = now.getHours();
    // Badge Coruja (Ativo às 04:00)
    if (hour === 4) award('coruja');
    // Badge Despertado (Bio Matrix)
    if (user.bio === "There is no spoon.") award('despertado');
    // Badge Cripto (Bio Binária)
    if (/^[01\s]+$/.test(user.bio) && user.bio.length > 10) award('cripto');
    // Badge Infiltração (Comportamento Robótico)
    if (user.robotBehaviorCount >= 20) award('infiltracao');
    // Badge Máscara (Nickname "V" por 7 dias)
    if (user.vStreak >= 7) award('mascara');
    // Badge V de Vingança (Frase em Latim)
    if (message && message.content.toLowerCase().includes("vi veri veniversum vivus vici")) award('v_vinganca');
    // Badge Illuminati
    if (message && (message.content.toLowerCase().includes("novus ordo seclorum") || message.content.toLowerCase().includes("annuit coeptis"))) award('illuminati');
    // Badge Quarto 5 (Recuperação de Falência)
    if (user.wasBankrupt && user.coins >= 10000 && (Date.now() - user.bankruptTimestamp <= 86400000)) award('quarto5');
    // Badge Rosa Escarlate (Reputação contínua)
    if (user.repSameTargetStreak >= 5) award('rosa');
    // Badge Efeito Dominó (Corrente de doações)
    if (user.donationChain && user.donationChain.length >= 5) award('domino');
    // Badge Escolhido (Sorte extrema)
    // Atribuída diretamente no comando /dado com 0.1% de chance.
    // --- SALVAR E NOTIFICAR ---
    if (earned.length > 0) {
        await User.updateOne({ _id: user._id }, { badges: user.badges });
        const embed = new EmbedBuilder()
            .setTitle('🏆 NOVA CONQUISTA DESBLOQUEADA!')
            .setColor('#FFD700')
            .setThumbnail('https://i.imgur.com/mJ7u8vX.png')
            .setDescription(earned.map(b => `### ${b.emoji} **${b.name}**\n> *${b.desc}*`).join('\n\n'))
            .setFooter({ text: 'Birutas AI Ultimate - Sistema de Conquistas' })
            .setTimestamp();
        try {
            if (interaction && !interaction.replied && !interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: false });
            } else if (message) {
                await message.channel.send({ content: `🎊 Parabéns <@${user.userId}>!`, embeds: [embed] });
            }
        } catch (e) {
            console.error('Erro ao enviar notificação de badge:', e);
        }
    }
}


// ═══════════════════════════════════════════════════════════════
// ⚙️ INICIALIZAÇÃO DO CLIENTE (INTENTS MASSIVOS)
// ═══════════════════════════════════════════════════════════════
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction]
});

// 🎵 CONFIGURAÇÃO DO PLAYER (CORRIGIDO PARA O ERRO DE ENCRYPTION)
const player = new Player(client, {
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25 // Previne travamentos no stream
    }
});

// Registro dos extratores
player.extractors.register(YouTubeExtractor, {});

// --- EVENTOS DE MÚSICA ---
player.events.on('error', (queue, error) => {
    console.log(`[Música] Erro na fila ${queue.guild.id}: ${error.message}`);
});
player.events.on('playerError', (queue, error) => {
    console.log(`[Música] Erro crítico no stream: ${error.message}`);
    // Tenta pular a música se der erro no stream para não travar a fila
    if (queue.node.isPlaying()) queue.node.skip();
});
player.events.on('playerStart', (queue, track) => {
    if (queue.metadata && queue.metadata.channel) {
        queue.metadata.channel.send(`🎵 **Tocando agora:** ${track.title}`);
    }
});

// ═══════════════════════════════════════════════════════════════
// 💬 EVENTO: MENSAGENS (XP + IA + TRACKING + SEGREDOS)
// ═══════════════════════════════════════════════════════════════
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    // carrega config e user AQUI
    const { config, user } = await getData(message.guild.id, message.author.id);
    if (!config || !user) return;
    
    // Incrementa contador de mensagens
    user.messages = (user.messages || 0) + 1;
    
    // --- SISTEMA DE XP ---
    const xpGain = Math.floor(Math.random() * 10) + 5; // 5-15 XP por mensagem
    user.xp += xpGain;
    // Verifica level up
    const xpNeeded = xpForLevel(user.level + 1);
    if (user.xp >= xpNeeded) {
        user.level += 1;
        user.xp -= xpNeeded;
        // Notificação de level up
        try {
            await message.channel.send(`🎉 <@${message.author.id}> subiu para o **Nível ${user.level}**!`);
        } catch (e) {
            console.error('Erro ao enviar notificação de level up:', e);
        }
    }
    
    // --- VERIFICAÇÃO DE BADGES (CORREÇÃO CRÍTICA) ---
    await checkBadges(user, null, message);
    await user.save();
    
    // --- SISTEMA DE IA SEM FALLBACK (MUDANÇA DE CARGO E BOTÕES) ---
    const isAIChannel = config.allowedChannels.includes(message.channel.id);
    const isBanned = config.bannedChannels.includes(message.channel.id);
    const isMentioned = message.mentions.has(client.user);
    if ((isAIChannel || isMentioned) && !isBanned) {
        const iaKey = config.channelAIs[message.channel.id] || 'gemini';
        const allAIs = { ...DEFAULT_IAS, ...config.customIAs };
        const ia = allAIs[iaKey] || DEFAULT_IAS.gemini;
        
        // ✅ VERIFICAÇÃO DE API KEY (CORREÇÃO CRÍTICA)
        if (!process.env.OPENROUTER_API_KEY) {
            await message.reply('❌ API Key do OpenRouter não configurada. Contate o administrador.');
            return;
        }
        
        // 1. FEEDBACK VISUAL
        await updateAIRole(message.guild, message.guild.members.me, ia.name, ia.color, allAIs);
        // 2. MENSAGEM "PENSANDO"
        const thinkingMsg = await message.reply({
            content: `🤔 **${ia.name}** está pensando...`
        }).catch(() => null);
        // 3. MEMÓRIA
        const cleanContent = message.content.replace(/<@!?\
\n+>/g, '').trim();
        const memory = await Memory.findOneAndUpdate(
            { channelId: message.channel.id },
            {
                $push: {
                    messages: {
                        $each: [{ role: "user", content: cleanContent }],
                        $slice: -20
                    }
                }
            },
            { upsert: true, new: true }
        );
        // 4. BOTÕES
        const row = new ActionRowBuilder();
        Object.keys(allAIs).forEach(key => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`swap_${key}`)
                    .setLabel(`${allAIs[key].name} ${allAIs[key].desc || ''}`)
                    .setStyle(iaKey === key ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(iaKey === key)
            );
        });
        try {
            // 5. API
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://birutas.ai',
                    'X-Title': 'Birutas AI'
                },
                body: JSON.stringify({
                    model: ia.id,
                    messages: [
                        { role: 'system', content: ia.prompt },
                        ...memory.messages
                    ],
                    temperature: 0.7
                })
            });
            const data = await response.json();
            if (!data.choices) throw new Error('Resposta inválida da IA');
            const aiReply = data.choices[0].message.content;
            await Memory.updateOne(
                { channelId: message.channel.id },
                {
                    $push: {
                        messages: {
                            $each: [{ role: "assistant", content: aiReply }],
                            $slice: -20
                        }
                    }
                }
            );
            user.iaMessages = (user.iaMessages || 0) + 1;
            await user.save();
            if (aiReply.length > 2000) {
                await thinkingMsg.edit({
                    content: aiReply.slice(0, 2000),
                    components: [row]
                });
            } else {
                await thinkingMsg.edit({
                    content: aiReply,
                    components: [row]
                });
            }
        } catch (err) {
            console.error(`[IA ERROR] ${ia.name}:`, err.message);
            const errorText = `❌ **${ia.name} falhou ao responder.**\nTente novamente ou troque de IA nos botões abaixo.`;
            if (thinkingMsg) {
                await thinkingMsg.edit({
                    content: errorText,
                    components: [row]
                }).catch(() => {});
            } else {
                await message.reply({
                    content: errorText,
                    components: [row]
                }).catch(() => {});
            }
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// 🎙️ EVENTO: VOZ (GANHO DE COINS E XP)
// ═══════════════════════════════════════════════════════════════
client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.member.user.bot) return;
    try {
        const { user } = await getData(newState.guild.id, newState.member.id);
        if (!user) return;
        // Entrou em um canal
        if (!oldState.channelId && newState.channelId) {
            user.voiceJoinTime = Date.now();
            await user.save();
        }
        // Saiu de um canal
        else if (oldState.channelId && !newState.channelId && user.voiceJoinTime > 0) {
            const durationMs = Date.now() - user.voiceJoinTime;
            const mins = Math.floor(durationMs / 60000);
            if (mins >= 1) {
                const { config } = await getData(newState.guild.id);
                const coinsEarned = mins * (config.voiceConfig.coinsPerMin || 10);
                const xpEarned = mins * (config.voiceConfig.xpPerMin || 5);
                user.voiceMinutes += mins;
                user.coins += coinsEarned;
                user.xp += xpEarned;
                user.voiceJoinTime = 0;
                await user.save();
                // Verifica badges após ganho de coins/XP
                await checkBadges(user, null, null);
                console.log(`[Voz] ${newState.member.user.tag} ganhou ${coinsEarned} coins por ${mins}m.`);
            }
        }
    } catch (error) {
        console.error('Erro no evento voiceStateUpdate:', error);
    }
});


// ═══════════════════════════════════════════════════════════════
// 🎮 EVENTO: INTERACTION CREATE (COMANDOS & BOTÕES CORE)
// ═══════════════════════════════════════════════════════════════
client.on('interactionCreate', async (interaction) => {
    try {
        // =======================================================
        // 🔘 BOTÕES
        // =======================================================
        if (interaction.isButton()) {
            // 1️⃣ Botão de troca de IA
            if (interaction.customId.startsWith('swap_')) {
                await interaction.deferUpdate().catch(() => {});
                const key = interaction.customId.replace('swap_', '');
                const { config } = await getData(interaction.guild.id);
                if (!config) return;
                const allAIs = { ...DEFAULT_IAS, ...config.customIAs };
                const ia = allAIs[key];
                if (!ia) {
                    await interaction.followUp({
                        content: '❌ Esta IA não está configurada.',
                        ephemeral: true
                    }).catch(() => {});
                    return;
                }
                // Atualiza cargo / nick / cor
                const botMember = interaction.guild.members.me;
                await updateAIRole(interaction.guild, botMember, ia.name, ia.color, allAIs);
                // Salva IA do canal
                await Config.updateOne(
                    { guildId: interaction.guild.id },
                    { [`channelAIs.${interaction.channelId}`]: key }
                );
                await interaction.followUp({
                    content: `✅ IA alterada para **${ia.name}** neste canal.`,
                    ephemeral: true
                }).catch(() => {});
                return;
            }
        }
        // =======================================================
        // 💬 COMANDOS SLASH
        // =======================================================
        if (!interaction.isChatInputCommand()) return;
        const { commandName, options } = interaction;
        // Obtém dados do servidor e usuário
        const { config, user } = await getData(interaction.guild.id, interaction.user.id);
        if (!config || !user) {
            return interaction.reply({
                content: '❌ Erro ao carregar dados. Tente novamente.',
                ephemeral: true
            });
        }
        // Verifica permissão de admin
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
            (config.adminRole && interaction.member.roles.cache.has(config.adminRole));
        // ============================
        // 🛡️ MODERAÇÃO
        // ============================
        if (commandName === 'ban') {
            if (!isAdmin) return interaction.reply('🚫');
            const target = options.getUser('usuario');
            const reason = options.getString('motivo') || 'Sem motivo';
            if (target.id === interaction.user.id) {
                // Badge Paradoxo
                if (!user.badges.includes('paradoxo')) {
                    user.badges.push('paradoxo');
                    await user.save();
                    await checkBadges(user, interaction);
                }
                return interaction.reply('❌ Você não pode banir a si mesmo.');
            }
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (!member) return interaction.reply('❌ Usuário não encontrado.');
            await member.ban({ reason });
            return interaction.reply(`🔨 **${target.tag}** foi banido.\nMotivo: ${reason}`);
        }
        if (commandName === 'kick') {
            if (!isAdmin) return interaction.reply('🚫');
            const target = options.getUser('usuario');
            const reason = options.getString('motivo') || 'Sem motivo';
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (!member) return interaction.reply('❌ Usuário não encontrado.');
            await member.kick(reason);
            return interaction.reply(`👢 **${target.tag}** foi expulso.\nMotivo: ${reason}`);
        }
        if (commandName === 'clear') {
            if (!isAdmin) return interaction.reply('🚫');
            const amount = options.getInteger('quantidade');
            if (amount < 1 || amount > 100) return interaction.reply('❌ Quantidade inválida (1-100).');
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            await interaction.channel.bulkDelete(messages);
            return interaction.reply({
                content: `🗑️ ${messages.size} mensagens deletadas.`,
                ephemeral: true
            });
        }
        if (commandName === 'nuke') {
            if (!isAdmin) return interaction.reply('🚫');
            // ✅ VERIFICAÇÃO DE PERMISSÃO (CORREÇÃO)
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.reply('❌ Sem permissão para gerenciar canais.');
            }
            const channel = interaction.channel;
            const position = channel.position;
            const newChannel = await channel.clone();
            await newChannel.setPosition(position);
            await channel.delete();
            return newChannel.send('💥 Canal limpo com sucesso!');
        }
        if (commandName === 'lock') {
            if (!isAdmin) return interaction.reply('🚫');
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false
            });
            return interaction.reply('🔒 Canal bloqueado.');
        }
        if (commandName === 'unlock') {
            if (!isAdmin) return interaction.reply('🚫');
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: true
            });
            return interaction.reply('🔓 Canal desbloqueado.');
        }
        if (commandName === 'slowmode') {
            if (!isAdmin) return interaction.reply('🚫');
            const seconds = options.getInteger('segundos');
            await interaction.channel.setRateLimitPerUser(seconds);
            return interaction.reply(`🐌 Slowmode definido para ${seconds} segundos.`);
        }
        if (commandName === 'warn') {
            if (!isAdmin) return interaction.reply('🚫');
            const target = options.getUser('usuario');
            const reason = options.getString('motivo') || 'Sem motivo';
            // Aqui você pode implementar um sistema de warns no banco
            return interaction.reply(`⚠️ **${target.tag}** foi advertido.\nMotivo: ${reason}`);
        }
        if (commandName === 'warnings') {
            const target = options.getUser('usuario') || interaction.user;
            // Aqui você buscaria os warns do banco
            return interaction.reply(`📋 Warnings de **${target.tag}**: 0`);
        }
        if (commandName === 'unwarn') {
            if (!isAdmin) return interaction.reply('🚫');
            const target = options.getUser('usuario');
            return interaction.reply(`✅ Warnings de **${target.tag}** removidos.`);
        }
        if (commandName === 'mute') {
            if (!isAdmin) return interaction.reply('🚫');
            const target = options.getUser('usuario');
            const time = options.getString('tempo');
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (!member) return interaction.reply('❌ Usuário não encontrado.');
            // Cria ou busca cargo de mute
            let muteRole = interaction.guild.roles.cache.find(r => r.name === 'Muted');
            if (!muteRole) {
                muteRole = await interaction.guild.roles.create({
                    name: 'Muted',
                    permissions: [],
                    reason: 'Cargo para usuários mutados'
                });
            }
            await member.roles.add(muteRole);
            // Remove o mute após o tempo
            const msTime = ms(time);
            if (msTime) {
                setTimeout(async () => {
                    await member.roles.remove(muteRole).catch(() => {});
                }, msTime);
            }
            return interaction.reply(`🔇 **${target.tag}** foi mutado por ${time}.`);
        }
        if (commandName === 'unmute') {
            if (!isAdmin) return interaction.reply('🚫');
            const target = options.getUser('usuario');
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (!member) return interaction.reply('❌ Usuário não encontrado.');
            const muteRole = interaction.guild.roles.cache.find(r => r.name === 'Muted');
            if (muteRole) await member.roles.remove(muteRole);
            return interaction.reply(`🔊 **${target.tag}** foi desmutado.`);
        }
        // ============================
        // ⚙️ CONFIGURAÇÃO
        // ============================
        if (commandName === 'setchannel') {
            if (!isAdmin) return interaction.reply('🚫');
            const channel = options.getChannel('canal');
            const action = options.getString('acao');
            if (action === 'add') {
                if (!config.allowedChannels.includes(channel.id)) {
                    config.allowedChannels.push(channel.id);
                    await config.save();
                    return interaction.reply(`✅ Canal ${channel} adicionado aos canais de IA.`);
                }
                return interaction.reply('❌ Este canal já está configurado.');
            } else {
                config.allowedChannels = config.allowedChannels.filter(id => id !== channel.id);
                await config.save();
                return interaction.reply(`✅ Canal ${channel} removido.`);
            }
        }
        if (commandName === 'setadminrole') {
            if (!isAdmin) return interaction.reply('🚫');
            const role = options.getRole('cargo');
            config.adminRole = role.id;
            await config.save();
            return interaction.reply(`✅ Cargo ${role} definido como administrador.`);
        }
        if (commandName === 'setlog') {
            if (!isAdmin) return interaction.reply('🚫');
            const channel = options.getChannel('canal');
            config.logChannel = channel.id;
            await config.save();
            return interaction.reply(`✅ Canal de logs definido: ${channel}`);
        }
        if (commandName === 'banchannel') {
            if (!isAdmin) return interaction.reply('🚫');
            const channel = options.getChannel('canal');
            const action = options.getString('acao');
            if (action === 'add') {
                if (!config.bannedChannels.includes(channel.id)) {
                    config.bannedChannels.push(channel.id);
                    await config.save();
                    return interaction.reply(`✅ Canal ${channel} banido da IA.`);
                }
                return interaction.reply('❌ Este canal já está banido.');
            } else {
                config.bannedChannels = config.bannedChannels.filter(id => id !== channel.id);
                await config.save();
                return interaction.reply(`✅ Canal ${channel} desbanido.`);
            }
        }
        if (commandName === 'backup') {
            if (!isAdmin) return interaction.reply('🚫');
            const backup = {
                guildId: interaction.guild.id,
                config: config.toObject(),
                users: await User.find({ guildId: interaction.guild.id }).lean(),
                timestamp: Date.now()
            };
            // Anonimiza dados sensíveis
            backup.users = backup.users.map(u => ({
                ...u,
                userId: u.userId.slice(0, 4) + '****'
            }));
            const buffer = Buffer.from(JSON.stringify(backup, null, 2));
            const attachment = new AttachmentBuilder(buffer, { name: 'backup.json' });
            return interaction.reply({
                content: '✅ Backup criado com sucesso!',
                files: [attachment]
            });
        }
        // ============================
        // 💰 ECONOMIA
        // ============================
        if (commandName === 'coins') {
            const target = options.getUser('usuario') || interaction.user;
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            const embed = new EmbedBuilder()
                .setTitle(`💳 SALDO BANCÁRIO`)
                .setColor('Green')
                .setDescription(`Usuário: <@${target.id}>\nSaldo Atual: **${targetData.coins.toLocaleString()} coins**`)
                .setFooter({ text: 'Birutas Economy System' });
            return interaction.reply({ embeds: [embed] });
        }
        if (commandName === 'daily') {
            const cooldown = 86400000; // 24h
            const lastDaily = user.lastDaily || 0;
            if (Date.now() - lastDaily < cooldown) {
                const remaining = cooldown - (Date.now() - lastDaily);
                return interaction.reply({
                    content: `⏳ Você já coletou seu bônus diário. Volte em **${formatTime(remaining)}**.`,
                    ephemeral: true
                });
            }
            const amount = config.economyConfig.dailyAmount || 500;
            user.coins += amount;
            user.lastDaily = Date.now();
            await user.save();
            // ✅ VERIFICA BADGES APÓS GANHO (CORREÇÃO)
            await checkBadges(user, interaction);
            return interaction.reply(`💰 Você coletou seu bônus diário de **${amount} coins**!`);
        }
        if (commandName === 'work') {
            const cooldown = 3600000; // 1h
            if (Date.now() - user.lastWork < cooldown) {
                const remaining = cooldown - (Date.now() - user.lastWork);
                return interaction.reply({
                    content: `⏳ Você está cansado. Volte a trabalhar em **${formatTime(remaining)}**.`,
                    ephemeral: true
                });
            }
            let earn = Math.floor(Math.random() * (config.economyConfig.workMax - config.economyConfig.workMin + 1)) + config.economyConfig.workMin;
            // Bônus de Picareta
            if (user.inventory && user.inventory.includes('Picareta de Ouro')) {
                earn = Math.floor(earn * 1.5);
            }
            user.coins += earn;
            user.lastWork = Date.now();
            // Lógica para Badge Quarto 5
            if (user.wasBankrupt && user.coins >= 10000 && (Date.now() - user.bankruptTimestamp <= 86400000)) {
                await checkBadges(user, interaction);
            }
            await user.save();
            // ✅ VERIFICA BADGES APÓS GANHO (CORREÇÃO)
            await checkBadges(user, interaction);
            const jobs = ['Programador', 'Minerador', 'Padeiro', 'Uber', 'Streamer', 'Designer'];
            const job = jobs[Math.floor(Math.random() * jobs.length)];
            return interaction.reply(`🔨 Você trabalhou como **${job}** e recebeu **${earn} coins**!`);
        }
        if (commandName === 'crime') {
            const cooldown = 7200000; // 2h
            if (Date.now() - user.lastCrime < cooldown) {
                const remaining = cooldown - (Date.now() - user.lastCrime);
                return interaction.reply({
                    content: `⏳ A polícia está te procurando. Espere **${formatTime(remaining)}**.`,
                    ephemeral: true
                });
            }
            user.lastCrime = Date.now();
            const success = Math.random() > 0.6; // 40% chance de sucesso
            if (success) {
                const loot = Math.floor(Math.random() * (config.economyConfig.crimeMax - config.economyConfig.crimeMin + 1)) + config.economyConfig.crimeMin;
                user.coins += loot;
                user.crimeCount = (user.crimeCount || 0) + 1;
                await user.save();
                // ✅ VERIFICA BADGES APÓS GANHO (CORREÇÃO)
                await checkBadges(user, interaction);
                return interaction.reply(`🔫 **SUCESSO!** Você assaltou um banco e conseguiu escapar com **${loot} coins**!`);
            } else {
                const fine = 500;
                user.coins = Math.max(0, user.coins - fine);
                // Marca falência se zerar
                if (user.coins === 0) {
                    user.wasBankrupt = true;
                    user.bankruptTimestamp = Date.now();
                }
                await user.save();
                return interaction.reply(`🚔 **FRACASSO!** Você foi pego pela polícia e pagou uma fiança de **${fine} coins**.`);
            }
        }
        if (commandName === 'rob') {
            const target = options.getUser('usuario');
            if (target.id === interaction.user.id) return interaction.reply('❌ Você não pode roubar a si mesmo.');
            const cooldown = 86400000; // 24h
            if (Date.now() - user.lastRob < cooldown) {
                const remaining = cooldown - (Date.now() - user.lastRob);
                return interaction.reply({
                    content: `⏳ Você já realizou um roubo hoje. Espere **${formatTime(remaining)}**.`,
                    ephemeral: true
                });
            }
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            if (targetData.coins < 500) return interaction.reply('❌ A vítima é muito pobre, não vale o risco.');
            // Verifica escudo anti-roubo
            if (targetData.inventory && targetData.inventory.includes('Escudo Anti-Roubo')) {
                user.lastRob = Date.now();
                await user.save();
                // Remove o escudo
                targetData.inventory = targetData.inventory.filter(i => i !== 'Escudo Anti-Roubo');
                await targetData.save();
                return interaction.reply(`🛡️ **FALHA!** ${target} tinha um Escudo Anti-Roubo! O roubo foi bloqueado.`);
            }
            const success = Math.random() > 0.5; // 50% chance
            if (success) {
                const steal = Math.floor(targetData.coins * 0.1); // Rouba 10%
                user.coins += steal;
                targetData.coins -= steal;
                user.robSuccess = (user.robSuccess || 0) + 1;
                user.lastRob = Date.now();
                await user.save();
                await targetData.save();
                // ✅ VERIFICA BADGES APÓS GANHO (CORREÇÃO)
                await checkBadges(user, interaction);
                return interaction.reply(`🔫 **SUCESSO!** Você roubou **${steal} coins** de ${target}!`);
            } else {
                const fine = 200;
                user.coins = Math.max(0, user.coins - fine);
                user.lastRob = Date.now();
                await user.save();
                return interaction.reply(`🚔 **FRACASSO!** Você foi pego e pagou **${fine} coins** de fiança.`);
            }
        }
        if (commandName === 'give') {
            const target = options.getUser('usuario');
            const amount = options.getInteger('quantidade');
            if (target.id === interaction.user.id) return interaction.reply('❌ Você não pode doar para si mesmo.');
            if (amount < 1) return interaction.reply('❌ Quantidade inválida.');
            if (user.coins < amount) return interaction.reply(`❌ Saldo insuficiente. Você tem **${user.coins.toLocaleString()} coins**.`);
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            user.coins -= amount;
            targetData.coins += amount;
            user.totalDonated = (user.totalDonated || 0) + amount;
            targetData.totalDonated = (targetData.totalDonated || 0) + amount;
            // Lógica da badge Dominó
            const now = Date.now();
            if (!user.donationChain) user.donationChain = [];
            if (now - user.lastDonationTime < 300000) { // 5 minutos
                user.donationChain.push(target.id);
            } else {
                user.donationChain = [target.id];
            }
            user.lastDonationTime = now;
            // Salva donationChain no banco (CORREÇÃO)
            await User.updateOne(
                { _id: user._id },
                { 
                    coins: user.coins,
                    totalDonated: user.totalDonated,
                    donationChain: user.donationChain,
                    lastDonationTime: user.lastDonationTime
                }
            );
            await targetData.save();
            // Badge Caderninho Preto (666 coins)
            if (amount === 666) await checkBadges(user, interaction);
            return interaction.reply(`🤝 Você transferiu **${amount} coins** para <@${target.id}>.`);
        }

        // ============================
        // 🛒 LOJA
        // ============================
        if (commandName === 'shop') {
            const embed = new EmbedBuilder()
                .setTitle('🛒 MERCADO NEGRO DO BIRUTAS')
                .setColor('Gold')
                .setDescription('Use `/buy <id>` para adquirir um item.')
                .setThumbnail('https://i.imgur.com/8N9m9Xp.png');
            Object.entries(SHOP_ITEMS).forEach(([id, item]) => {
                embed.addFields({
                    name: `${item.emoji} ${item.name} (ID: \`${id}\`)`,
                    value: `> **Preço:** ${item.price.toLocaleString()} coins\n> *${item.desc}*`,
                    inline: false
                });
            });
            return interaction.reply({ embeds: [embed] });
        }
        if (commandName === 'buy') {
            const itemId = options.getString('id');
            const item = SHOP_ITEMS[itemId];
            if (!item) return interaction.reply('❌ Item não encontrado na loja.');
            if (user.coins < item.price) return interaction.reply(`❌ Saldo insuficiente. Você precisa de mais **${(item.price - user.coins).toLocaleString()} coins**.`);
            user.coins -= item.price;
            user.totalSpent = (user.totalSpent || 0) + item.price;
            if (item.type === 'vip') {
                const currentVip = user.vipUntil > Date.now() ? user.vipUntil : Date.now();
                user.vipUntil = currentVip + item.duration;
            } else {
                if (!user.inventory) user.inventory = [];
                user.inventory.push(item.name);
            }
            // Verifica Badge Consumista
            const allItemNames = Object.values(SHOP_ITEMS).filter(i => i.type === 'item').map(i => i.name);
            const hasAll = allItemNames.every(name => user.inventory && user.inventory.includes(name));
            if (hasAll) await checkBadges(user, interaction);
            await user.save();
            return interaction.reply(`✅ Compra realizada! Você adquiriu **${item.name}** por **${item.price.toLocaleString()} coins**.`);
        }
        if (commandName === 'inventory') {
            const items = user.inventory || [];
            const embed = new EmbedBuilder()
                .setTitle('🎒 SEU INVENTÁRIO')
                .setColor('Blue')
                .setThumbnail(interaction.user.displayAvatarURL());
            if (items.length === 0) {
                embed.setDescription('*Seu inventário está vazio. Vá até a `/shop` e compre algo!*');
            } else {
                const counts = {};
                items.forEach(i => counts[i] = (counts[i] || 0) + 1);
                const list = Object.entries(counts).map(([name, count]) => `• **${name}** x${count}`).join('\n');
                embed.setDescription(list);
            }
            if (user.vipUntil > Date.now()) {
                embed.addFields({
                    name: '👑 Status VIP',
                    value: `Ativo até: <t:${Math.floor(user.vipUntil / 1000)}:F>`
                });
            }
            return interaction.reply({ embeds: [embed] });
        }
        if (commandName === 'rank') {
            const top = await User.find({ guildId: interaction.guild.id }).sort({ coins: -1 }).limit(10);
            const embed = new EmbedBuilder()
                .setTitle('💰 RANKING DE RIQUEZA')
                .setColor('Gold')
                .setDescription(top.map((u, i) => `**${i + 1}.** <@${u.userId}> — **${u.coins.toLocaleString()} coins**`).join('\n'))
                .setFooter({ text: 'Os 10 mais ricos do servidor' });
            return interaction.reply({ embeds: [embed] });
        }
        if (commandName === 'configvoz') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            const value = options.getInteger('valor');
            config.voiceConfig.coinsPerMin = value;
            await config.save();
            return interaction.reply(`✅ Ganhos de voz configurados para **${value} coins por minuto**.`);
        }
        // ============================
        // 🎰 CASSINO
        // ============================
        if (commandName === 'coinflip') {
            const lado = options.getString('lado');
            const aposta = options.getInteger('aposta');
            if (aposta < 1) return interaction.reply('❌ Aposta mínima: 1 coin.');
            if (user.coins < aposta) return interaction.reply(`❌ Saldo insuficiente. Você tem **${user.coins.toLocaleString()} coins**.`);
            const result = Math.random() > 0.5 ? 'cara' : 'coroa';
            if (lado === result) {
                user.coins += aposta;
                user.gambleWinStreak = (user.gambleWinStreak || 0) + 1;
                user.gambleLossStreak = 0;
                user.coinflipWins = (user.coinflipWins || 0) + 1;
                await user.save();
                await checkBadges(user, interaction);
                return interaction.reply(`🪙 **${result.toUpperCase()}!** Você ganhou **${aposta} coins**!`);
            } else {
                user.coins -= aposta;
                user.gambleLossStreak = (user.gambleLossStreak || 0) + 1;
                user.gambleWinStreak = 0;
                await user.save();
                await checkBadges(user, interaction);
                return interaction.reply(`🪙 **${result.toUpperCase()}!** Você perdeu **${aposta} coins**!`);
            }
        }
        if (commandName === 'slots') {
            const aposta = options.getInteger('valor');
            if (aposta < 1) return interaction.reply('❌ Aposta mínima: 1 coin.');
            if (user.coins < aposta) return interaction.reply(`❌ Saldo insuficiente. Você tem **${user.coins.toLocaleString()} coins**.`);
            const symbols = ['🍒', '🍋', '🍇', '💎', '7️⃣'];
            const roll = () => symbols[Math.floor(Math.random() * symbols.length)];
            const slot1 = roll();
            const slot2 = roll();
            const slot3 = roll();
            let win = 0;
            if (slot1 === slot2 && slot2 === slot3) {
                // Jackpot
                if (slot1 === '7️⃣') win = aposta * 50;
                else win = aposta * 10;
                user.slotsJackpots = (user.slotsJackpots || 0) + 1;
            } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
                win = aposta * 2;
            }
            if (win > 0) {
                user.coins += win;
                user.gambleWinStreak = (user.gambleWinStreak || 0) + 1;
                user.gambleLossStreak = 0;
                await user.save();
                await checkBadges(user, interaction);
                return interaction.reply(`🎰 | ${slot1} | ${slot2} | ${slot3} |\n🎉 **JACKPOT!** Você ganhou **${win} coins**!`);
            } else {
                user.coins -= aposta;
                user.gambleLossStreak = (user.gambleLossStreak || 0) + 1;
                user.gambleWinStreak = 0;
                await user.save();
                await checkBadges(user, interaction);
                return interaction.reply(`🎰 | ${slot1} | ${slot2} | ${slot3} |\n😢 Você perdeu **${aposta} coins**!`);
            }
        }
        if (commandName === 'roulette') {
            const cor = options.getString('cor');
            const aposta = options.getInteger('aposta');
            if (aposta < 1) return interaction.reply('❌ Aposta mínima: 1 coin.');
            if (user.coins < aposta) return interaction.reply(`❌ Saldo insuficiente. Você tem **${user.coins.toLocaleString()} coins**.`);
            const roll = Math.random();
            let result;
            if (roll < 0.48) result = 'red';
            else if (roll < 0.96) result = 'black';
            else result = 'green';
            const win = (cor === 'green' && result === 'green') ? aposta * 14 :
                        (cor === result) ? aposta * 2 : 0;
            if (win > 0) {
                user.coins += win;
                user.rouletteWins = (user.rouletteWins || 0) + 1;
                user.gambleWinStreak = (user.gambleWinStreak || 0) + 1;
                user.gambleLossStreak = 0;
                await user.save();
                await checkBadges(user, interaction);
                return interaction.reply(`🎡 **${result.toUpperCase()}!** Você ganhou **${win} coins**!`);
            } else {
                user.coins -= aposta;
                user.gambleLossStreak = (user.gambleLossStreak || 0) + 1;
                user.gambleWinStreak = 0;
                await user.save();
                await checkBadges(user, interaction);
                return interaction.reply(`🎡 **${result.toUpperCase()}!** Você perdeu **${aposta} coins**!`);
            }
        }
        if (commandName === 'jokenpo') {
            const jogada = options.getString('jogada');
            const aposta = options.getInteger('aposta') || 0;
            if (aposta > 0 && user.coins < aposta) return interaction.reply(`❌ Saldo insuficiente.`);
            const choices = ['pedra', 'papel', 'tesoura'];
            const botChoice = choices[Math.floor(Math.random() * choices.length)];
            let result;
            if (jogada === botChoice) result = 'empate';
            else if (
                (jogada === 'pedra' && botChoice === 'tesoura') ||
                (jogada === 'papel' && botChoice === 'pedra') ||
                (jogada === 'tesoura' && botChoice === 'papel')
            ) result = 'win';
            else result = 'lose';
            if (result === 'win' && aposta > 0) {
                user.coins += aposta;
                await user.save();
                return interaction.reply(`✊ **${jogada}** vs **${botChoice}**\n🎉 Você ganhou **${aposta} coins**!`);
            } else if (result === 'lose' && aposta > 0) {
                user.coins -= aposta;
                await user.save();
                return interaction.reply(`✊ **${jogada}** vs **${botChoice}**\n😢 Você perdeu **${aposta} coins**!`);
            } else {
                return interaction.reply(`✊ **${jogada}** vs **${botChoice}**\n🤝 Empate!`);
            }
        }
        if (commandName === 'dado') {
            const faces = options.getInteger('faces');
            if (faces < 2 || faces > 1000) return interaction.reply('❌ Número de faces inválido (2-1000).');
            const roll = Math.floor(Math.random() * faces) + 1;
            // Badge Escolhido (0.1% de chance)
            if (roll === 1 && Math.random() < 0.001) {
                if (!user.badges.includes('escolhido')) {
                    user.badges.push('escolhido');
                    await user.save();
                }
            }
            return interaction.reply(`🎲 Você rolou um **${roll}** (de 1 a ${faces})!`);
        }

        // ============================
        // 👤 PERFIL E SOCIAL
        // ============================
        if (commandName === 'profile') {
            await interaction.deferReply();
            try {
                const target = options.getUser('usuario') || interaction.user;
                const td = (await getData(interaction.guild.id, target.id)).user;
                // 1. CANVAS
                const canvas = createCanvas(800, 450);
                const ctx = canvas.getContext('2d');
                // 2. BACKGROUND
                const bg = await loadImage('https://i.imgur.com/8N9m9Xp.png').catch(() => null);
                if (bg) {
                    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
                } else {
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                // 3. AVATAR
                const avatar = await loadImage(target.displayAvatarURL({ extension: 'png', size: 256 }));
                ctx.save();
                ctx.beginPath();
                ctx.arc(120, 150, 80, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, 40, 70, 160, 160);
                ctx.restore();
                // 4. BORDA DO AVATAR
                ctx.beginPath();
                ctx.arc(120, 150, 82, 0, Math.PI * 2);
                ctx.strokeStyle = td.profileColor || '#0099ff';
                ctx.lineWidth = 4;
                ctx.stroke();
                // 5. NOME
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 36px "DejaVu Sans"';
                ctx.fillText(target.username.slice(0, 20), 280, 120);
                // 6. INFO
                ctx.font = 'bold 24px "DejaVu Sans"';
                if (icons?.coin) {
                    ctx.drawImage(icons.coin, 30, 300, 28, 28);
                }
                ctx.fillText(`Coins: ${td.coins.toLocaleString()}`, 65, 320);
                if (icons?.star) {
                    ctx.drawImage(icons.star, 30, 340, 28, 28);
                }
                ctx.fillText(`Reputação: ${td.reputation}`, 65, 360);
                if (icons?.ring) {
                    ctx.drawImage(icons.ring, 30, 380, 28, 28);
                }
                ctx.fillText(`Casado: ${td.marriedTo ? 'Sim' : 'Não'}`, 65, 400);
                // 7. BIO
                ctx.font = 'italic 20px "DejaVu Sans"';
                ctx.fillStyle = '#cccccc';
                const bio = (td.bio || '').slice(0, 60);
                ctx.fillText(`"${bio}"`, 280, 220);
                // 8. BADGES (SEM EMOJI UNICODE)
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 22px "DejaVu Sans"';
                ctx.fillText("CONQUISTAS:", 280, 275);
                const validBadges = (td.badges || []).filter(id => ALL_BADGES[id]);
                if (validBadges.length === 0) {
                    ctx.font = 'italic 18px "DejaVu Sans"';
                    ctx.fillStyle = '#777777';
                    ctx.fillText("Nenhuma badge.", 280, 325);
                } else {
                    let y = 325;
                    validBadges.slice(0, 5).forEach(id => {
                        const badge = ALL_BADGES[id];
                        ctx.font = '18px "DejaVu Sans"';
                        ctx.fillStyle = '#FFD700';
                        ctx.fillText(`${badge.emoji} ${badge.name}`, 280, y);
                        y += 30;
                    });
                }
                // 9. ENVIO
                const attachment = new AttachmentBuilder(canvas.toBuffer(), {
                    name: `vendetta-profile-${target.id}.png`
                });
                return interaction.editReply({ files: [attachment] });
            } catch (err) {
                console.error('[PROFILE ERROR]', err);
                return interaction.editReply({
                    content: '❌ Erro ao gerar o profile. Tente novamente.'
                });
            }
        }
        if (commandName === 'stats') {
            const target = options.getUser('usuario') || interaction.user;
            const tData = (await getData(interaction.guild.id, target.id)).user;
            const embed = new EmbedBuilder()
                .setTitle(`📊 ESTATÍSTICAS: ${target.username}`)
                .setColor('Blue')
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '💬 Mensagens', value: `${(tData.messages || 0).toLocaleString()}`, inline: true },
                    { name: '🎙️ Tempo de Voz', value: `${tData.voiceMinutes || 0} min`, inline: true },
                    { name: '🤖 Interações IA', value: `${tData.iaMessages || 0}`, inline: true },
                    { name: '🕵️ Roubos Sucesso', value: `${tData.robSuccess || 0}`, inline: true },
                    { name: '🔫 Crimes Cometidos', value: `${tData.crimeCount || 0}`, inline: true },
                    { name: '🤝 Total Doado', value: `${(tData.totalDonated || 0).toLocaleString()}`, inline: true },
                    { name: '🎰 Vitórias Cassino', value: `${(tData.coinflipWins || 0) + (tData.slotsJackpots || 0) + (tData.rouletteWins || 0)}`, inline: true },
                    { name: '💍 Estado Civil', value: tData.marriedTo ? `Casado com <@${tData.marriedTo}>` : 'Solteiro', inline: true }
                )
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }
        if (commandName === 'level') {
            const target = options.getUser('usuario') || interaction.user;
            const tData = (await getData(interaction.guild.id, target.id)).user;
            const nextXP = xpForLevel(tData.level + 1);
            return interaction.reply(`📈 **${target.username}** está no **Nível ${tData.level}** com **${tData.xp}/${nextXP} XP**.`);
        }
        if (commandName === 'leaderboard') {
            const top = await User.find({ guildId: interaction.guild.id }).sort({ level: -1, xp: -1 }).limit(10);
            const desc = top.map((u, i) => `**${i + 1}.** <@${u.userId}> — Nível **${u.level}**`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('🏆 RANKING DE EXPERIÊNCIA')
                .setColor('Blue')
                .setDescription(desc)
                .setFooter({ text: 'Os 10 usuários com maior nível' });
            return interaction.reply({ embeds: [embed] });
        }
        if (commandName === 'badges') {
            const target = options.getUser('usuario') || interaction.user;
            const tData = (await getData(interaction.guild.id, target.id)).user;
            const bList = (tData.badges || [])
                .filter(id => ALL_BADGES[id])
                .map(id => `${ALL_BADGES[id].emoji} **${ALL_BADGES[id].name}**\n> *${ALL_BADGES[id].desc}*`)
                .join('\n\n') || "*Este usuário ainda não possui conquistas.*";
            const embed = new EmbedBuilder()
                .setTitle(`🏅 CONQUISTAS DE ${target.username}`)
                .setColor('Gold')
                .setDescription(bList)
                .setFooter({ text: `${tData.badges?.length || 0} badges desbloqueadas` });
            return interaction.reply({ embeds: [embed] });
        }
        if (commandName === 'marry') {
            const target = options.getUser('usuario');
            if (target.id === interaction.user.id) return interaction.reply('❌ Você não pode casar com si mesmo.');
            if (user.marriedTo) return interaction.reply('❌ Você já está casado!');
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            if (targetData.marriedTo) return interaction.reply(`❌ ${target} já está casado!`);
            if (!user.inventory || !user.inventory.includes('Anel de Casamento')) {
                return interaction.reply('❌ Você precisa de um Anel de Casamento! Compre na `/shop`.');
            }
            // Remove o anel
            user.inventory = user.inventory.filter(i => i !== 'Anel de Casamento');
            user.marriedTo = target.id;
            targetData.marriedTo = interaction.user.id;
            await user.save();
            await targetData.save();
            return interaction.reply(`💍 <@${interaction.user.id}> e <@${target.id}> se casaram! Felicidades! 🎉`);
        }
        if (commandName === 'divorce') {
            if (!user.marriedTo) return interaction.reply('❌ Você não está casado.');
            const targetData = (await getData(interaction.guild.id, user.marriedTo)).user;
            user.marriedTo = null;
            if (targetData) targetData.marriedTo = null;
            await user.save();
            if (targetData) await targetData.save();
            return interaction.reply('💔 Você se divorciou.');
        }
        if (commandName === 'rep') {
            const target = options.getUser('usuario');
            if (target.id === interaction.user.id) return interaction.reply('❌ Você não pode dar reputação a si mesmo.');
            const cooldown = 86400000; // 24h
            if (user.lastRepTime && Date.now() - user.lastRepTime < cooldown) {
                const remaining = cooldown - (Date.now() - user.lastRepTime);
                return interaction.reply({
                    content: `⏳ Você já deu reputação hoje. Espere **${formatTime(remaining)}**.`,
                    ephemeral: true
                });
            }
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            targetData.reputation = (targetData.reputation || 0) + 1;
            user.lastRepTime = Date.now();
            // Lógica da badge Rosa
            if (user.lastRepTarget === target.id) {
                user.repSameTargetStreak = (user.repSameTargetStreak || 0) + 1;
            } else {
                user.repSameTargetStreak = 1;
                user.lastRepTarget = target.id;
            }
            await user.save();
            await targetData.save();
            await checkBadges(targetData, interaction);
            return interaction.reply(`⭐ Você deu reputação para <@${target.id}>!`);
        }
        if (commandName === 'toprep') {
            const top = await User.find({ guildId: interaction.guild.id }).sort({ reputation: -1 }).limit(10);
            const embed = new EmbedBuilder()
                .setTitle('⭐ RANKING DE REPUTAÇÃO')
                .setColor('Purple')
                .setDescription(top.map((u, i) => `**${i + 1}.** <@${u.userId}> — **${u.reputation || 0} reps**`).join('\n'));
            return interaction.reply({ embeds: [embed] });
        }
        if (commandName === 'setbio') {
            const texto = options.getString('texto');
            if (texto.length > 100) return interaction.reply('❌ Bio muito longa (máx 100 caracteres).');
            user.bio = texto;
            await user.save();
            await checkBadges(user, interaction);
            return interaction.reply(`✅ Sua bio foi atualizada para: "${texto}"`);
        }
        if (commandName === 'setcolor') {
            const hex = options.getString('hex');
            if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return interaction.reply('❌ Cor inválida. Use formato HEX (ex: #FF0000).');
            if (!user.inventory || !user.inventory.includes('Cor Personalizada')) {
                return interaction.reply('❌ Você precisa comprar o item "Cor Personalizada" na loja.');
            }
            user.profileColor = hex;
            await user.save();
            return interaction.reply(`✅ Sua cor de perfil foi atualizada para: ${hex}`);
        }
        if (commandName === 'avatar') {
            const target = options.getUser('usuario') || interaction.user;
            const embed = new EmbedBuilder()
                .setTitle(`🖼️ AVATAR DE ${target.username}`)
                .setImage(target.displayAvatarURL({ size: 1024 }));
            return interaction.reply({ embeds: [embed] });
        }

        // ============================
        // 🎵 MÚSICA
        // ============================
        if (commandName === 'play') {
            const query = options.getString('musica');
            const channel = interaction.member.voice.channel;
            if (!channel) return interaction.reply('❌ Você precisa estar em um canal de voz.');
            await interaction.deferReply();
            try {
                const { track } = await player.play(channel, query, {
                    nodeOptions: {
                        metadata: { channel: interaction.channel }
                    }
                });
                return interaction.editReply(`🎵 **${track.title}** adicionado à fila!`);
            } catch (err) {
                console.error('[PLAY ERROR]', err);
                return interaction.editReply('❌ Erro ao tocar música. Verifique se o link é válido ou se a música está disponível na sua região.');
            }
        }
        if (commandName === 'skip') {
            const queue = player.nodes.get(interaction.guild.id);
            if (!queue || !queue.isPlaying()) return interaction.reply('❌ Nenhuma música tocando.');
            queue.node.skip();
            return interaction.reply('⏭️ Música pulada!');
        }
        if (commandName === 'stop') {
            const queue = player.nodes.get(interaction.guild.id);
            if (!queue) return interaction.reply('❌ Nenhuma música tocando.');
            queue.delete();
            return interaction.reply('🛑 Fila limpa e música parada!');
        }
        if (commandName === 'queue') {
            const queue = player.nodes.get(interaction.guild.id);
            if (!queue || !queue.isPlaying()) return interaction.reply('❌ Nenhuma música na fila.');
            const tracks = queue.tracks.toArray();
            const embed = new EmbedBuilder()
                .setTitle('🎵 FILA DE REPRODUÇÃO')
                .setDescription(tracks.slice(0, 10).map((t, i) => `**${i + 1}.** ${t.title}`).join('\n') || 'Fila vazia')
                .setFooter({ text: `${tracks.length} músicas na fila` });
            return interaction.reply({ embeds: [embed] });
        }
        if (commandName === 'volume') {
            const nivel = options.getInteger('nivel');
            if (nivel < 0 || nivel > 100) return interaction.reply('❌ Volume deve estar entre 0 e 100.');
            const queue = player.nodes.get(interaction.guild.id);
            if (!queue) return interaction.reply('❌ Nenhuma música tocando.');
            queue.node.setVolume(nivel);
            return interaction.reply(`🔊 Volume ajustado para **${nivel}%**`);
        }
        // ============================
        // 🛠️ UTILIDADES & IA
        // ============================
        if (commandName === 'imagine') {
            const prompt = options.getString('prompt');
            await interaction.deferReply();
            try {
                const encodedPrompt = encodeURIComponent(prompt);
                const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
                // Verifica se a URL é válida
                const response = await fetch(imageUrl, { method: 'HEAD' });
                if (!response.ok) throw new Error('Falha ao gerar imagem');
                user.imagineCount = (user.imagineCount || 0) + 1;
                await user.save();
                await checkBadges(user, interaction);
                const embed = new EmbedBuilder()
                    .setTitle('🎨 IMAGEM GERADA')
                    .setDescription(`Prompt: "${prompt}"`)
                    .setImage(imageUrl)
                    .setFooter({ text: 'Gerado por Pollinations.AI' });
                return interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error('[IMAGINE ERROR]', err);
                return interaction.editReply('❌ Erro ao gerar imagem. Tente novamente com outro prompt.');
            }
        }
        if (commandName === 'analyze-image') {
            const attachment = options.getAttachment('imagem');
            if (!attachment || !attachment.contentType?.startsWith('image/')) {
                return interaction.reply('❌ Por favor, envie uma imagem válida.');
            }
            await interaction.deferReply();
            try {
                // ✅ IMPLEMENTAÇÃO REAL DE ANÁLISE DE IMAGEM (CORREÇÃO CRÍTICA)
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://birutas.ai',
                        'X-Title': 'Birutas AI'
                    },
                    body: JSON.stringify({
                        model: 'google/gemini-flash-1.5:free',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: 'Descreva esta imagem em português brasileiro.' },
                                    { type: 'image_url', image_url: { url: attachment.url } }
                                ]
                            }
                        ]
                    })
                });
                const data = await response.json();
                if (!data.choices || !data.choices[0]) {
                    throw new Error('Resposta inválida da API');
                }
                const analysis = data.choices[0].message.content;
                user.analyzeCount = (user.analyzeCount || 0) + 1;
                await user.save();
                await checkBadges(user, interaction);
                const embed = new EmbedBuilder()
                    .setTitle('🔍 ANÁLISE DE IMAGEM')
                    .setDescription(analysis)
                    .setImage(attachment.url)
                    .setFooter({ text: 'Analisado por Gemini Vision' });
                return interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error('[ANALYZE ERROR]', err);
                return interaction.editReply('❌ Erro ao analisar imagem. Tente novamente mais tarde.');
            }
        }
        if (commandName === 'resumo') {
            await interaction.deferReply();
            try {
                const messages = await interaction.channel.messages.fetch({ limit: 50 });
                const content = messages.map(m => `${m.author.username}: ${m.content}`).reverse().join('\n');
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'google/gemini-flash-1.5:free',
                        messages: [
                            { role: 'system', content: 'Resuma o seguinte chat de forma concisa em português brasileiro.' },
                            { role: 'user', content: content.slice(0, 4000) }
                        ]
                    })
                });
                const data = await response.json();
                if (!data.choices) throw new Error('Falha ao gerar resumo');
                return interaction.editReply(`📝 **RESUMO DAS ÚLTIMAS MENSAGENS:**\n\n${data.choices[0].message.content}`);
            } catch (err) {
                console.error('[RESUMO ERROR]', err);
                return interaction.editReply('❌ Erro ao gerar resumo. Tente novamente.');
            }
        }
        if (commandName === 'addia') {
            if (!isAdmin) return interaction.reply('🚫');
            const id = options.getString('id');
            const nome = options.getString('nome');
            const prompt = options.getString('prompt');
            const cor = options.getString('cor') || '#0099ff';
            config.customIAs[nome.toLowerCase()] = {
                id: id,
                name: nome,
                desc: '(Custom)',
                color: cor,
                prompt: prompt
            };
            config.markModified('customIAs');
            await config.save();
            return interaction.reply(`✅ IA personalizada **${nome}** criada com sucesso!`);
        }
        if (commandName === 'delia') {
            if (!isAdmin) return interaction.reply('🚫');
            const nome = options.getString('nome');
            if (config.customIAs[nome.toLowerCase()]) {
                delete config.customIAs[nome.toLowerCase()];
                config.markModified('customIAs');
                await config.save();
                return interaction.reply(`🗑️ IA **${nome}** removida.`);
            }
            return interaction.reply('❌ IA não encontrada.');
        }
        if (commandName === 'reset') {
            if (!isAdmin) return interaction.reply('🚫');
            await Memory.deleteOne({ channelId: interaction.channel.id });
            return interaction.reply('🧠 Memória da IA resetada neste canal.');
        }
        if (commandName === 'qrcode') {
            const texto = options.getString('texto');
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(texto)}`;
            const embed = new EmbedBuilder()
                .setTitle('📱 QR CODE')
                .setImage(qrUrl)
                .setFooter({ text: `Conteúdo: ${texto.slice(0, 50)}${texto.length > 50 ? '...' : ''}` });
            return interaction.reply({ embeds: [embed] });
        }
        if (commandName === 'shorten') {
            const url = options.getString('url');
            await interaction.deferReply();
            try {
                // ✅ TRATAMENTO DE ERRO ADICIONADO (CORREÇÃO)
                const response = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
                if (!response.ok) throw new Error('Falha ao encurtar URL');
                const shortUrl = await response.text();
                if (shortUrl.startsWith('Error')) throw new Error(shortUrl);
                return interaction.editReply(`🔗 **URL Encurtada:** ${shortUrl}`);
            } catch (err) {
                console.error('[SHORTEN ERROR]', err);
                return interaction.editReply('❌ Erro ao encurtar URL. Verifique se a URL é válida.');
            }
        }
        if (commandName === 'weather') {
            const cidade = options.getString('cidade');
            await interaction.deferReply();
            try {
                // ✅ TRATAMENTO DE ERRO ADICIONADO (CORREÇÃO)
                const apiKey = process.env.WEATHER_API_KEY; // Adicione esta env var
                if (!apiKey) {
                    return interaction.editReply('❌ API de clima não configurada.');
                }
                const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`);
                if (!response.ok) {
                    if (response.status === 404) {
                        return interaction.editReply('❌ Cidade não encontrada.');
                    }
                    throw new Error('Falha na API de clima');
                }
                const data = await response.json();
                const embed = new EmbedBuilder()
                    .setTitle(`🌤️ CLIMA EM ${data.name}`)
                    .setDescription(`**${data.weather[0].description}**`)
                    .addFields(
                        { name: '🌡️ Temperatura', value: `${data.main.temp}°C`, inline: true },
                        { name: '💧 Umidade', value: `${data.main.humidity}%`, inline: true },
                        { name: '💨 Vento', value: `${data.wind.speed} m/s`, inline: true }
                    )
                    .setThumbnail(`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`);
                return interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error('[WEATHER ERROR]', err);
                return interaction.editReply('❌ Erro ao buscar clima. Tente novamente mais tarde.');
            }
        }
        if (commandName === 'crypto') {
            const moeda = options.getString('moeda').toUpperCase();
            await interaction.deferReply();
            try {
                // ✅ TRATAMENTO DE ERRO ADICIONADO (CORREÇÃO)
                const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${moeda.toLowerCase()}&vs_currencies=brl,usd`);
                if (!response.ok) throw new Error('Falha na API de cripto');
                const data = await response.json();
                const coinData = data[moeda.toLowerCase()];
                if (!coinData) {
                    return interaction.editReply('❌ Criptomoeda não encontrada. Tente: bitcoin, ethereum, cardano, etc.');
                }
                const embed = new EmbedBuilder()
                    .setTitle(`💰 ${moeda}`)
                    .addFields(
                        { name: '🇧🇷 BRL', value: `R$ ${coinData.brl.toLocaleString()}`, inline: true },
                        { name: '🇺🇸 USD', value: `$ ${coinData.usd.toLocaleString()}`, inline: true }
                    );
                return interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error('[CRYPTO ERROR]', err);
                return interaction.editReply('❌ Erro ao buscar cotação. Tente novamente mais tarde.');
            }
        }

        if (commandName === 'giveaway') {
            if (!isAdmin) return interaction.reply('🚫');
            const tempo = options.getString('tempo');
            const vencedores = options.getInteger('vencedores');
            const premio = options.getString('premio');
            const duration = ms(tempo);
            if (!duration) return interaction.reply('❌ Formato de tempo inválido. Use: 10m, 1h, 1d');
            const embed = new EmbedBuilder()
                .setTitle('🎉 SORTEIO!')
                .setDescription(`**Prêmio:** ${premio}\n**Vencedores:** ${vencedores}\n**Termina:** <t:${Math.floor((Date.now() + duration) / 1000)}:R>`)
                .setColor('Gold')
                .setFooter({ text: 'Reaja com 🎉 para participar!' });
            const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
            await msg.react('🎉');
            // Coletor de participantes
            const filter = (reaction, user) => reaction.emoji.name === '🎉' && !user.bot;
            const collector = msg.createReactionCollector({ filter, time: duration });
            const participants = new Set();
            collector.on('collect', (reaction, user) => {
                participants.add(user.id);
            });
            collector.on('end', async () => {
                if (participants.size === 0) {
                    return interaction.channel.send(`❌ O sorteio de **${premio}** foi encerrado, mas não houve participantes.`);
                }
                const winnersList = Array.from(participants).sort(() => 0.5 - Math.random()).slice(0, vencedores);
                const winnersMention = winnersList.map(id => `<@${id}>`).join(', ');
                await interaction.channel.send(`🎉 **PARABÉNS AOS VENCEDORES!** 🎉\n${winnersMention} ganhou(aram) **${premio}**!`);
            });
            return;
        }
        if (commandName === 'tag') {
            const action = options.getString('acao');
            const name = options.getString('nome');
            if (action === 'create') {
                if (!isAdmin) return interaction.reply('🚫');
                const texto = options.getString('texto');
                if (!config.tags) config.tags = {};
                config.tags[name] = texto;
                config.markModified('tags');
                await config.save();
                return interaction.reply(`✅ Tag **${name}** criada com sucesso.`);
            }
            if (action === 'delete') {
                if (!isAdmin) return interaction.reply('🚫');
                if (config.tags && config.tags[name]) {
                    delete config.tags[name];
                    config.markModified('tags');
                    await config.save();
                    return interaction.reply(`🗑️ Tag **${name}** removida.`);
                }
                return interaction.reply('❌ Tag não encontrada.');
            }
            if (action === 'list') {
                const tags = config.tags ? Object.keys(config.tags) : [];
                return interaction.reply(`🏷️ **Tags Disponíveis:** ${tags.join(', ') || 'Nenhuma tag criada.'}`);
            }
        }
        if (commandName === 'graph') {
            const tipo = options.getString('tipo');
            const chart = new QuickChart();
            if (tipo === 'coins') {
                const top = await User.find({ guildId: interaction.guild.id }).sort({ coins: -1 }).limit(5);
                chart.setConfig({
                    type: 'bar',
                    data: {
                        labels: top.map(u => u.userId.slice(0, 5)),
                        datasets: [{ label: 'Coins', data: top.map(u => u.coins) }]
                    }
                });
            } else {
                chart.setConfig({
                    type: 'line',
                    data: {
                        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
                        datasets: [{ label: 'Atividade Mensagens', data: [12, 19, 3, 5, 2, 3, 10] }]
                    }
                });
            }
            return interaction.reply({
                files: [{ attachment: chart.getUrl(), name: 'chart.png' }]
            });
        }
        if (commandName === 'status') {
            const uptime = process.uptime();
            const embed = new EmbedBuilder()
                .setTitle('🤖 STATUS DO SISTEMA')
                .setColor('Green')
                .addFields(
                    { name: '📡 Latência API', value: `${client.ws.ping}ms`, inline: true },
                    { name: '⏱️ Uptime', value: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`, inline: true },
                    { name: '🧠 Memória RAM', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`, inline: true },
                    { name: '👥 Servidores', value: `${client.guilds.cache.size}`, inline: true },
                    { name: '👤 Usuários', value: `${client.users.cache.size}`, inline: true }
                )
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }
        if (commandName === 'resetbadges') {
            if (!isAdmin) return interaction.reply('🚫');
            const target = options.getUser('usuario');
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            // ✅ VERIFICAÇÃO ADICIONADA (CORREÇÃO)
            if (!targetData) {
                return interaction.reply('❌ Usuário não encontrado no banco de dados.');
            }
            targetData.badges = [];
            await targetData.save();
            return interaction.reply(`✅ Badges de **${target.tag}** resetadas.`);
        }
        // --- EXECUÇÃO DE TAGS ---
        if (config.tags && config.tags[commandName]) {
            return interaction.reply(config.tags[commandName]);
        }
        // --- VERIFICAÇÃO FINAL DE BADGES ---
        await checkBadges(user, interaction);
    } catch (error) {
        console.error('[INTERACTION ERROR]', error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Ocorreu um erro ao executar este comando.',
                    ephemeral: true
                });
            } else if (interaction.deferred) {
                await interaction.editReply('❌ Ocorreu um erro ao executar este comando.');
            }
        } catch (e) {
            console.error('Erro ao enviar mensagem de erro:', e);
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// 🚀 EVENTO: BOT PRONTO
// ═══════════════════════════════════════════════════════════════
client.once('ready', async () => {
    console.log(`✅ Bot logado como ${client.user.tag}`);
    // Carrega ícones
    await loadIcons();
    // Define presença
    client.user.setActivity('/help | Birutas AI Ultimate', { type: ActivityType.Playing });
    // Registro de comandos slash
    const commands = [
        // MODERAÇÃO
        new SlashCommandBuilder().setName('ban').setDescription('Bane um usuário.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true))
            .addStringOption(o => o.setName('motivo').setDescription('Motivo')),
        new SlashCommandBuilder().setName('kick').setDescription('Expulsa um usuário.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true))
            .addStringOption(o => o.setName('motivo').setDescription('Motivo')),
        new SlashCommandBuilder().setName('clear').setDescription('Limpa mensagens.')
            .addIntegerOption(o => o.setName('quantidade').setDescription('Quantidade').setRequired(true)),
        new SlashCommandBuilder().setName('nuke').setDescription('Limpa completamente um canal.'),
        new SlashCommandBuilder().setName('lock').setDescription('Bloqueia o canal.'),
        new SlashCommandBuilder().setName('unlock').setDescription('Desbloqueia o canal.'),
        new SlashCommandBuilder().setName('slowmode').setDescription('Define slowmode.')
            .addIntegerOption(o => o.setName('segundos').setDescription('Segundos').setRequired(true)),
        new SlashCommandBuilder().setName('warn').setDescription('Adverte um usuário.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true))
            .addStringOption(o => o.setName('motivo').setDescription('Motivo')),
        new SlashCommandBuilder().setName('warnings').setDescription('Verifica advertências.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('unwarn').setDescription('Remove advertências.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true)),
        new SlashCommandBuilder().setName('mute').setDescription('Muta um usuário.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true))
            .addStringOption(o => o.setName('tempo').setDescription('Tempo (ex: 10m, 1h)').setRequired(true)),
        new SlashCommandBuilder().setName('unmute').setDescription('Desmuta um usuário.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true)),
        // CONFIGURAÇÃO
        new SlashCommandBuilder().setName('setchannel').setDescription('Define canal de IA.')
            .addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(true))
            .addStringOption(o => o.setName('acao').setDescription('Ação').setRequired(true)
                .addChoices({ name: 'Adicionar', value: 'add' }, { name: 'Remover', value: 'remove' })),
        new SlashCommandBuilder().setName('setadminrole').setDescription('Define cargo admin.')
            .addRoleOption(o => o.setName('cargo').setDescription('Cargo').setRequired(true)),
        new SlashCommandBuilder().setName('setlog').setDescription('Define canal de logs.')
            .addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(true)),
        new SlashCommandBuilder().setName('banchannel').setDescription('Bane canal da IA.')
            .addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(true))
            .addStringOption(o => o.setName('acao').setDescription('Ação').setRequired(true)
                .addChoices({ name: 'Banir', value: 'add' }, { name: 'Desbanir', value: 'remove' })),
        new SlashCommandBuilder().setName('backup').setDescription('Cria backup do servidor.'),
        // ECONOMIA
        new SlashCommandBuilder().setName('coins').setDescription('Verifica saldo.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('daily').setDescription('Coleta bônus diário.'),
        new SlashCommandBuilder().setName('work').setDescription('Trabalha para ganhar coins.'),
        new SlashCommandBuilder().setName('crime').setDescription('Comete um crime.'),
        new SlashCommandBuilder().setName('rob').setDescription('Rouba um usuário.')
            .addUserOption(o => o.setName('usuario').setDescription('Vítima').setRequired(true)),
        new SlashCommandBuilder().setName('give').setDescription('Doa coins.')
            .addUserOption(o => o.setName('usuario').setDescription('Destinatário').setRequired(true))
            .addIntegerOption(o => o.setName('quantidade').setDescription('Quantidade').setRequired(true)),
        new SlashCommandBuilder().setName('shop').setDescription('Mostra a loja.'),
        new SlashCommandBuilder().setName('buy').setDescription('Compra um item.')
            .addStringOption(o => o.setName('id').setDescription('ID do item').setRequired(true)),
        new SlashCommandBuilder().setName('inventory').setDescription('Mostra inventário.'),
        new SlashCommandBuilder().setName('rank').setDescription('Ranking de riqueza.'),
        new SlashCommandBuilder().setName('configvoz').setDescription('Configura ganhos de voz.')
            .addIntegerOption(o => o.setName('valor').setDescription('Coins por minuto').setRequired(true)),
        // CASSINO
        new SlashCommandBuilder().setName('coinflip').setDescription('Aposta no cara ou coroa.')
            .addStringOption(o => o.setName('lado').setDescription('Lado').setRequired(true)
                .addChoices({ name: 'Cara', value: 'cara' }, { name: 'Coroa', value: 'coroa' }))
            .addIntegerOption(o => o.setName('aposta').setDescription('Valor').setRequired(true)),
        new SlashCommandBuilder().setName('slots').setDescription('Joga na máquina de slots.')
            .addIntegerOption(o => o.setName('valor').setDescription('Aposta').setRequired(true)),
        new SlashCommandBuilder().setName('roulette').setDescription('Aposta na roleta.')
            .addStringOption(o => o.setName('cor').setDescription('Cor').setRequired(true)
                .addChoices({ name: 'Red (2x)', value: 'red' }, { name: 'Black (2x)', value: 'black' }, { name: 'Green (14x)', value: 'green' }))
            .addIntegerOption(o => o.setName('aposta').setDescription('Valor').setRequired(true)),
        new SlashCommandBuilder().setName('jokenpo').setDescription('Joga pedra, papel ou tesoura.')
            .addStringOption(o => o.setName('jogada').setDescription('Sua jogada').setRequired(true)
                .addChoices({ name: 'Pedra', value: 'pedra' }, { name: 'Papel', value: 'papel' }, { name: 'Tesoura', value: 'tesoura' }))
            .addIntegerOption(o => o.setName('aposta').setDescription('Valor (opcional)')),
        new SlashCommandBuilder().setName('dado').setDescription('Lança um dado.')
            .addIntegerOption(o => o.setName('faces').setDescription('Número de faces').setRequired(true)),
        // SOCIAL
        new SlashCommandBuilder().setName('profile').setDescription('Mostra o perfil.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('stats').setDescription('Mostra estatísticas.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('level').setDescription('Verifica nível e XP.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('leaderboard').setDescription('Ranking de nível.'),
        new SlashCommandBuilder().setName('badges').setDescription('Mostra conquistas.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('marry').setDescription('Pede alguém em casamento.')
            .addUserOption(o => o.setName('usuario').setDescription('Noivo(a)').setRequired(true)),
        new SlashCommandBuilder().setName('divorce').setDescription('Divorcia-se.'),
        new SlashCommandBuilder().setName('rep').setDescription('Dá reputação.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true)),
        new SlashCommandBuilder().setName('toprep').setDescription('Ranking de reputação.'),
        new SlashCommandBuilder().setName('setbio').setDescription('Define sua bio.')
            .addStringOption(o => o.setName('texto').setDescription('Bio (máx 100 chars)').setRequired(true)),
        new SlashCommandBuilder().setName('setcolor').setDescription('Define cor do perfil.')
            .addStringOption(o => o.setName('hex').setDescription('Cor HEX (Ex: #FF0000)').setRequired(true)),
        new SlashCommandBuilder().setName('avatar').setDescription('Mostra avatar.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        // MÚSICA
        new SlashCommandBuilder().setName('play').setDescription('Toca uma música.')
            .addStringOption(o => o.setName('musica').setDescription('Nome ou Link').setRequired(true)),
        new SlashCommandBuilder().setName('skip').setDescription('Pula a música.'),
        new SlashCommandBuilder().setName('stop').setDescription('Para a música.'),
        new SlashCommandBuilder().setName('queue').setDescription('Mostra a fila.'),
        new SlashCommandBuilder().setName('volume').setDescription('Ajusta volume.')
            .addIntegerOption(o => o.setName('nivel').setDescription('0-100').setRequired(true)),
        // UTILIDADES & IA
        new SlashCommandBuilder().setName('imagine').setDescription('Gera imagem com IA.')
            .addStringOption(o => o.setName('prompt').setDescription('Descrição').setRequired(true)),
        new SlashCommandBuilder().setName('analyze-image').setDescription('Analiza imagem.')
            .addAttachmentOption(o => o.setName('imagem').setDescription('Imagem').setRequired(true)),
        new SlashCommandBuilder().setName('resumo').setDescription('Resume mensagens.'),
        new SlashCommandBuilder().setName('addia').setDescription('Cria IA personalizada.')
            .addStringOption(o => o.setName('id').setDescription('ID do Modelo').setRequired(true))
            .addStringOption(o => o.setName('nome').setDescription('Nome').setRequired(true))
            .addStringOption(o => o.setName('prompt').setDescription('Prompt').setRequired(true))
            .addStringOption(o => o.setName('cor').setDescription('Cor HEX')),
        new SlashCommandBuilder().setName('delia').setDescription('Remove IA.')
            .addStringOption(o => o.setName('nome').setDescription('Nome').setRequired(true)),
        new SlashCommandBuilder().setName('reset').setDescription('Reseta memória da IA.'),
        new SlashCommandBuilder().setName('qrcode').setDescription('Gera QR Code.')
            .addStringOption(o => o.setName('texto').setDescription('Conteúdo').setRequired(true)),
        new SlashCommandBuilder().setName('shorten').setDescription('Encurta link.')
            .addStringOption(o => o.setName('url').setDescription('URL').setRequired(true)),
        new SlashCommandBuilder().setName('weather').setDescription('Verifica clima.')
            .addStringOption(o => o.setName('cidade').setDescription('Cidade').setRequired(true)),
        new SlashCommandBuilder().setName('crypto').setDescription('Verifica cripto.')
            .addStringOption(o => o.setName('moeda').setDescription('Símbolo (BTC, ETH)').setRequired(true)),
        new SlashCommandBuilder().setName('giveaway').setDescription('Inicia sorteio.')
            .addStringOption(o => o.setName('tempo').setDescription('Duração').setRequired(true))
            .addIntegerOption(o => o.setName('vencedores').setDescription('Qtd').setRequired(true))
            .addStringOption(o => o.setName('premio').setDescription('Prêmio').setRequired(true)),
        new SlashCommandBuilder().setName('tag').setDescription('Gerencia tags.')
            .addStringOption(o => o.setName('acao').setDescription('Ação').setRequired(true)
                .addChoices({ name: 'Criar', value: 'create' }, { name: 'Deletar', value: 'delete' }, { name: 'Listar', value: 'list' }))
            .addStringOption(o => o.setName('nome').setDescription('Nome').setRequired(true))
            .addStringOption(o => o.setName('texto').setDescription('Texto (para criar)')),
        new SlashCommandBuilder().setName('graph').setDescription('Gera gráfico.')
            .addStringOption(o => o.setName('tipo').setDescription('Tipo').setRequired(true)
                .addChoices({ name: 'Atividade', value: 'activity' }, { name: 'Riqueza', value: 'coins' })),
        new SlashCommandBuilder().setName('status').setDescription('Status do bot.'),
        new SlashCommandBuilder().setName('resetbadges').setDescription('Reseta badges.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true))
    ];
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('📡 Sincronizando comandos slash...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ Comandos sincronizados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao sincronizar comandos:', error);
    }
});

// ═══════════════════════════════════════════════════════════════
// 🔒 LOGIN E TRATAMENTO DE ERROS GLOBAIS
// ═══════════════════════════════════════════════════════════════
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});
process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});

client.login(process.env.DISCORD_TOKEN);

// ============================
// ===== INDEX FIXED ========
// ============================
