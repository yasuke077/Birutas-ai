// --- FIX PARA NODE 18 (Cria a classe File que está faltando) ---
if (typeof File === 'undefined') {
    const { Blob } = require('buffer');
    global.File = class File extends Blob {
        constructor(parts, filename, options = {}) {
            super(parts, options);
            this.name = filename;
            this.lastModified = Date.now();
        }
        get [Symbol.toStringTag]() { return 'File'; }
    };
}

const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, 
    REST, Routes, SlashCommandBuilder, AttachmentBuilder 
} = require('discord.js');
const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const cheerio = require('cheerio');

// --- MONITORAMENTO (RAILWAY FREE) ---
const app = express();
app.get('/', (req, res) => res.send('Birutas AI Online! 🚀'));
app.listen(process.env.PORT || 3000);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// --- BANCO DE DADOS ---
const DB_FILE = './database.json';
let db = { 
    allowedChannels: [], channelAIs: {}, memory: {}, channelPresets: {},
    customIAs: {
        deepseek: { id: "deepseek/deepseek-chat", name: "DeepSeek", color: "#0099ff", prompt: "Você é o DeepSeek." }
    },
    presets: {} 
};
if (fs.existsSync(DB_FILE)) try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch (e) {}
function saveDB() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

// --- REGISTRO DE COMANDOS DE BARRA (SLASH) ---
const commands = [
    new SlashCommandBuilder().setName('hub').setDescription('Painel central do Birutas'),
    new SlashCommandBuilder().setName('config').setDescription('Define o canal de chat'),
    new SlashCommandBuilder().setName('addia')
        .setDescription('Adiciona uma nova IA')
        .addStringOption(o => o.setName('id').setDescription('ID do OpenRouter').setRequired(true))
        .addStringOption(o => o.setName('nome').setDescription('Nome da IA').setRequired(true))
        .addStringOption(o => o.setName('cor').setDescription('Cor Hex (#ffffff)').setRequired(true))
        .addStringOption(o => o.setName('prompt').setDescription('Personalidade').setRequired(true)),
    new SlashCommandBuilder().setName('addpreset')
        .setDescription('Cria um modo personalizado')
        .addStringOption(o => o.setName('nome').setDescription('Nome do Modo').setRequired(true))
        .addStringOption(o => o.setName('instrucoes').setDescription('O que esse modo faz').setRequired(true)),
    new SlashCommandBuilder().setName('setmode').setDescription('Escolhe um preset/modo para o canal'),
    new SlashCommandBuilder().setName('reset').setDescription('Limpa a memória do canal atual')
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`Logado como ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Slash Commands registrados!');
    } catch (error) { console.error(error); }
});

// --- LÓGICA DE BOTÕES ---
function getAiButtons(channelId) {
    const currentAi = db.channelAIs[channelId] || 'deepseek';
    const rows = [];
    let currentRow = new ActionRowBuilder();
    const keys = Object.keys(db.customIAs);
    keys.forEach((key, i) => {
        if (i > 0 && i % 5 === 0) { rows.push(currentRow); currentRow = new ActionRowBuilder(); }
        currentRow.addComponents(new ButtonBuilder()
            .setCustomId(`setia_${key}`).setLabel(db.customIAs[key].name)
            .setStyle(currentAi === key ? ButtonStyle.Success : ButtonStyle.Secondary));
    });
    if (currentRow.components.length > 0) rows.push(currentRow);
    return rows;
}

// --- TRATAMENTO DE MENSAGENS (CHAT) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !db.allowedChannels.includes(message.channel.id)) return;

    let userContent = message.content;

    // LER ARQUIVOS (TXT, JS, etc)
    if (message.attachments.size > 0) {
        for (const [id, attachment] of message.attachments) {
            if (attachment.contentType?.includes('text') || attachment.name.endsWith('.js') || attachment.name.endsWith('.py')) {
                const res = await fetch(attachment.url);
                const text = await res.text();
                userContent += `\n\n[Conteúdo do arquivo ${attachment.name}]:\n${text}`;
            }
        }
    }

    // LER LINKS
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

    const aiKey = db.channelAIs[message.channel.id] || 'deepseek';
    const model = db.customIAs[aiKey];
    const presetPrompt = db.channelPresets[message.channel.id] ? ` MODO ATUAL: ${db.channelPresets[message.channel.id]}` : "";

    const thinking = await message.reply("⏳ Processando...");
    
    if (!db.memory[message.channel.id]) db.memory[message.channel.id] = [];
    const context = db.memory[message.channel.id];

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model.id,
                messages: [{ role: "system", content: model.prompt + presetPrompt }, ...context, { role: "user", content: userContent }]
            })
        });
        const data = await response.json();
        const text = data.choices[0].message.content;

        context.push({ role: "user", content: message.content }, { role: "assistant", content: text });
        if (context.length > 10) context.splice(0, 2);
        saveDB();

        const embed = new EmbedBuilder().setDescription(text).setColor(model.color).setAuthor({ name: model.name });
        
        // BOTÃO SNAPSHOT (Se houver código)
        const components = getAiButtons(message.channel.id);
        if (text.includes('```')) {
            const snapBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('snapshot').setLabel('📸 Gerar Snapshot').setStyle(ButtonStyle.Primary)
            );
            components.push(snapBtn);
        }

        await thinking.edit({ content: null, embeds: [embed], components });
    } catch (e) { await thinking.edit("❌ Erro ao consultar IA."); }
});

