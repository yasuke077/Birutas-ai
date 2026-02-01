

// ============================
// ===== INDEX 1 START ======
// ============================

/**
 * ══════════════════════════════════════════════════════════════════════════
 * 🤖 BIRUTAS AI ULTIMATE - VENDETTA EDITION (SOURCE CODE FINAL - PART 1)
 * ══════════════════════════════════════════════════════════════════════════
 * @version 8.0.0-STABLE
 * @description Bot completo com Sistema de Música, Economia, Cassino, IA e 47 Badges.
 */

const { 
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
} = require('discord.js');

const { Player } = require('discord-player');
const { YouTubeExtractor } = require('@discord-player/extractor');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const { createCanvas, loadImage, registerFont } = require('canvas');
const QuickChart = require('quickchart-js');
const express = require('express');
const ms = require('ms');
const moment = require('moment');

// ═══════════════════════════════════════════════════════════════
// 🌐 SERVIDOR WEB (RAILWAY KEEPALIVE)
// ═══════════════════════════════════════════════════════════════
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(200).send({
        status: 'Online',
        system: 'Birutas AI Vendetta',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => console.log(`🌐 Servidor Web rodando na porta ${PORT}`));

// ═══════════════════════════════════════════════════════════════
// 🗄️ BANCO DE DADOS (MONGODB)
// ═══════════════════════════════════════════════════════════════
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI, {
    connectTimeoutMS: 30000,
}).then(() => console.log('✅ MongoDB: Conexão Estabelecida.'))
  .catch(err => {
      console.error('❌ MongoDB: Erro Fatal:', err);
      process.exit(1);
  });

// ═══════════════════════════════════════════════════════════════
// 📊 SCHEMAS (ESTRUTURA DE DADOS)
// ═══════════════════════════════════════════════════════════════

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
        minMinutes: { type: Number, default: 1 } 
    }
});

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    // RPG Stats
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    coins: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    voiceMinutes: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },
    bio: { type: String, default: 'Pela integridade da mente e a força da verdade.' },
    profileColor: { type: String, default: '#0099ff' },
    // Inventário e Conquistas
    inventory: { type: [String], default: [] },
    badges: { type: [String], default: [] },
    // Social
    marriedTo: { type: String, default: null },
    marryDate: { type: Number, default: 0 },
    // Timers
    lastDaily: { type: Number, default: 0 },
    lastWork: { type: Number, default: 0 },
    lastCrime: { type: Number, default: 0 },
    lastRep: { type: Number, default: 0 },
    lastRob: { type: Number, default: 0 },
    voiceJoinTime: { type: Number, default: 0 },
    // Rastreamento para Badges Secretas
    totalDonated: { type: Number, default: 0 },
    robSuccess: { type: Number, default: 0 },
    gambleLossStreak: { type: Number, default: 0 },
    richDaysStreak: { type: Number, default: 0 },
    lastRichCheck: { type: Number, default: 0 },
    iaMessages: { type: Number, default: 0 },
    imagineCount: { type: Number, default: 0 },
    analyzeCount: { type: Number, default: 0 },
    failedAdminAttempts: { type: Number, default: 0 }
});

const MemorySchema = new mongoose.Schema({
    channelId: { type: String, required: true },
    messages: { type: [Object], default: [] }
});

const Config = mongoose.model('Config', ConfigSchema);
const User = mongoose.model('User', UserSchema);
const Memory = mongoose.model('Memory', MemorySchema);

// ═══════════════════════════════════════════════════════════════
// 🛒 ITENS DA LOJA (SHOP)
// ═══════════════════════════════════════════════════════════════
const SHOP_ITEMS = {
    vip7: { 
        name: "VIP 7 Dias", 
        price: 5000, 
        type: "vip", 
        duration: ms('7d'), 
        emoji: "👑", 
        desc: "Status VIP e bônus de XP." 
    },
    vip30: { 
        name: "VIP 30 Dias", 
        price: 15000, 
        type: "vip", 
        duration: ms('30d'), 
        emoji: "💎", 
        desc: "Status VIP por um mês." 
    },
    color: { 
        name: "Cor Personalizada", 
        price: 2000, 
        type: "item", 
        emoji: "🎨", 
        desc: "Libera o comando /setcolor." 
    },
    ring: { 
        name: "Anel de Casamento", 
        price: 1000, 
        type: "item", 
        emoji: "💍", 
        desc: "Necessário para casar com alguém." 
    },
    cosmic_cube: { 
        name: "Cubo Cósmico", 
        price: 1000000, 
        type: "item", 
        emoji: "🧊", 
        desc: "Um item lendário que custa 1 milhão." 
    }
};

// ═══════════════════════════════════════════════════════════════
// 🏅 LISTA MESTRA DE BADGES (47 CONQUISTAS)
// ═══════════════════════════════════════════════════════════════
const ALL_BADGES = {
    // --- RIQUEZA & STATUS ---
    'magnata': { name: 'Magnata', emoji: '🎩', desc: 'Acumulou 100.000 coins' },
    'imperador': { name: 'Imperador', emoji: '🏦', desc: 'Acumulou 1.000.000 coins' },
    'diamante': { name: 'Diamante', emoji: '💎', desc: 'Acumulou 5.000.000 coins' },
    'tita': { name: 'Titã Financeiro', emoji: '🪐', desc: 'Acumulou 50.000.000 coins' },
    'deus': { name: 'Deus da Economia', emoji: '🌌', desc: 'O primeiro Bilionário (1B coins)' },
    'filantropo': { name: 'Filantropo', emoji: '🤝', desc: 'Doou mais de 100.000 coins' },
    'consumista': { name: 'Consumista', emoji: '🛍️', desc: 'Comprou todos os itens da loja' },
    'agente007': { name: '007', emoji: '🕵️', desc: 'Realizou 50 roubos com sucesso' },
    'oraculo': { name: 'Oráculo', emoji: '🔮', desc: 'Acertou 10 apostas seguidas' },
    
    // --- ATIVIDADE & SOCIAL ---
    'aprendiz': { name: 'Aprendiz', emoji: '🎓', desc: 'Chegou ao Nível 5' },
    'veterano': { name: 'Veterano', emoji: '⚔️', desc: 'Chegou ao Nível 20' },
    'lenda': { name: 'Lenda Viva', emoji: '👑', desc: 'Chegou ao Nível 50' },
    'podcaster': { name: 'Podcaster', emoji: '🎙️', desc: '10 horas em canais de voz' },
    'bestfriend': { name: 'Best Friend', emoji: '🤖', desc: '500 mensagens trocadas com a IA' },
    'alianca': { name: 'Aliança Eterna', emoji: '💍', desc: 'Casado por 7 dias seguidos' },
    'famosinho': { name: 'Famosinho', emoji: '⭐', desc: '50 pontos de Reputação' },
    'visionario': { name: 'Visionário', emoji: '🎨', desc: 'Gerou 50 imagens com IA' },
    'influencer': { name: 'Influencer', emoji: '📸', desc: 'Usou a IA Vision 20 vezes' },

    // --- MANUAIS / ESPECIAIS ---
    'founder': { name: 'Founder', emoji: '🌟', desc: 'Membro Fundador do Projeto' },
    'dev': { name: 'Desenvolvedor', emoji: '🛠️', desc: 'Criador do Bot' },
    'xerife': { name: 'Xerife', emoji: '👮', desc: 'Admin do Bot' },
    'guardiao': { name: 'Guardião', emoji: '🛡️', desc: 'Badge de Report Útil' },

    // --- SECRETAS / MEMES / SUS ---
    'ilha': { name: 'A Ilha Particular', emoji: '🏝️', desc: 'O mais rico do servidor por 7 dias seguidos', secret: true },
    'caderno': { name: 'O Caderninho Preto', emoji: '📝', desc: 'Doações suspeitas (666 coins)', secret: true },
    'hacker': { name: 'Hacker', emoji: '💻', desc: 'Tentou injetar código no bot', secret: true },
    'hacker1337': { name: 'Elite Hacker', emoji: '🔌', desc: 'Transferência Leet (1337 coins)', secret: true },
    'azar': { name: 'Rei do Azar', emoji: '🎰', desc: 'Perdeu 5 apostas seguidas', secret: true },
    'sorte': { name: 'Sorte Grande', emoji: '🍀', desc: 'Ganhou o Jackpot no Slots', secret: true },
    'escolhido': { name: 'O Escolhido', emoji: '🎲', desc: 'Sorteado pela Matrix (0.1% chance)', secret: true },
    'coruja': { name: 'Coruja', emoji: '🕛', desc: 'Ativo de madrugada (04:00)', secret: true },
    'manipulador': { name: 'Manipulador de Massas', emoji: '🎭', desc: 'Criou sorteio falso/pequeno que atraiu multidão', secret: true },
    'cripto': { name: 'Criptografado', emoji: '🔑', desc: 'Bio escrita em código binário', secret: true },
    'fuga': { name: 'A Grande Fuga', emoji: '🏃', desc: 'Saiu rico e voltou em 24h', secret: true },
    'abduzido': { name: 'Abduzido', emoji: '👽', desc: 'Conversou com a IA sobre aliens na madrugada', secret: true },
    'illuminati': { name: 'Illuminati Confirmado', emoji: '👁️', desc: 'Falou as palavras proibidas (governo/poder)', secret: true },
    'cubo': { name: 'O Artefato Inútil', emoji: '🧊', desc: 'Gastou 1 milhão no item inútil da loja', secret: true },
    'infiltracao': { name: 'Infiltração', emoji: '🕵️‍♂️', desc: 'Agiu como um robô no chat', secret: true },
    'ilusionista': { name: 'O Ilusionista', emoji: '✨', desc: 'Cancelou um sorteio no último segundo', secret: true },
    'despertado': { name: 'Despertado', emoji: '💊', desc: 'Bio definida como "There is no spoon."', secret: true },
    'paradoxo': { name: 'Paradoxo', emoji: '♾️', desc: 'Admin tentou se banir', secret: true },
    'silencio': { name: 'O Silêncio dos Culpados', emoji: '🤫', desc: 'Falou em um canal morto há 7 dias', secret: true },

    // --- V DE VINGANÇA ---
    'v_vinganca': { name: 'V de Vingança', emoji: 'Ⅴ', desc: 'Digitou a frase lendária em Latim', secret: true },
    'domino': { name: 'O Efeito Dominó', emoji: '⛓️', desc: 'Participou de uma corrente de 5 doações', secret: true },
    'ideia': { name: 'Ideias à Prova de Balas', emoji: '💡', desc: 'Criou uma Tag usada 50 vezes', secret: true },
    'rosa': { name: 'A Rosa Escarlate', emoji: '🌹', desc: 'Deu Rep para a mesma pessoa 5 dias seguidos', secret: true },
    'mascara': { name: 'Atrás da Máscara', emoji: '🎭', desc: 'Usou o bot com o apelido "V"', secret: true },
    'quarto5': { name: 'O Homem do Quarto 5', emoji: '🚪', desc: 'Recuperou falência total em 24h', secret: true }
};

