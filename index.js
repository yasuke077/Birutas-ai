// ═══════════════════════════════════════════════════════════════
// 🤖 BIRUTAS AI - BOT DISCORD COMPLETO E 100% GRATUITO
// ═══════════════════════════════════════════════════════════════

const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, 
    REST, Routes, SlashCommandBuilder, PermissionFlagsBits,
    AttachmentBuilder
} = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
const { createCanvas, loadImage } = require('canvas');
const cheerio = require('cheerio');

// ═══════════════════════════════════════════════════════════════
// 🌐 MONITORAMENTO (RAILWAY)
// ═══════════════════════════════════════════════════════════════
const app = express();
app.get('/', (req, res) => res.send('🚀 Birutas AI Online!'));
app.listen(process.env.PORT || 3000, () => console.log('🌐 Servidor HTTP ativo'));

// ═══════════════════════════════════════════════════════════════
// 🗄️ CONEXÃO MONGODB
// ═══════════════════════════════════════════════════════════════
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Conectado!'))
  .catch(err => console.error('❌ Erro MongoDB:', err));

// Schemas
const ConfigSchema = new mongoose.Schema({
    guildId: String,
    allowedChannels: [String],
    bannedChannels: [String],
    adminRole: String,
    logChannel: String,
    channelAIs: Object,
    channelPresets: Object,
    customIAs: Object,
    presets: Object,
    voiceConfig: Object
}, { minimize: false });

const UserSchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    coins: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    voiceMinutes: { type: Number, default: 0 },
    inventory: [String],
    badges: [String],
    marriedTo: String,
    reputation: { type: Number, default: 0 },
    lastDaily: Number,
    lastWork: Number,
    lastCrime: Number,
    lastRep: Object,
    bio: { type: String, default: '' },
    profileColor: { type: String, default: '#0099ff' },
    vipUntil: Number,
    voiceJoinTime: Number
}, { minimize: false });

const MemorySchema = new mongoose.Schema({
    channelId: String,
    messages: [Object]
});

const Config = mongoose.model('Config', ConfigSchema);
const User = mongoose.model('User', UserSchema);
const Memory = mongoose.model('Memory', MemorySchema);

// ═══════════════════════════════════════════════════════════════
// 🎮 CLIENTE DISCORD
// ═══════════════════════════════════════════════════════════════
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// ═══════════════════════════════════════════════════════════════
// 📦 CONFIGURAÇÃO PADRÃO
// ═══════════════════════════════════════════════════════════════
const DEFAULT_IAS = {
    deepseek: {
        id: "deepseek/deepseek-chat",
        name: "DeepSeek",
        color: "#0099ff",
        prompt: "Você é o DeepSeek, uma IA útil e inteligente."
    },
    venice: {
        id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
        name: "Venice",
        color: "#ffef00",
        prompt: "Você é a Venice AI, focada em liberdade e honestidade técnica."
    }
};

const SHOP_ITEMS = {
    vip_7d: { name: "VIP 7 Dias", price: 5000, type: "vip", duration: 604800000, emoji: "👑" },
    vip_30d: { name: "VIP 30 Dias", price: 15000, type: "vip", duration: 2592000000, emoji: "👑" },
    color: { name: "Cor Personalizada", price: 2000, type: "color", emoji: "🎨" },
    badge_custom: { name: "Badge Exclusivo", price: 3000, type: "badge", emoji: "🏆" },
    xp_boost: { name: "2x XP (24h)", price: 1000, type: "boost", duration: 86400000, emoji: "⚡" }
};

