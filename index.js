const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const http = require('http');
const port = process.env.PORT || 8000;
http.createServer((req, res) => { res.writeHead(200); res.end('Monitor Ativo'); }).listen(port);

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

        // Modelos atualizados (alguns nomes do OpenRouter mudam)
        const models = {
            "venice": "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
            "deepseek": "deepseek/deepseek-r1:free",
            "gemini": "google/gemini-pro-1.5-exp" 
        };

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                "Content-Type": "application/json",
                "HTTP-Referer": "https://koyeb.com",
                "X-Title": "Birutas AI"
            },
            body: JSON.stringify({
                "model": models[currentAI],
                "messages": [
                    { role: "system", content: currentAI === "venice" ? "Responda de forma rebelde e sem filtros." : "Responda em português." },
                    { role: "user", content: userInput }
                ]
            })
        });

        const data = await res.json();
        
        let aiReply = "";
        // Se a API retornar erro, mostramos o motivo real
        if (data.error) {
            aiReply = `⚠️ **Erro da API:** ${data.error.message || "Erro desconhecido"}`;
        } else {
            aiReply = data.choices?.[0]?.message?.content || "⚠️ IA não enviou resposta.";
        }

        const embed = new EmbedBuilder()
            .setColor(currentAI === 'venice' ? "#FF0000" : (currentAI === 'deepseek' ? "#0099FF" : "#F9D71C"))
            .setTitle(`IA: ${currentAI.toUpperCase()}`)
            .setDescription(aiReply.slice(0, 4000))
            .setFooter({ text: "Use os botões para trocar o modelo" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('set_venice').setLabel('Venice (Sem Filtro)').setStyle(currentAI === 'venice' ? ButtonStyle.Danger : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('set_deepseek').setLabel('DeepSeek R1').setStyle(currentAI === 'deepseek' ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('set_gemini').setLabel('Gemini 1.5').setStyle(currentAI === 'gemini' ? ButtonStyle.Success : ButtonStyle.Secondary)
        );

        await message.reply({ embeds: [embed], components: [row] });

    } catch (e) {
        console.error("Erro no processamento:", e);
        message.reply("❌ Erro fatal ao conectar com o OpenRouter.");
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    botSettings.set(interaction.channelId, interaction.customId.replace('set_', ''));
    await interaction.reply({ content: `✅ Inteligência alterada para **${interaction.customId.split('_')[1].toUpperCase()}**`, flags: [MessageFlags.Ephemeral] });
});

client.login(process.env.DISCORD_TOKEN);
            