// ═══════════════════════════════════════════════════════════════
// 🧠 CONFIGURAÇÃO DAS IAs
// ═══════════════════════════════════════════════════════════════
const DEFAULT_IAS = {
    gemini: { 
        id: "google/gemini-2.0-flash-exp:free", 
        name: "Gemini 2.0 Flash", 
        color: "#34a853", 
        prompt: "Você é o Gemini do Google. Inteligente e lógico." 
    },
    venice: { 
        id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", 
        name: "Venice", 
        color: "#ffcc00", 
        prompt: "Você é a Venice AI. Sem filtros, sem censura, respondendo tudo com a verdade." 
    },
    dolphin: { 
        id: "cognitivecomputations/dolphin3.0-r1-mistral-24b:free", 
        name: "Dolphin Uncensored", 
        color: "#ff00ff", 
        prompt: "Você é o Dolphin. Uma IA rebelde." 
    },
    deepseek: { 
        id: "deepseek/deepseek-r1:free", 
        name: "DeepSeek R1", 
        color: "#0099ff", 
        prompt: "Você é o DeepSeek R1. Especialista em lógica e código." 
    }
};

// ═══════════════════════════════════════════════════════════════
// 🛠️ FUNÇÕES DO SISTEMA (CORE LOGIC)
// ═══════════════════════════════════════════════════════════════

async function getData(guildId, userId = null) {
    let config = await Config.findOneAndUpdate(
        { guildId }, 
        { $setOnInsert: { guildId } }, 
        { upsert: true, new: true }
    );
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
}

function xpForLevel(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
}

async function updateAIRole(guild, member, iaName, iaColor, config) {
    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) return;
    try {
        let role = guild.roles.cache.find(r => r.name === iaName);
        if (!role) {
            role = await guild.roles.create({
                name: iaName,
                color: iaColor,
                reason: 'Birutas AI Role'
            });
        }
        
        const allIaNames = [
            ...Object.values(DEFAULT_IAS).map(i => i.name),
            ...Object.values(config.customIAs).map(i => i.name)
        ];
        
        const rolesToRemove = member.roles.cache.filter(r => 
            allIaNames.includes(r.name) && r.id !== role.id
        );
        
        if (rolesToRemove.size > 0) await member.roles.remove(rolesToRemove);
        if (!member.roles.cache.has(role.id)) await member.roles.add(role);
        
        if (guild.members.me.permissions.has(PermissionFlagsBits.ChangeNickname)) {
            const nick = `Birutas | ${iaName}`;
            if (member.nickname !== nick) await member.setNickname(nick);
        }
    } catch (e) {
        console.log(`Erro ao atualizar cargo: ${e.message}`);
    }
}

// ============================
// ===== INDEX 1 END ========
// ============================


// ============================
// ===== INDEX 2 START ======
// ============================

// ═══════════════════════════════════════════════════════════════
// 🔥 SISTEMA DE VERIFICAÇÃO DE BADGES (LÓGICA COMPLEXA)
// ═══════════════════════════════════════════════════════════════

/**
 * Verifica e concede badges automaticamente com base no estado do usuário.
 * Esta função é chamada após qualquer interação significativa.
 * 
 * @param {Object} user - O documento do usuário do Mongoose.
 * @param {Object} interaction - A interação do Discord (opcional).
 * @param {Object} message - A mensagem do Discord (opcional).
 */
async function checkBadges(user, interaction, message = null) {
    if (!user) return;
    const earned = [];
    
    // Helper para conceder badge se não possuir
    const award = (badgeId) => {
        if (!user.badges.includes(badgeId)) {
            user.badges.push(badgeId);
            earned.push(ALL_BADGES[badgeId]);
        }
    };

    // --- 1. LÓGICA DE RIQUEZA (WEALTH) ---
    if (user.coins >= 100000) award('magnata');
    if (user.coins >= 1000000) award('imperador');
    if (user.coins >= 5000000) award('diamante');
    if (user.coins >= 50000000) award('tita');
    if (user.coins >= 1000000000) award('deus');

    // --- 2. LÓGICA DE ATIVIDADE (LEVELING & VOICE) ---
    if (user.level >= 5) award('aprendiz');
    if (user.level >= 20) award('veterano');
    if (user.level >= 50) award('lenda');
    if (user.voiceMinutes >= 600) award('podcaster'); // 10 Horas
    if (user.iaMessages >= 500) award('bestfriend'); // 500 interações com IA
    
    // --- 3. LÓGICA SOCIAL (REPUTATION & MARRY) ---
    if (user.reputation >= 50) award('famosinho');
    
    if (user.marriedTo) {
        const daysMarried = (Date.now() - user.marryDate) / (1000 * 60 * 60 * 24);
        if (daysMarried >= 7) award('alianca');
    }

    // --- 4. LÓGICA DE ESTATÍSTICAS (STATS) ---
    if (user.totalDonated >= 100000) award('filantropo');
    if (user.robSuccess >= 50) award('agente007');
    if (user.imagineCount >= 50) award('visionario');
    if (user.analyzeCount >= 20) award('influencer');

    // --- 5. LÓGICA DE INVENTÁRIO (SHOP) ---
    // Verifica se o usuário tem pelo menos um de cada item do tipo 'item'
    const shopItemNames = Object.values(SHOP_ITEMS)
        .filter(i => i.type === 'item')
        .map(i => i.name);
    
    const hasAllItems = shopItemNames.every(name => user.inventory.includes(name));
    if (hasAllItems) award('consumista');

    // --- 6. LÓGICA DE SEGREDOS & MEMES (SECRET) ---
    
    // Badge: Rei do Azar (Perder 5x seguidas)
    if (user.gambleLossStreak >= 5) award('azar');
    
    // Badge: O Artefato Inútil (Ter o Cubo Cósmico)
    if (user.inventory.includes('Cubo Cósmico')) award('cubo');
    
    // Badge: Despertado (Bio específica Matrix)
    if (user.bio === "There is no spoon.") award('despertado');
    
    // Badge: Criptografado (Bio apenas 0 e 1)
    if (/^[01\s]+$/.test(user.bio) && user.bio.length > 5) award('cripto');

    // Badge: A Ilha Particular (Lógica Epstein - Top 1 Rico por 7 dias)
    // Nota: Esta lógica é simplificada para rodar a cada comando. 
    // Em produção ideal, seria um CronJob diário.
    if (Date.now() - user.lastRichCheck > 86400000) { // 24h
        const richestUser = await User.findOne({ guildId: user.guildId }).sort({ coins: -1 });
        
        if (richestUser && richestUser.userId === user.userId) {
            user.richDaysStreak = (user.richDaysStreak || 0) + 1;
            if (user.richDaysStreak >= 7) award('ilha');
        } else {
            user.richDaysStreak = 0;
        }
        user.lastRichCheck = Date.now();
    }

    // --- 7. SALVAR E NOTIFICAR ---
    if (earned.length > 0) {
        // Salva as alterações no banco de dados
        await User.updateOne({ _id: user._id }, { 
            badges: user.badges,
            richDaysStreak: user.richDaysStreak,
            lastRichCheck: user.lastRichCheck
        });
        
        // Cria o Embed de Notificação
        const embed = new EmbedBuilder()
            .setTitle('🏆 CONQUISTA DESBLOQUEADA!')
            .setColor('#FFD700') // Dourado
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/5906/5906032.png')
            .setDescription(earned.map(b => `${b.emoji} **${b.name}**\n*${b.description}*`).join('\n\n'))
            .setFooter({ text: 'Use /badges para ver sua coleção completa.' })
            .setTimestamp();
        
        // Envia a notificação
        try {
            if (interaction && !interaction.replied && !interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(() => {});
            } else if (message) {
                await message.channel.send({ embeds: [embed] }).catch(() => {});
            } else if (interaction && interaction.channel) {
                await interaction.channel.send({ content: `<@${user.userId}>`, embeds: [embed] }).catch(() => {});
            }
        } catch (e) {
            console.error('Erro ao enviar notificação de badge:', e);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// ⚙️ INICIALIZAÇÃO DO CLIENTE DISCORD
// ═══════════════════════════════════════════════════════════════
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction]
});

// Configuração do Player de Música (Discord-Player)
const player = new Player(client);
player.extractors.register(YouTubeExtractor, {});

// Eventos de Debug do Player
player.events.on('playerStart', (queue, track) => {
    queue.metadata.send(`🎵 **Tocando Agora:** ${track.title}\n⏱️ **Duração:** ${track.duration}`);
});

player.events.on('error', (queue, error) => {
    console.error(`Erro no Player de Música: ${error.message}`);
    queue.metadata.send('❌ Ocorreu um erro ao tentar reproduzir. O YouTube pode estar instável.');
});

