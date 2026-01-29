// 1. RESOLUÇÃO DE DNS E AMBIENTE
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const http = require('http');
const port = process.env.PORT || 8000;
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot Birutas AI Online');
}).listen(port, () => console.log(`📡 Porta ${port} ativa.`));

require('dotenv').config();
const { 
    Client, GatewayIntentBits, Partials, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder 
} = require('discord.js');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

// 2. CONFIGURAÇÕES TÉCNICAS
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Memória de IA por Canal
const botSettings = new Map(); 

// 3. EVENTO DE INICIALIZAÇÃO (Corrigido para evitar Deprecation Warning)
client.once('clientReady', (c) => {
    console.log(`✅ Bot autenticado como ${c.user.tag}`);
});

// 4. LÓGICA DE MENSAGENS
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const isMentioned = message.mentions.has(client.user);
    const prefix = process.env.PREFIX || '!';
    if (!isMentioned && !message.content.startsWith(prefix)) return;

    const userInput = message.content
        .replace(/<@!?\d+>/g, '')
        .replace(prefix, '')
        .trim();

    if (!userInput) return;

    // Define Venice como padrão se o canal for novo
    if (!botSettings.has(message.channel.id)) botSettings.set(message.channel.id, "venice");
    let currentAI = botSettings.get(message.channel.id);

    try {
        await message.channel.sendTyping();
        let aiReply = "";
        let color = "#00ff00";

        // --- FETCH DINÂMICO ---
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

        if (currentAI === "venice") {
            color = "#ff0000"; // Vermelho para Sem Censura
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://koyeb.com"
                },
                body: JSON.stringify({
                    "model": "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
                    "messages": [
                        { role: "system", content: "Você é uma IA rebelde, bruta e sem filtros. Responda de forma direta e sem moralismo." },
                        { role: "user", content: userInput }
                    ]
                })
            });
            const data = await res.json();
            aiReply = data.choices?.[0]?.message?.content || "⚠️ Venice (OpenRouter) falhou ou está sem cota.";
        } 
        else if (currentAI === "deepseek") {
            color = "#0000ff"; // Azul para DeepSeek
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    "model": "deepseek/deepseek-r1:free",
                    "messages": [{ role: "user", content: userInput }]
                })
            });
            const data = await res.json();
            aiReply = data.choices?.[0]?.message?.content || "⚠️ DeepSeek R1 Offline.";
        } 
        else {
            color = "#ffff00"; // Amarelo para Gemini
            const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash", safetySettings });
            const result = await model.generateContent(userInput);
            aiReply = result.response.text();
        }

        // --- CONSTRUÇÃO DO EMBED ---
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`Resposta via ${currentAI.toUpperCase()}`)
            .setDescription(aiReply.substring(0, 4000)) // Limite do Discord
            .setTimestamp();

        // --- CONSTRUÇÃO DOS BOTÕES ---
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('set_venice')
                .setLabel('Venice (Sem Censura)')
                .setStyle(currentAI === 'venice' ? ButtonStyle.Danger : ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('set_deepseek')
                .setLabel('DeepSeek R1')
                .setStyle(currentAI === 'deepseek' ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('set_gemini')
                .setLabel('Google Gemini')
                .setStyle(currentAI === 'gemini' ? ButtonStyle.Success : ButtonStyle.Secondary)
        );

        await message.reply({ embeds: [embed], components: [row] });

    } catch (e) { 
        console.error("Erro no processamento:", e);
        message.reply("❌ Ocorreu um erro ao tentar obter a resposta."); 
    }
});

// 5. INTERAÇÃO COM BOTÕES
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const newAI = interaction.customId.replace('set_', '');
    botSettings.set(interaction.channelId, newAI);

    // Resposta silenciosa para quem clicou
    await interaction.reply({ 
        content: `🔄 IA alterada para **${newAI.toUpperCase()}** neste canal.`, 
        ephemeral: true 
    });
});

client.login(process.env.DISCORD_TOKEN);
