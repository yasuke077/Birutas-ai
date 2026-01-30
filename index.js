const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, 
    REST, Routes, SlashCommandBuilder, PermissionFlagsBits 
} = require('discord.js');
const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');

// --- MONITORAMENTO ---
const app = express();
app.get('/', (req, res) => res.send('Birutas PRO Online! 🛡️'));
app.listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// --- DATABASE BLINDADO ---
const DB_FILE = './database.json';
const DEFAULT_IAS = {
    deepseek: { id: "deepseek/deepseek-chat", name: "DeepSeek", color: "#0099ff", prompt: "Você é o DeepSeek, uma IA útil." },
    venice: { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", name: "Venice", color: "#ffef00", prompt: "Você é a Venice AI, focada em liberdade e honestidade técnica." }
};

let db = { 
    allowedChannels: [], bannedChannels: [], adminRole: null, logChannel: null,
    channelAIs: {}, memory: {}, economy: {}, voiceTime: {},
    voiceConfig: { coinsPerMin: 10, minMinutes: 1, allowMuted: false, allowAlone: false },
    customIAs: { ...DEFAULT_IAS }
};

if (fs.existsSync(DB_FILE)) {
    try { 
        db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE)) }; 
        db.customIAs = { ...DEFAULT_IAS, ...db.customIAs };
    } catch (e) { console.error("Erro ao carregar DB"); }
}
const saveDB = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

// --- SEGURANÇA VIRUSTOTAL ---
async function checkLinkVT(url) {
    if (!process.env.VT_API_KEY) return true;
    try {
        const urlBase64 = Buffer.from(url).toString('base64').replace(/=/g, '');
        const res = await fetch(`https://www.virustotal.com/api/v3/urls/${urlBase64}`, { headers: { 'x-apikey': process.env.VT_API_KEY } });
        const data = await res.json();
        return !(data.data?.attributes?.last_analysis_stats?.malicious > 0);
    } catch { return true; }
}

// --- COMANDOS ---
const commands = [
    new SlashCommandBuilder().setName('hub').setDescription('Lista TODOS os comandos do Birutas PRO'),
    new SlashCommandBuilder().setName('status').setDescription('Saúde do sistema'),
    new SlashCommandBuilder().setName('permissao').setDescription('Configura o cargo de Gerência').addRoleOption(o => o.setName('cargo').setRequired(true)),
    new SlashCommandBuilder().setName('config').setDescription('Autoriza a IA neste canal'),
    new SlashCommandBuilder().setName('banchannel').setDescription('Bane a IA deste canal'),
    new SlashCommandBuilder().setName('unbanchannel').setDescription('Remove banimento do canal'),
    new SlashCommandBuilder().setName('logs').setDescription('Define canal de Auditoria'),
    new SlashCommandBuilder().setName('lock').setDescription('Tranca o chat (ADM)'),
    new SlashCommandBuilder().setName('unlock').setDescription('Destranca o chat (ADM)'),
    new SlashCommandBuilder().setName('slowmode').setDescription('Define modo lento').addIntegerOption(o => o.setName('segundos').setRequired(true)),
    new SlashCommandBuilder().setName('coins').setDescription('Ver seu saldo de Birutas Coins'),
    new SlashCommandBuilder().setName('daily').setDescription('Resgatar 100 moedas diárias'),
    new SlashCommandBuilder().setName('rank').setDescription('Ver quem são os mais ricos'),
    new SlashCommandBuilder().setName('avatar').setDescription('Ver foto de perfil').addUserOption(o => o.setName('user')),
    new SlashCommandBuilder().setName('resumo').setDescription('IA resume as últimas mensagens'),
    new SlashCommandBuilder().setName('imagine').setDescription('Gera imagem via prompt').addStringOption(o => o.setName('prompt').setRequired(true)),
    new SlashCommandBuilder().setName('backup').setDescription('Recebe o database no seu privado'),
    new SlashCommandBuilder().setName('anuncio').setDescription('Envia mensagem em todos os canais da IA').addStringOption(o => o.setName('texto').setRequired(true)),
    new SlashCommandBuilder().setName('configvoz').setDescription('Configura ganhos em call')
        .addIntegerOption(o => o.setName('moedas').setDescription('Coins por minuto'))
        .addBooleanOption(o => o.setName('mutado').setDescription('Contar se estiver mutado?')),
    new SlashCommandBuilder().setName('addia').setDescription('Adiciona um novo modelo de IA').addStringOption(o => o.setName('id').setRequired(true)).addStringOption(o => o.setName('nome').setRequired(true)).addStringOption(o => o.setName('prompt').setRequired(true)),
    new SlashCommandBuilder().setName('setmode').setDescription('Troca a IA do canal atual'),
    new SlashCommandBuilder().setName('reset').setDescription('Limpa a memória da conversa no canal')
].map(c => c.toJSON());

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("🛡️ Birutas PRO Ativo e Sincronizado!");
});

