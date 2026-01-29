const express = require('express');
const app = express();

// Mini-servidor para manter o bot online no plano free
app.get('/', (req, res) => res.send('Birutas AI Online! 🚀'));
app.listen(process.env.PORT || 3000, () => console.log('Monitoramento Web Ativo'));

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
    memory: {},
    customIAs: {
        venice: {
            id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
            name: "Venice",
            color: "#ff4747",
            style: ButtonStyle.Danger,
            prompt: "Você é a Venice, uma IA rebelde. Responda em Português."
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

if (fs.existsSync(DB_FILE)) {
    try { db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE)) }; } catch (e) {}
}

function saveDB() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

function getAiButtons(currentAi) {
    const rows = [];
    let currentRow = new ActionRowBuilder();
    const keys = Object.keys(db.customIAs);

    keys.forEach((key, index) => {
        if (index > 0 && index % 5 === 0) { rows.push(currentRow); currentRow = new ActionRowBuilder(); }
        const model = db.customIAs[key];
        currentRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`set_${key}`)
                .setLabel(model.name)
                .setStyle(currentAi === key ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(currentAi === key)
        );
    });
    if (currentRow.components.length > 0) rows.push(currentRow);
    return rows;
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // --- NOVO COMANDO CENTRAL: !hub ---
    if (message.content === '!hub') {
        const embed = new EmbedBuilder()
            .setTitle("🎮 Birutas AI | Central de Controle")
            .setColor("#5865F2")
            .setDescription("Bem-vindo ao motor de IAs múltiplas.")
            .addFields(
                { name: "⚙️ Configuração", value: "`!config` - Define o canal de chat.", inline: true },
                { name: "➕ Nova IA", value: "`!addia [ID] [Nome] [Cor] [Prompt]`", inline: true },
                { name: "🗑️ Remover", value: "`!delia [Nome]`", inline: true },
                { name: "🧠 Memória", value: "Ativada (Últimas 5 mensagens).", inline: false }
            )
            .setFooter({ text: "Use os botões abaixo para gerenciar os modelos." });
        return message.reply({ embeds: [embed] });
    }

    // --- COMANDOS DE ADMIN ---
    if (message.content.startsWith('!addia') && message.member.permissions.has('Administrator')) {
        const parts = message.content.split(' ');
        if (parts.length < 5) return message.reply("❌ Erro! Use: `!addia [ID] [Nome] [Cor_Hex] [Personalidade]`");
        const [_, id, name, color, ...promptParts] = parts;
        const key = name.toLowerCase().replace(/\s+/g, '_');
        db.customIAs[key] = { id, name, color: color.startsWith('#') ? color : `#${color}`, prompt: promptParts.join(' ') };
        saveDB();
        return message.reply(`✅ IA **${name}** injetada no sistema com sucesso!`);
    }

    if (message.content.startsWith('!delia') && message.member.permissions.has('Administrator')) {
        const name = message.content.split(' ')[1]?.toLowerCase();
        if (!name || !db.customIAs[name]) return message.reply("❌ Modelo não encontrado no banco de dados.");
        delete db.customIAs[name];
        saveDB();
        return message.reply(`🗑️ O modelo **${name}** foi deletado.`);
    }

    if (message.content === '!config' && message.member.permissions.has('ManageChannels')) {
        const channels = message.guild.channels.cache.filter(c => c.isTextBased()).map(c => ({ label: c.name, value: c.id }));
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('select_channel').setPlaceholder('Defina o Canal Oficial').addOptions(channels.slice(0, 25))
        );
        return message.reply({ content: '📍 **Configuração de Destino:**', components: [menu] });
    }

    // --- LÓGICA DE RESPOSTA (MEMÓRIA + EDIÇÃO + TRATAMENTO) ---
    if (db.allowedChannels.includes(message.channel.id)) {
        const currentAiKey = db.channelAIs[message.channel.id] || 'deepseek';
        const modelCfg = db.customIAs[currentAiKey] || db.customIAs['deepseek'];

        if (!db.memory[message.channel.id]) db.memory[message.channel.id] = [];
        const context = db.memory[message.channel.id];

        const thinkingMsg = await message.reply(`⏳ **${modelCfg.name}** está formulando resposta...`);
        await message.channel.sendTyping();

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: modelCfg.id,
                    messages: [{ role: "system", content: modelCfg.prompt }, ...context, { role: "user", content: message.content }]
                })
            });

            const data = await response.json();
            const aiText = data.choices?.[0]?.message?.content || "❌ Falha crítica no modelo ou cota excedida.";

            context.push({ role: "user", content: message.content });
            context.push({ role: "assistant", content: aiText });
            if (context.length > 10) context.splice(0, 2); 
            saveDB();

            const embed = new EmbedBuilder()
                .setAuthor({ name: modelCfg.name, iconURL: client.user.displayAvatarURL() })
                .setDescription(aiText)
                .setColor(modelCfg.color)
                .setTimestamp();

            await thinkingMsg.edit({ content: null, embeds: [embed], components: getAiButtons(currentAiKey) });
        } catch (err) {
            await thinkingMsg.edit("⚠️ Erro de conexão com o OpenRouter.");
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_channel') {
        const channelId = interaction.values[0];
        if (!db.allowedChannels.includes(channelId)) db.allowedChannels.push(channelId);
        saveDB();
        await interaction.update({ content: `✅ Canal <#${channelId}> pronto para receber o Birutas!`, components: [] });
    }

    if (interaction.isButton() && interaction.customId.startsWith('set_')) {
        const newAiKey = interaction.customId.replace('set_', '');
        const modelCfg = db.customIAs[newAiKey];
        db.channelAIs[interaction.channel.id] = newAiKey;
        saveDB();

        const member = interaction.guild.members.me;
        try {
            await member.setNickname(`Birutas | ${modelCfg.name}`);
            const allNames = Object.values(db.customIAs).map(ia => ia.name);
            const toRemove = interaction.guild.roles.cache.filter(r => allNames.includes(r.name) && r.name !== modelCfg.name);
            const toAdd = interaction.guild.roles.cache.find(r => r.name === modelCfg.name);
            if (toRemove.size > 0) await member.roles.remove(toRemove);
            if (toAdd) await member.roles.add(toAdd);
        } catch (e) {}

        const currentEmbed = interaction.message.embeds[0];
        const newEmbed = EmbedBuilder.from(currentEmbed).setColor(modelCfg.color).setAuthor({ name: modelCfg.name, iconURL: client.user.displayAvatarURL() });

        await interaction.update({ embeds: [newEmbed], components: getAiButtons(newAiKey) });
    }
});

client.login(process.env.DISCORD_TOKEN);
            