const BADGES = {
    first_message: { name: "Primeira Mensagem", emoji: "✉️", requirement: "messages", value: 1 },
    chatter_100: { name: "Tagarela", emoji: "💬", requirement: "messages", value: 100 },
    chatter_1000: { name: "Conversador", emoji: "🗣️", requirement: "messages", value: 1000 },
    millionaire: { name: "Milionário", emoji: "💰", requirement: "coins", value: 10000 },
    voice_10h: { name: "Streamer Iniciante", emoji: "🎤", requirement: "voiceMinutes", value: 600 },
    voice_100h: { name: "Streamer Pro", emoji: "🎙️", requirement: "voiceMinutes", value: 6000 },
    married: { name: "Casado", emoji: "💍", requirement: "marriedTo", value: true },
    level_10: { name: "Veterano", emoji: "⭐", requirement: "level", value: 10 },
    level_50: { name: "Lendário", emoji: "🌟", requirement: "level", value: 50 }
};

// ═══════════════════════════════════════════════════════════════
// 🛠️ FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════

// Pegar/criar configuração do servidor
async function getConfig(guildId) {
    let config = await Config.findOne({ guildId });
    if (!config) {
        config = new Config({
            guildId,
            allowedChannels: [],
            bannedChannels: [],
            adminRole: null,
            logChannel: null,
            channelAIs: {},
            channelPresets: {},
            customIAs: { ...DEFAULT_IAS },
            presets: {},
            voiceConfig: { coinsPerMin: 10, minMinutes: 1, allowMuted: false }
        });
        await config.save();
    }
    if (!config.customIAs) config.customIAs = {};
    Object.keys(DEFAULT_IAS).forEach(key => {
        if (!config.customIAs[key]) config.customIAs[key] = DEFAULT_IAS[key];
    });
    return config;
}

// Pegar/criar usuário
async function getUser(userId, guildId) {
    let user = await User.findOne({ userId, guildId });
    if (!user) {
        user = new User({ userId, guildId });
        await user.save();
    }
    return user;
}

// Verificar se é admin
function isAdmin(member, config) {
    return member.permissions.has(PermissionFlagsBits.Administrator) || 
           (config.adminRole && member.roles.cache.has(config.adminRole));
}

// Calcular XP necessário para próximo nível
function xpForLevel(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
}

// Verificar e dar badges
async function checkBadges(user) {
    const earned = [];
    for (const [key, badge] of Object.entries(BADGES)) {
        if (user.badges.includes(key)) continue;
        
        let qualified = false;
        if (badge.requirement === 'marriedTo') {
            qualified = user.marriedTo ? true : false;
        } else {
            qualified = user[badge.requirement] >= badge.value;
        }
        
        if (qualified) {
            user.badges.push(key);
            earned.push(badge);
        }
    }
    if (earned.length > 0) await user.save();
    return earned;
}

// Gerar perfil em imagem (Canvas)
async function generateProfile(user, member) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    
    // Fundo gradiente
    const gradient = ctx.createLinearGradient(0, 0, 800, 400);
    gradient.addColorStop(0, user.profileColor);
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 400);
    
    // Avatar
    try {
        const avatar = await loadImage(member.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(120, 120, 80, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 40, 40, 160, 160);
        ctx.restore();
        
        // Borda do avatar
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(120, 120, 80, 0, Math.PI * 2);
        ctx.stroke();
    } catch (e) {}
    
    // Nome
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(member.displayName, 220, 80);
    
    // Nível e XP
    ctx.font = '28px Arial';
    ctx.fillText(`Nível ${user.level}`, 220, 120);
    const nextXP = xpForLevel(user.level + 1);
    ctx.font = '20px Arial';
    ctx.fillText(`${user.xp}/${nextXP} XP`, 220, 150);
    
    // Barra de progresso
    const barWidth = 500;
    const barHeight = 30;
    const progress = user.xp / nextXP;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(220, 160, barWidth, barHeight);
    
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(220, 160, barWidth * progress, barHeight);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(220, 160, barWidth, barHeight);
    
    // Stats
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`💰 ${user.coins} Coins`, 220, 230);
    ctx.fillText(`💬 ${user.messages} Mensagens`, 220, 270);
    ctx.fillText(`🎤 ${Math.floor(user.voiceMinutes / 60)}h em Call`, 220, 310);
    ctx.fillText(`🏆 ${user.badges.length} Badges`, 220, 350);
    
    // VIP
    if (user.vipUntil && user.vipUntil > Date.now()) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 30px Arial';
        ctx.fillText('👑 VIP', 650, 50);
    }
    
    return canvas.toBuffer('image/png');
}