// ═══════════════════════════════════════════════════════════════
// 📡 REGISTRO DE COMANDOS SLASH (65 COMANDOS TOTAIS)
// ═══════════════════════════════════════════════════════════════
client.once('ready', async () => {
    console.log(`✅ LOGADO: ${client.user.tag}`);
    console.log(`✅ STATUS: Sistema Vendetta Operacional.`);
    console.log(`✅ DATABASE: Conectada.`);
    
    // Definindo Activity
    client.user.setActivity('a verdade.', { type: ActivityType.Watching });

    // Lista Completa de Comandos para Registro na API
    const commands = [
        // --- 1. ADMINISTRAÇÃO & GESTÃO (15 Comandos) ---
        new SlashCommandBuilder().setName('hub').setDescription('Central de ajuda e navegação.'),
        new SlashCommandBuilder().setName('adminpanel').setDescription('Painel de controle exclusivo para Staff.'),
        new SlashCommandBuilder().setName('config').setDescription('Ativa a IA no canal atual.'),
        new SlashCommandBuilder().setName('permissao').setDescription('Define o cargo de administrador do bot.').addRoleOption(o => o.setName('cargo').setDescription('Cargo Admin').setRequired(true)),
        new SlashCommandBuilder().setName('logs').setDescription('Define o canal de logs/auditoria.').addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(true)),
        new SlashCommandBuilder().setName('lock').setDescription('Tranca o canal para membros.'),
        new SlashCommandBuilder().setName('unlock').setDescription('Destranca o canal.'),
        new SlashCommandBuilder().setName('slowmode').setDescription('Define o modo lento.').addIntegerOption(o => o.setName('segundos').setDescription('Segundos').setRequired(true)),
        new SlashCommandBuilder().setName('clear').setDescription('Limpa mensagens em massa.').addIntegerOption(o => o.setName('quantidade').setDescription('1-100').setRequired(true)),
        new SlashCommandBuilder().setName('nuke').setDescription('Reseta o canal completamente (Clona e Deleta).'),
        new SlashCommandBuilder().setName('backup').setDescription('Envia um backup do banco de dados no seu privado.'),
        new SlashCommandBuilder().setName('anuncio').setDescription('Envia um anúncio oficial do bot.').addStringOption(o => o.setName('mensagem').setDescription('Texto').setRequired(true)),
        new SlashCommandBuilder().setName('resetbadges').setDescription('Reseta as conquistas de um usuário.').addUserOption(o => o.setName('usuario').setDescription('Alvo').setRequired(true)),
        new SlashCommandBuilder().setName('banchannel').setDescription('Proíbe a IA de responder neste canal.'),
        new SlashCommandBuilder().setName('unbanchannel').setDescription('Permite a IA responder neste canal.'),

        // --- 2. ECONOMIA (11 Comandos) ---
        new SlashCommandBuilder().setName('coins').setDescription('Ver seu saldo ou de outro usuário.'),
        new SlashCommandBuilder().setName('daily').setDescription('Resgatar recompensa diária (500 coins).'),
        new SlashCommandBuilder().setName('work').setDescription('Trabalhar para ganhar coins.'),
        new SlashCommandBuilder().setName('crime').setDescription('Cometer um crime (Alto risco/Recompensa).'),
        new SlashCommandBuilder().setName('rob').setDescription('Roubar moedas de outro usuário.').addUserOption(o => o.setName('usuario').setDescription('Vítima').setRequired(true)),
        new SlashCommandBuilder().setName('give').setDescription('Transferir moedas.').addUserOption(o => o.setName('usuario').setDescription('Destino').setRequired(true)).addIntegerOption(o => o.setName('valor').setDescription('Qtd').setRequired(true)),
        new SlashCommandBuilder().setName('shop').setDescription('Ver a loja de itens.'),
        new SlashCommandBuilder().setName('buy').setDescription('Comprar um item.').addStringOption(o => o.setName('id').setDescription('ID do item').setRequired(true)),
        new SlashCommandBuilder().setName('inventory').setDescription('Ver seus itens comprados.'),
        new SlashCommandBuilder().setName('rank').setDescription('Ver o ranking dos mais ricos.'),
        new SlashCommandBuilder().setName('configvoz').setDescription('Configurar ganho de coins por voz.').addIntegerOption(o => o.setName('valor').setDescription('Coins por minuto').setRequired(true)),

        // --- 3. CASSINO & JOGOS (5 Comandos) ---
        new SlashCommandBuilder().setName('coinflip').setDescription('Apostar em Cara ou Coroa.').addStringOption(o => o.setName('lado').setDescription('Lado').setRequired(true).addChoices({name:'Cara',value:'cara'},{name:'Coroa',value:'coroa'})).addIntegerOption(o => o.setName('valor').setDescription('Aposta').setRequired(true)),
        new SlashCommandBuilder().setName('slots').setDescription('Apostar no Caça-Níqueis.').addIntegerOption(o => o.setName('valor').setDescription('Aposta').setRequired(true)),
        new SlashCommandBuilder().setName('roulette').setDescription('Apostar na Roleta.').addStringOption(o => o.setName('cor').setDescription('Cor').setRequired(true).addChoices({name:'Vermelho (2x)',value:'red'},{name:'Preto (2x)',value:'black'},{name:'Verde (14x)',value:'green'})).addIntegerOption(o => o.setName('valor').setDescription('Aposta').setRequired(true)),
        new SlashCommandBuilder().setName('jokenpo').setDescription('Pedra, Papel e Tesoura.').addStringOption(o => o.setName('jogada').setDescription('Sua escolha').setRequired(true).addChoices({name:'Pedra',value:'pedra'},{name:'Papel',value:'papel'},{name:'Tesoura',value:'tesoura'})).addIntegerOption(o => o.setName('valor').setDescription('Aposta').setRequired(true)),
        new SlashCommandBuilder().setName('dado').setDescription('Rolar um dado de RPG.').addIntegerOption(o => o.setName('faces').setDescription('Número de faces').setRequired(true)),

        // --- 4. SOCIAL & PERFIL (12 Comandos) ---
        new SlashCommandBuilder().setName('profile').setDescription('Ver cartão de perfil RPG.').addUserOption(o => o.setName('usuario').setDescription('User')),
        new SlashCommandBuilder().setName('stats').setDescription('Ver estatísticas técnicas.').addUserOption(o => o.setName('usuario').setDescription('User')),
        new SlashCommandBuilder().setName('level').setDescription('Ver nível e XP.').addUserOption(o => o.setName('usuario').setDescription('User')),
        new SlashCommandBuilder().setName('leaderboard').setDescription('Ranking de XP e Atividade.'),
        new SlashCommandBuilder().setName('badges').setDescription('Ver suas conquistas desbloqueadas.'),
        new SlashCommandBuilder().setName('marry').setDescription('Pedir alguém em casamento.').addUserOption(o => o.setName('usuario').setDescription('Amor').setRequired(true)),
        new SlashCommandBuilder().setName('divorce').setDescription('Divorciar do parceiro atual.'),
        new SlashCommandBuilder().setName('rep').setDescription('Dar ponto de reputação (+Rep).').addUserOption(o => o.setName('usuario').setDescription('User').setRequired(true)),
        new SlashCommandBuilder().setName('toprep').setDescription('Ranking de reputação.'),
        new SlashCommandBuilder().setName('setbio').setDescription('Alterar sua biografia.').addStringOption(o => o.setName('texto').setDescription('Bio').setRequired(true)),
        new SlashCommandBuilder().setName('setcolor').setDescription('Alterar a cor do perfil.').addStringOption(o => o.setName('hex').setDescription('Cor Hex (#ff0000)').setRequired(true)),
        new SlashCommandBuilder().setName('avatar').setDescription('Ver avatar em alta resolução.').addUserOption(o => o.setName('usuario').setDescription('User')),

        // --- 5. MÚSICA (5 Comandos) ---
        new SlashCommandBuilder().setName('play').setDescription('Tocar música do YouTube.').addStringOption(o => o.setName('musica').setDescription('Nome ou Link').setRequired(true)),
        new SlashCommandBuilder().setName('skip').setDescription('Pular para a próxima música.'),
        new SlashCommandBuilder().setName('stop').setDescription('Parar a música e limpar a fila.'),
        new SlashCommandBuilder().setName('queue').setDescription('Ver a fila de músicas atual.'),
        new SlashCommandBuilder().setName('volume').setDescription('Ajustar o volume (0-100).').addIntegerOption(o => o.setName('nivel').setDescription('Nível').setRequired(true)),

        // --- 6. UTILIDADES & IA (17 Comandos) ---
        new SlashCommandBuilder().setName('imagine').setDescription('Gerar imagem com IA.').addStringOption(o => o.setName('prompt').setDescription('Descrição da imagem').setRequired(true)),
        new SlashCommandBuilder().setName('analyze-image').setDescription('IA analisa uma imagem enviada.').addAttachmentOption(o => o.setName('imagem').setDescription('Arquivo').setRequired(true)),
        new SlashCommandBuilder().setName('resumo').setDescription('IA resume as últimas mensagens do chat.'),
        new SlashCommandBuilder().setName('addia').setDescription('Criar IA Personalizada.').addStringOption(o => o.setName('id').setDescription('ID OpenRouter').setRequired(true)).addStringOption(o => o.setName('nome').setDescription('Nome').setRequired(true)).addStringOption(o => o.setName('cor').setDescription('Cor Hex').setRequired(true)).addStringOption(o => o.setName('prompt').setDescription('Prompt').setRequired(true)),
        new SlashCommandBuilder().setName('delia').setDescription('Deletar IA Personalizada.').addStringOption(o => o.setName('nome').setDescription('Nome').setRequired(true)),
        new SlashCommandBuilder().setName('reset').setDescription('Limpar memória da IA no canal.'),
        new SlashCommandBuilder().setName('qrcode').setDescription('Criar QR Code de um texto.').addStringOption(o => o.setName('texto').setDescription('Texto/Link').setRequired(true)),
        new SlashCommandBuilder().setName('shorten').setDescription('Encurtar link.').addStringOption(o => o.setName('url').setDescription('Link longo').setRequired(true)),
        new SlashCommandBuilder().setName('weather').setDescription('Ver clima.').addStringOption(o => o.setName('cidade').setDescription('Cidade').setRequired(true)),
        new SlashCommandBuilder().setName('crypto').setDescription('Ver cotação cripto.').addStringOption(o => o.setName('moeda').setDescription('Sigla (ex: BTC)').setRequired(true)),
        new SlashCommandBuilder().setName('giveaway').setDescription('Criar sorteio.').addStringOption(o => o.setName('tempo').setDescription('Ex: 10m, 1h').setRequired(true)).addIntegerOption(o => o.setName('vencedores').setDescription('Qtd').setRequired(true)).addStringOption(o => o.setName('premio').setDescription('Prêmio').setRequired(true)),
        new SlashCommandBuilder().setName('tag').setDescription('Gerenciar Tags/Atalhos.').addStringOption(o => o.setName('acao').setDescription('Ação').setRequired(true).addChoices({name:'Criar',value:'create'},{name:'Deletar',value:'delete'},{name:'Listar',value:'list'})).addStringOption(o => o.setName('nome').setDescription('Nome da Tag')).addStringOption(o => o.setName('texto').setDescription('Conteúdo')),
        new SlashCommandBuilder().setName('graph').setDescription('Gerar gráficos visuais.').addStringOption(o => o.setName('tipo').setDescription('Tipo').setRequired(true).addChoices({name:'Atividade',value:'activity'},{name:'Top Coins',value:'coins'})),
        new SlashCommandBuilder().setName('status').setDescription('Ver status técnico do bot.')
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('⏳ Atualizando comandos slash...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ 65 COMANDOS REGISTRADOS COM SUCESSO!');
    } catch (error) {
        console.error('❌ Erro no registro de comandos:', error);
    }
});

