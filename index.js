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

// --- DATABASE ---
const DB_FILE = './database.json';
const activeRequests = new Map();

let db = { 
    allowedChannels: [], adminRole: null, logChannel: null,
    channelAIs: {}, memory: {}, economy: {}, inventory: {}, 
    lastDaily: {}, // Para controlar o tempo do daily
    voiceConfig: { coinsPerMin: 10, allowMuted: false },
    customIAs: {
        deepseek: { id: "deepseek/deepseek-chat", name: "DeepSeek", prompt: "Você é o DeepSeek, uma IA útil e inteligente." },
        venice: { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", name: "Venice", prompt: "Você é a Venice AI, sem censura e honesta." }
    }
};

// Carregar DB
if (fs.existsSync(DB_FILE)) {
    try { 
        const data = JSON.parse(fs.readFileSync(DB_FILE));
        db = { ...db, ...data };
    } catch (e) { console.error("Erro ao carregar DB"); }
}
const saveDB = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

// --- FUNÇÃO DE LOGS ---
async function logToChannel(guild, title, desc, color) {
    if (!db.logChannel) return;
    const channel = guild.channels.cache.get(db.logChannel);
    if (!channel) return;
    const embed = new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color).setTimestamp();
    channel.send({ embeds: [embed] }).catch(() => {});
}

// --- SEGURANÇA (VIRUS TOTAL) ---
async function checkLinkVT(url) {
    if (!process.env.VT_API_KEY) return true; // Se não tiver chave, deixa passar (ou mude para false para bloquear tudo)
    try {
        const urlBase64 = Buffer.from(url).toString('base64').replace(/=/g, '');
        const res = await fetch(`https://www.virustotal.com/api/v3/urls/${urlBase64}`, { headers: { 'x-apikey': process.env.VT_API_KEY } });
        const data = await res.json();
        // Se tiver mais de 0 detecções maliciosas, retorna false (perigoso)
        return !(data.data?.attributes?.last_analysis_stats?.malicious > 0);
    } catch { return true; }
}

// --- VOZ EM TEMPO REAL ---
setInterval(() => {
    client.guilds.cache.forEach(guild => {
        guild.voiceStates.cache.forEach(vs => {
            if (vs.member.user.bot || !vs.channelId) return;
            const isMuted = vs.selfMute || vs.serverMute;
            if (isMuted && !db.voiceConfig.allowMuted) return;

            const uid = vs.id;
            db.economy[uid] = (db.economy[uid] || 0) + db.voiceConfig.coinsPerMin;
        });
    });
    saveDB();
}, 60000);

// --- REGISTRO DE COMANDOS (TODOS CORRIGIDOS) ---
const commands = [
    new SlashCommandBuilder().setName('hub').setDescription('Exibe todos os comandos'),
    new SlashCommandBuilder().setName('config').setDescription('Autoriza a IA neste canal'),
    new SlashCommandBuilder().setName('setmode').setDescription('Troca a PERSONALIDADE da IA'),
    new SlashCommandBuilder().setName('reset').setDescription('Limpa a memória da conversa'),
    new SlashCommandBuilder().setName('coins').setDescription('Ver saldo'),
    new SlashCommandBuilder().setName('daily').setDescription('Resgatar prêmio diário (24h)'),
    new SlashCommandBuilder().setName('logs').setDescription('Define canal de logs de segurança'),
    new SlashCommandBuilder().setName('resumo').setDescription('Gera um resumo das últimas mensagens'),
    new SlashCommandBuilder().setName('imagine').setDescription('Cria um prompt detalhado para imagem')
        .addStringOption(o => o.setName('prompt').setDescription('O que você quer imaginar?').setRequired(true)),
    
    new SlashCommandBuilder().setName('permissao').setDescription('Configura cargo de Gerência')
        .addRoleOption(o => o.setName('cargo').setDescription('Cargo ADM').setRequired(true)),
    
    new SlashCommandBuilder().setName('addia').setDescription('Cria uma nova personalidade')
        .addStringOption(o => o.setName('id').setDescription('ID do Modelo (ex: deepseek/deepseek-chat)').setRequired(true))
        .addStringOption(o => o.setName('nome').setDescription('Nome do Preset').setRequired(true))
        .addStringOption(o => o.setName('prompt').setDescription('Prompt do Sistema').setRequired(true)),
    
    new SlashCommandBuilder().setName('delia').setDescription('Remove uma personalidade')
        .addStringOption(o => o.setName('nome').setDescription('Nome do Preset').setRequired(true)),
    
    new SlashCommandBuilder().setName('configvoz').setDescription('Configura economia')
        .addIntegerOption(o => o.setName('moedas').setDescription('Valor por minuto').setRequired(true))
        .addBooleanOption(o => o.setName('mutado').setDescription('Ganha mutado?').setRequired(true))
].map(c => c.toJSON());