// Gerar gráfico com QuickChart
function generateChartURL(type, data) {
    const config = {
        type: type,
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            }
        }
    };
    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}`;
}

// Botões de IA
function getAIButtons(config, channelId) {
    const currentAI = config.channelAIs[channelId] || 'deepseek';
    const rows = [];
    let row = new ActionRowBuilder();
    
    const iaKeys = Object.keys(config.customIAs);
    iaKeys.forEach((key, i) => {
        if (i > 0 && i % 5 === 0) {
            rows.push(row);
            row = new ActionRowBuilder();
        }
        
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`setia_${key}`)
                .setLabel(config.customIAs[key].name)
                .setStyle(currentAI === key ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );
    });
    
    // Botão vermelho "Restaurar Padrão" só se tiver preset ativo
    if (config.channelPresets[channelId]) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('restore_default')
                .setLabel('🔴 Restaurar Padrão')
                .setStyle(ButtonStyle.Danger)
        );
    }
    
    if (row.components.length > 0) rows.push(row);
    return rows;
}

// Verificar VirusTotal (opcional)
async function checkVirusTotal(url) {
    if (!process.env.VT_API_KEY) return true;
    try {
        const urlBase64 = Buffer.from(url).toString('base64').replace(/=/g, '');
        const res = await fetch(`https://www.virustotal.com/api/v3/urls/${urlBase64}`, {
            headers: { 'x-apikey': process.env.VT_API_KEY }
        });
        const data = await res.json();
        return !(data.data?.attributes?.last_analysis_stats?.malicious > 0);
    } catch {
        return true;
    }
}

// Enviar para canal de logs
async function sendLog(config, guild, message) {
    if (!config.logChannel) return;
    const channel = guild.channels.cache.get(config.logChannel);
    if (channel) {
        const embed = new EmbedBuilder()
            .setDescription(message)
            .setColor('#ff9900')
            .setTimestamp();
        channel.send({ embeds: [embed] });
    }
}

