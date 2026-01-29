const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const http = require('http');
// Servidor HTTP para o Health Check do Koyeb
const port = process.env.PORT || 8000;
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot Birutas AI está online e operante.');
}).listen(port, () => console.log(`[SISTEMA] Porta ${port} aberta para o Koyeb.`));

const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, EmbedBuilder, MessageFlags, ActivityType 
} = require('discord.js');

// Verificação de Variáveis de Ambiente (Variables do Koyeb)
const REQUIRED_VARS = ['DISCORD_TOKEN', 'OPENROUTER_API_KEY', 'PREFIX'];
REQUIRED_VARS.forEach(v => {
    if (!process.env[v]) {
        console.error(`[ERRO FATAL] A variável ${v} não foi definida no painel do Koyeb!`);
        process.exit(1);
    }
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const botSettings = new Map();

client.once('ready', (c) => {
    console.log(`[SUCESSO] Logado como ${c.user.tag}`);
    c.user.setActivity('Conversas Inteligentes', { type: ActivityType.Listening });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefix = process.env.PREFIX;
    const isMention = message.mentions.has(client.user);
    if (!isMention && !message.content.startsWith(prefix)) return;

    const userInput = message.content
        .replace(/<@!?\d+>/g, '')
        .replace(prefix, '')
        .trim();

    if (!userInput) return;

    // IA Padrão por canal
    if (!botSettings.has(message.channel.id)) botSettings.set(message.channel.id, "venice");
    let currentAI = botSettings.get(message.channel.id);

    try {
        await message.channel.sendTyping();
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

        // Mapeamento de Modelos Profissionais
        const models = {
            "venice": "cognitivecomputations/dolphin-mistral-24b-venice-edition",
            "deepseek": "deepseek/deepseek-chat",
            "gemini": "google/gemini-flash-1.5"
        };

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                "Content-Type": "application/json",
                "HTTP-Referer": "https://koyeb.com",
                "X-Title": "Birutas AI Multi-Modo"
            },
            body: JSON.stringify({
                "model": models[currentAI],
                "messages": [
                    { role: "system", content: "Você é um assistente prestativo chamado Birutas AI." },
                    { role: "user", content: userInput }
                ]
            })
        });

        const data = await res.json();
        
        let aiReply = "";
        let isError = false;

        if (data.error) {
            isError = true;
            aiReply = `⚠️ **Erro da API:**\n\`\`\`json\n${JSON.stringify(data.error, null, 2)}\n\`\`\``;
        } else {
            aiReply = data.choices?.[0]?.message?.content || "Ocorreu um erro inesperado: Resposta vazia.";
        }

        const embed = new EmbedBuilder()
            .setColor(isError ? "#ff0000" : (currentAI === 'venice' ? "#ff0000" : "#0099ff"))
            .setAuthor({ name: `Birutas AI - ${currentAI.toUpperCase()}`, iconURL: client.user.displayAvatarURL() })
            .setDescription(aiReply.slice(0, 4000))
            .setTimestamp()
            .setFooter({ text: "Use os botões abaixo para trocar de IA" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('set_venice').setLabel('Venice').setStyle(currentAI === 'venice' ? ButtonStyle.Danger : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('set_deepseek').setLabel('DeepSeek').setStyle(currentAI === 'deepseek' ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('set_gemini').setLabel('Gemini').setStyle(currentAI === 'gemini' ? ButtonStyle.Success : ButtonStyle.Secondary)
        );

        await message.reply({ embeds: [embed], components: [row] });

    } catch (e) {
        console.error("[CRITICAL]", e);
        message.reply("❌ Erro interno no servidor do bot.");
    }
});

// Listener de Botões Otimizado
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    try {
        await interaction.deferUpdate(); // Evita o erro 10062 do Discord
        
        const newAI = interaction.customId.replace('set_', '');
        botSettings.set(interaction.channelId, newAI);

        await interaction.followUp({ 
            content: `🔄 Inteligência alterada para **${newAI.toUpperCase()}** neste canal.`, 
            flags: [MessageFlags.Ephemeral] 
        });
    } catch (err) {
        console.error("[INTERACTION ERROR]", err);
    }
});

client.login(process.env.DISCORD_TOKEN);
                     