client.once('ready', async () => {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log("🛡️ Birutas PRO: Comandos e Sistemas Carregados!");
    } catch (e) { console.error("Erro no registro:", e); }
});

// --- CHAT E IA ---
client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    // 1. Verificação de Segurança (Vírus)
    const links = msg.content.match(/\bhttps?:\/\/\S+/gi);
    if (links && db.allowedChannels.includes(msg.channel.id)) {
        for (const l of links) {
            const isSafe = await checkLinkVT(l);
            if (!isSafe) {
                await msg.delete().catch(()=>{});
                logToChannel(msg.guild, "🚫 Link Malicioso Removido", `User: ${msg.author.tag}\nLink: ${l}`, "#FF0000");
                return msg.channel.send(`🚫 **SEGURANÇA:** ${msg.author}, link perigoso removido!`);
            }
        }
    }

    if (!db.allowedChannels.includes(msg.channel.id)) return;

    // 2. IA Respondendo
    const controller = new AbortController();
    const stopRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('stop_gen').setLabel('Parar').setStyle(ButtonStyle.Danger)
    );

    const thinkingMsg = await msg.reply({ content: "🤖 **Pensando...**", components: [stopRow] });
    activeRequests.set(thinkingMsg.id, controller);

    const key = db.channelAIs[msg.channel.id] || 'deepseek';
    const ia = db.customIAs[key] || db.customIAs['deepseek'];

    // Troca de Nickname
    if (msg.guild.members.me.permissions.has(PermissionFlagsBits.ChangeNickname)) {
        const nick = `Birutas | ${ia.name}`.substring(0, 32);
        if (msg.guild.members.me.nickname !== nick) msg.guild.members.me.setNickname(nick).catch(()=>{});
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST", signal: controller.signal,
            headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ 
                model: ia.id, 
                messages: [
                    { role: "system", content: ia.prompt }, 
                    ...(db.memory[msg.channel.id]||[]).slice(-6), 
                    { role: "user", content: msg.content }
                ] 
            })
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "❌ Sem resposta da API.";

        const row = new ActionRowBuilder();
        if (reply.includes('```')) row.addComponents(new ButtonBuilder().setCustomId('snapshot').setLabel('Snapshot').setStyle(ButtonStyle.Primary));

        await thinkingMsg.edit({ content: reply, components: row.components.length > 0 ? [row] : [] });
        db.memory[msg.channel.id] = [...(db.memory[msg.channel.id]||[]), {role:"user", content: msg.content}, {role:"assistant", content: reply}];
        saveDB();

    } catch (e) {
        thinkingMsg.edit({ content: e.name === 'AbortError' ? "🛑 Parado." : "❌ Erro na IA.", components: [] });
    } finally { activeRequests.delete(thinkingMsg.id); }
});