// ═══════════════════════════════════════════════════════════════
// 📝 REGISTRO DE COMANDOS SLASH
// ═══════════════════════════════════════════════════════════════
const commands = [
    // CORE
    new SlashCommandBuilder().setName('hub').setDescription('Menu principal do bot'),
    new SlashCommandBuilder().setName('status').setDescription('Ver status do bot'),
    
    // ADMIN
    new SlashCommandBuilder().setName('permissao').setDescription('Definir cargo de gerência')
        .addRoleOption(o => o.setName('cargo').setDescription('Cargo com permissões de admin').setRequired(true)),
    new SlashCommandBuilder().setName('config').setDescription('Autorizar IA neste canal'),
    new SlashCommandBuilder().setName('banchannel').setDescription('Banir IA deste canal'),
    new SlashCommandBuilder().setName('unbanchannel').setDescription('Desbanir IA deste canal'),
    new SlashCommandBuilder().setName('logs').setDescription('Definir canal de auditoria'),
    new SlashCommandBuilder().setName('lock').setDescription('Trancar chat (impedir mensagens)'),
    new SlashCommandBuilder().setName('unlock').setDescription('Destrancar chat'),
    new SlashCommandBuilder().setName('slowmode').setDescription('Configurar modo lento')
        .addIntegerOption(o => o.setName('segundos').setDescription('Segundos de cooldown').setRequired(true)),
    new SlashCommandBuilder().setName('backup').setDescription('Receber backup das configurações'),
    new SlashCommandBuilder().setName('anuncio').setDescription('Enviar anúncio em todos canais autorizados')
        .addStringOption(o => o.setName('texto').setDescription('Mensagem do anúncio').setRequired(true)),
    
    // ECONOMIA
    new SlashCommandBuilder().setName('coins').setDescription('Ver seu saldo de Birutas Coins'),
    new SlashCommandBuilder().setName('daily').setDescription('Resgatar 500 coins diários'),
    new SlashCommandBuilder().setName('rank').setDescription('Ver top 10 mais ricos'),
    new SlashCommandBuilder().setName('give').setDescription('Transferir coins para alguém')
        .addUserOption(o => o.setName('usuario').setDescription('Para quem enviar').setRequired(true))
        .addIntegerOption(o => o.setName('valor').setDescription('Quantidade de coins').setRequired(true)),
    new SlashCommandBuilder().setName('work').setDescription('Trabalhar para ganhar coins'),
    new SlashCommandBuilder().setName('crime').setDescription('Cometer crime (alto risco)'),
    new SlashCommandBuilder().setName('rob').setDescription('Tentar roubar coins de alguém')
        .addUserOption(o => o.setName('usuario').setDescription('Vítima').setRequired(true)),
    new SlashCommandBuilder().setName('coinflip').setDescription('Apostar em cara ou coroa')
        .addStringOption(o => o.setName('lado').setDescription('cara ou coroa').setRequired(true).addChoices(
            { name: 'Cara', value: 'cara' },
            { name: 'Coroa', value: 'coroa' }
        ))
        .addIntegerOption(o => o.setName('valor').setDescription('Quantidade de coins').setRequired(true)),
    new SlashCommandBuilder().setName('slots').setDescription('Jogar caça-níqueis')
        .addIntegerOption(o => o.setName('valor').setDescription('Quantidade de coins').setRequired(true)),
    new SlashCommandBuilder().setName('configvoz').setDescription('Configurar economia de voz')
        .addIntegerOption(o => o.setName('moedas').setDescription('Coins por minuto'))
        .addBooleanOption(o => o.setName('mutado').setDescription('Contar se estiver mutado?')),
    
    // LOJA & INVENTÁRIO
    new SlashCommandBuilder().setName('shop').setDescription('Ver loja de itens'),
    new SlashCommandBuilder().setName('buy').setDescription('Comprar item da loja')
        .addStringOption(o => o.setName('item').setDescription('ID do item').setRequired(true)),
    new SlashCommandBuilder().setName('inventory').setDescription('Ver seu inventário'),
    
    // SOCIAL
    new SlashCommandBuilder().setName('marry').setDescription('Pedir em casamento')
        .addUserOption(o => o.setName('usuario').setDescription('Com quem casar').setRequired(true)),
    new SlashCommandBuilder().setName('divorce').setDescription('Divorciar'),
    new SlashCommandBuilder().setName('rep').setDescription('Dar reputação para alguém (1x/dia)')
        .addUserOption(o => o.setName('usuario').setDescription('Quem recebe +rep').setRequired(true)),
    new SlashCommandBuilder().setName('toprep').setDescription('Ver top 10 reputação'),
    
    // PERFIL & STATS
    new SlashCommandBuilder().setName('profile').setDescription('Ver perfil visual')
        .addUserOption(o => o.setName('usuario').setDescription('De quem ver perfil')),
    new SlashCommandBuilder().setName('level').setDescription('Ver nível e XP')
        .addUserOption(o => o.setName('usuario').setDescription('De quem ver level')),
    new SlashCommandBuilder().setName('stats').setDescription('Ver suas estatísticas completas'),
    new SlashCommandBuilder().setName('badges').setDescription('Ver suas conquistas'),
    new SlashCommandBuilder().setName('leaderboard').setDescription('Ver rankings')
        .addStringOption(o => o.setName('tipo').setDescription('Tipo de ranking').setRequired(true).addChoices(
            { name: 'XP', value: 'xp' },
            { name: 'Coins', value: 'coins' },
            { name: 'Mensagens', value: 'messages' },
            { name: 'Tempo em Call', value: 'voice' }
        )),
    new SlashCommandBuilder().setName('graph').setDescription('Gerar gráfico visual')
        .addStringOption(o => o.setName('tipo').setDescription('Tipo de gráfico').setRequired(true).addChoices(
            { name: 'Atividade Semanal', value: 'activity' },
            { name: 'Top Usuários XP', value: 'topxp' }
        )),
    new SlashCommandBuilder().setName('premium').setDescription('Ver/comprar VIP'),
    
    // IA
    new SlashCommandBuilder().setName('addia').setDescription('Adicionar nova IA')
        .addStringOption(o => o.setName('id').setDescription('ID do OpenRouter').setRequired(true))
        .addStringOption(o => o.setName('nome').setDescription('Nome da IA').setRequired(true))
        .addStringOption(o => o.setName('cor').setDescription('Cor Hex (#0099ff)').setRequired(true))
        .addStringOption(o => o.setName('prompt').setDescription('Prompt de sistema').setRequired(true)),
    new SlashCommandBuilder().setName('delia').setDescription('Deletar uma IA customizada')
        .addStringOption(o => o.setName('nome').setDescription('Nome da IA para deletar').setRequired(true)),
    new SlashCommandBuilder().setName('add-prompt').setDescription('Criar personalidade')
        .addStringOption(o => o.setName('nome').setDescription('Nome da personalidade').setRequired(true))
        .addStringOption(o => o.setName('prompt').setDescription('Prompt de sistema').setRequired(true)),
    new SlashCommandBuilder().setName('setmode').setDescription('Escolher personalidade/preset'),
    new SlashCommandBuilder().setName('reset').setDescription('Limpar memória do canal'),
    new SlashCommandBuilder().setName('resumo').setDescription('IA resume as últimas mensagens'),
    new SlashCommandBuilder().setName('imagine').setDescription('Gerar imagem com IA')
        .addStringOption(o => o.setName('prompt').setDescription('Descrição da imagem').setRequired(true)),
    
    // INTEGRAÇÕES
    new SlashCommandBuilder().setName('weather').setDescription('Ver clima de uma cidade')
        .addStringOption(o => o.setName('cidade').setDescription('Nome da cidade').setRequired(true)),
    new SlashCommandBuilder().setName('crypto').setDescription('Ver preço de criptomoeda')
        .addStringOption(o => o.setName('moeda').setDescription('Ex: bitcoin, ethereum').setRequired(true)),
    new SlashCommandBuilder().setName('avatar').setDescription('Ver avatar de alguém')
        .addUserOption(o => o.setName('usuario').setDescription('De quem ver avatar'))
].map(c => c.toJSON());

