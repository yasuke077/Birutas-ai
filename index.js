const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const http = require('http');
const port = process.env.PORT || 8000;
http.createServer((req, res) => { res.writeHead(200); res.end('Monitor Ativo'); }).listen(port);

require('dotenv').config();
const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags 
} = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const botSettings = new Map();

// --- TESTADOR DE CHAVES AO INICIAR ---
async function testKeys() {
    console.log("🔍 Iniciando teste de APIs...");
    
    // Teste OpenRouter
    try {
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
            headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}` }
        });
        const data = await res.json();
        if (data.data) console.log("✅ OpenRouter: Chave Válida!");
        else console.log("❌ OpenRouter: Chave Inválida ou Sem Saldo.");
    } catch (e) { console.log("❌ OpenRouter: Erro de conexão."); }

    // Teste Gemini
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await model.generateContent("Oi");
        console.log("✅ Gemini: Chave Válida!");
    } catch (e) { 
        console.log("❌ Gemini: Erro 404 ou Chave Inválida. Tentando formato alternativo...");
    }
}

client.once('ready', async (c) => {
    console.log(`🚀 Bot Online: ${c.user.tag}`);
    await testKeys();
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const prefix = process.env.PREFIX || '!';
    if (!message.mentions.has(client.user) && !message.content.startsWith(prefix)) return;

    const userInput = message.content.replace(/<@!?\d+>/g, '').replace(prefix, '').trim();
    if (!userInput) return;

    if (!botSettings.has(message.channel.id)) botSettings.set(message.channel.id, "venice");
    let currentAI = botSettings.get(message.channel.id);

    try {
        await message.channel.sendTyping();
        let aiReply = "";
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

        if (currentAI === "venice") {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    "model": "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
                    "messages": [{ role: "user", content: userInput }]
                })
            });
            const data = await res.json();
            aiReply = data.choices?.[0]?.message?.content || "Erro na Venice. Verifique o saldo/chave.";
        } else if (currentAI === "deepseek") {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    "model": "deepseek/deepseek-r1:free",
                    "messages": [{ role: "user", content: userInput }]
                })
            });
            const data = await res.json();
            aiReply = data.choices?.[0]?.message?.content || "Erro no DeepSeek.";
        } else {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            // Tentativa de correção automática de nome de modelo
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(userInput);
            aiReply = result.response.text();
        }

        const embed = new EmbedBuilder()
            .setColor(currentAI === 'venice' ? "#FF0000" : "#0099FF")
            .setTitle(`IA: ${currentAI.toUpperCase()}`)
            .setDescription(aiReply.slice(0, 4000));

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('set_venice').setLabel('Venice').setStyle(currentAI === 'venice' ? ButtonStyle.Danger : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('set_deepseek').setLabel('DeepSeek').setStyle(currentAI === 'deepseek' ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('set_gemini').setLabel('Gemini').setStyle(currentAI === 'gemini' ? ButtonStyle.Success : ButtonStyle.Secondary)
        );

        await message.reply({ embeds: [embed], components: [row] });

    } catch (e) {
        console.error(e);
        message.reply("❌ Falha crítica na API selecionada.");
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    botSettings.set(interaction.channelId, interaction.customId.replace('set_', ''));
    await interaction.reply({ content: "✅ IA Alterada!", flags: [MessageFlags.Ephemeral] });
});

client.login(process.env.DISCORD_TOKEN);
