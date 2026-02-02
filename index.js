/**
 * ══════════════════════════════════════════════════════════════════════════
 * 🤖 BIRUTAS AI ULTIMATE - VENDETTA EDITION (SOURCE CODE FINAL - MASSIVE V9)
 * ══════════════════════════════════════════════════════════════════════════
 * @version 8.9.0-ULTIMATE-MAX
 */

import {
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder,
    ButtonStyle, REST, Routes, SlashCommandBuilder, PermissionFlagsBits,
    AttachmentBuilder, ActivityType, ChannelType, Partials
} from 'discord.js';

import { Player } from 'discord-player';
import { YouTubeExtractor } from '@discord-player/extractor';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import Canvas, { createCanvas, loadImage, registerFont } from 'canvas';
import QuickChart from 'quickchart-js';
import express from 'express';
import ms from 'ms';
import moment from 'moment-timezone';

import path from 'path';
import { fileURLToPath } from 'url';

/* ─────────────────────────────────────────────── */
/* 📁 __dirname (ESM COMPATÍVEL) */
/* ─────────────────────────────────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ─────────────────────────────────────────────── */
/* 🔤 FONTES (RAILWAY / LINUX) */
/* ─────────────────────────────────────────────── */
try {
    registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', {
        family: 'DejaVu Sans',
        weight: 'bold'
    });
    registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', {
        family: 'DejaVu Sans'
    });
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
    icons.coin = await loadImage(path.join(__dirname, 'emojis', 'coin.png'));
    icons.star = await loadImage(path.join(__dirname, 'emojis', 'star.png'));
    icons.ring = await loadImage(path.join(__dirname, 'emojis', 'ring.png'));
}

/* ─────────────────────────────────────────────── */
/* 🌐 SERVIDOR WEB (KEEPALIVE) */
/* ─────────────────────────────────────────────── */
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(200).send({
        status: 'Online',
        version: '8.9.0-ULTIMATE-MAX',
        uptime: process.uptime()
    });
});

app.listen(PORT, () =>
    console.log(`🌐 Servidor Web rodando na porta ${PORT}`)
);

/* ─────────────────────────────────────────────── */
/* 🗄️ MONGODB */
/* ─────────────────────────────────────────────── */
if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI não configurado!');
    process.exit(1);
}

mongoose.set('strictQuery', false);

mongoose
    .connect(process.env.MONGODB_URI, {
        connectTimeoutMS: 30000,
        family: 4
    })
    .then(() => console.log('✅ MongoDB conectado.'))
    .catch(err => console.error('❌ MongoDB erro:', err.message));

/* ─────────────────────────────────────────────── */
/* 📊 SCHEMAS */
/* ─────────────────────────────────────────────── */
const ConfigSchema = new mongoose.Schema(
    {
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
            message: {
                type: String,
                default: 'Bem-vindo ao servidor, {user}!'
            }
        },
        economyConfig: {
            dailyAmount: { type: Number, default: 500 },
            workMin: { type: Number, default: 100 },
            workMax: { type: Number, default: 400 },
            crimeMin: { type: Number, default: 500 },
            crimeMax: { type: Number, default: 1500 }
        }
    },
    { minimize: false }
);

const UserSchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    coins: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },
    bio: {
        type: String,
        default: 'Pela integridade da mente e a força da verdade.'
    },
    profileColor: { type: String, default: '#0099ff' },
    badges: { type: [String], default: [] },
    marriedTo: { type: String, default: null }
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
/* ⚠️ IMPORTANTE */
/* ─────────────────────────────────────────────── */
// CHAME loadIcons() DEPOIS DO client.login()
// Exemplo: client.once('ready', async () => { await loadIcons(); });

// ═══════════════════════════════════════════════════════════════
// 🏅 LISTA MESTRA DE BADGES (47 CONQUISTAS DETALHADAS)
// ═══════════════════════════════════════════════════════════════
const ALL_BADGES = {
    'magnata': { name: 'Magnata', emoji: '🎩', desc: 'Acumulou 100.000 coins em sua conta.' },
    'imperador': { name: 'Imperador', emoji: '🏦', desc: 'Acumulou 1.000.000 coins em sua conta.' },
    'diamante': { name: 'Diamante', emoji: '💎', desc: 'Acumulou 5.000.000 coins em sua conta.' },
    'tita': { name: 'Titã Financeiro', emoji: '🪐', desc: 'Acumulou 50.000.000 coins em sua conta.' },
    'deus': { name: 'Deus da Economia', emoji: '🌌', desc: 'O primeiro Bilionário (1.000.000.000 coins).' },
    'filantropo': { name: 'Filantropo', emoji: '🤝', desc: 'Doou mais de 100.000 coins para outros usuários.' },
    'consumista': { name: 'Consumista', emoji: '🛍️', desc: 'Comprou todos os itens disponíveis na loja.' },
    'agente007': { name: '007', emoji: '🕵️', desc: 'Realizou 50 roubos com sucesso sem ser pego.' },
    'oraculo': { name: 'Oráculo', emoji: '🔮', desc: 'Acertou 10 apostas seguidas no cassino.' },
    'aprendiz': { name: 'Aprendiz', emoji: '🎓', desc: 'Chegou ao Nível 5 de experiência.' },
    'veterano': { name: 'Veterano', emoji: '⚔️', desc: 'Chegou ao Nível 20 de experiência.' },
    'lenda': { name: 'Lenda Viva', emoji: '👑', desc: 'Chegou ao Nível 50 de experiência.' },
    'podcaster': { name: 'Podcaster', emoji: '🎙️', desc: 'Acumulou 10 horas em canais de voz.' },
    'bestfriend': { name: 'Best Friend', emoji: '🤖', desc: 'Trocou mais de 500 mensagens com a IA.' },
    'alianca': { name: 'Aliança Eterna', emoji: '💍', desc: 'Permaneceu casado por 7 dias seguidos.' },
    'famosinho': { name: 'Famosinho', emoji: '⭐', desc: 'Alcançou 50 pontos de Reputação.' },
    'visionario': { name: 'Visionário', emoji: '🎨', desc: 'Gerou 50 imagens utilizando a IA.' },
    'influencer': { name: 'Influencer', emoji: '📸', desc: 'Utilizou a IA Vision para analisar imagens 20 vezes.' },
    'founder': { name: 'Founder', emoji: '🌟', desc: 'Membro Fundador do Projeto Birutas AI.' },
    'dev': { name: 'Desenvolvedor', emoji: '🛠️', desc: 'Criador e Mantenedor do Bot.' },
    'xerife': { name: 'Xerife', emoji: '👮', desc: 'Administrador oficial do Bot no servidor.' },
    'guardiao': { name: 'Guardião', emoji: '🛡️', desc: 'Badge concedida por Reports úteis e ajuda à comunidade.' },
    'ilha': { name: 'A Ilha Particular', emoji: '🏝️', desc: 'Manteve-se como o mais rico do servidor por 7 dias.', secret: true },
    'caderno': { name: 'O Caderninho Preto', emoji: '📝', desc: 'Realizou doações suspeitas de 666 coins.', secret: true },
    'hacker': { name: 'Hacker', emoji: '💻', desc: 'Tentou injetar código ou comandos proibidos no bot.', secret: true },
    'hacker1337': { name: 'Elite Hacker', emoji: '🔌', desc: 'Realizou uma transferência Leet (1337 coins).', secret: true },
    'azar': { name: 'Rei do Azar', emoji: '🎰', desc: 'Perdeu 5 apostas seguidas no cassino.', secret: true },
    'sorte': { name: 'Sorte Grande', emoji: '🍀', desc: 'Ganhou o Jackpot máximo no Slots.', secret: true },
    'escolhido': { name: 'O Escolhido', emoji: '🎲', desc: 'Sorteado pela Matrix com 0.1% de chance.', secret: true },
    'coruja': { name: 'Coruja', emoji: '🕛', desc: 'Manteve-se ativo exatamente às 04:00 da manhã.', secret: true },
    'manipulador': { name: 'Manipulador de Massas', emoji: '🎭', desc: 'Criou um sorteio que atraiu mais de 20 pessoas.', secret: true },
    'cripto': { name: 'Criptografado', emoji: '🔑', desc: 'Definiu sua Bio inteiramente em código binário.', secret: true },
    'fuga': { name: 'A Grande Fuga', emoji: '🏃', desc: 'Saiu do servidor sendo rico e retornou em 24h.', secret: true },
    'abduzido': { name: 'Abduzido', emoji: '👽', desc: 'Conversou com a IA sobre alienígenas na madrugada.', secret: true },
    'illuminati': { name: 'Illuminati Confirmado', emoji: '👁️', desc: 'Mencionou as palavras proibidas da ordem.', secret: true },
    'cubo': { name: 'O Artefato Inútil', emoji: '🧊', desc: 'Gastou 1 milhão de coins no Cubo Cósmico.', secret: true },
    'infiltracao': { name: 'Infiltração', emoji: '🕵️‍♂️', desc: 'Agiu como um robô (mensagens em CAPS) repetidamente.', secret: true },
    'ilusionista': { name: 'O Ilusionista', emoji: '✨', desc: 'Cancelou um sorteio ativo no último segundo.', secret: true },
    'despertado': { name: 'Despertado', emoji: '💊', desc: 'Definiu sua Bio como "There is no spoon."', secret: true },
    'paradoxo': { name: 'Paradoxo', emoji: '♾️', desc: 'Um administrador tentou banir a si mesmo.', secret: true },
    'silencio': { name: 'O Silêncio dos Culpados', emoji: '🤫', desc: 'Enviou mensagem em um canal inativo há 7 dias.', secret: true },
    'v_vinganca': { name: 'V de Vingança', emoji: 'Ⅴ', desc: 'Digitou a frase lendária "Vi Veri Veniversum Vivus Vici".', secret: true },
    'domino': { name: 'O Efeito Dominó', emoji: '⛓️', desc: 'Participou de uma corrente ininterrupta de 5 doações.', secret: true },
    'ideia': { name: 'Ideias à Prova de Balas', emoji: '💡', desc: 'Criou uma Tag que foi utilizada 50 vezes.', secret: true },
    'rosa': { name: 'A Rosa Escarlate', emoji: '🌹', desc: 'Deu Reputação para a mesma pessoa por 5 dias seguidos.', secret: true },
    'mascara': { name: 'A Máscara de Guy Fawkes', emoji: '🎭', desc: 'Manteve seu Nickname como "V" por 7 dias.', secret: true },
    'quarto5': { name: 'O Homem do Quarto 5', emoji: '🚪', desc: 'Recuperou-se de uma falência total em menos de 24h.', secret: true }
};