// ═══════════════════════════════════════════════════════════════
// 🚀 EVENTO: BOT ONLINE
// ═══════════════════════════════════════════════════════════════
client.once('ready', async () => {
    console.log(`✅ Bot logado como ${client.user.tag}`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ Comandos slash registrados!');
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
    
    client.user.setActivity('🤖 /hub para começar');
});

// ═══════════════════════════════════════════════════════════════
// 🎤 ECONOMIA DE VOZ
// ═══════════════════════════════════════════════════════════════
client.on('voiceStateUpdate', async (oldState, newState) => {
    const user = await getUser(newState.id, newState.guild.id);
    const config = await getConfig(newState.guild.id);
    
    // Entrou em call
    if (!oldState.channelId && newState.channelId) {
        user.voiceJoinTime = Date.now();
        await user.save();
    }
    // Saiu de call
    else if (oldState.channelId && !newState.channelId) {
        if (user.voiceJoinTime) {
            const minutes = Math.floor((Date.now() - user.voiceJoinTime) / 60000);
            const vConfig = config.voiceConfig;
            
            if (minutes >= vConfig.minMinutes) {
                const shouldCount = vConfig.allowMuted || (!oldState.selfMute && !oldState.selfDeaf);
                if (shouldCount) {
                    const coins = minutes * vConfig.coinsPerMin;
                    user.coins += coins;
                    user.voiceMinutes += minutes;
                    
                    // XP por call
                    user.xp += minutes * 5;
                    while (user.xp >= xpForLevel(user.level + 1)) {
                        user.level++;
                    }
                    
                    await user.save();
                    await checkBadges(user);
                }
            }
            user.voiceJoinTime = null;
            await user.save();
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// 💬 SISTEMA DE CHAT COM IA
// ═══════════════════════════════════════════════════════════════
client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;
    
    const config = await getConfig(msg.guild.id);
    
    // Verificar links maliciosos (VirusTotal)
    const links = msg.content.match(/\bhttps?:\/\/\S+/gi);
    if (links && config.allowedChannels.includes(msg.channel.id)) {
        for (const link of links) {
            const safe = await checkVirusTotal(link);
            if (!safe) {
                await msg.delete().catch(() => {});
                return msg.channel.send(`🚫 **SEGURANÇA:** ${msg.author}, link malicioso detectado e removido!`);
            }
        }
    }
    
    // Verificar se canal está autorizado
    if (!config.allowedChannels.includes(msg.channel.id) || config.bannedChannels.includes(msg.channel.id)) {
        // Sistema de XP para mensagens fora do canal de IA
        const user = await getUser(msg.author.id, msg.guild.id);
        user.messages++;
        user.xp += 10;
        while (user.xp >= xpForLevel(user.level + 1)) {
            user.level++;
            // Anunciar level up
            msg.channel.send(`🎉 ${msg.author} subiu para o **Nível ${user.level}**!`).then(m => setTimeout(() => m.delete(), 5000));
        }
        await user.save();
        const earned = await checkBadges(user);
        if (earned.length > 0) {
            msg.channel.send(`🏆 ${msg.author} desbloqueou: ${earned.map(b => `${b.emoji} **${b.name}**`).join(', ')}`).then(m => setTimeout(() => m.delete(), 10000));
        }
        return;
    }
    
    // Preparar conteúdo
    let userContent = msg.content;
    
    // Ler arquivos anexados
    if (msg.attachments.size > 0) {
        for (const [id, attachment] of msg.attachments) {
            if (attachment.contentType?.includes('text') || 
                attachment.name.endsWith('.js') || 
                attachment.name.endsWith('.py') || 
                attachment.name.endsWith('.txt')) {
                try {
                    const res = await fetch(attachment.url);
                    const text = await res.text();
                    userContent += `\n\n[Conteúdo do arquivo ${attachment.name}]:\n${text}`;
                } catch (e) {}
            }
        }
    }
    
    // Ler links
    if (userContent.includes('http')) {
        const url = userContent.match(/\bhttps?:\/\/\S+/gi)?.[0];
        try {
            const webRes = await fetch(url);
            const html = await webRes.text();
            const $ = cheerio.load(html);
            const webText = $('p').text().substring(0, 1000);
            userContent += `\n\n[Resumo do Link]: ${webText}`;
        } catch (e) {}
    }
    
    const aiKey = config.channelAIs[msg.channel.id] || 'deepseek';
    const ia = config.customIAs[aiKey];
    const presetPrompt = config.channelPresets[msg.channel.id] ? 
        ` MODO ATUAL: ${config.channelPresets[msg.channel.id]}` : "";
    
    // Mudar nickname do bot
    if (msg.guild.members.me.permissions.has(PermissionFlagsBits.ChangeNickname)) {
        msg.guild.members.me.setNickname(`Birutas | ${ia.name}`).catch(() => {});
    }
    
    // Mudar cargo do bot
    if (msg.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        let role = msg.guild.roles.cache.find(r => r.name === ia.name);
        if (!role) {
            role = await msg.guild.roles.create({
                name: ia.name,
                color: ia.color,
                reason: 'IA do Birutas Bot'
            }).catch(() => null);
        }
        if (role) {
            await msg.guild.members.me.roles.add(role).catch(() => {});
        }
    }
    
    const thinking = await msg.reply("⏳ **Pensando...**");
    
    // Buscar memória
    let memory = await Memory.findOne({ channelId: msg.channel.id });
    if (!memory) {
        memory = new Memory({ channelId: msg.channel.id, messages: [] });
    }
    
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: ia.id,
                messages: [
                    { role: "system", content: ia.prompt + presetPrompt },
                    ...memory.messages.slice(-6),
                    { role: "user", content: userContent }
                ]
            })
        });
        
        const data = await response.json();
        const reply = data.choices[0].message.content;
        
        // Atualizar memória
        memory.messages.push(
            { role: "user", content: msg.content },
            { role: "assistant", content: reply }
        );
        if (memory.messages.length > 20) memory.messages = memory.messages.slice(-20);
        await memory.save();
        
        // Botões de controle
        const components = getAIButtons(config, msg.channel.id);
        
        // Botão Snapshot se houver código
        if (reply.includes('```')) {
            const snapRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('snapshot')
                    .setLabel('📸 Snapshot')
                    .setStyle(ButtonStyle.Primary)
            );
            components.push(snapRow);
        }
        
        await thinking.edit({ content: reply, components });
        
        // XP por usar IA
        const user = await getUser(msg.author.id, msg.guild.id);
        user.messages++;
        user.xp += 15;
        while (user.xp >= xpForLevel(user.level + 1)) {
            user.level++;
        }
        await user.save();
        await checkBadges(user);
        
    } catch (e) {
        console.error('Erro na IA:', e);
        await thinking.edit("❌ Erro ao consultar a IA. Tente novamente.");
    }
});