// --- INTERAÇÕES (SLASH + BOTÕES + MENU) ---
client.on('interactionCreate', async (int) => {
    if (int.isChatInputCommand()) {
        if (int.commandName === 'hub') {
            await int.reply({ content: "🎮 **Birutas Central**\nUse `/config` para o canal ou botões para IAs.", components: getAiButtons(int.channelId) });
        }
        
        if (int.commandName === 'addia') {
            const [id, nome, cor, prompt] = [int.options.getString('id'), int.options.getString('nome'), int.options.getString('cor'), int.options.getString('prompt')];
            db.customIAs[nome.toLowerCase()] = { id, name: nome, color: cor, prompt };
            saveDB();
            await int.reply(`✅ IA **${nome}** cadastrada!`);
        }

        if (int.commandName === 'addpreset') {
            const nome = int.options.getString('nome');
            db.presets[nome] = int.options.getString('instrucoes');
            saveDB();
            await int.reply(`✨ Preset **${nome}** criado!`);
        }

        if (int.commandName === 'setmode') {
            const options = Object.keys(db.presets).map(p => ({ label: p, value: p }));
            if (options.length === 0) return int.reply("Nenhum preset criado. Use `/addpreset`.");
            
            const menu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder().setCustomId('select_preset').setPlaceholder('Escolha um modo').addOptions(options)
            );
            const btns = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('clear_mode').setLabel('🔄 Restaurar Padrão').setStyle(ButtonStyle.Danger)
            );
            await int.reply({ content: "🛠️ **Modos Disponíveis:**", components: [menu, btns] });
        }

        if (int.commandName === 'reset') {
            db.memory[int.channelId] = [];
            saveDB();
            await int.reply("🧠 Memória do canal limpa!");
        }

        if (int.commandName === 'config') {
            if (!db.allowedChannels.includes(int.channelId)) db.allowedChannels.push(int.channelId);
            saveDB();
            await int.reply("📍 Este canal agora é oficial do Birutas AI!");
        }
    }

    // --- INTERAÇÕES DE BOTÃO/MENU ---
    if (int.isButton()) {
        if (int.customId.startsWith('setia_')) {
            const key = int.customId.replace('setia_', '');
            db.channelAIs[int.channelId] = key;
            saveDB();
            await int.update({ components: getAiButtons(int.channelId) });
        }
        if (int.customId === 'clear_mode') {
            delete db.channelPresets[int.channelId];
            saveDB();
            await int.update({ content: "✅ Voltamos ao padrão da IA!", components: [] });
        }
        if (int.customId === 'snapshot') {
            await int.reply("📸 Snapshot em alta definição seria gerado aqui! (Requer API de Canvas ou Carbon)");
        }
    }

    if (int.isStringSelectMenu() && int.customId === 'select_preset') {
        db.channelPresets[int.channelId] = db.presets[int.values[0]];
        saveDB();
        await int.update({ content: `🚀 Modo **${int.values[0]}** ativado neste canal!`, components: [] });
    }
});

client.login(process.env.DISCORD_TOKEN);