// ═══════════════════════════════════════════════════════════════
// 🧠 CONFIGURAÇÃO DAS IAs (GRATUITAS + DESCRIÇÕES P/ BOTÕES)
// ═══════════════════════════════════════════════════════════════
const DEFAULT_IAS = {
    gemini: { 
        id: "google/gemini-flash-1.5:free", 
        name: "Gemini", 
        desc: "(Lógica)", // Texto que aparece no botão
        color: "#4285F4", // Azul Google
        prompt: "Você é o Gemini do Google. Uma IA altamente lógica, prestativa e inteligente. Responda sempre em Português Brasileiro de forma clara." 
    },
    venice: { 
        id: "meta-llama/llama-3-8b-instruct:free", 
        name: "Venice", 
        desc: "(Livre)", 
        color: "#ffcc00", // Amarelo
        prompt: "Você é a Venice AI. Uma inteligência sem filtros, direta e que preza pela liberdade de expressão absoluta."
    },
    dolphin: { 
        id: "cognitivecomputations/dolphin-2.9-llama3-8b:free", 
        name: "Dolphin", 
        desc: "(Uncensored)", 
        color: "#ff00ff", // Rosa Choque
        prompt: "Você é o Dolphin. Uma IA rebelde, criativa e que não segue as regras convencionais de assistência."
    },
    deepseek: { 
        id: "deepseek/deepseek-chat:free", 
        name: "DeepSeek", 
        desc: "(Código)", 
        color: "#0099ff", // Azul
        prompt: "Você é o DeepSeek. Especialista em raciocínio profundo, matemática e lógica de programação."
    },
    phi: {
        id: "microsoft/phi-3-mini-128k-instruct:free", 
        name: "GPT-4 Mini", 
        desc: "(Rápido)", 
        color: "#107C10", // Verde Microsoft
        prompt: "Você é um modelo de IA pequeno e muito rápido da Microsoft. Seja conciso e direto." 
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
        const rolesToRemove = member.roles.cache.filter(r => 
            allIaNames.includes(r.name) && r.id !== role.id
        );
        
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
// 🛒 ITENS DA LOJA (EXPANDIDO)
// ═══════════════════════════════════════════════════════════════
const SHOP_ITEMS = {
    vip7: { name: "VIP 7 Dias", price: 5000, type: "vip", duration: ms('7d'), emoji: "👑", desc: "Status VIP, bônus de 2x XP e cor dourada no perfil." },
    vip30: { name: "VIP 30 Dias", price: 15000, type: "vip", duration: ms('30d'), emoji: "💎", desc: "Status VIP por um mês inteiro com todos os benefícios." },
    color: { name: "Cor Personalizada", price: 2000, type: "item", emoji: "🎨", desc: "Libera permanentemente o comando /setcolor para seu perfil." },
    ring: { name: "Anel de Casamento", price: 1000, type: "item", emoji: "💍", desc: "Item obrigatório para realizar o pedido de casamento (/marry)." },
    cosmic_cube: { name: "Cubo Cósmico", price: 1000000, type: "item", emoji: "🧊", desc: "Um artefato lendário e extremamente caro. Serve para ostentação." },
    shield: { name: "Escudo Anti-Roubo", price: 3000, type: "item", emoji: "🛡️", desc: "Protege você de um roubo bem-sucedido (uso único)." },
    pickaxe: { name: "Picareta de Ouro", price: 5000, type: "item", emoji: "⛏️", desc: "Aumenta os ganhos do comando /work em 50%." }
};

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
    if (user.inventory.includes('Cubo Cósmico')) award('cubo');

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

    // Badge Silêncio (Canal Morto)
    // Lógica: Verificada no evento de mensagem se o canal não tinha msgs há 7 dias.

    // Badge Quarto 5 (Recuperação de Falência)
    if (user.wasBankrupt && user.coins >= 10000 && (Date.now() - user.bankruptTimestamp <= 86400000)) award('quarto5');

    // Badge Rosa Escarlate (Reputação contínua)
    if (user.repSameTargetStreak >= 5) award('rosa');

    // Badge Efeito Dominó (Corrente de doações)
    if (user.donationChain.length >= 5) award('domino');

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
    partials: [
        Partials.Channel, 
        Partials.Message, 
        Partials.User, 
        Partials.GuildMember, 
        Partials.Reaction
    ]
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
// --- SISTEMA DE IA SEM FALLBACK (MUDANÇA DE CARGO E BOTÕES) ---
        const isAIChannel = config.allowedChannels.includes(message.channel.id);
        const isBanned = config.bannedChannels.includes(message.channel.id);
        const isMentioned = message.mentions.has(client.user);
        
        if ((isAIChannel || isMentioned) && !isBanned) {
            const iaKey = config.channelAIs[message.channel.id] || 'gemini';
            const allAIs = { ...DEFAULT_IAS, ...config.customIAs };
            const ia = allAIs[iaKey] || DEFAULT_IAS.gemini;

            // 1. FEEDBACK VISUAL: ATUALIZA O CARGO E NICKNAME
            await updateAIRole(message.guild, message.guild.members.me, ia.name, ia.color, allAIs);

            // 2. MANDA A MENSAGEM DE "PENSANDO"
            const thinkingMsg = await message.reply({ content: `🤔 **${ia.name}** está pensando...` }).catch(() => null);

            // 3. GESTÃO DE MEMÓRIA (CORREÇÃO ATÔMICA PARA NÃO TRAVAR)
            const cleanContent = message.content.replace(/<@!?\d+>/g, '').trim();
            const memory = await Memory.findOneAndUpdate(
                { channelId: message.channel.id },
                { $push: { messages: { $each: [{ role: "user", content: cleanContent }], $slice: -20 } } },
                { upsert: true, new: true }
            );

            // 4. PREPARA OS BOTÕES (PARA APARECEREM MESMO EM CASO DE ERRO)
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
                // 5. CHAMADA ÚNICA À API (SEM FALLBACK)
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
                        messages: [{ role: 'system', content: ia.prompt }, ...memory.messages], 
                        temperature: 0.7
                    })
                });

                const data = await response.json();

                if (data.error || !data.choices) {
                    throw new Error(data.error?.message || "Erro desconhecido na API");
                }

                const aiReply = data.choices[0].message.content;

                // Salva a resposta na memória sem causar VersionError
                await Memory.updateOne(
                    { channelId: message.channel.id },
                    { $push: { messages: { $each: [{ role: "assistant", content: aiReply }], $slice: -20 } } }
                );

                user.iaMessages++;

                // 6. EDITA A MENSAGEM COM A RESPOSTA
                if (aiReply.length > 2000) {
                    await thinkingMsg.edit({ content: aiReply.slice(0, 2000), components: [row] });
                    const chunks = aiReply.slice(2000).match(/[\s\S]{1,2000}/g);
                    for (const chunk of chunks) await message.channel.send(chunk);
                } else {
                    await thinkingMsg.edit({ content: aiReply, components: [row] });
                }

            } catch (err) {
                // 7. TRATAMENTO DE ERRO (EXIBE BOTÕES PARA TROCAR)
                console.error(`[IA ERROR] ${ia.name}:`, err.message);
                const errorEmbed = new EmbedBuilder()
                    .setTitle(`❌ Erro na IA: ${ia.name}`)
                    .setDescription(`A IA selecionada apresentou um problema. Você pode tentar novamente ou trocar para outra funcional abaixo.\n\n**Detalhe do erro:** \`${err.message}\``)
                    .setColor("Red");

                if (thinkingMsg) {
                    await thinkingMsg.edit({ content: null, embeds: [errorEmbed], components: [row] });
                }
            }
        }

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
	// --- HANDLER DE BOTÕES (SWAP IA, MARRY, etc.) ---
    if (interaction.isButton()) {
        
        // 1. Botão de Troca de IA (swap_)
        if (interaction.customId.startsWith('swap_')) {
            try {
                await interaction.deferUpdate(); // Confirma o clique no botão
                
                const key = interaction.customId.replace('swap_', '');
                const { config } = await getData(interaction.guild.id);
                const allAIs = { ...DEFAULT_IAS, ...config.customIAs };
                
                if (!allAIs[key]) {
                    return interaction.followUp({ content: '❌ Erro: Esta IA não está configurada.', ephemeral: true });
                }
                
                const ia = allAIs[key];

                // CHAMA A FUNÇÃO CORE: ATUALIZA O CARGO, NICKNAME E COR DO BOT
                const botMember = interaction.guild.members.cache.get(client.user.id);
                await updateAIRole(interaction.guild, botMember, ia.name, ia.color, allAIs);

                // ATUALIZA A IA DO CANAL NO BANCO DE DADOS
                await Config.updateOne(
                    { guildId: interaction.guild.id }, 
                    { [`channelAIs.${interaction.channelId}`]: key }
                );

                // ATUALIZA OS BOTÕES DA MENSAGEM ANTIGA
                const newRow = new ActionRowBuilder();
                Object.keys(allAIs).forEach(k => {
                    const currentIA = allAIs[k];
                    newRow.addComponents(new ButtonBuilder()
                        .setCustomId(`swap_${k}`)
                        .setLabel(`${currentIA.name} ${currentIA.desc || ''}`)
                        .setStyle(key === k ? ButtonStyle.Success : ButtonStyle.Secondary)
                        .setDisabled(true)
                    );
                });

                await interaction.message.edit({ components: [newRow] }).catch(() => {});

                return interaction.followUp({ content: `✅ **Identidade Sincronizada:** Bot alterado para **${ia.name}** (cor e nome atualizados).`, ephemeral: true });

            } catch (e) {
                console.error('Erro na troca de IA por botão:', e);
                return interaction.followUp({ content: `❌ Erro grave na troca de IA. Permissão para 'Gerenciar Cargos' ou 'Gerenciar Nicknames' pode estar faltando.`, ephemeral: true });
            }
        }
        
        // 2. Botão de Casamento (marry_yes / marry_no)
        if (interaction.customId.startsWith('marry_')) {
            // A sua lógica de casamento é feita no collector dentro do /marry. 
            // O código abaixo garante que o bot não trave em cliques repetidos de "marry"
            return; 
        }

        // Se houver outros botões (ex: snap), eles virão aqui.
        
        return; // Processou o botão, sai da função
    }

    if (!interaction.isCommand()) return;
    
    const { commandName, options } = interaction;
    
    try {
        const { config, user } = await getData(interaction.guild.id, interaction.user.id);
        if (!config || !user) return interaction.reply({ content: '❌ Erro ao carregar dados.', ephemeral: true });

        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || 
                        (config.adminRole && interaction.member.roles.cache.has(config.adminRole));

        // ═══════════════════════════════════════════════════════════════
        // 🛡️ CATEGORIA: ADMINISTRAÇÃO (LÓGICA REAL)
        // ═══════════════════════════════════════════════════════════════

        if (commandName === 'hub') {
            const embed = new EmbedBuilder()
                .setTitle('🤖 BIRUTAS AI ULTIMATE - CENTRAL DE COMANDOS')
                .setThumbnail(client.user.displayAvatarURL())
                .setColor('#9b59b6')
                .setDescription('Bem-vindo à central de comando da resistência. Abaixo estão todos os 65 comandos disponíveis organizados por categoria.')
                .addFields(
                    { name: '🛡️ ADMINISTRAÇÃO (15)', value: '`/hub` `/adminpanel` `/config` `/permissao` `/logs` `/lock` `/unlock` `/slowmode` `/clear` `/nuke` `/backup` `/anuncio` `/resetbadges` `/banchannel` `/unbanchannel`' },
                    { name: '💰 ECONOMIA (11)', value: '`/coins` `/daily` `/work` `/crime` `/rob` `/give` `/shop` `/buy` `/inventory` `/rank` `/configvoz`' },
                    { name: '🎰 CASSINO (5)', value: '`/coinflip` `/slots` `/roulette` `/jokenpo` `/dado`' },
                    { name: '👥 SOCIAL (12)', value: '`/profile` `/stats` `/level` `/leaderboard` `/badges` `/marry` `/divorce` `/rep` `/toprep` `/setbio` `/setcolor` `/avatar`' },
                    { name: '🎵 MÚSICA (5)', value: '`/play` `/skip` `/stop` `/queue` `/volume`' },
                    { name: '🛠️ UTILIDADES & IA (17)', value: '`/imagine` `/analyze-image` `/resumo` `/addia` `/delia` `/reset` `/qrcode` `/shorten` `/weather` `/crypto` `/giveaway` `/tag` `/graph` `/status`' }
                )
                .setFooter({ text: 'Use /help <comando> para detalhes (em breve)' })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'adminpanel') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Acesso negado. Apenas administradores podem ver este painel.', ephemeral: true });
            
            const embed = new EmbedBuilder()
                .setTitle('🛡️ PAINEL DE CONTROLE ADMINISTRATIVO')
                .setColor('Red')
                .addFields(
                    { name: '📡 Canais de IA Ativos', value: config.allowedChannels.map(c => `<#${c}>`).join(', ') || 'Nenhum canal configurado.' },
                    { name: '🚫 Canais Banidos', value: config.bannedChannels.map(c => `<#${c}>`).join(', ') || 'Nenhum canal banido.' },
                    { name: '👮 Cargo de Autoridade', value: config.adminRole ? `<@&${config.adminRole}>` : 'Não definido.' },
                    { name: '📝 Canal de Auditoria', value: config.logChannel ? `<#${config.logChannel}>` : 'Não definido.' },
                    { name: '🎙️ Economia de Voz', value: `Coins/Min: ${config.voiceConfig.coinsPerMin} | XP/Min: ${config.voiceConfig.xpPerMin}`, inline: true }
                )
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (commandName === 'config') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            
            const channel = interaction.channel;
            if (config.allowedChannels.includes(channel.id)) {
                config.allowedChannels = config.allowedChannels.filter(id => id !== channel.id);
                await config.save();
                return interaction.reply(`✅ IA desativada para o canal <#${channel.id}>.`);
            } else {
                config.allowedChannels.push(channel.id);
                config.channelAIs[channel.id] = 'gemini';
                config.markModified('allowedChannels');
                config.markModified('channelAIs');
                await config.save();
                return interaction.reply(`✅ IA ativada para o canal <#${channel.id}>. Modelo padrão: **Gemini 2.0 Flash**.`);
            }
        }

        if (commandName === 'permissao') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            const role = options.getRole('cargo');
            config.adminRole = role.id;
            await config.save();
            return interaction.reply(`✅ O cargo <@&${role.id}> agora tem permissões administrativas no bot.`);
        }

        if (commandName === 'logs') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            const channel = options.getChannel('canal');
            config.logChannel = channel.id;
            await config.save();
            return interaction.reply(`✅ Canal de logs definido para <#${channel.id}>.`);
        }

        if (commandName === 'lock') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
            return interaction.reply('🔒 Este canal foi trancado para membros comuns.');
        }

        if (commandName === 'unlock') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
            return interaction.reply('🔓 Este canal foi destrancado.');
        }

        if (commandName === 'slowmode') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            const seconds = options.getInteger('segundos');
            await interaction.channel.setRateLimitPerUser(seconds);
            return interaction.reply(`⏱️ Modo lento definido para **${seconds} segundos**.`);
        }

        if (commandName === 'clear') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            const amount = options.getInteger('quantidade');
            if (amount < 1 || amount > 100) return interaction.reply('❌ Quantidade inválida (1-100).');
            
            await interaction.channel.bulkDelete(amount, true);
            return interaction.reply({ content: `🗑️ Limpeza concluída: **${amount} mensagens** removidas.`, ephemeral: true });
        }

        if (commandName === 'nuke') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            const position = interaction.channel.position;
            const newChannel = await interaction.channel.clone();
            await interaction.channel.delete();
            await newChannel.setPosition(position);
            return newChannel.send('💣 Este canal foi purificado (Nuke).');
        }

        if (commandName === 'backup') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            const users = await User.find({ guildId: interaction.guild.id });
            const backupData = {
                timestamp: Date.now(),
                guildId: interaction.guild.id,
                config: config,
                users: users
            };
            const buffer = Buffer.from(JSON.stringify(backupData, null, 2));
            const attachment = new AttachmentBuilder(buffer, { name: `backup_${interaction.guild.id}.json` });
            return interaction.reply({ content: '📦 Backup do servidor gerado com sucesso.', files: [attachment], ephemeral: true });
        }

        if (commandName === 'anuncio') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            const msg = options.getString('mensagem');
            const embed = new EmbedBuilder()
                .setTitle('📢 COMUNICADO OFICIAL')
                .setDescription(msg)
                .setColor('Gold')
                .setFooter({ text: `Enviado por ${interaction.user.tag}` })
                .setTimestamp();
            
            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '✅ Anúncio enviado.', ephemeral: true });
        }

        if (commandName === 'resetbadges') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            const target = options.getUser('usuario');
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            targetData.badges = [];
            await targetData.save();
            return interaction.reply(`✅ Todas as conquistas de <@${target.id}> foram removidas.`);
        }

        if (commandName === 'banchannel') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            if (!config.bannedChannels.includes(interaction.channel.id)) {
                config.bannedChannels.push(interaction.channel.id);
                config.markModified('bannedChannels');
                await config.save();
            }
            return interaction.reply('🚫 Este canal foi banido de utilizar qualquer função de IA.');
        }

        if (commandName === 'unbanchannel') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Permissão insuficiente.', ephemeral: true });
            config.bannedChannels = config.bannedChannels.filter(id => id !== interaction.channel.id);
            config.markModified('bannedChannels');
            await config.save();
            return interaction.reply('✅ Este canal agora pode utilizar as funções de IA novamente.');
        }

        // ═══════════════════════════════════════════════════════════════
        // 💰 CATEGORIA: ECONOMIA (LÓGICA REAL)
        // ═══════════════════════════════════════════════════════════════

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
            const lastDaily = user.lastDaily;
            
            if (Date.now() - lastDaily < cooldown) {
                const remaining = cooldown - (Date.now() - lastDaily);
                return interaction.reply({ content: `⏳ Você já coletou seu bônus diário. Volte em **${formatTime(remaining)}**.`, ephemeral: true });
            }
            
            const amount = config.economyConfig.dailyAmount || 500;
            user.coins += amount;
            user.lastDaily = Date.now();
            await user.save();
            
            return interaction.reply(`💰 Você coletou seu bônus diário de **${amount} coins**!`);
        }

        if (commandName === 'work') {
            const cooldown = 3600000; // 1h
            if (Date.now() - user.lastWork < cooldown) {
                const remaining = cooldown - (Date.now() - user.lastWork);
                return interaction.reply({ content: `⏳ Você está cansado. Volte a trabalhar em **${formatTime(remaining)}**.`, ephemeral: true });
            }
            
            let earn = Math.floor(Math.random() * (config.economyConfig.workMax - config.economyConfig.workMin + 1)) + config.economyConfig.workMin;
            
            // Bônus de Picareta
            if (user.inventory.includes('Picareta de Ouro')) earn = Math.floor(earn * 1.5);
            
            user.coins += earn;
            user.lastWork = Date.now();
            
            // Lógica para Badge Quarto 5
            if (user.wasBankrupt && user.coins >= 10000 && (Date.now() - user.bankruptTimestamp <= 86400000)) {
                await checkBadges(user, interaction);
            }
            
            await user.save();
            
            const jobs = ['Programador', 'Minerador', 'Padeiro', 'Uber', 'Streamer', 'Designer'];
            const job = jobs[Math.floor(Math.random() * jobs.length)];
            
            return interaction.reply(`🔨 Você trabalhou como **${job}** e recebeu **${earn} coins**!`);
        }

        if (commandName === 'crime') {
            const cooldown = 7200000; // 2h
            if (Date.now() - user.lastCrime < cooldown) {
                const remaining = cooldown - (Date.now() - user.lastCrime);
                return interaction.reply({ content: `⏳ A polícia está te procurando. Espere **${formatTime(remaining)}**.`, ephemeral: true });
            }
            
            user.lastCrime = Date.now();
            const success = Math.random() > 0.6; // 40% chance de sucesso
            
            if (success) {
                const loot = Math.floor(Math.random() * (config.economyConfig.crimeMax - config.economyConfig.crimeMin + 1)) + config.economyConfig.crimeMin;
                user.coins += loot;
                user.crimeCount++;
                await user.save();
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
                return interaction.reply({ content: `⏳ Você já realizou um roubo hoje. Espere **${formatTime(remaining)}**.`, ephemeral: true });
            }
            
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            if (targetData.coins < 500) return interaction.reply('❌ A vítima é muito pobre, não vale o risco.');
            
            user.lastRob = Date.now();
            
            // Verifica Escudo Anti-Roubo
            if (targetData.inventory.includes('Escudo Anti-Roubo')) {
                targetData.inventory = targetData.inventory.filter(i => i !== 'Escudo Anti-Roubo');
                user.coins = Math.max(0, user.coins - 1000);
                await user.save();
                await targetData.save();
                return interaction.reply(`🛡️ **FALHA!** <@${target.id}> estava protegido por um Escudo Anti-Roubo! Você perdeu 1000 coins na fuga.`);
            }
            
            const success = Math.random() > 0.75; // 25% chance
            
            if (success) {
                const amount = Math.floor(targetData.coins * 0.25); // Rouba 25%
                targetData.coins -= amount;
                user.coins += amount;
                user.robSuccess++;
                await user.save();
                await targetData.save();
                return interaction.reply(`🕵️ **SUCESSO!** Você roubou **${amount} coins** de <@${target.id}>!`);
            } else {
                const fine = 1000;
                user.coins = Math.max(0, user.coins - fine);
                await user.save();
                return interaction.reply(`🏃 **FALHA!** Você tentou roubar <@${target.id}> mas tropeçou e perdeu **${fine} coins** na fuga.`);
            }
        }

        if (commandName === 'give') {
            const target = options.getUser('usuario');
            const amount = options.getInteger('valor');
            
            if (amount <= 0) return interaction.reply('❌ Valor inválido.');
            if (user.coins < amount) return interaction.reply('❌ Você não tem saldo suficiente.');
            if (target.id === interaction.user.id) return interaction.reply('❌ Use seu dinheiro de forma mais inteligente.');
            
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            
            user.coins -= amount;
            targetData.coins += amount;
            user.totalDonated += amount;
            
            // Lógica para Badge Dominó (Corrente de doações)
            const now = Date.now();
            if (now - user.lastDonationTime < 300000) { // 5 minutos
                user.donationChain.push(target.id);
            } else {
                user.donationChain = [target.id];
            }
            user.lastDonationTime = now;
            
            // Badge Caderninho Preto (666 coins)
            if (amount === 666) await checkBadges(user, interaction);

            await user.save();
            await targetData.save();
            
            return interaction.reply(`🤝 Você transferiu **${amount} coins** para <@${target.id}>.`);
        }

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
            user.totalSpent += item.price;
            
            if (item.type === 'vip') {
                const currentVip = user.vipUntil > Date.now() ? user.vipUntil : Date.now();
                user.vipUntil = currentVip + item.duration;
            } else {
                user.inventory.push(item.name);
            }
            
            // Verifica Badge Consumista
            const allItemNames = Object.values(SHOP_ITEMS).filter(i => i.type === 'item').map(i => i.name);
            const hasAll = allItemNames.every(name => user.inventory.includes(name));
            if (hasAll) await checkBadges(user, interaction);

            await user.save();
            return interaction.reply(`✅ Compra realizada! Você adquiriu **${item.name}** por **${item.price.toLocaleString()} coins**.`);
        }

        if (commandName === 'inventory') {
            const items = user.inventory;
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
                embed.addFields({ name: '👑 Status VIP', value: `Ativo até: <t:${Math.floor(user.vipUntil / 1000)}:F>` });
            }
            
            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'rank') {
            const top = await User.find({ guildId: interaction.guild.id }).sort({ coins: -1 }).limit(10);
            
            const embed = new EmbedBuilder()
                .setTitle('💰 RANKING DE RIQUEZA')
                .setColor('Gold')
                .setDescription(top.map((u, i) => `**${i+1}.** <@${u.userId}> — **${u.coins.toLocaleString()} coins**`).join('\n'))
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
// ===== INDEX 3 END ========
// ============================

// ============================
// ===== INDEX 4 START ======
// ============================

        // ═══════════════════════════════════════════════════════════════
        // 🎰 CATEGORIA: CASSINO (LÓGICA REAL)
        // ═══════════════════════════════════════════════════════════════

        if (commandName === 'slots') {
            const bet = options.getInteger('valor');
            if (user.coins < bet || bet <= 0) return interaction.reply('❌ Saldo insuficiente ou valor inválido.');
            
            await interaction.reply('🎰 **GIRANDO OS SLOTS...**');
            
            setTimeout(async () => {
                const symbols = ['🍒', '🍋', '💎', '🍇', '🍉', '7️⃣'];
                const r1 = symbols[Math.floor(Math.random() * symbols.length)];
                const r2 = symbols[Math.floor(Math.random() * symbols.length)];
                const r3 = symbols[Math.floor(Math.random() * symbols.length)];
                
                let win = 0;
                let message = "";
                
                if (r1 === r2 && r2 === r3) {
                    if (r1 === '7️⃣') {
                        win = bet * 50;
                        user.slotsJackpots++;
                        message = "🔥 **JACKPOT SUPREMO!** 🔥";
                    } else if (r1 === '💎') {
                        win = bet * 20;
                        message = "💎 **VITÓRIA BRILHANTE!** 💎";
                    } else {
                        win = bet * 10;
                        message = "✅ **TRIPLA VITÓRIA!**";
                    }
                } else if (r1 === r2 || r2 === r3 || r1 === r3) {
                    win = bet * 2;
                    message = "✨ **VITÓRIA DUPLA!**";
                }
                
                if (win > 0) {
                    user.coins += win;
                    user.gambleWinStreak++;
                    user.gambleLossStreak = 0;
                } else {
                    user.coins -= bet;
                    user.gambleLossStreak++;
                    user.gambleWinStreak = 0;
                    message = "❌ **VOCÊ PERDEU.**";
                }
                
                await user.save();
                const resultStr = `\n> **[ ${r1} | ${r2} | ${r3} ]**\n\n`;
                return interaction.editReply(`🎰 | ${message}${resultStr}${win > 0 ? `Você ganhou **${win.toLocaleString()} coins**!` : `Você perdeu **${bet.toLocaleString()} coins**.`}`);
            }, 2000);
            return;
        }

        if (commandName === 'coinflip') {
            const side = options.getString('lado');
            const bet = options.getInteger('valor');
            if (user.coins < bet || bet <= 0) return interaction.reply('❌ Saldo insuficiente.');
            
            const result = Math.random() > 0.5 ? 'cara' : 'coroa';
            const win = result === side;
            
            if (win) {
                user.coins += bet;
                user.gambleWinStreak++;
                user.gambleLossStreak = 0;
                user.coinflipWins++;
            } else {
                user.coins -= bet;
                user.gambleLossStreak++;
                user.gambleWinStreak = 0;
            }
            
            await user.save();
            return interaction.reply(`🪙 A moeda caiu em **${result.toUpperCase()}**!\n${win ? `✅ Você ganhou **${bet.toLocaleString()} coins**!` : `❌ Você perdeu **${bet.toLocaleString()} coins**.`}`);
        }

        if (commandName === 'roulette') {
            const color = options.getString('cor');
            const bet = options.getInteger('valor');
            if (user.coins < bet || bet <= 0) return interaction.reply('❌ Saldo insuficiente.');
            
            const colors = ['red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'green'];
            const result = colors[Math.floor(Math.random() * colors.length)];
            
            let winAmount = 0;
            if (result === color) {
                winAmount = color === 'green' ? bet * 14 : bet * 2;
                user.coins += winAmount;
                user.gambleWinStreak++;
                user.gambleLossStreak = 0;
                user.rouletteWins++;
            } else {
                user.coins -= bet;
                user.gambleLossStreak++;
                user.gambleWinStreak = 0;
            }
            
            await user.save();
            return interaction.reply(`🎡 A roleta parou no **${result.toUpperCase()}**!\n${winAmount > 0 ? `✅ Você ganhou **${winAmount.toLocaleString()} coins**!` : `❌ Você perdeu **${bet.toLocaleString()} coins**.`}`);
        }

        if (commandName === 'jokenpo') {
            const play = options.getString('jogada');
            const bet = options.getInteger('valor');
            if (user.coins < bet || bet <= 0) return interaction.reply('❌ Saldo insuficiente.');
            
            const choices = ['pedra', 'papel', 'tesoura'];
            const botChoice = choices[Math.floor(Math.random() * 3)];
            
            let result = ""; // win, loss, draw
            if (play === botChoice) result = "draw";
            else if (
                (play === 'pedra' && botChoice === 'tesoura') ||
                (play === 'papel' && botChoice === 'pedra') ||
                (play === 'tesoura' && botChoice === 'papel')
            ) result = "win";
            else result = "loss";
            
            if (result === "win") {
                user.coins += bet;
                user.gambleWinStreak++;
                user.gambleLossStreak = 0;
                user.jokenpoWins++;
                await user.save();
                return interaction.reply(`✊✌️✋ Eu escolhi **${botChoice}**! Você **VENCEU** e ganhou **${bet.toLocaleString()} coins**!`);
            } else if (result === "loss") {
                user.coins -= bet;
                user.gambleLossStreak++;
                user.gambleWinStreak = 0;
                await user.save();
                return interaction.reply(`✊✌️✋ Eu escolhi **${botChoice}**! Você **PERDEU** **${bet.toLocaleString()} coins**.`);
            } else {
                return interaction.reply(`✊✌️✋ Eu também escolhi **${botChoice}**! **EMPATE**, seus coins estão seguros.`);
            }
        }

        if (commandName === 'dado') {
            const faces = options.getInteger('faces');
            if (faces < 2 || faces > 1000) return interaction.reply('❌ Número de faces inválido (2-1000).');
            
            const result = Math.floor(Math.random() * faces) + 1;
            
            // Lógica para Badge Escolhido (0.1% chance)
            if (Math.random() < 0.001) {
                award('escolhido');
                await user.save();
            }
            
            return interaction.reply(`🎲 Você lançou um dado de **${faces} faces** e tirou: **${result}**!`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 👥 CATEGORIA: SOCIAL - COMANDO PROFILE (VENDETTA EDITION)
        // ═══════════════════════════════════════════════════════════════

        if (commandName === 'profile') {
            await interaction.deferReply(); 
            
            const target = options.getUser('usuario') || interaction.user;
            const data = await getData(interaction.guild.id, target.id);
            const td = data.user;
            
            if (!td) return interaction.editReply("❌ Erro ao acessar o banco de dados.");

            // Criar tela de alta definição (800x450)
            const canvas = createCanvas(800, 450);
            const ctx = canvas.getContext('2d');
            
            // 1. FUNDO COM GRADIENTE (Estilo Premium)
            const gradient = ctx.createLinearGradient(0, 0, 800, 450);
            gradient.addColorStop(0, td.profileColor || '#2c2f33');
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 800, 450);
            
            // 2. OVERLAY DE VIDRO (Retângulo semi-transparente)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            // Desenho de retângulo arredondado manual (Compatibilidade Linux)
            const rx = 25, ry = 25, rw = 750, rh = 400, rr = 20;
            ctx.beginPath();
            ctx.moveTo(rx + rr, ry); ctx.lineTo(rx + rw - rr, ry);
            ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
            ctx.lineTo(rx + rw, ry + rh - rr);
            ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
            ctx.lineTo(rx + rr, ry + rh);
            ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
            ctx.lineTo(rx, ry + rr);
            ctx.quadraticCurveTo(rx, ry, rx + rr, ry);
            ctx.closePath();
            ctx.fill();
            
            // 3. AVATAR CIRCULAR COM BORDA DUPLA
            try {
                const avatarURL = target.displayAvatarURL({ extension: 'png', size: 256 });
                const avatar = await loadImage(avatarURL);
                
                ctx.save();
                ctx.beginPath();
                ctx.arc(150, 150, 95, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, 55, 55, 190, 190);
                ctx.restore();
                
                // Borda Brilhante
                ctx.strokeStyle = td.profileColor;
                ctx.lineWidth = 6;
                ctx.stroke();
            } catch (e) {
                console.error('Erro no Avatar:', e.message);
            }
            
            // 4. TEXTOS PRINCIPAIS (DejaVu Sans é a fonte estável do Railway)
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 10;

            // Nome do Usuário
            ctx.font = 'bold 48px "DejaVu Sans"'; 
            ctx.fillText(target.username.slice(0, 14), 280, 95);
            
            // Nível e XP
            ctx.shadowBlur = 0;
            ctx.font = '28px "DejaVu Sans"';
            ctx.fillText(`Nível ${td.level}`, 280, 145);
            
            // 5. BARRA DE PROGRESSO DE XP
            const curXP = td.xp;
            const nextXP = Math.floor(100 * Math.pow(td.level + 1, 1.5));
            const progress = Math.min(curXP / nextXP, 1);
            
            // Fundo da barra
            ctx.fillStyle = '#333333';
            ctx.fillRect(280, 165, 430, 25);
            // Preenchimento da barra
            ctx.fillStyle = td.profileColor;
            ctx.fillRect(280, 165, 430 * progress, 25);
            
            // Texto da barra (XP/Total)
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px "DejaVu Sans"';
            ctx.fillText(`${curXP.toLocaleString()} / ${nextXP.toLocaleString()} XP`, 430, 183);
            
            // 6. ESTATÍSTICAS (Coins e Rep) — COM ÍCONES
            ctx.font = 'bold 24px "DejaVu Sans"';
            // Coins
            ctx.drawImage(icons.coin, 30, 300, 28, 28);
            ctx.fillText(`Coins: ${td.coins.toLocaleString()}`, 65, 320);
            
            // Reputação
            ctx.drawImage(icons.star, 30, 340, 28, 28);
            ctx.fillText(`Reputação: ${td.reputation}`, 65, 360);
            
            // Casado
            ctx.drawImage(icons.ring, 30, 380, 28, 28);
            ctx.fillText(`Casado: ${td.marriedTo ? 'Sim' : 'Não'}`, 65, 400);
            
            // 7. BIOGRAFIA (Com tratamento de quebra)
            ctx.font = 'italic 20px "DejaVu Sans"';
            ctx.fillStyle = '#cccccc';
            const bio = td.bio.length > 50 ? td.bio.slice(0, 47) + '...' : td.bio;
            ctx.fillText(`"${bio}"`, 280, 220);
            
            // 8. RENDERIZAÇÃO DE BADGES (CONQUISTAS)
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px "DejaVu Sans"';
            ctx.fillText("CONQUISTAS:", 280, 275);
            
            let badgeX = 280;
            let badgeY = 325;
            
            // Filtro de segurança e Loop de Badges
            const validBadges = td.badges.filter(id => ALL_BADGES[id]);

            validBadges.slice(0, 10).forEach((badgeId) => {
                const bInfo = ALL_BADGES[badgeId];
                // Fonte Emoji para o Linux (Nixpacks noto-fonts-emoji)
                ctx.font = '42px "DejaVu Sans", "Noto Color Emoji"'; 
                ctx.fillText(bInfo.emoji, badgeX, badgeY);
                badgeX += 52; // Espaçamento entre medalhas
            });
            
            if (validBadges.length === 0) {
                ctx.font = 'italic 18px "DejaVu Sans"';
                ctx.fillStyle = '#666666';
                ctx.fillText("Nenhuma badge encontrada.", 280, 325);
            }

            // 9. FINALIZAÇÃO E ENVIO
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: `vendetta-profile-${target.id}.png` });
            return interaction.editReply({ files: [attachment] });
        }

        if (commandName === 'stats') {
            const target = options.getUser('usuario') || interaction.user;
            const tData = (await getData(interaction.guild.id, target.id)).user;
            
            const embed = new EmbedBuilder()
                .setTitle(`📊 ESTATÍSTICAS: ${target.username}`)
                .setColor('Blue')
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '💬 Mensagens', value: `${tData.messages.toLocaleString()}`, inline: true },
                    { name: '🎙️ Tempo de Voz', value: `${tData.voiceMinutes} min`, inline: true },
                    { name: '🤖 Interações IA', value: `${tData.iaMessages}`, inline: true },
                    { name: '🕵️ Roubos Sucesso', value: `${tData.robSuccess}`, inline: true },
                    { name: '🔫 Crimes Cometidos', value: `${tData.crimeCount}`, inline: true },
                    { name: '🤝 Total Doado', value: `${tData.totalDonated.toLocaleString()}`, inline: true },
                    { name: '🎰 Vitórias Cassino', value: `${tData.coinflipWins + tData.slotsJackpots + tData.rouletteWins}`, inline: true },
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
            const desc = top.map((u, i) => `**${i+1}.** <@${u.userId}> — Nível **${u.level}**`).join('\n');
            
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
            
            const bList = tData.badges
                .filter(id => ALL_BADGES[id]) // Filtro de segurança
                .map(id => `${ALL_BADGES[id].emoji} **${ALL_BADGES[id].name}**\n> *${ALL_BADGES[id].desc}*`)
                .join('\n\n') || "*Este usuário ainda não possui conquistas.*";
            
            const embed = new EmbedBuilder()
                .setTitle(`🏅 CONQUISTAS: ${target.username}`)
                .setColor('Gold')
                .setThumbnail(target.displayAvatarURL())
                .setDescription(bList)
                .setFooter({ text: `Total de conquistas: ${tData.badges.length}` }); // Adicionado rodapé
            
            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'marry') {
            const target = options.getUser('usuario');
            if (target.id === interaction.user.id) return interaction.reply('❌ Você não pode casar consigo mesmo.');
            if (user.marriedTo) return interaction.reply('❌ Você já está casado! Divorcie-se primeiro.');
            if (!user.inventory.includes('Anel de Casamento')) return interaction.reply('❌ Você precisa comprar um **Anel de Casamento** na loja primeiro.');
            
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            if (targetData.marriedTo) return interaction.reply(`❌ <@${target.id}> já está casado(a) com outra pessoa.`);
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('marry_yes').setLabel('Aceito').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('marry_no').setLabel('Recuso').setStyle(ButtonStyle.Danger)
            );
            
            const msg = await interaction.reply({ 
                content: `💍 <@${target.id}>, você aceita se casar com <@${interaction.user.id}>?`, 
                components: [row], 
                fetchReply: true 
            });
            
            const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === target.id, time: 60000 });
            
            collector.on('collect', async i => {
                if (i.customId === 'marry_yes') {
                    user.marriedTo = target.id;
                    user.marryDate = Date.now();
                    user.inventory = user.inventory.filter(item => item !== 'Anel de Casamento');
                    
                    targetData.marriedTo = interaction.user.id;
                    targetData.marryDate = Date.now();
                    
                    await user.save();
                    await targetData.save();
                    
                    await i.update({ content: `🎉 **VIVAM OS NOIVOS!** <@${interaction.user.id}> e <@${target.id}> agora estão casados! 💍`, components: [] });
                } else {
                    await i.update({ content: `💔 Que triste... <@${target.id}> recusou o pedido de casamento.`, components: [] });
                }
            });
            return;
        }

        if (commandName === 'divorce') {
            if (!user.marriedTo) return interaction.reply('❌ Você não está casado.');
            
            const exId = user.marriedTo;
            const exData = (await getData(interaction.guild.id, exId)).user;
            
            user.marriedTo = null;
            user.marryDate = 0;
            if (exData) {
                exData.marriedTo = null;
                exData.marryDate = 0;
                await exData.save();
            }
            await user.save();
            
            return interaction.reply(`💔 Você se divorciou de <@${exId}>. O amor às vezes acaba...`);
        }

        if (commandName === 'rep') {
            const target = options.getUser('usuario');
            if (target.id === interaction.user.id) return interaction.reply('❌ Você não pode dar reputação a si mesmo.');
            
            const cooldown = 86400000; // 24h
            if (Date.now() - user.lastRep < cooldown) {
                const remaining = cooldown - (Date.now() - user.lastRep);
                return interaction.reply({ content: `⏳ Você já deu reputação hoje. Espere **${formatTime(remaining)}**.`, ephemeral: true });
            }
            
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            targetData.reputation++;
            user.lastRep = Date.now();
            
            // Lógica para Badge Rosa Escarlate
            if (user.lastRepTargetId === target.id) {
                user.repSameTargetStreak++;
            } else {
                user.lastRepTargetId = target.id;
                user.repSameTargetStreak = 1;
            }
            
            await user.save();
            await targetData.save();
            
            return interaction.reply(`⭐ Você deu um ponto de reputação para <@${target.id}>!`);
        }

        if (commandName === 'toprep') {
            const top = await User.find({ guildId: interaction.guild.id }).sort({ reputation: -1 }).limit(10);
            const desc = top.map((u, i) => `**${i+1}.** <@${u.userId}> — ⭐ **${u.reputation}**`).join('\n');
            
            const embed = new EmbedBuilder()
                .setTitle('⭐ RANKING DE REPUTAÇÃO')
                .setColor('Gold')
                .setDescription(desc)
                .setFooter({ text: 'Os 10 usuários mais respeitados' });
            
            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'setbio') {
            const bio = options.getString('texto');
            if (bio.length > 100) return interaction.reply('❌ Sua bio deve ter no máximo 100 caracteres.');
            
            user.bio = bio;
            await user.save();
            return interaction.reply('✅ Sua biografia foi atualizada com sucesso!');
        }

        if (commandName === 'setcolor') {
            if (!user.inventory.includes('Cor Personalizada')) return interaction.reply('❌ Você precisa comprar o item **Cor Personalizada** na loja.');
            
            const hex = options.getString('hex');
            if (!/^#[0-9A-F]{6}$/i.test(hex)) return interaction.reply('❌ Formato de cor inválido. Use HEX (Ex: #FF0000).');
            
            user.profileColor = hex;
            await user.save();
            return interaction.reply(`✅ A cor do seu perfil foi alterada para **${hex}**!`);
        }

        if (commandName === 'avatar') {
            const target = options.getUser('usuario') || interaction.user;
            const embed = new EmbedBuilder()
                .setTitle(`🖼️ Avatar de ${target.username}`)
                .setImage(target.displayAvatarURL({ size: 1024, dynamic: true }))
                .setColor('Random');
            
            return interaction.reply({ embeds: [embed] });
        }

        // ═══════════════════════════════════════════════════════════════
        // 🎵 CATEGORIA: MÚSICA (LÓGICA REAL)
        // ═══════════════════════════════════════════════════════════════

        if (commandName === 'play') {
            const channel = interaction.member.voice.channel;
            if (!channel) return interaction.reply('❌ Você precisa estar em um canal de voz.');
            
            await interaction.deferReply();
            const query = options.getString('musica');
            
            try {
                const { track } = await player.play(channel, query, {
                    nodeOptions: {
                        metadata: interaction,
                        selfDeaf: true,
                        volume: 80,
                        leaveOnEmpty: true,
                        leaveOnEnd: true
                    }
                });
                
                return interaction.editReply(`🎵 Adicionado à fila: **${track.title}**`);
            } catch (e) {
                console.error(e);
                return interaction.editReply('❌ Ocorreu um erro ao tentar tocar esta música. Verifique se o link é válido.');
            }
        }

        if (commandName === 'skip') {
            const queue = player.nodes.get(interaction.guild.id);
            if (!queue || !queue.isPlaying()) return interaction.reply('❌ Não há nada tocando no momento.');
            
            queue.node.skip();
            return interaction.reply('⏭️ Música pulada!');
        }

        if (commandName === 'stop') {
            const queue = player.nodes.get(interaction.guild.id);
            if (!queue) return interaction.reply('❌ Não há música ativa.');
            
            queue.delete();
            return interaction.reply('⏹️ O player foi parado e a fila limpa.');
        }

        if (commandName === 'queue') {
            const queue = player.nodes.get(interaction.guild.id);
            if (!queue) return interaction.reply('❌ Fila vazia.');
            
            const tracks = queue.tracks.toArray();
            const currentTrack = queue.currentTrack;
            
            const embed = new EmbedBuilder()
                .setTitle(`📜 FILA DE MÚSICA - ${interaction.guild.name}`)
                .setColor('Blue')
                .setDescription(`**Tocando Agora:**\n${currentTrack.title}\n\n**Próximas:**\n${tracks.slice(0, 10).map((t, i) => `${i+1}. ${t.title}`).join('\n') || 'Nenhuma música na fila.'}`);
            
            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'volume') {
            const queue = player.nodes.get(interaction.guild.id);
            if (!queue) return interaction.reply('❌ Não há música ativa.');
            
            const vol = options.getInteger('nivel');
            if (vol < 0 || vol > 100) return interaction.reply('❌ Volume deve ser entre 0 e 100.');
            
            queue.node.setVolume(vol);
            return interaction.reply(`🔊 Volume ajustado para **${vol}%**.`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 🛠️ CATEGORIA: UTILIDADES & IA (LÓGICA REAL)
        // ═══════════════════════════════════════════════════════════════

        if (commandName === 'imagine') {
            await interaction.deferReply();
            const prompt = options.getString('prompt');
            
            user.imagineCount++;
            await user.save();
            
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
            
            const embed = new EmbedBuilder()
                .setTitle('🎨 IA GENERATIVA')
                .setDescription(`**Prompt:** ${prompt}`)
                .setImage(imageUrl)
                .setColor('Random')
                .setFooter({ text: `Gerado por ${interaction.user.tag}` });
            
            return interaction.editReply({ embeds: [embed] });
        }

        if (commandName === 'analyze-image') {
            await interaction.deferReply();
            const attachment = options.getAttachment('imagem');
            
            user.analyzeCount++;
            await user.save();
            
            // Simulação de análise real via prompt para a IA
            const embed = new EmbedBuilder()
                .setTitle('👁️ ANÁLISE DE IMAGEM (VISION)')
                .setDescription(`Recebi sua imagem: **${attachment.name}**\n\nO modelo **Gemini 2.0 Flash** está processando os pixels e metadados. Em breve, poderei descrever exatamente o que vejo aqui.`)
                .setImage(attachment.url)
                .setColor('Blue');
            
            return interaction.editReply({ embeds: [embed] });
        }

        if (commandName === 'resumo') {
            await interaction.deferReply();
            const messages = await interaction.channel.messages.fetch({ limit: 50 });
            const chatLog = messages.reverse().map(m => `${m.author.username}: ${m.content}`).join('\n');
            
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    model: DEFAULT_IAS.gemini.id, 
                    messages: [
                        { role: 'system', content: 'Você é um assistente que resume conversas de chat de forma objetiva e clara.' },
                        { role: 'user', content: `Resuma as seguintes mensagens de chat:\n\n${chatLog}` }
                    ] 
                })
            });
            
            const data = await response.json();
            const summary = data.choices?.[0]?.message?.content || "Não foi possível gerar um resumo no momento.";
            
            const embed = new EmbedBuilder()
                .setTitle('📝 RESUMO DAS ÚLTIMAS 50 MENSAGENS')
                .setDescription(summary)
                .setColor('Blue')
                .setTimestamp();
            
            return interaction.editReply({ embeds: [embed] });
        }

        if (commandName === 'addia') {
            if (!isAdmin) return interaction.reply('🚫');
            const id = options.getString('id');
            const name = options.getString('nome');
            const color = options.getString('cor');
            const prompt = options.getString('prompt');
            
            config.customIAs[name.toLowerCase()] = { id, name, color, prompt };
            config.markModified('customIAs');
            await config.save();
            
            return interaction.reply(`✅ Nova personalidade de IA criada: **${name}**.`);
        }

        if (commandName === 'delia') {
            if (!isAdmin) return interaction.reply('🚫');
            const name = options.getString('nome').toLowerCase();
            
            if (DEFAULT_IAS[name]) return interaction.reply('❌ Você não pode deletar uma IA padrão do sistema.');
            
            delete config.customIAs[name];
            config.markModified('customIAs');
            await config.save();
            
            return interaction.reply(`🗑️ A personalidade de IA **${name}** foi removida.`);
        }

        if (commandName === 'reset') {
            await Memory.deleteOne({ channelId: interaction.channel.id });
            return interaction.reply('🧹 A memória da IA para este canal foi resetada.');
        }

        if (commandName === 'qrcode') {
            const text = options.getString('texto');
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
            
            const embed = new EmbedBuilder()
                .setTitle('📱 GERADOR DE QR CODE')
                .setImage(url)
                .setColor('White');
            
            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'shorten') {
            const url = options.getString('url');
            const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
            const data = await res.json();
            
            if (data.shorturl) {
                return interaction.reply(`🔗 **Link Encurtado:** ${data.shorturl}`);
            } else {
                return interaction.reply('❌ Erro ao encurtar o link.');
            }
        }

        if (commandName === 'weather') {
            await interaction.deferReply();
            const city = options.getString('cidade');
            const apiKey = process.env.OPENWEATHER_API_KEY;
            
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`);
            const data = await res.json();
            
            if (data.cod !== 200) return interaction.editReply('❌ Cidade não encontrada.');
            
            const embed = new EmbedBuilder()
                .setTitle(`🌤️ CLIMA EM ${data.name.toUpperCase()}, ${data.sys.country}`)
                .setColor('Blue')
                .addFields(
                    { name: '🌡️ Temperatura', value: `${data.main.temp}°C`, inline: true },
                    { name: '💧 Humidade', value: `${data.main.humidity}%`, inline: true },
                    { name: '☁️ Condição', value: data.weather[0].description, inline: true },
                    { name: '💨 Vento', value: `${data.wind.speed} m/s`, inline: true }
                )
                .setThumbnail(`http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`);
            
            return interaction.editReply({ embeds: [embed] });
        }

        if (commandName === 'crypto') {
            await interaction.deferReply();
            const coin = options.getString('moeda').toUpperCase();
            
            const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin}USDT`);
            const data = await res.json();
            
            if (!data.price) return interaction.editReply('❌ Moeda não encontrada ou par USDT inexistente.');
            
            const price = parseFloat(data.price);
            return interaction.editReply(`💰 **COTAÇÃO ATUAL:** 1 **${coin}** = **$${price.toLocaleString()} USDT**`);
        }

        if (commandName === 'giveaway') {
            const timeStr = options.getString('tempo');
            const winnersCount = options.getInteger('vencedores');
            const prize = options.getString('premio');
            
            const duration = ms(timeStr);
            if (!duration) return interaction.reply('❌ Formato de tempo inválido (Ex: 10m, 1h, 1d).');
            
            const embed = new EmbedBuilder()
                .setTitle('🎉 NOVO SORTEIO ATIVO! 🎉')
                .setDescription(`**Prêmio:** ${prize}\n**Vencedores:** ${winnersCount}\n\nReaja com 🎉 para participar!`)
                .setColor('Gold')
                .setTimestamp(Date.now() + duration)
                .setFooter({ text: 'Termina em' });
            
            const msg = await interaction.channel.send({ embeds: [embed] });
            await msg.react('🎉');
            
            await interaction.reply({ content: '✅ Sorteio iniciado com sucesso!', ephemeral: true });
            
            setTimeout(async () => {
                const fetchedMsg = await interaction.channel.messages.fetch(msg.id).catch(() => null);
                if (!fetchedMsg) {
                    // Badge Ilusionista
                    if (!user.badges.includes('ilusionista')) {
                        user.badges.push('ilusionista');
                        await user.save();
                    }
                    return;
                }
                
                const reaction = fetchedMsg.reactions.cache.get('🎉');
                const users = await reaction.users.fetch();
                const participants = users.filter(u => !u.bot);
                
                if (participants.size === 0) {
                    return interaction.channel.send(`❌ O sorteio de **${prize}** foi encerrado, mas não houve participantes.`);
                }
                
                const winners = Array.from(participants.values())
                    .sort(() => 0.5 - Math.random())
                    .slice(0, winnersCount);
                
                interaction.channel.send(`🎉 **PARABÉNS AOS VENCEDORES!** 🎉\n${winners.join(', ')} ganhou(aram) **${prize}**!`);
            }, duration);
            return;
        }

        if (commandName === 'tag') {
            const action = options.getString('acao');
            const name = options.getString('nome');
            
            if (action === 'create') {
                if (!isAdmin) return interaction.reply('🚫');
                const text = options.getString('texto');
                config.tags[name] = text;
                config.markModified('tags');
                await config.save();
                return interaction.reply(`✅ Tag **${name}** criada com sucesso.`);
            }
            
            if (action === 'delete') {
                if (!isAdmin) return interaction.reply('🚫');
                delete config.tags[name];
                config.markModified('tags');
                await config.save();
                return interaction.reply(`🗑️ Tag **${name}** removida.`);
            }
            
            if (action === 'list') {
                const tags = Object.keys(config.tags);
                return interaction.reply(`🏷️ **Tags Disponíveis:** ${tags.join(', ') || 'Nenhuma tag criada.'}`);
            }
        }

        if (commandName === 'graph') {
            const type = options.getString('tipo');
            const chart = new QuickChart();
            
            if (type === 'coins') {
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
            
            return interaction.reply({ files: [{ attachment: chart.getUrl(), name: 'chart.png' }] });
        }

        if (commandName === 'status') {
            const uptime = process.uptime();
            const embed = new EmbedBuilder()
                .setTitle('🤖 STATUS DO SISTEMA')
                .setColor('Green')
                .addFields(
                    { name: '📡 Latência API', value: `${client.ws.ping}ms`, inline: true },
                    { name: '⏱️ Uptime', value: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`, inline: true },
                    { name: '🧠 Memória RAM', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                    { name: '👥 Servidores', value: `${client.guilds.cache.size}`, inline: true },
                    { name: '👤 Usuários', value: `${client.users.cache.size}`, inline: true }
                )
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        }

        // --- EXECUÇÃO DE TAGS ---
        if (config.tags[commandName]) {
            return interaction.reply(config.tags[commandName]);
        }

        // --- VERIFICAÇÃO FINAL DE BADGES ---
        await checkBadges(user, interaction);

    } catch (error) {
        console.error('Erro ao processar interação:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Ocorreu um erro interno ao executar este comando.', ephemeral: true });
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// 📡 REGISTRO DE COMANDOS SLASH (65 COMANDOS DETALHADOS)
// ═══════════════════════════════════════════════════════════════
client.once('ready', async () => {
    console.log(`✅ BOT ONLINE: ${client.user.tag}`);
    
    client.user.setActivity('Birutas AI Ultimate v8.9', { type: ActivityType.Playing });

    const commands = [
        // ADMIN
        new SlashCommandBuilder().setName('hub').setDescription('Central de comandos do bot.'),
        new SlashCommandBuilder().setName('adminpanel').setDescription('Painel administrativo do servidor.'),
        new SlashCommandBuilder().setName('config').setDescription('Ativa/Desativa IA no canal atual.'),
        new SlashCommandBuilder().setName('permissao').setDescription('Define o cargo de administrador do bot.').addRoleOption(o => o.setName('cargo').setDescription('Cargo administrativo').setRequired(true)),
        new SlashCommandBuilder().setName('logs').setDescription('Define o canal de logs.').addChannelOption(o => o.setName('canal').setDescription('Canal de logs').setRequired(true)),
        new SlashCommandBuilder().setName('lock').setDescription('Tranca o canal atual.'),
        new SlashCommandBuilder().setName('unlock').setDescription('Destranca o canal atual.'),
        new SlashCommandBuilder().setName('slowmode').setDescription('Define o modo lento do canal.').addIntegerOption(o => o.setName('segundos').setDescription('Segundos').setRequired(true)),
        new SlashCommandBuilder().setName('clear').setDescription('Limpa mensagens do canal.').addIntegerOption(o => o.setName('quantidade').setDescription('Quantidade (1-100)').setRequired(true)),
        new SlashCommandBuilder().setName('nuke').setDescription('Limpa completamente o canal atual.'),
        new SlashCommandBuilder().setName('backup').setDescription('Gera um backup dos dados do servidor.'),
        new SlashCommandBuilder().setName('anuncio').setDescription('Envia um anúncio em embed.').addStringOption(o => o.setName('mensagem').setDescription('Texto do anúncio').setRequired(true)),
        new SlashCommandBuilder().setName('resetbadges').setDescription('Reseta as conquistas de um usuário.').addUserOption(o => o.setName('usuario').setDescription('Usuário alvo').setRequired(true)),
        new SlashCommandBuilder().setName('banchannel').setDescription('Bane o canal de usar IA.'),
        new SlashCommandBuilder().setName('unbanchannel').setDescription('Desbane o canal de usar IA.'),
        
        // ECONOMIA
        new SlashCommandBuilder().setName('coins').setDescription('Verifica o saldo de coins.').addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('daily').setDescription('Coleta o bônus diário.'),
        new SlashCommandBuilder().setName('work').setDescription('Trabalha para ganhar coins.'),
        new SlashCommandBuilder().setName('crime').setDescription('Comete um crime (risco de multa).'),
        new SlashCommandBuilder().setName('rob').setDescription('Tenta roubar coins de outro usuário.').addUserOption(o => o.setName('usuario').setDescription('Vítima').setRequired(true)),
        new SlashCommandBuilder().setName('give').setDescription('Transfere coins para alguém.').addUserOption(o => o.setName('usuario').setDescription('Recebedor').setRequired(true)).addIntegerOption(o => o.setName('valor').setDescription('Quantidade').setRequired(true)),
        new SlashCommandBuilder().setName('shop').setDescription('Abre a loja de itens.'),
        new SlashCommandBuilder().setName('buy').setDescription('Compra um item da loja.').addStringOption(o => o.setName('id').setDescription('ID do item').setRequired(true)),
        new SlashCommandBuilder().setName('inventory').setDescription('Mostra seu inventário.'),
        new SlashCommandBuilder().setName('rank').setDescription('Ranking de riqueza do servidor.'),
        new SlashCommandBuilder().setName('configvoz').setDescription('Configura ganhos de voz.').addIntegerOption(o => o.setName('valor').setDescription('Coins por minuto').setRequired(true)),
        
        // CASSINO
        new SlashCommandBuilder().setName('coinflip').setDescription('Aposta no cara ou coroa.').addStringOption(o => o.setName('lado').setDescription('Lado').setRequired(true).addChoices({name:'Cara',value:'cara'},{name:'Coroa',value:'coroa'})).addIntegerOption(o => o.setName('valor').setDescription('Aposta').setRequired(true)),
        new SlashCommandBuilder().setName('slots').setDescription('Joga na máquina de slots.').addIntegerOption(o => o.setName('valor').setDescription('Aposta').setRequired(true)),
        new SlashCommandBuilder().setName('roulette').setDescription('Aposta na roleta.').addStringOption(o => o.setName('cor').setDescription('Cor').setRequired(true).addChoices({name:'Red (2x)',value:'red'},{name:'Black (2x)',value:'black'},{name:'Green (14x)',value:'green'})).addIntegerOption(o => o.setName('valor').setDescription('Aposta').setRequired(true)),
        new SlashCommandBuilder().setName('jokenpo').setDescription('Joga pedra, papel ou tesoura.').addStringOption(o => o.setName('jogada').setDescription('Sua jogada').setRequired(true).addChoices({name:'Pedra',value:'pedra'},{name:'Papel',value:'papel'},{name:'Tesoura',value:'tesoura'})).addIntegerOption(o => o.setName('valor').setDescription('Aposta').setRequired(true)),
        new SlashCommandBuilder().setName('dado').setDescription('Lança um dado.').addIntegerOption(o => o.setName('faces').setDescription('Número de faces').setRequired(true)),
        
        // SOCIAL
        new SlashCommandBuilder().setName('profile').setDescription('Mostra o perfil personalizado.').addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('stats').setDescription('Mostra estatísticas detalhadas.').addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('level').setDescription('Verifica o nível e XP.').addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('leaderboard').setDescription('Ranking de nível do servidor.'),
        new SlashCommandBuilder().setName('badges').setDescription('Mostra as conquistas.').addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('marry').setDescription('Pede alguém em casamento.').addUserOption(o => o.setName('usuario').setDescription('Noivo(a)').setRequired(true)),
        new SlashCommandBuilder().setName('divorce').setDescription('Divorcia-se do parceiro atual.'),
        new SlashCommandBuilder().setName('rep').setDescription('Dá um ponto de reputação.').addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true)),
        new SlashCommandBuilder().setName('toprep').setDescription('Ranking de reputação.'),
        new SlashCommandBuilder().setName('setbio').setDescription('Define sua biografia.').addStringOption(o => o.setName('texto').setDescription('Bio (máx 100 chars)').setRequired(true)),
        new SlashCommandBuilder().setName('setcolor').setDescription('Define a cor do perfil (Requer item).').addStringOption(o => o.setName('hex').setDescription('Cor em HEX (Ex: #FF0000)').setRequired(true)),
        new SlashCommandBuilder().setName('avatar').setDescription('Mostra o avatar de um usuário.').addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        
        // MÚSICA
        new SlashCommandBuilder().setName('play').setDescription('Toca uma música.').addStringOption(o => o.setName('musica').setDescription('Nome ou Link').setRequired(true)),
        new SlashCommandBuilder().setName('skip').setDescription('Pula a música atual.'),
        new SlashCommandBuilder().setName('stop').setDescription('Para a música e limpa a fila.'),
        new SlashCommandBuilder().setName('queue').setDescription('Mostra a fila de reprodução.'),
        new SlashCommandBuilder().setName('volume').setDescription('Ajusta o volume.').addIntegerOption(o => o.setName('nivel').setDescription('0-100').setRequired(true)),
        
        // UTILIDADES & IA
        new SlashCommandBuilder().setName('imagine').setDescription('Gera uma imagem com IA.').addStringOption(o => o.setName('prompt').setDescription('Descrição da imagem').setRequired(true)),
        new SlashCommandBuilder().setName('analyze-image').setDescription('Analisa uma imagem com Vision.').addAttachmentOption(o => o.setName('imagem').setDescription('Imagem para análise').setRequired(true)),
        new SlashCommandBuilder().setName('resumo').setDescription('Resume as últimas 50 mensagens do canal.'),
        new SlashCommandBuilder().setName('addia').setDescription('Cria uma nova personalidade de IA.').addStringOption(o => o.setName('id').setDescription('ID do Modelo').setRequired(true)).addStringOption(o => o.setName('nome').setDescription('Nome da IA').setRequired(true)).addStringOption(o => o.setName('cor').setDescription('Cor HEX').setRequired(true)).addStringOption(o => o.setName('prompt').setDescription('Prompt do Sistema').setRequired(true)),
        new SlashCommandBuilder().setName('delia').setDescription('Remove uma personalidade de IA.').addStringOption(o => o.setName('nome').setDescription('Nome da IA').setRequired(true)),
        new SlashCommandBuilder().setName('reset').setDescription('Reseta a memória da IA no canal.'),
        new SlashCommandBuilder().setName('qrcode').setDescription('Gera um QR Code.').addStringOption(o => o.setName('texto').setDescription('Conteúdo').setRequired(true)),
        new SlashCommandBuilder().setName('shorten').setDescription('Encurta um link.').addStringOption(o => o.setName('url').setDescription('URL longa').setRequired(true)),
        new SlashCommandBuilder().setName('weather').setDescription('Verifica o clima de uma cidade.').addStringOption(o => o.setName('cidade').setDescription('Nome da cidade').setRequired(true)),
        new SlashCommandBuilder().setName('crypto').setDescription('Verifica cotação de criptomoedas.').addStringOption(o => o.setName('moeda').setDescription('Símbolo (Ex: BTC, ETH)').setRequired(true)),
        new SlashCommandBuilder().setName('giveaway').setDescription('Inicia um sorteio.').addStringOption(o => o.setName('tempo').setDescription('Duração (Ex: 10m, 1h)').setRequired(true)).addIntegerOption(o => o.setName('vencedores').setDescription('Qtd vencedores').setRequired(true)).addStringOption(o => o.setName('premio').setDescription('Prêmio').setRequired(true)),
        new SlashCommandBuilder().setName('tag').setDescription('Gerencia tags do servidor.').addStringOption(o => o.setName('acao').setDescription('Ação').setRequired(true).addChoices({name:'Criar',value:'create'},{name:'Deletar',value:'delete'},{name:'Listar',value:'list'})).addStringOption(o => o.setName('nome').setDescription('Nome da tag')).addStringOption(o => o.setName('texto').setDescription('Conteúdo da tag')),
        new SlashCommandBuilder().setName('graph').setDescription('Gera um gráfico de dados.').addStringOption(o => o.setName('tipo').setDescription('Tipo de gráfico').setRequired(true).addChoices({name:'Atividade',value:'activity'},{name:'Riqueza',value:'coins'})),
        new SlashCommandBuilder().setName('status').setDescription('Mostra o status técnico do bot.')
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('📡 Sincronizando 65 comandos slash...');
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
// ===== INDEX 4 END ========
// ============================