// ═══════════════════════════════════════════════════════════════
// 🎮 PROCESSAMENTO DE COMANDOS E INTERAÇÕES (O QUE FALTAVA)
// ═══════════════════════════════════════════════════════════════

client.on('interactionCreate', async interaction => {
    if (!interaction.guild) return;

    const config = await getConfig(interaction.guildId);
    const user = await getUser(interaction.user.id, interaction.guildId);

    // 1️⃣ TRATAMENTO DE COMANDOS SLASH (/)
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // --- COMANDO HUB ---
        if (commandName === 'hub') {
            const embed = new EmbedBuilder()
                .setTitle('🛡️ Central de Comando - Birutas AI')
                .setColor(user.profileColor || '#0099ff')
                .setDescription('Use os botões abaixo para gerenciar a IA ou use os comandos `/` para economia.');
            
            return interaction.reply({ 
                embeds: [embed], 
                components: getAIButtons(config, interaction.channelId) 
            });
        }

        // --- COMANDO DAILY ---
        if (commandName === 'daily') {
            const now = Date.now();
            const cooldown = 86400000; 
            if (user.lastDaily && (now - user.lastDaily) < cooldown) {
                return interaction.reply({ content: "⏳ Você já coletou seu daily hoje!", ephemeral: true });
            }
            user.coins += 500;
            user.lastDaily = now;
            await user.save();
            return interaction.reply(`💰 **Daily resgatado!** Você recebeu **500 coins**.`);
        }

        // --- COMANDO WORK (TRABALHAR) ---
        if (commandName === 'work') {
            const now = Date.now();
            const cooldown = 3600000; // 1 hora
            if (user.lastWork && (now - user.lastWork) < cooldown) {
                return interaction.reply({ content: "👷 Você está cansado! Trabalhe novamente em 1 hora.", ephemeral: true });
            }
            const ganho = Math.floor(Math.random() * (300 - 100 + 1)) + 100;
            user.coins += ganho;
            user.lastWork = now;
            await user.save();
            return interaction.reply(`⚒️ Você trabalhou como desenvolvedor e ganhou **${ganho} coins**!`);
        }

        // --- COMANDO CRIME ---
        if (commandName === 'crime') {
            const now = Date.now();
            const cooldown = 7200000; // 2 horas
            if (user.lastCrime && (now - user.lastCrime) < cooldown) {
                return interaction.reply({ content: "🚓 A polícia está te vigiando. Espere 2 horas.", ephemeral: true });
            }
            
            const sucesso = Math.random() > 0.5;
            user.lastCrime = now;

            if (sucesso) {
                const ganho = Math.floor(Math.random() * 800) + 200;
                user.coins += ganho;
                await user.save();
                return interaction.reply(`🥷 Sucesso! Você assaltou uma lojinha e levou **${ganho} coins**.`);
            } else {
                const multa = 300;
                user.coins = Math.max(0, user.coins - multa);
                await user.save();
                return interaction.reply(`👮 Perdeu! Você foi pego e pagou **${multa} coins** de fiança.`);
            }
        }

        // --- COMANDO PROFILE ---
        if (commandName === 'profile') {
            await interaction.deferReply();
            const target = interaction.options.getUser('usuario') || interaction.user;
            const targetMember = await interaction.guild.members.fetch(target.id);
            const targetData = await getUser(target.id, interaction.guildId);
            
            const buffer = await generateProfile(targetData, targetMember);
            const attachment = new AttachmentBuilder(buffer, { name: 'profile.png' });
            return interaction.editReply({ files: [attachment] });
        }

        // --- COMANDO RESET ---
        if (commandName === 'reset') {
            await Memory.deleteOne({ channelId: interaction.channelId });
            return interaction.reply("🧠 **Memória limpa!** A IA esqueceu as conversas deste canal.");
        }

        // --- COMANDO COINS ---
        if (commandName === 'coins') {
            return interaction.reply(`🪙 Você possui **${user.coins.toLocaleString()}** Birutas Coins.`);
        }
        
        // --- COMANDO CONFIG (AUTORIZAR CANAL) ---
        if (commandName === 'config') {
            if (!isAdmin(interaction.member, config)) return interaction.reply("❌ Apenas admins!");
            if (!config.allowedChannels.includes(interaction.channelId)) {
                config.allowedChannels.push(interaction.channelId);
                await config.save();
                return interaction.reply("✅ Canal autorizado para uso da IA!");
            }
            return interaction.reply("ℹ️ Este canal já está autorizado.");
        }
    }

    // 2️⃣ TRATAMENTO DE INTERAÇÕES DE BOTÃO
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('setia_')) {
            const aiKey = interaction.customId.replace('setia_', '');
            if (!config.channelAIs) config.channelAIs = {};
            config.channelAIs[interaction.channelId] = aiKey;
            
            const ia = config.customIAs[aiKey];
            if (interaction.guild.members.me.permissions.has(PermissionFlagsBits.ChangeNickname)) {
                await interaction.guild.members.me.setNickname(`Birutas | ${ia.name}`).catch(() => {});
            }

            config.markModified('channelAIs');
            await config.save();
            return interaction.reply({ content: `✅ IA alterada para **${ia.name}**n neste canal.`, ephemeral: true });
        }

        if (interaction.customId === 'snapshot') {
            const memory = await Memory.findOne({ channelId: interaction.channelId });
            if (!memory) return interaction.reply({ content: "Sem memória.", ephemeral: true });
            const resumo = memory.messages.slice(-3).map(m => `**${m.role}:** ${m.content.substring(0, 50)}...`).join('\n');
            return interaction.reply({ content: `📸 **Snapshot:**\n${resumo}`, ephemeral: true });
        }
    }
});

// 🚀 LOGIN FINAL
client.login(process.env.DISCORD_TOKEN);


