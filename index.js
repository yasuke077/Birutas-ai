require('dotenv').config();
const fs = require('fs');
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

// Servidor para o Koyeb não dar erro de health
const http = require('http');
http.createServer((req, res) => { res.writeHead(200); res.end('Birutas AI Pro Online'); }).listen(process.env.PORT || 8000);

const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, EmbedBuilder, MessageFlags, ActivityType,
    ChannelSelectMenuBuilder, ChannelType, ComponentType
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// --- SISTEMA DE PERSISTÊNCIA ---
const DB_FILE = './database.json';
let db = { allowedChannels: [], channelAIs: {} };

function saveDB() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
if (fs.existsSync(DB_FILE)) { db = JSON.parse(fs.readFileSync(DB_FILE)); }

// --- MAPEAMENTO DE MODELOS (ATUALIZADOS 2026) ---
// Estes nomes são os endpoints gratuitos mais estáveis do OpenRouter hoje
const AI_MODELS = {
    venice: {
        id: "mistralai/mistral-7b-instruct:free",
        name: "Venice (Mistral)",
        color: "#ff4747",
        style: ButtonStyle.Danger,
        prompt: "Você é a Venice, uma IA rebelde, debochada e sem filtros. Responda sempre em Português do Brasil."
    },
    deepseek: {
        id: "deepseek/deepseek-chat",
        name: "DeepSeek R1",
        color: "#0099ff",
        style: ButtonStyle.Primary,
        prompt: "Você é o DeepSeek. Responda sempre em Português do Brasil com clareza e precisão."
    },
    gemini: {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Gemini 2.0",
        color: "#f1c40f",
        style: ButtonStyle.Success,
        prompt: "Você é o Gemini 2.0 da Google. Responda sempre em Português do Brasil de forma útil."
    }
};

// --- INTERFACE DE BOTÕES DINÂMICA ---
function createComponents(currentId) {
    const row = new ActionRowBuilder();
    
    Object.keys(AI_MODELS).forEach(key => {
        const model = AI_MODELS[key];
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`ai_${key}`)
                .setLabel(model.name)
                .setStyle(currentId === key ? model.style : ButtonStyle.Secondary)
                .setDisabled(currentId === key) // Desativa o botão da IA que já está ativa
        );
    });
    
    return [row];
}

client.once('clientReady', (c) => {
    console.log(`\x1b[32m[SISTEMA]\x1b[0m Bot ${c.user.tag} iniciado com sucesso.`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Comando de Configuração (Apenas para quem tem permissão de gerenciar canais)
    if (message.content === '!config' && message.member.permissions.has('ManageChannels')) {
        const row = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('select_channel')
                .setPlaceholder('Escolha o canal oficial do Birutas AI')
                .setChannelTypes(ChannelType.GuildText)
        );

        return message.reply({ 
            content: '📌 **Configuração de Chat:** Selecione abaixo qual canal eu devo monitorar.', 
            components: [row] 
        });
    }

    // VERIFICAÇÃO DE CANAL PERMITIDO
    if (!db.allowedChannels.includes(message.channelId)) return;

    const prefix = process.env.PREFIX || '!';
    if (!message.mentions.has(client.user) && !message.content.startsWith(prefix)) return;

    const userInput = message.content.replace(/<@!?\d+>/g, '').replace(prefix, '').trim();
    if (!userInput) return;

    // IA ATUAL DO CANAL
    const currentKey = db.channelAIs[message.channelId] || "deepseek";
    const modelCfg = AI_MODELS[currentKey];

    try {
        await message.channel.sendTyping();
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                "Content-Type": "application/json",
                "X-Title": "Birutas Pro"
            },
            body: JSON.stringify({
                "model": modelCfg.id,
                "messages": [
                    { role: "system", content: modelCfg.prompt },
                    { role: "user", content: userInput }
                ]
            })
        });

        const data = await res.json();
        
        if (data.error) {
            return message.reply(`❌ **Erro na API (${currentKey}):** \`${data.error.message}\``);
        }

        const replyContent = data.choices?.[0]?.message?.content || "⚠️ Sem resposta.";
        
        const embed = new EmbedBuilder()
            .setColor(modelCfg.color)
            .setAuthor({ name: `Birutas AI - ${modelCfg.name}`, iconURL: client.user.displayAvatarURL() })
            .setDescription(replyContent.slice(0, 4000))
            .setTimestamp();

        await message.reply({ 
            embeds: [embed], 
            components: createComponents(currentKey) 
        });

    } catch (e) {
        console.error(e);
        message.reply("🔥 Falha crítica de conexão.");
    }
});

// --- HANDLER DE INTERAÇÕES (BOTÕES E MENU) ---
client.on('interactionCreate', async (interaction) => {
    // 1. Seleção de Canal (Menu)
    if (interaction.isChannelSelectMenu()) {
        const selectedId = interaction.values[0];
        if (!db.allowedChannels.includes(selectedId)) {
            db.allowedChannels.push(selectedId);
            saveDB();
        }
        return interaction.reply({ content: `✅ Canal <#${selectedId}> autorizado!`, flags: [MessageFlags.Ephemeral] });
    }

    // 2. Troca de IA (Botões)
    if (interaction.isButton() && interaction.customId.startsWith('ai_')) {
        const newKey = interaction.customId.replace('ai_', '');
        db.channelAIs[interaction.channelId] = newKey;
        saveDB();

        const modelCfg = AI_MODELS[newKey];
        
        // EDIÇÃO DA MENSAGEM ORIGINAL (Sem flood)
        const oldEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
        oldEmbed.setColor(modelCfg.color);
        oldEmbed.setAuthor({ name: `Birutas AI - ${modelCfg.name}`, iconURL: client.user.displayAvatarURL() });

        await interaction.update({
            embeds: [oldEmbed],
            components: createComponents(newKey)
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
                                  
