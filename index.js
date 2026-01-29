const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const http = require('http');
const port = process.env.PORT || 8000;
http.createServer((req, res) => { res.writeHead(200); res.end('Birutas AI Ativo'); }).listen(port);

require('dotenv').config();
const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags 
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const botSettings = new Map();

client.once('ready', (c) => {
    console.log(`🚀 Bot Online: ${c.user.tag}`);
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
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

        // NOMES DE MODELOS ATUALIZADOS PARA EVITAR "NO ENDPOINTS FOUND"
        const models = {
            "venice": "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
            "deepseek": "deepseek/deepseek-r1:free",
            "gemini": "google/gemini-2.0-flash-exp:free" // Nome atualizado
        };

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                "Content-Type": "application/json",
                "HTTP-Referer": "https://koyeb.com",
                "X-Title": "Birutas Bot"
            },
            body: JSON.stringify({
                "model": models[currentAI],
                "messages": [{ role: "user", content: userInput }]
            })
        });

        const data = await res.json();
        let aiReply = "";

        if (data.error) {
            aiReply = `❌ **Erro na API:** ${data.error.message}`;
        } else {
            aiReply = data.choices?.[0]?.message?.content || "⚠️ Sem resposta.";
        }

        const embed = new EmbedBuilder()
            .setColor(currentAI === 'venice' ? "#FF0000" : (currentAI === 'deepseek' ? "#0099FF" : "#F9D71C"))
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
        message.reply("🔥 Erro de conexão.");
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    
    try {
        // Evita o erro 10062 (Unknown Interaction) avisando o Discord que estamos processando
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        
        const newAI = interaction.customId.replace('set_', '');
        botSettings.set(interaction.channelId, newAI);

        await interaction.editReply({ content: `✅ Modo alterado para **${newAI.toUpperCase()}**!` });
    } catch (err) {
        console.error("Erro no clique:", err);
    }
});

client.login(process.env.DISCORD_TOKEN);