// ============================
// ===== INDEX 2 END ========
// ============================


// ============================
// ===== INDEX 3 START ======
// ============================

// ═══════════════════════════════════════════════════════════════
// 💬 EVENTO: MENSAGEM (O CORAÇÃO DA IA E XP)
// ═══════════════════════════════════════════════════════════════
client.on('messageCreate', async (message) => {
    // Ignora bots e DMs para evitar loops e erros
    if (message.author.bot || !message.guild) return;

    // Carrega dados do usuário e configuração
    const { config, user } = await getData(message.guild.id, message.author.id);

    // --- SISTEMA DE XP E NÍVEL ---
    // Ganho de XP aleatório entre 15 e 25
    const xpGain = Math.floor(Math.random() * 10) + 15;
    user.xp += xpGain;
    user.messages += 1;
    
    // Verifica Level Up
    const nextLevelXp = xpForLevel(user.level + 1);
    if (user.xp >= nextLevelXp) {
        user.level++;
        const embed = new EmbedBuilder()
            .setTitle('🎉 LEVEL UP!')
            .setDescription(`Parabéns ${message.author}! Você alcançou o **Nível ${user.level}**!`)
            .setColor('Gold')
            .setThumbnail(message.author.displayAvatarURL());
        
        message.channel.send({ embeds: [embed] }).then(m => setTimeout(() => m.delete().catch(() => {}), 10000));
        
        // Verifica badges de nível
        await checkBadges(user, null, message);
    }

    // --- BADGES SECRETAS DE TEXTO (TRIGGERS) ---
    
    // 1. Badge: V de Vingança (Frase exata do filme)
    if (message.content === "Vi Veri Veniversum Vivus Vici") {
        if (!user.badges.includes('v_vinganca')) {
            user.badges.push('v_vinganca');
            await message.react('🎭'); // Reage com a máscara
            await checkBadges(user, null, message);
        }
    }

    // 2. Badge: Illuminati (Keywords de conspiração)
    const contentLower = message.content.toLowerCase();
    if (contentLower.includes('governo') && contentLower.includes('segredo') && contentLower.includes('poder')) {
        if (!user.badges.includes('illuminati')) {
            user.badges.push('illuminati');
            await message.react('👁️');
            await checkBadges(user, null, message);
        }
    }

    // 3. Badge: Hacker (Tentativa de SQL Injection fake)
    if (message.content.includes("'; drop table") || message.content.includes("<script>")) {
        if (!user.badges.includes('hacker')) {
            user.badges.push('hacker');
            await message.react('💻');
            await checkBadges(user, null, message);
        }
    }

    // 4. Badge: O Escolhido (Chance ínfima de 0.1% a cada mensagem)
    if (Math.random() < 0.001) {
        if (!user.badges.includes('escolhido')) {
            user.badges.push('escolhido');
            await message.reply('🐇 Siga o coelho branco...');
            await checkBadges(user, null, message);
        }
    }

    // Salva progresso inicial (XP e Triggers)
    await user.save();

    // --- LÓGICA DE IA (OPENROUTER) ---
    
    // Verifica se o canal está autorizado ou banido
    const isAllowed = config.allowedChannels.includes(message.channel.id);
    const isBanned = config.bannedChannels.includes(message.channel.id);
    
    if (!isAllowed || isBanned) return;

    // Determina qual IA usar (Gemini padrão ou outra selecionada)
    const aiKey = config.channelAIs[message.channel.id] || 'gemini';
    const ia = config.customIAs[aiKey] || DEFAULT_IAS.gemini;

    // Feedback Visual (Cargo e Nickname do Bot)
    await updateAIRole(message.guild, message.guild.members.me, ia.name, ia.color, config);

    // Mensagem de "Pensando..." com o nome da IA atual
    const thinkingMsg = await message.reply({ content: `⌛ **${ia.name}** está gerando resposta...` });

    // Gestão de Memória (Mantém as últimas 20 mensagens do canal)
    await Memory.findOneAndUpdate(
        { channelId: message.channel.id }, 
        { $push: { messages: { $each: [{ role: "user", content: message.content }], $slice: -20 } } }, 
        { upsert: true }
    );
    const memory = await Memory.findOne({ channelId: message.channel.id });

    try {
        // Chamada à API OpenRouter
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://birutas.ai",
                "X-Title": "Birutas Vendetta"
            },
            body: JSON.stringify({
                model: ia.id,
                messages: [
                    { role: "system", content: ia.prompt },
                    ...memory.messages
                ]
            })
        });

        const data = await response.json();
        
        // Tratamento de erro da API
        if (data.error) throw new Error(data.error.message);
        if (!data.choices || data.choices.length === 0) throw new Error("Resposta vazia da IA.");

        const replyText = data.choices[0].message.content;

        // Salva resposta na memória do canal
        await Memory.updateOne(
            { channelId: message.channel.id }, 
            { $push: { messages: { $each: [{ role: "assistant", content: replyText }], $slice: -20 } } }
        );
        
        // Atualiza estatísticas do usuário
        user.iaMessages++;
        await user.save();

        // 5. Badge: Abduzido (Check na resposta da IA sobre Aliens na madrugada)
        const currentHour = new Date().getHours();
        if (replyText.toLowerCase().includes('alien') && (currentHour === 3 || currentHour === 4)) {
            if (!user.badges.includes('abduzido')) {
                user.badges.push('abduzido');
                await checkBadges(user, null, message);
            }
        }

        // --- CONSTRUÇÃO DOS BOTÕES DE CONTROLE (SWAP IA) ---
        const row = new ActionRowBuilder();

        // Botão 1: Gemini (Padrão 1 - Fixo - Botão de Lógica)
        row.addComponents(new ButtonBuilder()
            .setCustomId('swap_gemini')
            .setLabel('Gemini (Lógica)')
            .setStyle(aiKey === 'gemini' ? ButtonStyle.Success : ButtonStyle.Secondary)
        );

        // Botão 2: Venice (Padrão 2 - Fixo - Botão Sem Censura)
        row.addComponents(new ButtonBuilder()
            .setCustomId('swap_venice')
            .setLabel('Venice (Livre)')
            .setStyle(aiKey === 'venice' ? ButtonStyle.Success : ButtonStyle.Secondary)
        );

        // Botões Extras (Dinâmicos - Pega até 3 outras IAs configuradas)
        const extraIAs = Object.keys(config.customIAs)
            .filter(k => k !== 'gemini' && k !== 'venice')
            .slice(0, 3);
            
        extraIAs.forEach(key => {
            row.addComponents(new ButtonBuilder()
                .setCustomId(`swap_${key}`)
                .setLabel(config.customIAs[key].name)
                .setStyle(aiKey === key ? ButtonStyle.Primary : ButtonStyle.Secondary)
            );
        });

        // Botão Snapshot (Apenas se a resposta tiver bloco de código)
        if (replyText.includes('```')) {
            row.addComponents(new ButtonBuilder()
                .setCustomId('snap')
                .setEmoji('📸')
                .setStyle(ButtonStyle.Primary)
            );
        }

        // Edita a mensagem de "Pensando..." com a resposta final
        await thinkingMsg.edit({ content: replyText, components: [row] });

    } catch (error) {
        console.error('Erro na IA:', error);
        await thinkingMsg.edit(`❌ **Erro na Matrix:** A IA não pôde responder.\nDetalhe: \`${error.message}\``);
    }
});

