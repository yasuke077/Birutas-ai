const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, REST, Routes, SlashCommandBuilder, 
    PermissionFlagsBits 
} = require('discord.js');
const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');

// --- MONITORAMENTO ---
const app = express();
app.get('/', (req, res) => res.send('Birutas PRO Online! 🛡️'));
app.listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// --- DATABASE ---
const DB_FILE = './database.json';
const activeRequests = new Map();

let db = { 
    allowedChannels: [], adminRole: null, logChannel: null,
    channelAIs: {}, channelPresets: {}, memory: {}, economy: {}, 
    lastDaily: {}, presets: {},
    voiceConfig: { coinsPerMin: 10, allowMuted: false },
    customIAs: {
        deepseek: { id: "deepseek/deepseek-chat", name: "DeepSeek R1", prompt: "Você é o DeepSeek R1." },
        venice: { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", name: "Venice", prompt: "Você é a Venice." }
    }
};

if (fs.existsSync(DB_FILE)) {
    try { db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE)) }; } catch (e) {}
}
const saveDB = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

// --- LÓGICA DE BOTÕES (CONTROLE TOTAL) ---
function getControlButtons(channelId) {
    const rows = [];
    let row = new ActionRowBuilder();
    
    // Botões de Troca Rápida de IA
    Object.keys(db.customIAs).forEach((key) => {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`setia_${key}`)
                .setLabel(db.customIAs[key].name)
                .setStyle(db.channelAIs[channelId] === key ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );
    });

    // BOTÃO VERMELHO: Só aparece se houver uma personalidade ativa
    if (db.channelPresets[channelId]) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('restore_default')
                .setLabel('Restaurar Padrão')
                .setStyle(ButtonStyle.Danger)
        );
    }

    rows.push(row);
    return rows;
}

// --- ECONOMIA EM TEMPO REAL ---
setInterval(() => {
    client.guilds.cache.forEach(guild => {
        guild.voiceStates.cache.forEach(vs => {
            if (vs.member.user.bot || !vs.channelId) return;
            if (!db.voiceConfig.allowMuted && (vs.selfMute || vs.serverMute)) return;
            db.economy[vs.id] = (db.economy[vs.id] || 0) + (db.voiceConfig.coinsPerMin || 10);
        });
    });
    saveDB();
}, 60000);

// --- REGISTRO DE COMANDOS ---
const commands = [
    new SlashCommandBuilder().setName('hub').setDescription('Menu de comandos'),
    new SlashCommandBuilder().setName('rank').setDescription('Top 10 mais ricos'),
    new SlashCommandBuilder().setName('coins').setDescription('Ver seu saldo'),
    new SlashCommandBuilder().setName('daily').setDescription('Resgate moedas (24h)'),
    new SlashCommandBuilder().setName('setmode').setDescription('Escolher Personalidade'),
    new SlashCommandBuilder().setName('add-prompt').setDescription('Criar Personalidade')
        .addStringOption(o => o.setName('nome').setDescription('Nome do preset').setRequired(true))
        .addStringOption(o => o.setName('prompt').setDescription('Prompt da personalidade').setRequired(true)),
    new SlashCommandBuilder().setName('resumo').setDescription('Resumir chat'),
    new SlashCommandBuilder().setName('imagine').setDescription('Prompt para imagem')
        .addStringOption(o => o.setName('tema').setDescription('O que imaginar').setRequired(true)),
    new SlashCommandBuilder().setName('config').setDescription('Ativar IA aqui'),
    new SlashCommandBuilder().setName('reset').setDescription('Limpar memória do chat'),
    new SlashCommandBuilder().setName('permissao').setDescription('Configurar ADM')
        .addRoleOption(o => o.setName('cargo').setDescription('Cargo ADM').setRequired(true))
].map(c => c.toJSON());

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("🛡️ Birutas PRO Ativo!");
});

