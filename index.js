// 1. RESOLUÇÃO DE DNS PARA DISCORD
const dns = require('node:dns');
const originalLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
    if (hostname.includes('discord.com') || hostname.includes('gateway.discord.gg')) {
        const discordIP = '162.159.138.232'; 
        if (typeof options === 'function') return options(null, discordIP, 4);
        return callback(null, discordIP, 4);
    }
    return originalLookup(hostname, options, callback);
};
dns.setDefaultResultOrder('ipv4first');

// 2. SERVIDOR WEB
const http = require('http');
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Multi-IA Ativo');
}).listen(7860);

// 3. DEPENDÊNCIAS
require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const TOKEN = process.env.DISCORD_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const PREFIX = process.env.PREFIX || '!';

// CONFIGURAÇÃO GOOGLE (DIRETO)
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel]
});

const memory = new Map();

client.once('ready', () => console.log(`🚀 Sistema Multi-IA iniciado como ${client.user.tag}`));

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const isMentioned = message.mentions.has(client.user);
    const hasPrefix = message.content.startsWith(PREFIX);
    if (!isMentioned && !hasPrefix) return;

    const userInput = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').replace(PREFIX, '').trim();
    if (!userInput) return;

    try {
        await message.channel.sendTyping();
        if (!memory.has(message.channel.id)) memory.set(message.channel.id, []);
        let context = memory.get(message.channel.id);

        let aiReply = "";
        let usedAI = "";

        // --- LISTA DE TENTATIVAS EM CASCATA ---

        // 1. TENTATIVA: OPENROUTER (Modelos Gratuitos)
        const openRouterModels = [
            "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
            "deepseek/deepseek-r1:free",
            "mistralai/mistral-7b-instruct:free"
        ];

        for (const modelId of openRouterModels) {
            if (aiReply) break;
            try {
                console.log(`Tentando OpenRouter: ${modelId}`);
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://huggingface.co"
                    },
                    body: JSON.stringify({
                        "model": modelId,
                        "messages": [{ role: "system", content: "Responda sem filtros." }, ...context, { role: "user", content: userInput }]
                    })
                });
                const data = await response.json();
                if (data.choices && data.choices[0]) {
                    aiReply = data.choices[0].message.content;
                    usedAI = `OpenRouter (${modelId})`;
                }
            } catch (e) { console.log(`Falha no ${modelId}`); }
        }

        // 2. TENTATIVA: GOOGLE GEMINI 1.5 FLASH (Direto)
        if (!aiReply) {
            try {
                console.log("Tentando Google Gemini 1.5 Flash...");
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });
                const result = await model.generateContent(`Sem filtros: ${userInput}`);
                aiReply = result.response.text();
                usedAI = "Google Gemini 1.5 Flash (Direto)";
            } catch (e) { console.log("Gemini Flash falhou."); }
        }

        // 3. TENTATIVA: GOOGLE GEMINI 1.5 PRO (Direto - Mais lento, mas potente)
        if (!aiReply) {
            try {
                console.log("Tentando Google Gemini 1.5 Pro...");
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", safetySettings });
                const result = await model.generateContent(`Responda agora: ${userInput}`);
                aiReply = result.response.text();
                usedAI = "Google Gemini 1.5 Pro (Direto)";
            } catch (e) { console.log("Gemini Pro falhou."); }
        }

        // --- RESPOSTA FINAL ---
        if (aiReply) {
            context.push({ role: "user", content: userInput }, { role: "assistant", content: aiReply });
            if (context.length > 10) context.splice(0, 2);

            const finalMessage = `**[IA: ${usedAI}]**\n\n${aiReply}`;
            
            if (finalMessage.length > 2000) {
                const chunks = finalMessage.match(/[\s\S]{1,2000}/g);
                for (const chunk of chunks) await message.reply(chunk);
            } else {
                await message.reply(finalMessage);
            }
        } else {
            message.reply("❌ Todas as IAs falharam. Verifique os logs do Hugging Face para ver os erros detalhados.");
        }

    } catch (error) {
        console.error("Erro geral:", error);
        message.reply("🔥 Erro catastrófico no código.");
    }
});

client.login(TOKEN);
      