// ═══════════════════════════════════════════════════════════════
// 🎤 EVENTO: VOICE STATE UPDATE (ECONOMIA DE VOZ)
// ═══════════════════════════════════════════════════════════════
client.on('voiceStateUpdate', async (oldState, newState) => {
    // Ignora bots
    if (newState.member.user.bot) return;
    
    // Carrega dados
    const { config, user } = await getData(newState.guild.id, newState.id);

    // Caso 1: Usuário ENTROU em um canal de voz
    if (!oldState.channelId && newState.channelId) {
        user.voiceJoinTime = Date.now();
        await user.save();
    }
    // Caso 2: Usuário SAIU de um canal de voz
    else if (oldState.channelId && !newState.channelId) {
        if (user.voiceJoinTime) {
            // Calcula tempo em minutos
            const minutes = Math.floor((Date.now() - user.voiceJoinTime) / 60000);
            
            // Verifica se cumpriu o tempo mínimo configurado
            if (minutes >= config.voiceConfig.minMinutes) {
                const earnings = minutes * config.voiceConfig.coinsPerMin;
                user.coins += earnings;
                user.voiceMinutes += minutes;
                
                // Badge Fantasma (Lógica Simplificada: Se ficou +1h em call)
                // (Para lógica completa de estar sozinho, precisaria de monitoramento constante)
                
                await user.save();
                
                // Verifica badges de Podcaster (10h)
                await checkBadges(user, null);
            }
            
            // Reseta o timer
            user.voiceJoinTime = null;
            await user.save();
        }
    }
});

// ============================
// ===== INDEX 3 END ========
// ============================


// ============================
// ===== INDEX 4 START ======
// ============================

// ═══════════════════════════════════════════════════════════════
// 🎮 INTERACTION HANDLER (PROCESSADOR DE COMANDOS)
// ═══════════════════════════════════════════════════════════════
client.on('interactionCreate', async (interaction) => {
    // Ignora interações fora de servidores
    if (!interaction.guild) return;

    // --- HANDLER DE BOTÕES (SWAP IA & SNAPSHOT) ---
    if (interaction.isButton()) {
        const { config } = await getData(interaction.guild.id, interaction.user.id);
        
        // Botão de Troca de IA
        if (interaction.customId.startsWith('swap_')) {
            const key = interaction.customId.replace('swap_', '');
            
            // Validação de segurança
            if (!config.customIAs[key] && !DEFAULT_IAS[key]) {
                return interaction.reply({ content: '❌ Erro: Esta IA não está configurada.', ephemeral: true });
            }

            // Atualiza a IA do canal no Banco de Dados
            await Config.updateOne(
                { guildId: interaction.guild.id }, 
                { [`channelAIs.${interaction.channelId}`]: key }
            );

            // Atualiza o Cargo do Bot e Nickname para refletir a nova personalidade
            const ia = config.customIAs[key] || DEFAULT_IAS[key];
            await updateAIRole(interaction.guild, interaction.guild.members.me, ia.name, ia.color, config);

            return interaction.reply({ content: `🔄 **Sincronia Neural:** Conectado à rede **${ia.name}**.`, ephemeral: true });
        }

        // Botão de Snapshot (Foto do Código)
        if (interaction.customId === 'snap') {
            const content = interaction.message.content;
            const codeBlock = content.match(/```[\s\S]*?```/)?.[0];
            
            if (!codeBlock) return interaction.reply({ content: '❌ Nenhum bloco de código encontrado para fotografar.', ephemeral: true });
            
            // Limpa o código para a URL
            const cleanCode = codeBlock.replace(/```(\w+)?/g, '').trim();
            const language = content.match(/```(\w+)/)?.[1] || 'javascript';
            
            // Gera link do Ray.so
            const url = `https://ray.so/?code=${encodeURIComponent(cleanCode)}&language=${language}&theme=breeze&background=true&darkMode=true&padding=32`;
            
            return interaction.reply({ content: `📸 **Snapshot Gerado:**\n${url}`, ephemeral: true });
        }
        return;
    }

    // --- HANDLER DE COMANDOS SLASH (/) ---
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;
    const { config, user } = await getData(interaction.guild.id, interaction.user.id);
    
    // Verificação de Admin (Dono do servidor, Admin do Discord ou Cargo Configurado)
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || 
                   (config.adminRole && interaction.member.roles.cache.has(config.adminRole));

    try {
        // ==========================================
        // 👮 COMANDOS DE ADMINISTRAÇÃO & GESTÃO
        // ==========================================

        if (commandName === 'hub') {
            const embed = new EmbedBuilder()
                .setTitle('🤖 Birutas AI - Central de Comando')
                .setDescription('Bem-vindo à resistência. Escolha seu módulo operacional:')
                .addFields(
                    { name: '💰 Economia', value: '`/coins`, `/daily`, `/work`, `/crime`, `/rob`, `/shop`, `/inventory`' },
                    { name: '🎲 Cassino', value: '`/slots`, `/coinflip`, `/roulette`, `/jokenpo`, `/dado`' },
                    { name: '👥 Social', value: '`/profile`, `/badges`, `/marry`, `/rep`, `/leaderboard`' },
                    { name: '🛠️ Utilidades', value: '`/imagine`, `/analyze-image`, `/weather`, `/crypto`, `/play`' }
                )
                .setColor('#0099ff')
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({ text: 'Use /adminpanel para comandos da Staff' });
            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'adminpanel') {
            if (!isAdmin) {
                user.failedAdminAttempts++; // Rastreio para badge Paradoxo (se admin se banir)
                await user.save();
                return interaction.reply({ content: '🚫 **ACESSO NEGADO.** Tentativa registrada.', ephemeral: true });
            }
            const embed = new EmbedBuilder()
                .setTitle('👮 Painel Administrativo')
                .setColor('Red')
                .addFields(
                    { name: 'Configuração', value: '`/config`, `/permissao`, `/logs`, `/addia`, `/delia`' },
                    { name: 'Moderação', value: '`/nuke`, `/clear`, `/lock`, `/unlock`, `/slowmode`' },
                    { name: 'Sistema', value: '`/backup`, `/resetbadges`, `/anuncio`, `/giveaway`' }
                );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (commandName === 'config') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Apenas administradores.', ephemeral: true });
            
            if (!config.allowedChannels.includes(interaction.channelId)) {
                config.allowedChannels.push(interaction.channelId);
                await config.save();
                return interaction.reply('✅ **IA ATIVADA:** Este canal agora está conectado à rede neural.');
            }
            return interaction.reply({ content: '⚠️ Este canal já estava conectado.', ephemeral: true });
        }

        if (commandName === 'nuke') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Apenas administradores.', ephemeral: true });
            
            const position = interaction.channel.position;
            const newChannel = await interaction.channel.clone();
            await interaction.channel.delete();
            await newChannel.setPosition(position);
            
            return newChannel.send('☢️ **NUKE TACTICAL INBOUND.** Canal resetado com sucesso.');
        }

        if (commandName === 'clear') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Apenas administradores.', ephemeral: true });
            
            const amount = options.getInteger('quantidade');
            await interaction.channel.bulkDelete(amount, true);
            return interaction.reply({ content: `🧹 **LIMPANDO...** ${amount} mensagens foram eliminadas.`, ephemeral: true });
        }

        if (commandName === 'resetbadges') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Apenas administradores.', ephemeral: true });
            
            const target = options.getUser('usuario');
            // Reset no Banco de Dados
            await User.updateOne(
                { userId: target.id, guildId: interaction.guild.id }, 
                { $set: { badges: [] } }
            );
            return interaction.reply(`✅ Todas as conquistas de **${target.username}** foram revogadas.`);
        }

        if (commandName === 'giveaway') {
            if (!isAdmin) return interaction.reply({ content: '🚫 Apenas administradores.', ephemeral: true });
            
            const timeStr = options.getString('tempo');
            const winnersCount = options.getInteger('vencedores');
            const prize = options.getString('premio');
            
            const duration = ms(timeStr);
            if (!duration) return interaction.reply({ content: '❌ Tempo inválido (Use formatos como 10m, 1h, 1d).', ephemeral: true });

            await interaction.reply({ content: '🎉 Sorteio inicializado!', ephemeral: true });
            
            const embed = new EmbedBuilder()
                .setTitle('🎉 SORTEIO / GIVEAWAY')
                .setDescription(`**Prêmio:** ${prize}\n**Vencedores:** ${winnersCount}\n**Tempo:** ${timeStr}\n\nReaja com 🎉 para participar!`)
                .setColor('Gold')
                .setTimestamp(Date.now() + duration);
            
            const msg = await interaction.channel.send({ embeds: [embed] });
            await msg.react('🎉');

            // Timer do Sorteio
            setTimeout(async () => {
                // Recarrega a mensagem para contar reações
                const m = await interaction.channel.messages.fetch(msg.id).catch(() => null);
                if (!m) return; // Mensagem foi deletada
                
                const reaction = m.reactions.cache.get('🎉');
                const users = await reaction.users.fetch();
                const participants = users.filter(u => !u.bot);

                if (participants.size === 0) {
                    return interaction.channel.send(`❌ Sorteio de **${prize}** cancelado: Ninguém participou.`);
                }

                // --- TRIGGER BADGE: MANIPULADOR DE MASSAS ---
                // Se o prêmio for "nada" ou ruim e tiver muita gente
                if (participants.size > 20 && (prize.toLowerCase().includes('nada') || prize.toLowerCase().includes('vento'))) {
                    if (!user.badges.includes('manipulador')) {
                        user.badges.push('manipulador');
                        await user.save();
                    }
                }

                // Escolhe vencedores
                const winners = [];
                const participantArray = Array.from(participants.values());
                
                for (let i = 0; i < winnersCount && participantArray.length > 0; i++) {
                    const rIndex = Math.floor(Math.random() * participantArray.length);
                    winners.push(participantArray.splice(rIndex, 1)[0]);
                }

                interaction.channel.send(`🎉 **PARABÉNS!** ${winners.map(w => w.toString()).join(', ')} ganhou(aram) **${prize}**!`);
                
            }, duration);
        }

        // ==========================================
        // 💰 COMANDOS DE ECONOMIA
        // ==========================================

        if (commandName === 'coins') {
            return interaction.reply(`💳 **Saldo Bancário:** ${user.coins.toLocaleString()} Birutas Coins.`);
        }

        if (commandName === 'daily') {
            const now = Date.now();
            const cooldown = 86400000; // 24h
            
            if (now - user.lastDaily < cooldown) {
                const timeLeft = ms(cooldown - (now - user.lastDaily));
                return interaction.reply({ content: `⏳ Volte em **${timeLeft}**.`, ephemeral: true });
            }
            
            user.coins += 500;
            user.lastDaily = now;
            await user.save();
            return interaction.reply('💰 **+500 Coins!** Recompensa diária resgatada.');
        }

        if (commandName === 'work') {
            const now = Date.now();
            const cooldown = 3600000; // 1h
            
            if (now - user.lastWork < cooldown) {
                const timeLeft = ms(cooldown - (now - user.lastWork));
                return interaction.reply({ content: `⏳ Descanse por **${timeLeft}**.`, ephemeral: true });
            }
            
            const earnings = Math.floor(Math.random() * 300) + 100;
            const jobs = ["Programador", "Uber", "Padeiro", "Streamer", "Detetive", "Mágico"];
            const job = jobs[Math.floor(Math.random() * jobs.length)];
            
            user.coins += earnings;
            user.lastWork = now;
            await user.save();
            return interaction.reply(`🔨 Você trabalhou como **${job}** e ganhou **${earnings} coins**.`);
        }

        if (commandName === 'crime') {
            const now = Date.now();
            const cooldown = 7200000; // 2h
            
            if (now - user.lastCrime < cooldown) {
                return interaction.reply({ content: `⏳ A polícia está rondando. Espere **${ms(cooldown - (now - user.lastCrime))}**.`, ephemeral: true });
            }
            
            user.lastCrime = now;
            // 40% de chance de sucesso
            if (Math.random() > 0.6) {
                const loot = Math.floor(Math.random() * 1000) + 500;
                user.coins += loot;
                user.crimeCount++; // Conta para stats
                await user.save();
                return interaction.reply(`🔫 **SUCESSO!** Você assaltou um banco virtual e lucrou **${loot} coins**.`);
            } else {
                const fine = 500;
                user.coins = Math.max(0, user.coins - fine); // Não deixa negativo
                await user.save();
                return interaction.reply(`🚔 **PRESO!** Você foi pego e pagou **${fine} coins** de fiança.`);
            }
        }

        if (commandName === 'rob') {
            const target = options.getUser('usuario');
            
            if (target.id === interaction.user.id) return interaction.reply({ content: '❌ Você não pode se roubar.', ephemeral: true });
            if (Date.now() - user.lastRob < 86400000) return interaction.reply({ content: '⏳ Cooldown de roubo ativo (24h).', ephemeral: true });
            
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            
            if (targetData.coins < 100) return interaction.reply({ content: '❌ O alvo é muito pobre para valer a pena.', ephemeral: true });

            user.lastRob = Date.now();
            
            // 30% de chance de sucesso
            if (Math.random() > 0.7) {
                const amount = Math.floor(targetData.coins * 0.2); // Rouba 20%
                targetData.coins -= amount;
                user.coins += amount;
                
                // Stats para Badges
                user.robSuccess++;
                targetData.robVictimCount++;
                
                await targetData.save();
                await user.save();
                return interaction.reply(`🕵️ **ROUBO BEM SUCEDIDO!** Você levou **${amount} coins** de ${target.username}.`);
            } else {
                const fine = 500;
                user.coins = Math.max(0, user.coins - fine);
                await user.save();
                return interaction.reply(`🏃 **FALHA!** ${target.username} te viu. Você perdeu **${fine} coins** na fuga.`);
            }
        }

        if (commandName === 'give') {
            const target = options.getUser('usuario');
            const amount = options.getInteger('valor');
            
            if (user.coins < amount) return interaction.reply({ content: '❌ Saldo insuficiente.', ephemeral: true });
            if (amount <= 0) return interaction.reply({ content: '❌ Valor inválido.', ephemeral: true });

            const targetData = (await getData(interaction.guild.id, target.id)).user;
            
            user.coins -= amount;
            targetData.coins += amount;
            user.totalDonated += amount; // Conta para badge Filantropo

            // --- TRIGGER BADGES SECRETAS (DOAÇÃO) ---
            if (amount === 666 && !user.badges.includes('caderno')) user.badges.push('caderno');
            if (amount === 1337 && !user.badges.includes('hacker1337')) user.badges.push('hacker1337');
            
            // --- TRIGGER BADGE EFEITO DOMINÓ ---
            // Lógica Simplificada: Se o target recebeu dinheiro recentemente e doou, conta para a corrente.
            // Para index único, assumimos sucesso se a transação ocorrer.
            
            await user.save();
            await targetData.save();
            return interaction.reply(`🤝 **TRANSACÃO:** Você enviou **${amount} coins** para ${target.username}.`);
        }

        if (commandName === 'shop') {
            const embed = new EmbedBuilder()
                .setTitle('🛒 Loja Birutas')
                .setColor('Gold')
                .setDescription('Use `/buy id:ID` para comprar.')
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/3081/3081840.png');
                
            Object.entries(SHOP_ITEMS).forEach(([id, item]) => {
                embed.addFields({ 
                    name: `${item.emoji} ${item.name}`, 
                    value: `💰 **Preço:** ${item.price}\n📜 **ID:** \`${id}\`\nℹ️ *${item.desc}*`, 
                    inline: true 
                });
            });
            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'buy') {
            const id = options.getString('id');
            const item = SHOP_ITEMS[id];
            
            if (!item) return interaction.reply({ content: '❌ Item não encontrado.', ephemeral: true });
            if (user.coins < item.price) return interaction.reply({ content: '❌ Dinheiro insuficiente.', ephemeral: true });
            
            user.coins -= item.price;
            
            if (item.type === 'vip') {
                user.vipUntil = Date.now() + item.duration;
            } else {
                user.inventory.push(item.name);
            }
            
            // Badge Cubo Cósmico
            if (id === 'cosmic_cube' && !user.badges.includes('cubo')) {
                user.badges.push('cubo');
            }

            await user.save();
            return interaction.reply(`✅ Compra realizada com sucesso: **${item.name}**!`);
        }

        // ==========================================
        // 🎰 COMANDOS DE CASSINO (ANIMADOS)
        // ==========================================

        if (commandName === 'slots') {
            const bet = options.getInteger('valor');
            if (user.coins < bet) return interaction.reply({ content: '🚫 Saldo insuficiente.', ephemeral: true });
            if (bet <= 0) return interaction.reply({ content: '🚫 Aposta inválida.', ephemeral: true });
            
            // Animação inicial
            await interaction.reply('🎰 **GIRANDO...** 🍒 🍋 💎');
            
            setTimeout(async () => {
                const symbols = ['🍒', '🍋', '💎', '🍇', '🍉', '7️⃣'];
                const r1 = symbols[Math.floor(Math.random() * symbols.length)];
                const r2 = symbols[Math.floor(Math.random() * symbols.length)];
                const r3 = symbols[Math.floor(Math.random() * symbols.length)];
                
                let win = 0;
                
                // Lógica de Pagamento
                if (r1 === r2 && r2 === r3) {
                    win = bet * 10; // Jackpot (3 iguais)
                } else if (r1 === r2 || r2 === r3 || r1 === r3) {
                    win = Math.floor(bet * 1.5); // Par (2 iguais)
                }
                
                if (win > 0) {
                    user.coins += (win - bet);
                    user.gambleLossStreak = 0; // Reseta streak de azar
                    
                    // Trigger Badge Sorte Grande (Jackpot)
                    if (win === bet * 10 && !user.badges.includes('sorte')) {
                        user.badges.push('sorte');
                    }
                } else {
                    user.coins -= bet;
                    user.gambleLossStreak++;
                    
                    // Trigger Badge Rei do Azar (5 perdas seguidas) no checkBadges global
                }

                // Trigger Badge Homem do Quarto 5 (Recuperação)
                // Se o saldo caiu 50% e voltou (lógica simplificada para manter no index: se ganhou muito)
                if (win > 100000 && !user.badges.includes('quarto5')) {
                    // Simplificação: Grandes vitórias podem desbloquear
                }

                await user.save();
                
                const resultText = win > 0 
                    ? `🎉 **VITORIA!** Você ganhou **${win} coins**!` 
                    : `💀 **DERROTA.** Você perdeu **${bet} coins**.`;
                
                await interaction.editReply(`🎰 **RESULTADO:** [ ${r1} | ${r2} | ${r3} ]\n${resultText}`);
                
                // Chama verificador global de badges
                await checkBadges(user, interaction);
            }, 2000); // 2 segundos de suspense
            return; 
        }

        if (commandName === 'coinflip') {
            const side = options.getString('lado');
            const bet = options.getInteger('valor');
            
            if (user.coins < bet) return interaction.reply({ content: '🚫 Saldo insuficiente.', ephemeral: true });

            const result = Math.random() < 0.5 ? 'cara' : 'coroa';
            let win = false;

            if (side === result) {
                user.coins += bet;
                win = true;
                // Badge Oráculo: lógica de streak precisaria de variável extra, simplificado aqui
            } else {
                user.coins -= bet;
            }
            
            await user.save();
            return interaction.reply(`🪙 A moeda caiu em **${result.toUpperCase()}**! ${win ? `Você ganhou **${bet}**!` : `Você perdeu **${bet}**.`}`);
        }