// --- CHAT E IA ---
client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !db.allowedChannels.includes(msg.channel.id)) return;

    const controller = new AbortController();
    const iaKey = db.channelAIs[msg.channel.id] || 'deepseek';
    const iaBase = db.customIAs[iaKey];
    
    // Sistema de Personalidade: Usa o preset se houver, senão usa o padrão da IA
    const activePrompt = db.channelPresets[msg.channel.id] || iaBase.prompt;

    const thinkingMsg = await msg.reply({ 
        content: "🤖 **Pensando...**", 
        components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('stop_gen').setLabel('Parar').setStyle(ButtonStyle.Danger)
        )] 
    });
    activeRequests.set(thinkingMsg.id, controller);

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST", signal: controller.signal,
            headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ 
                model: iaBase.id, 
                messages: [
                    { role: "system", content: activePrompt }, 
                    ...(db.memory[msg.channel.id] || []).slice(-6), 
                    { role: "user", content: msg.content }
                ] 
            })
        });

        const data = await response.json();
        const reply = data.choices[0].message.content;

        const comps = getControlButtons(msg.channel.id);
        if (reply.includes('```')) comps[0].addComponents(new ButtonBuilder().setCustomId('snapshot').setLabel('Snapshot').setStyle(ButtonStyle.Primary));

        await thinkingMsg.edit({ content: reply, components: comps });
        db.memory[msg.channel.id] = [...(db.memory[msg.channel.id] || []), { role: "user", content: msg.content }, { role: "assistant", content: reply }];
        saveDB();
    } catch (e) {
        thinkingMsg.edit({ content: "❌ Geração interrompida ou erro na API.", components: [] });
    } finally { activeRequests.delete(thinkingMsg.id); }
});

// --- INTERAÇÕES ---
client.on('interactionCreate', async (int) => {
    const isAdm = int.member.permissions.has(PermissionFlagsBits.Administrator) || (db.adminRole && int.member.roles.cache.has(db.adminRole));

    if (int.isButton()) {
        if (int.customId === 'stop_gen') {
            activeRequests.get(int.message.id)?.abort();
            return int.reply({ content: "Parando...", ephemeral: true });
        }
        if (int.customId.startsWith('setia_')) {
            db.channelAIs[int.channelId] = int.customId.replace('setia_', '');
            saveDB();
            return int.reply({ content: "✅ Modelo de IA alterado!", ephemeral: true });
        }
        if (int.customId === 'restore_default') {
            delete db.channelPresets[int.channelId];
            saveDB();
            return int.reply({ content: "🔄 Personalidade restaurada para o padrão!", ephemeral: true });
        }
        if (int.customId.startsWith('setpreset_')) {
            const pName = int.customId.replace('setpreset_', '');
            db.channelPresets[int.channelId] = db.presets[pName];
            saveDB();
            return int.update({ content: `🎭 Agora agindo como: **${pName}**`, components: [] });
        }
    }

    if (int.isChatInputCommand()) {
        if (int.commandName === 'add-prompt') {
            db.presets[int.options.getString('nome')] = int.options.getString('prompt');
            saveDB();
            return int.reply(`✅ Preset **${int.options.getString('nome')}** criado!`);
        }
        if (int.commandName === 'setmode') {
            const keys = Object.keys(db.presets);
            if (!keys.length) return int.reply("Crie um preset primeiro com `/add-prompt`.");
            const row = new ActionRowBuilder();
            keys.slice(0, 5).forEach(k => row.addComponents(new ButtonBuilder().setCustomId(`setpreset_${k}`).setLabel(k).setStyle(ButtonStyle.Success)));
            return int.reply({ content: "Escolha uma personalidade:", components: [row] });
        }
        if (int.commandName === 'daily') {
            const now = Date.now();
            const last = db.lastDaily[int.user.id] || 0;
            if (now - last < 86400000) return int.reply("⏳ Volte em 24h!");
            db.economy[int.user.id] = (db.economy[int.user.id] || 0) + 500;
            db.lastDaily[int.user.id] = now;
            saveDB();
            return int.reply("💰 +500 Coins!");
        }
        if (int.commandName === 'rank') {
            const sorted = Object.entries(db.economy).sort(([,a],[,b]) => b - a).slice(0, 10);
            const list = sorted.map(([id, val], i) => `${i+1}º <@${id}> - 💰 ${val}`).join('\n');
            return int.reply({ embeds: [new EmbedBuilder().setTitle("🏆 Rank").setDescription(list || "Vazio")] });
        }
        if (int.commandName === 'config' && isAdm) {
            if (!db.allowedChannels.includes(int.channelId)) db.allowedChannels.push(int.channelId);
            saveDB();
            return int.reply("✅ Canal ativo.");
        }
        if (int.commandName === 'coins') return int.reply(`Saldo: ${db.economy[int.user.id] || 0}`);
        if (int.commandName === 'reset') { db.memory[int.channelId] = []; saveDB(); return int.reply("🧹 Resetado."); }
    }
});

client.login(process.env.DISCORD_TOKEN);