// --- ECONOMIA DE VOZ ---
client.on('voiceStateUpdate', (oldS, newS) => {
    const uid = newS.id;
    if (!oldS.channelId && newS.channelId) db.voiceTime[uid] = Date.now();
    else if (oldS.channelId && !newS.channelId && db.voiceTime[uid]) {
        const mins = Math.floor((Date.now() - db.voiceTime[uid]) / 60000);
        const conf = db.voiceConfig;
        if (mins >= conf.minMinutes && (conf.allowMuted || (!oldS.selfMute && !oldS.selfDeaf))) {
            db.economy[uid] = (db.economy[uid] || 0) + (mins * conf.coinsPerMin);
            saveDB();
        }
        delete db.voiceTime[uid];
    }
});

// --- CHAT E CIBERSEGURANÇA ---
client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    // Filtro VirusTotal
    const links = msg.content.match(/\bhttps?:\/\/\S+/gi);
    if (links && db.allowedChannels.includes(msg.channel.id)) {
        for (const l of links) {
            if (!(await checkLinkVT(l))) {
                await msg.delete().catch(()=>{});
                return msg.channel.send(`🚫 **SEGURANÇA:** ${msg.author}, link malicioso detectado e removido!`);
            }
        }
    }

    if (!db.allowedChannels.includes(msg.channel.id) || db.bannedChannels.includes(msg.channel.id)) return;

    await msg.channel.sendTyping();
    const ia = db.customIAs[db.channelAIs[msg.channel.id] || 'deepseek'];
    if (msg.guild.members.me.permissions.has(PermissionFlagsBits.ChangeNickname)) {
        msg.guild.members.me.setNickname(`Birutas [${ia.name}]`).catch(()=>{});
    }

    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST", headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: ia.id, messages: [{role:"system", content: ia.prompt}, ...(db.memory[msg.channel.id]||[]).slice(-6), {role:"user", content: msg.content}] })
        });
        const data = await res.json();
        const reply = data.choices[0].message.content;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('snapshot').setLabel('Snapshot').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('stop').setLabel('Parar').setStyle(ButtonStyle.Danger)
        );

        msg.reply({ content: reply, components: [row] });
        db.memory[msg.channel.id] = [...(db.memory[msg.channel.id]||[]), {role:"user", content: msg.content}, {role:"assistant", content: reply}];
        saveDB();
    } catch (e) { msg.reply("❌ Erro na conexão com a IA."); }
});