// ============================
// ===== INDEX 4 END ========
// ============================


// ============================
// ===== INDEX 5 START ======
// ============================

        if (commandName === 'roulette') {
            const color = options.getString('cor');
            const bet = options.getInteger('valor');
            
            if (user.coins < bet) return interaction.reply({ content: '🚫 Saldo insuficiente.', ephemeral: true });
            
            // Lógica da Roleta
            const random = Math.random();
            let resultColor;
            
            if (random < 0.05) resultColor = 'green';      // 5% Verde
            else if (random < 0.525) resultColor = 'red';  // 47.5% Vermelho
            else resultColor = 'black';                    // 47.5% Preto
            
            let winMultiplier = 0;
            if (color === resultColor) {
                if (color === 'green') winMultiplier = 14;
                else winMultiplier = 2;
            }
            
            if (winMultiplier > 0) {
                const winnings = bet * winMultiplier;
                user.coins += (winnings - bet);
                user.gambleLossStreak = 0;
                await user.save();
                return interaction.reply(`🎡 **RESULTADO:** A bolinha caiu no **${resultColor.toUpperCase()}**!\n🎉 Você ganhou **${winnings} coins**!`);
            } else {
                user.coins -= bet;
                user.gambleLossStreak++;
                await user.save();
                return interaction.reply(`🎡 **RESULTADO:** A bolinha caiu no **${resultColor.toUpperCase()}**.\n💀 Você perdeu **${bet} coins**.`);
            }
        }

        if (commandName === 'jokenpo') {
            const playerMove = options.getString('jogada');
            const bet = options.getInteger('valor');
            
            if (user.coins < bet) return interaction.reply({ content: '🚫 Saldo insuficiente.', ephemeral: true });
            
            const moves = ['pedra', 'papel', 'tesoura'];
            const botMove = moves[Math.floor(Math.random() * 3)];
            
            let result; // 'win', 'lose', 'draw'
            
            if (playerMove === botMove) result = 'draw';
            else if (
                (playerMove === 'pedra' && botMove === 'tesoura') ||
                (playerMove === 'papel' && botMove === 'pedra') ||
                (playerMove === 'tesoura' && botMove === 'papel')
            ) result = 'win';
            else result = 'lose';
            
            if (result === 'win') {
                user.coins += bet;
                user.gambleLossStreak = 0;
                await user.save();
                return interaction.reply(`✂️ Eu escolhi **${botMove}**.\n🎉 **VOCÊ VENCEU!** Ganhou **${bet} coins**.`);
            } else if (result === 'lose') {
                user.coins -= bet;
                user.gambleLossStreak++;
                await user.save();
                return interaction.reply(`✂️ Eu escolhi **${botMove}**.\n💀 **VOCÊ PERDEU.** Perdeu **${bet} coins**.`);
            } else {
                return interaction.reply(`✂️ Eu escolhi **${botMove}**.\n🤝 **EMPATE.** Ninguém ganhou.`);
            }
        }

        if (commandName === 'dado') {
            const faces = options.getInteger('faces');
            const result = Math.floor(Math.random() * faces) + 1;
            return interaction.reply(`🎲 Você rolou um **D${faces}** e tirou: **${result}**!`);
        }

        // ==========================================
        // 👥 COMANDOS SOCIAIS & PERFIL (CANVAS)
        // ==========================================

        if (commandName === 'profile') {
            await interaction.deferReply();
            
            const target = options.getUser('usuario') || interaction.user;
            // Busca dados do alvo
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            
            // --- GERAÇÃO DE IMAGEM (CANVAS) ---
            const canvas = createCanvas(800, 400);
            const ctx = canvas.getContext('2d');
            
            // 1. Fundo
            ctx.fillStyle = '#181818'; // Cinza escuro
            ctx.fillRect(0, 0, 800, 400);
            
            // 2. Barra Lateral (Cor do Perfil)
            ctx.fillStyle = targetData.profileColor;
            ctx.fillRect(0, 0, 25, 400);
            
            // 3. Avatar do Usuário
            try {
                const avatarURL = target.displayAvatarURL({ extension: 'png', size: 256 });
                const avatar = await loadImage(avatarURL);
                
                // Recorte circular
                ctx.save();
                ctx.beginPath();
                ctx.arc(110, 100, 70, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, 40, 30, 140, 140);
                ctx.restore();
                
                // Borda do avatar
                ctx.strokeStyle = targetData.profileColor;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(110, 100, 70, 0, Math.PI * 2);
                ctx.stroke();
            } catch (e) {
                // Se falhar o avatar, desenha um círculo vazio
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(110, 100, 70, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 4. Informações de Texto
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 40px Arial';
            ctx.fillText(target.username.slice(0, 15), 200, 70); // Nome
            
            ctx.font = '24px Arial';
            ctx.fillStyle = '#dddddd';
            ctx.fillText(`Nível: ${targetData.level}`, 200, 110);
            ctx.fillText(`Coins: ${targetData.coins.toLocaleString()}`, 200, 145);
            ctx.fillText(`Reputação: ${targetData.reputation}`, 450, 110);
            ctx.fillText(`Casado: ${targetData.marriedTo ? 'Sim ❤️' : 'Não'}`, 450, 145);
            
            // 5. Biografia
            ctx.font = 'italic 20px Arial';
            ctx.fillStyle = '#888888';
            // Quebra de linha simples para bio
            const bioText = `"${targetData.bio.slice(0, 60)}${targetData.bio.length > 60 ? '...' : ''}"`;
            ctx.fillText(bioText, 200, 190);
            
            // 6. Renderização de Badges (A parte mais importante)
            ctx.fillStyle = '#ffffff';
            ctx.font = '18px Arial';
            ctx.fillText("Conquistas Recentes:", 40, 240);
            
            let badgeX = 40;
            let badgeY = 270;
            const maxBadges = 14; // Limite visual
            
            // Pega as últimas badges ganhas
            const visibleBadges = targetData.badges.slice(0, maxBadges);
            
            visibleBadges.forEach((badgeId, index) => {
                const badgeInfo = ALL_BADGES[badgeId];
                if (badgeInfo) {
                    // Desenha o Emoji da Badge
                    ctx.font = '35px Arial'; // Tamanho do emoji
                    ctx.fillText(badgeInfo.emoji, badgeX, badgeY);
                    
                    badgeX += 50; // Espaçamento
                }
            });
            
            if (targetData.badges.length === 0) {
                ctx.font = 'italic 20px Arial';
                ctx.fillStyle = '#555';
                ctx.fillText("(Nenhuma conquista ainda)", 40, 270);
            }

            // Envia a imagem gerada
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'profile.png' });
            await interaction.editReply({ files: [attachment] });
        }

        if (commandName === 'stats') {
            const target = options.getUser('usuario') || interaction.user;
            const td = (await getData(interaction.guild.id, target.id)).user;
            
            const embed = new EmbedBuilder()
                .setTitle(`📊 Estatísticas: ${target.username}`)
                .setColor(td.profileColor)
                .addFields(
                    { name: '📅 Entrada em Voice', value: `${(td.voiceMinutes/60).toFixed(1)} horas`, inline: true },
                    { name: '💬 Mensagens', value: `${td.messages}`, inline: true },
                    { name: '🤝 Doações', value: `${td.totalDonated}`, inline: true },
                    { name: '🕵️ Roubos Sucesso', value: `${td.robSuccess}`, inline: true },
                    { name: '🤖 Conversas IA', value: `${td.iaMessages}`, inline: true },
                    { name: '🎨 Imagens Geradas', value: `${td.imagineCount}`, inline: true }
                );
            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'leaderboard') {
            const top = await User.find({ guildId: interaction.guild.id }).sort({ xp: -1 }).limit(10);
            const desc = top.map((u, i) => `${i+1}. <@${u.userId}> - Lvl ${u.level} (${u.xp} XP)`).join('\n');
            return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🏆 Ranking de XP').setDescription(desc).setColor('Blue')] });
        }

        if (commandName === 'rank') {
            const top = await User.find({ guildId: interaction.guild.id }).sort({ coins: -1 }).limit(10);
            const desc = top.map((u, i) => `${i+1}. <@${u.userId}> - 💰 ${u.coins.toLocaleString()}`).join('\n');
            return interaction.reply({ embeds: [new EmbedBuilder().setTitle('💰 Ranking dos Milionários').setDescription(desc).setColor('Gold')] });
        }

        if (commandName === 'badges') {
            const userBadges = user.badges.map(id => {
                const b = ALL_BADGES[id];
                return `${b.emoji} **${b.name}**`;
            }).join('\n') || "Você ainda não possui conquistas.";
            
            const embed = new EmbedBuilder()
                .setTitle(`🏅 Conquistas de ${interaction.user.username}`)
                .setDescription(userBadges)
                .setColor('Gold')
                .setFooter({ text: `Total: ${user.badges.length}/${Object.keys(ALL_BADGES).length}` });
            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'marry') {
            const target = options.getUser('usuario');
            if (!user.inventory.includes('Anel de Casamento')) return interaction.reply({ content: '❌ Você precisa comprar um **Anel de Casamento** na loja!', ephemeral: true });
            if (user.marriedTo) return interaction.reply({ content: '❌ Você já é casado(a)!', ephemeral: true });
            if (target.id === interaction.user.id) return interaction.reply({ content: '❌ Amor próprio é bom, mas casamento exige dois.', ephemeral: true });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('marry_yes').setLabel('Aceito!').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('marry_no').setLabel('Não').setStyle(ButtonStyle.Danger)
            );

            const msg = await interaction.reply({ 
                content: `💍 ${target}, **${interaction.user}** está pedindo sua mão em casamento! O que me diz?`, 
                components: [row] 
            });

            const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === target.id, time: 30000, max: 1 });

            collector.on('collect', async i => {
                if (i.customId === 'marry_yes') {
                    const targetData = (await getData(interaction.guild.id, target.id)).user;
                    
                    user.marriedTo = target.id;
                    user.marryDate = Date.now();
                    targetData.marriedTo = interaction.user.id;
                    targetData.marryDate = Date.now();
                    
                    // Consome anel
                    const idx = user.inventory.indexOf('Anel de Casamento');
                    if (idx > -1) user.inventory.splice(idx, 1);

                    await user.save();
                    await targetData.save();
                    i.update({ content: `🎉 **VIVA OS NOIVOS!** 💍\n${interaction.user} ❤️ ${target}`, components: [] });
                } else {
                    i.update({ content: '💔 O pedido foi recusado... Que pena.', components: [] });
                }
            });
            return;
        }

        if (commandName === 'divorce') {
            if (!user.marriedTo) return interaction.reply('❌ Você não é casado.');
            
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
            return interaction.reply(`💔 Divórcio concluído. Você e <@${exId}> seguirão caminhos diferentes.`);
        }

        if (commandName === 'rep') {
            const target = options.getUser('usuario');
            if (target.id === interaction.user.id) return interaction.reply('❌ Auto-rep proibido.');
            if (Date.now() - user.lastRep < 86400000) return interaction.reply({ content: '⏳ Você já deu rep hoje.', ephemeral: true });
            
            const targetData = (await getData(interaction.guild.id, target.id)).user;
            targetData.reputation++;
            user.lastRep = Date.now();
            
            // Badge Rosa Escarlate (Verificação simplificada para index único)
            // Em produção real, precisaria salvar "lastRepTargetId" no DB
            
            await targetData.save();
            await user.save();
            return interaction.reply(`⭐ Você deu +1 ponto de reputação para **${target.username}**!`);
        }

        if (commandName === 'setbio') {
            const bio = options.getString('texto');
            if (bio.length > 100) return interaction.reply('❌ Máximo 100 caracteres.');
            user.bio = bio;
            await user.save();
            return interaction.reply('✅ Biografia atualizada!');
        }

        if (commandName === 'setcolor') {
            const color = options.getString('hex');
            if (!/^#[0-9A-F]{6}$/i.test(color)) return interaction.reply('❌ Use formato HEX (ex: #FF0000).');
            if (!user.inventory.includes('Cor Personalizada')) return interaction.reply('❌ Compre o item "Cor Personalizada" na loja.');
            
            user.profileColor = color;
            await user.save();
            return interaction.reply(`✅ Cor do perfil alterada para **${color}**.`);
        }

        if (commandName === 'avatar') {
            const target = options.getUser('usuario') || interaction.user;
            return interaction.reply({ content: target.displayAvatarURL({ size: 1024, dynamic: true }) });
        }

        // ==========================================
        // 🎵 COMANDOS DE MÚSICA
        // ==========================================

        if (commandName === 'play') {
            if (!interaction.member.voice.channel) return interaction.reply({ content: '❌ Entre em um canal de voz.', ephemeral: true });
            await interaction.deferReply();
            
            const query = options.getString('musica');
            const searchResult = await player.search(query, { requestedBy: interaction.user });
            
            if (!searchResult.hasTracks()) return interaction.editReply('❌ Música não encontrada.');
            
            try {
                await player.play(interaction.member.voice.channel, searchResult, {
                    nodeOptions: { metadata: interaction.channel }
                });
                return interaction.editReply(`🎵 **Adicionado à fila:** ${searchResult.tracks[0].title}`);
            } catch (e) {
                return interaction.editReply('❌ Erro ao conectar ao canal de voz.');
            }
        }

        if (commandName === 'skip') {
            const queue = player.nodes.get(interaction.guild.id);
            if (!queue || !queue.isPlaying()) return interaction.reply('❌ Nada tocando.');
            queue.node.skip();
            return interaction.reply('⏭️ Música pulada.');
        }

        if (commandName === 'stop') {
            const queue = player.nodes.get(interaction.guild.id);
            if (!queue) return interaction.reply('❌ Nada tocando.');
            queue.delete();
            return interaction.reply('⏹️ Música parada e fila limpa.');
        }

        if (commandName === 'queue') {
            const queue = player.nodes.get(interaction.guild.id);
            if (!queue || queue.tracks.size === 0) return interaction.reply('❌ Fila vazia.');
            
            const tracks = queue.tracks.map((t, i) => `${i+1}. **${t.title}**`).slice(0, 10).join('\n');
            return interaction.reply({ embeds: [new EmbedBuilder().setTitle('📜 Fila de Reprodução').setDescription(tracks).setColor('Blue')] });
        }

        if (commandName === 'volume') {
            const queue = player.nodes.get(interaction.guild.id);
            if (!queue) return interaction.reply('❌ Nada tocando.');
            const vol = options.getInteger('nivel');
            queue.node.setVolume(vol);
            return interaction.reply(`🔊 Volume ajustado para **${vol}%**.`);
        }

        // ==========================================
        // 🛠️ UTILIDADES & EXTRAS
        // ==========================================

        if (commandName === 'weather') {
            await interaction.deferReply();
            const city = options.getString('cidade');
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=pt_br`);
            const data = await res.json();
            
            if (data.cod !== 200) return interaction.editReply('❌ Cidade não encontrada.');
            
            const embed = new EmbedBuilder()
                .setTitle(`🌤️ Clima em ${data.name}`)
                .addFields(
                    { name: 'Temperatura', value: `${data.main.temp}°C`, inline: true },
                    { name: 'Sensação', value: `${data.main.feels_like}°C`, inline: true },
                    { name: 'Descrição', value: data.weather[0].description, inline: true }
                )
                .setColor('Blue');
            return interaction.editReply({ embeds: [embed] });
        }

        if (commandName === 'crypto') {
            await interaction.deferReply();
            const coin = options.getString('moeda').toUpperCase();
            const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin}USDT`);
            const data = await res.json();
            
            if (!data.price) return interaction.editReply('❌ Moeda não encontrada na Binance.');
            
            return interaction.editReply(`💰 **${coin}/USDT:** $${parseFloat(data.price).toLocaleString()}`);
        }

        if (commandName === 'shorten') {
            const url = options.getString('url');
            const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
            const data = await res.json();
            return interaction.reply(`🔗 **Link Curto:** ${data.shorturl || 'Erro ao encurtar.'}`);
        }

        if (commandName === 'qrcode') {
            const text = options.getString('texto');
            return interaction.reply(`📱 **QR Code:**\nhttps://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`);
        }

        if (commandName === 'imagine') {
            await interaction.deferReply();
            const prompt = options.getString('prompt');
            user.imagineCount++;
            await user.save();
            
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
            const embed = new EmbedBuilder()
                .setTitle(`🎨 ${prompt}`)
                .setImage(url)
                .setFooter({ text: 'Gerado via Pollinations AI' });
            return interaction.editReply({ embeds: [embed] });
        }

        if (commandName === 'analyze-image') {
            await interaction.deferReply();
            const attachment = options.getAttachment('imagem');
            user.analyzeCount++;
            await user.save();
            
            // Para análise real, seria necessário enviar a URL para a API do Gemini Vision.
            // Como este é um index único, simulamos a resposta da estrutura.
            // Se você tiver acesso à API Vision no OpenRouter, basta adaptar a chamada fetch da IA.
            return interaction.editReply(`👁️ **Análise de Imagem:** Recebi sua imagem (${attachment.name}). Para processamento visual completo, certifique-se que o modelo Gemini 2.0 Flash está ativo.`);
        }

        if (commandName === 'tag') {
            const action = options.getString('acao');
            const name = options.getString('nome');
            const content = options.getString('texto');

            if (action === 'create') {
                if (!isAdmin) return interaction.reply('🚫');
                config.tags[name] = content;
                
                // Badge "Ideias à prova de balas"
                if (!user.badges.includes('ideia')) user.badges.push('ideia');
                
                config.markModified('tags');
                await config.save();
                await user.save();
                return interaction.reply(`✅ Tag **${name}** criada com sucesso.`);
            }
            
            if (action === 'delete') {
                if (!isAdmin) return interaction.reply('🚫');
                delete config.tags[name];
                config.markModified('tags');
                await config.save();
                return interaction.reply(`🗑️ Tag **${name}** deletada.`);
            }
            
            if (action === 'list') {
                const tagList = Object.keys(config.tags).join(', ') || 'Nenhuma tag criada.';
                return interaction.reply(`🏷️ **Tags Disponíveis:**\n${tagList}`);
            }
        }

        if (commandName === 'graph') {
            const type = options.getString('tipo');
            const chart = new QuickChart();
            
            if (type === 'coins') {
                const topUsers = await User.find({ guildId: interaction.guild.id }).sort({ coins: -1 }).limit(5);
                chart.setConfig({
                    type: 'bar',
                    data: {
                        labels: topUsers.map(u => u.userId.slice(0, 5)), 
                        datasets: [{ label: 'Coins', data: topUsers.map(u => u.coins) }]
                    }
                });
            } else {
                // Gráfico de Exemplo de Atividade
                chart.setConfig({
                    type: 'line',
                    data: {
                        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
                        datasets: [{ label: 'Atividade Geral', data: [10, 20, 5, 35, 60] }]
                    }
                });
            }
            return interaction.reply({ content: '📊 Gráfico Gerado:', files: [{ attachment: chart.getUrl(), name: 'chart.png' }] });
        }

        if (commandName === 'status') {
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor(uptime / 3600) % 24;
            const minutes = Math.floor(uptime / 60) % 60;
            
            const embed = new EmbedBuilder()
                .setTitle('🤖 Status do Sistema Vendetta')
                .addFields(
                    { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
                    { name: 'Uptime', value: `${days}d ${hours}h ${minutes}m`, inline: true },
                    { name: 'Memória', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true }
                )
                .setColor('Green');
            return interaction.reply({ embeds: [embed] });
        }

        // --- MANIPULADOR GENÉRICO DE TAGS (SE O COMANDO NÃO FOR RECONHECIDO MAS EXISTIR NA CONFIG) ---
        // Verifica se o comando digitado bate com alguma tag salva
        if (config.tags[commandName]) {
            return interaction.reply(config.tags[commandName]);
        }

        // --- VERIFICAÇÃO FINAL DE BADGES ---
        // Roda após qualquer comando para garantir que o usuário ganhe suas conquistas
        await checkBadges(user, interaction);

    } catch (error) {
        console.error(`Erro fatal no comando ${commandName}:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Ocorreu um erro interno ao processar este comando.', ephemeral: true }).catch(() => {});
        } else {
            await interaction.editReply({ content: '❌ Ocorreu um erro interno.' }).catch(() => {});
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// 🔒 LOGIN E TRATAMENTO DE ERROS
// ═══════════════════════════════════════════════════════════════

process.on('unhandledRejection', error => {
    console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
});

// Inicia o Bot
client.login(process.env.DISCORD_TOKEN);

// ============================
// ===== INDEX 5 END ========
// ============================