// --- INTERAÇÕES ---
client.on('interactionCreate', async (int) => {
    // Botões
    if (int.isButton()) {
        if (int.customId === 'stop_gen') {
            activeRequests.get(int.message.id)?.abort();
            return int.reply({ content: "Parando...", ephemeral: true });
        }
        if (int.customId === 'snapshot') {
            return int.reply({ content: `📸 **Snapshot:** https://ray.so/?code=${Buffer.from(int.message.content).toString('base64')}`, ephemeral: true });
        }
        if (int.customId.startsWith('set_ia_')) {
            const key = int.customId.replace('set_ia_', '');
            db.channelAIs[int.channelId] = key;
            saveDB();
            return int.update({ content: `✅ Personalidade alterada para: **${db.customIAs[key].name}**`, components: [] });
        }
    }

    // Comandos Slash
    if (int.isChatInputCommand()) {
        const isAdm = int.member.permissions.has(PermissionFlagsBits.Administrator) || (db.adminRole && int.member.roles.cache.has(db.adminRole));

        // Comandos Públicos
        if (int.commandName === 'coins') return int.reply(`💰 Saldo: **${db.economy[int.user.id] || 0} Coins**`);
        
        if (int.commandName === 'daily') {
            const now = Date.now();
            const last = db.lastDaily[int.user.id] || 0;
            const cooldown = 24 * 60 * 60 * 1000; // 24h
            
            if (now - last < cooldown) {
                const horas = Math.ceil((cooldown - (now - last)) / 3600000);
                return int.reply(`⏳ Você já pegou seu daily! Volte em **${horas} horas**.`);
            }
            
            db.economy[int.user.id] = (db.economy[int.user.id] || 0) + 100;
            db.lastDaily[int.user.id] = now;
            saveDB();
            return int.reply("💵 **+100 Coins!** Volte amanhã.");
        }

        if (int.commandName === 'imagine') {
            // Gera um prompt descritivo usando a IA atual
            await int.reply("🎨 **Gerando prompt para imagem...**");
            const ia = db.customIAs[db.channelAIs[int.channelId] || 'deepseek'];
            try {
                const res = await fetch("[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)", {
                    method: "POST", headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        model: ia.id, 
                        messages: [{role: "system", content: "Crie um prompt detalhado em inglês para um gerador de imagem baseado nisto:"}, {role: "user", content: int.options.getString('prompt')}] 
                    })
                });
                const d = await res.json();
                return int.editReply(`🖌️ **Prompt Gerado:**\n\`\`\`${d.choices[0].message.content}\`\`\`\n*(Copie e cole no Midjourney ou DALL-E)*`);
            } catch { return int.editReply("❌ Erro ao gerar prompt."); }
        }

        if (int.commandName === 'resumo') {
            await int.deferReply();
            const msgs = await int.channel.messages.fetch({ limit: 50 });
            const texto = msgs.map(m => `${m.author.username}: ${m.content}`).reverse().join('\n');
            const ia = db.customIAs[db.channelAIs[int.channelId] || 'deepseek'];
            
            try {
                const res = await fetch("[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)", {
                    method: "POST", headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        model: ia.id, 
                        messages: [{role: "system", content: "Faça um resumo conciso dessa conversa em tópicos:"}, {role: "user", content: texto.substring(0, 4000)}] 
                    })
                });
                const d = await res.json();
                return int.editReply(`📝 **Resumo do Chat:**\n${d.choices[0].message.content}`);
            } catch { return int.editReply("❌ Erro ao resumir."); }
        }

        if (int.commandName === 'setmode') {
            const rows = [];
            let row = new ActionRowBuilder();
            Object.keys(db.customIAs).forEach((key, i) => {
                if (i > 0 && i % 5 === 0) { rows.push(row); row = new ActionRowBuilder(); }
                row.addComponents(new ButtonBuilder().setCustomId(`set_ia_${key}`).setLabel(db.customIAs[key].name).setStyle(ButtonStyle.Secondary));
            });
            rows.push(row);
            return int.reply({ content: "🎭 Escolha a **Personalidade**:", components: rows });
        }

        // Comandos ADM
        if (!isAdm) return int.reply({ content: "❌ Apenas Gerência.", ephemeral: true });

        if (int.commandName === 'logs') { db.logChannel = int.channelId; saveDB(); return int.reply("✅ Logs definidos neste canal."); }
        if (int.commandName === 'config') { if(!db.allowedChannels.includes(int.channelId)) db.allowedChannels.push(int.channelId); saveDB(); return int.reply("✅ IA Ativa!"); }
        if (int.commandName === 'permissao') { db.adminRole = int.options.getRole('cargo').id; saveDB(); return int.reply("✅ Cargo ADM salvo."); }
        
        if (int.commandName === 'addia') {
            const key = int.options.getString('nome').toLowerCase().replace(/\s/g, '');
            db.customIAs[key] = { id: int.options.getString('id'), name: int.options.getString('nome'), prompt: int.options.getString('prompt') };
            saveDB();
            return int.reply(`✅ Personalidade **${int.options.getString('nome')}** criada!`);
        }
        
        if (int.commandName === 'delia') {
            const nome = int.options.getString('nome').toLowerCase().replace(/\s/g, '');
            if (['deepseek', 'venice'].includes(nome)) return int.reply("❌ Proibido deletar padrão.");
            delete db.customIAs[nome];
            saveDB();
            return int.reply("🗑️ Deletado.");
        }

        if (int.commandName === 'configvoz') {
            db.voiceConfig.coinsPerMin = int.options.getInteger('moedas');
            db.voiceConfig.allowMuted = int.options.getBoolean('mutado');
            saveDB();
            return int.reply(`🎙️ Voz: **${db.voiceConfig.coinsPerMin} coins/min** (Mutado: ${db.voiceConfig.allowMuted})`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