// --- INTERAÇÕES ---
client.on('interactionCreate', async (int) => {
    const isAdm = int.member.permissions.has(PermissionFlagsBits.Administrator) || (db.adminRole && int.member.roles.cache.has(db.adminRole));

    if (int.isChatInputCommand()) {
        if (int.commandName === 'hub') {
            const embed = new EmbedBuilder()
                .setTitle("🛠️ Hub de Comandos Birutas PRO")
                .setColor("#00ff00")
                .addFields(
                    { name: "👑 Administração", value: "`/permissao` `/config` `/banchannel` `/unbanchannel` `/logs` `/lock` `/unlock` `/slowmode` `/backup` `/anuncio`" },
                    { name: "💰 Economia", value: "`/coins` `/daily` `/rank` `/configvoz`" },
                    { name: "🤖 Inteligência & Úteis", value: "`/setmode` `/addia` `/reset` `/imagine` `/resumo` `/status` `/avatar`" }
                );
            return int.reply({ embeds: [embed] });
        }

        // Verificação de ADM para comandos sensíveis
        const admCmds = ['permissao', 'config', 'banchannel', 'unbanchannel', 'logs', 'lock', 'unlock', 'slowmode', 'backup', 'anuncio', 'configvoz', 'addia'];
        if (admCmds.includes(int.commandName) && !isAdm) return int.reply({ content: "❌ Erro: Você precisa de permissão de Gerência Birutas.", ephemeral: true });

        if (int.commandName === 'config') { if(!db.allowedChannels.includes(int.channelId)) db.allowedChannels.push(int.channelId); saveDB(); return int.reply("✅ Canal autorizado!"); }
        if (int.commandName === 'banchannel') { if(!db.bannedChannels.includes(int.channelId)) db.bannedChannels.push(int.channelId); saveDB(); return int.reply("🚫 Canal banido!"); }
        if (int.commandName === 'unbanchannel') { db.bannedChannels = db.bannedChannels.filter(id => id !== int.channelId); saveDB(); return int.reply("✅ Canal desbanido!"); }
        if (int.commandName === 'lock') { int.channel.permissionOverwrites.edit(int.guild.id, { SendMessages: false }); return int.reply("🔒 Chat trancado!"); }
        if (int.commandName === 'unlock') { int.channel.permissionOverwrites.edit(int.guild.id, { SendMessages: true }); return int.reply("🔓 Chat liberado!"); }
        if (int.commandName === 'slowmode') { int.channel.setRateLimitPerUser(int.options.getInteger('segundos')); return int.reply("⏱️ Modo lento configurado!"); }
        
        if (int.commandName === 'anuncio') { 
            db.allowedChannels.forEach(id => { const c = client.channels.cache.get(id); if(c) c.send(`📢 **ANÚNCIO**: ${int.options.getString('texto')}`); }); 
            return int.reply("✅ Anúncio disparado!"); 
        }

        if (int.commandName === 'daily') {
            db.economy[int.user.id] = (db.economy[int.user.id] || 0) + 100;
            saveDB();
            return int.reply("💵 Você resgatou suas **100 Birutas Coins** diárias!");
        }

        if (int.commandName === 'coins') return int.reply(`💰 Saldo atual: **${db.economy[int.user.id] || 0} Birutas Coins**`);

        if (int.commandName === 'setmode') {
            const select = new StringSelectMenuBuilder().setCustomId('select_ia').setPlaceholder('Selecione a IA do canal').addOptions(Object.keys(db.customIAs).map(k => ({ label: db.customIAs[k].name, value: k })));
            return int.reply({ components: [new ActionRowBuilder().addComponents(select)] });
        }

        if (int.commandName === 'backup') { await int.user.send({ files: [DB_FILE] }); return int.reply("📂 O database foi enviado no seu privado!"); }
        if (int.commandName === 'reset') { db.memory[int.channelId] = []; saveDB(); return int.reply("🧹 Memória da IA limpa para este canal!"); }
        if (int.commandName === 'status') return int.reply(`🛰️ **Online** | Ping: ${client.ws.ping}ms | Uptime: ${Math.floor(process.uptime()/60)}m`);
        if (int.commandName === 'permissao') { db.adminRole = int.options.getRole('cargo').id; saveDB(); return int.reply("✅ Cargo de ADM configurado!"); }
    }

    if (int.isStringSelectMenu() && int.customId === 'select_ia') {
        db.channelAIs[int.channelId] = int.values[0]; saveDB();
        return int.update({ content: `✅ IA alterada para: **${db.customIAs[int.values[0]].name}**`, components: [] });
    }

    if (int.isButton()) {
        if (int.customId === 'snapshot') return int.reply({ content: `📸 **Snapshot**: https://ray.so/?code=${Buffer.from(int.message.content).toString('base64')}`, ephemeral: true });
        if (int.customId === 'stop') return int.reply({ content: "⏹️ Resposta parada.", ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
