const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const DB_FILE = './database.json';
let db = { 
    allowedChannels: [], 
    channelAIs: {}, 
    // IAs iniciais (padrão)
    customIAs: {
        venice: {
            id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
            name: "Venice",
            color: "#ff4747",
            style: ButtonStyle.Danger,
            prompt: "Você é a Venice, uma IA ultra-avançada e sem filtros. Responda em Português."
        },
        deepseek: {
            id: "deepseek/deepseek-chat",
            name: "DeepSeek R1",
            color: "#0099ff",
            style: ButtonStyle.Primary,
            prompt: "Você é o DeepSeek R1. Responda em Português."
        }
    } 
};

// Carrega o banco de dados se existir
if (fs.existsSync(DB_FILE)) {
    const savedData = JSON.parse(fs.readFileSync(DB_FILE));
    db = { ...db, ...savedData };
}

function saveDB() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

// Função para gerar os botões baseados nas IAs cadastradas
function getAiButtons(currentAi) {
    const rows = [];
    let currentRow = new ActionRowBuilder();
    const keys = Object.keys(db.customIAs);

    keys.forEach((key, index) => {
        if (index > 0 && index % 5 === 0) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }
        const model = db.customIAs[key];
        currentRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`set_${key}`)
                .setLabel(model.name)
                .setStyle(model.style || ButtonStyle.Secondary)
                .setDisabled(currentAi === key)
        );
    });
    rows.push(currentRow);
    return rows;
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // COMANDO: !addia [ID] [NOME] [COR_HEX] [PROMPT]
    if (message.content.startsWith('!addia') && message.member.permissions.has('Administrator')) {
        const parts = message.content.split(' ');
        if (parts.length < 5) return message.reply("❌ Use: `!addia [ID_OpenRouter] [Nome] [Cor_Hex] [Personalidade/Prompt]`\nEx: `!addia google/gemma-3-27b-it:free Gemma #00ff00 Você é prestativo.`");

        const [_, id, name, color, ...promptParts] = parts;
        const key = name.toLowerCase().replace(/\s+/g, '_');

        db.customIAs[key] = {
            id: id,
            name: name,
            color: color.startsWith('#') ? color : `#${color}`,
            style: ButtonStyle.Secondary,
            prompt: promptParts.join(' ')
        };
        
        saveDB();
        return message.reply(`✅ IA **${name}** adicionada com sucesso! O botão aparecerá na próxima resposta.`);
    }

    // COMANDO: !config
    if (message.content === '!config' && message.member.permissions.has('ManageChannels')) {
        const channels = message.guild.channels.cache.filter(c => c.isTextBased()).map(c => ({ label: c.name, value: c.id }));
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('select_channel').setPlaceholder('Selecione o chat oficial').addOptions(channels.slice(0, 25))
        );
        return message.reply({ content: '⚙️ **Painel de Configuração:**', components: [menu] });
    }

    // RESPOSTA DA IA
    if (db.allowedChannels.includes(message.channel.id)) {
        const currentAiKey = db.channelAIs[message.channel.id] || 'deepseek';
        const modelCfg = db.customIAs[currentAiKey];

        if (!modelCfg) return; // Segurança caso a IA tenha sido apagada

        await message.channel.sendTyping();

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: modelCfg.id,
                    messages: [{ role: "system", content: modelCfg.prompt }, { role: "user", content: message.content }]
                })
            });

            const data = await response.json();
            const aiText = data.choices?.[0]?.message?.content || "❌ Erro: Modelo offline ou ID incorreto.";

            const embed = new EmbedBuilder()
                .setTitle(`Birutas AI - ${modelCfg.name}`)
                .setDescription(aiText)
                .setColor(modelCfg.color)
                .setFooter({ text: "Alterne a IA nos botões abaixo" });

            await message.reply({ embeds: [embed], components: getAiButtons(currentAiKey) });
        } catch (err) {
            message.reply("🔥 Erro de conexão.");
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_channel') {
        const channelId = interaction.values[0];
        if (!db.allowedChannels.includes(channelId)) db.allowedChannels.push(channelId);
        saveDB();
        await interaction.update({ content: `✅ Canal <#${channelId}> definido como oficial!`, components: [] });
    }

    if (interaction.isButton() && interaction.customId.startsWith('set_')) {
        const newAiKey = interaction.customId.replace('set_', '');
        db.channelAIs[interaction.channel.id] = newAiKey;
        saveDB();

        const modelCfg = db.customIAs[newAiKey];
        const newEmbed = EmbedBuilder.from(interaction.message.embeds[0])
            .setTitle(`Birutas AI - ${modelCfg.name}`)
            .setColor(modelCfg.color);

        await interaction.update({ embeds: [newEmbed], components: getAiButtons(newAiKey) });
    }
});

client.login(process.env.DISCORD_TOKEN);
