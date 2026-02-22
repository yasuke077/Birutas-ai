/**
 * ══════════════════════════════════════════════════════════════
 * 🤖 BIRUTAS AI ULTIMATE v11
 * ══════════════════════════════════════════════════════════════
 */

import {
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, REST, Routes, SlashCommandBuilder,
    PermissionFlagsBits, AttachmentBuilder, ActivityType, ChannelType, Partials
} from 'discord.js';
import { Player }              from 'discord-player';
import { YoutubeiExtractor }   from 'discord-player-youtubei';
import sodium                  from 'libsodium-wrappers';
import mongoose                from 'mongoose';
import { registerFont }        from 'canvas';
import express                 from 'express';
import ms                      from 'ms';
import moment                  from 'moment-timezone';
import path                    from 'path';
import { fileURLToPath }       from 'url';

import { DEFAULT_IAS }                   from './src/config.js';
import { Config, Memory }                from './src/models.js';
import { getData, checkBadges, updateAIRole, loadIcons, xpForLevel, XP_COOLDOWN_MS, XP_MIN, XP_MAX } from './src/helpers.js';
import { handleCommand }                 from './src/commands.js';
import { emailCommand, handleEmailButton, handleEmailModal } from './src/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

moment.tz.setDefault('America/Sao_Paulo');

// ─── ENV ──────────────────────────────────────────────────────
['DISCORD_TOKEN','CLIENT_ID','MONGODB_URI','OPENROUTER_API_KEY'].forEach(k => {
    if (!process.env[k]) { console.error(`❌ ${k} não configurado!`); process.exit(1); }
});

// ─── Fontes ───────────────────────────────────────────────────
for (const [file, opts] of [
    ['DejaVuSans-Bold.ttf', { family: 'DejaVu Sans', weight: 'bold' }],
    ['DejaVuSans.ttf',      { family: 'DejaVu Sans' }]
]) {
    try {
        registerFont(path.join(__dirname, 'fonts', file), opts);
    } catch {
        try { registerFont(`/usr/share/fonts/truetype/dejavu/${file}`, opts); } catch { /* fallback */ }
    }
}

// ─── Keepalive ────────────────────────────────────────────────
express().get('/', (_, r) => r.json({ status: 'Online', v: '11.0' })).listen(process.env.PORT || 3000);

// ─── MongoDB ──────────────────────────────────────────────────
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI, { connectTimeoutMS: 30000, family: 4 })
    .then(() => console.log('✅ MongoDB conectado.'))
    .catch(e => console.error('❌ MongoDB:', e.message));

// ─── Discord Client ───────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction]
});

// ─── Player ───────────────────────────────────────────────────
// Inicializa libsodium antes de qualquer conexão de voz
// Sem isso, @discordjs/voice nao encontra os modos de criptografia do Discord
await sodium.ready;
console.log('✅ libsodium inicializado.');

const player = new Player(client, { skipFFmpeg: false });
player.extractors.register(YoutubeiExtractor, {});
player.events.on('error',       (q, e) => console.error('[Música]', e.message));
player.events.on('playerError', (q, e) => { console.error('[Música Stream]', e.message); if (q.node.isPlaying()) q.node.skip(); });
player.events.on('playerStart', (q, t) => q.metadata?.channel?.send(`🎵 **Tocando agora:** ${t.title}`).catch(() => {}));

// ─── Constrói rows de botões de IA (máx 5 por row) ───────────
function buildIARows(allAIs, activeKey) {
    const rows = [];
    const keys = Object.keys(allAIs).slice(0, 10);
    for (let i = 0; i < keys.length; i += 5) {
        const row = new ActionRowBuilder();
        keys.slice(i, i + 5).forEach(k => {
            const ia = allAIs[k];
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`swap_${k}`)
                    .setLabel(`${ia.name} ${ia.desc || ''}`.trim().slice(0, 80))
                    .setStyle(k === activeKey ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(k === activeKey)
            );
        });
        rows.push(row);
    }
    return rows.slice(0, 5); // Discord: máx 5 rows por mensagem
}

// ═══════════════════════════════════════════════════════════════
// 💬 MENSAGENS — XP + IA
// ═══════════════════════════════════════════════════════════════
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    try {
        const { config, user } = await getData(message.guild.id, message.author.id);
        if (!config || !user) return;

        // ── XP PROFISSIONAL (cooldown de 60s, igual Arcane/Loritta) ────
        const now = Date.now();
        if (now - (user.xpCooldown || 0) >= XP_COOLDOWN_MS) {
            const xpGain = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
            // VIP ganha 2x XP
            const finalXP = user.vipUntil > now ? xpGain * 2 : xpGain;
            user.xp     += finalXP;
            user.xpCooldown = now;
            user.messages   = (user.messages || 0) + 1;

            // Level up
            let leveled = false;
            while (user.xp >= xpForLevel(user.level + 1)) {
                user.xp -= xpForLevel(user.level + 1);
                user.level++;
                leveled = true;
            }
            if (leveled) {
                const embed = new EmbedBuilder()
                    .setTitle('🆙 LEVEL UP!')
                    .setColor('#00ff88')
                    .setDescription(`🎉 <@${message.author.id}> subiu para o **Nível ${user.level}**!`)
                    .setTimestamp();
                message.channel.send({ embeds: [embed] }).catch(() => {});
            }
        }

        // ── Tracking de comportamento para badges ────────────────
        if (message.content.length > 15 && message.content === message.content.toUpperCase() && /[A-Z]/.test(message.content)) {
            user.robotBehaviorCount = (user.robotBehaviorCount || 0) + 1;
        }
        const member = message.member;
        if (member?.displayName === 'V') {
            const elapsed = now - (user.lastMessageTimestamp || 0);
            if (!user.isV) { user.isV = true; user.vStreak = 1; }
            else if (elapsed > 72000000 && elapsed < 172800000) user.vStreak++;
        } else { user.isV = false; user.vStreak = 0; }
        user.lastMessageTimestamp = now;

        // Badge silêncio (canal morto)
        if (!user.badges?.includes('silencio')) {
            const lastMsgs = await message.channel.messages.fetch({ limit: 2 }).catch(() => null);
            if (lastMsgs?.size >= 2) {
                const prev = lastMsgs.at(1);
                if (prev && now - prev.createdTimestamp > 604800000) {
                    if (!user.badges) user.badges = [];
                    user.badges.push('silencio');
                }
            }
        }

        await checkBadges(user, null, message);
        await user.save();

        // ── IA ───────────────────────────────────────────────────
        const isAllowed  = config.allowedChannels.includes(message.channel.id);
        const isBanned   = config.bannedChannels.includes(message.channel.id);
        const isMentioned = message.mentions.has(client.user);
        if ((!isAllowed && !isMentioned) || isBanned) return;

        if (!process.env.OPENROUTER_API_KEY) return message.reply('❌ OPENROUTER_API_KEY não configurada.');

        const allAIs  = { ...DEFAULT_IAS, ...(config.customIAs || {}) };
        const iaKey   = config.channelAIs?.[message.channel.id] || 'gemini';
        const ia      = allAIs[iaKey] || DEFAULT_IAS.gemini;

        await updateAIRole(message.guild, message.guild.members.me, ia.name, ia.color, allAIs);
        const thinkingMsg = await message.reply(`🤔 **${ia.name}** está pensando...`).catch(() => null);

        const cleanContent = message.content.replace(/<@!?\d+>/g, '').trim();
        const memory = await Memory.findOneAndUpdate(
            { channelId: message.channel.id },
            { $push: { messages: { $each: [{ role: 'user', content: cleanContent }], $slice: -20 } } },
            { upsert: true, new: true }
        );

        try {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type':  'application/json',
                    'HTTP-Referer':  'https://birutas.ai',
                    'X-Title':       'Birutas AI'
                },
                body: JSON.stringify({
                    model:    ia.id,
                    messages: [{ role: 'system', content: ia.prompt }, ...memory.messages],
                    temperature: 0.75,
                    max_tokens:  1000
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || res.statusText);
            const aiReply = data.choices?.[0]?.message?.content;
            if (!aiReply) throw new Error('Resposta vazia da API.');

            await Memory.updateOne(
                { channelId: message.channel.id },
                { $push: { messages: { $each: [{ role: 'assistant', content: aiReply }], $slice: -20 } } }
            );

            // Atualiza stats do usuário
            const { user: freshUser } = await getData(message.guild.id, message.author.id);
            if (freshUser) {
                freshUser.iaMessages = (freshUser.iaMessages || 0) + 1;
                await freshUser.save();
                await checkBadges(freshUser, null, message);
            }

            const rows    = buildIARows(allAIs, iaKey);
            const content = aiReply.slice(0, 2000);
            if (thinkingMsg) {
                await thinkingMsg.edit({ content, components: rows }).catch(async () => {
                    await message.channel.send({ content, components: rows }).catch(() => {});
                });
            } else {
                await message.channel.send({ content, components: rows }).catch(() => {});
            }
        } catch (err) {
            console.error('[IA ERROR]', ia.name, err.message);
            const errContent = `❌ **${ia.name}** falhou: ${err.message.slice(0, 150)}\nTente outra IA nos botões abaixo.`;
            const rows = buildIARows(allAIs, iaKey);
            if (thinkingMsg) await thinkingMsg.edit({ content: errContent, components: rows }).catch(() => {});
            else await message.channel.send({ content: errContent, components: rows }).catch(() => {});
        }
    } catch (e) {
        console.error('[messageCreate]', e.message);
    }
});

// ═══════════════════════════════════════════════════════════════
// 🎙️ VOZ
// ═══════════════════════════════════════════════════════════════
client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.member?.user?.bot) return;
    try {
        const { config, user } = await getData(newState.guild.id, newState.member.id);
        if (!config || !user) return;
        if (!oldState.channelId && newState.channelId) {
            user.voiceJoinTime = Date.now();
            await user.save();
        } else if (oldState.channelId && !newState.channelId && (user.voiceJoinTime || 0) > 0) {
            const mins = Math.floor((Date.now() - user.voiceJoinTime) / 60000);
            if (mins >= 1) {
                user.voiceMinutes = (user.voiceMinutes || 0) + mins;
                user.coins        += mins * (config.voiceConfig?.coinsPerMin ?? 10);
                const xpGain       = mins * (config.voiceConfig?.xpPerMin ?? 5);
                user.xp           += user.vipUntil > Date.now() ? xpGain * 2 : xpGain;
                // Level up por voz
                while (user.xp >= xpForLevel(user.level + 1)) {
                    user.xp -= xpForLevel(user.level + 1);
                    user.level++;
                }
                user.voiceJoinTime = 0;
                await user.save();
                await checkBadges(user, null, null);
            }
        }
    } catch (e) { console.error('[VOZ]', e.message); }
});

// ═══════════════════════════════════════════════════════════════
// 👋 BOAS-VINDAS
// ═══════════════════════════════════════════════════════════════
client.on('guildMemberAdd', async (member) => {
    try {
        const { config } = await getData(member.guild.id);
        if (!config?.welcomeConfig?.enabled || !config.welcomeConfig.channelId) return;
        const ch = member.guild.channels.cache.get(config.welcomeConfig.channelId);
        if (!ch) return;
        const msg = (config.welcomeConfig.message || 'Bem-vindo, {user}!').replace('{user}', `<@${member.id}>`);
        await ch.send(msg);
    } catch { /* silencioso */ }
});

// ═══════════════════════════════════════════════════════════════
// 🎮 INTERACTIONS — Comandos + Botões + Modais
// ═══════════════════════════════════════════════════════════════
client.on('interactionCreate', async (interaction) => {
    try {
        // ── BOTÃO: troca de IA ──────────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('swap_')) {
            await interaction.deferUpdate();
            const key            = interaction.customId.replace('swap_', '');
            const { config }     = await getData(interaction.guild.id);
            if (!config) return;
            const allAIs         = { ...DEFAULT_IAS, ...(config.customIAs || {}) };
            const ia             = allAIs[key];
            if (!ia) return interaction.followUp({ content: '❌ IA não encontrada.', flags: 64 });
            await updateAIRole(interaction.guild, interaction.guild.members.me, ia.name, ia.color, allAIs);
            await Config.updateOne({ guildId: interaction.guild.id }, { [`channelAIs.${interaction.channelId}`]: key });
            return interaction.followUp({ content: `✅ IA trocada para **${ia.name}** neste canal.`, flags: 64 });
        }

        // ── BOTÕES: e-mail ──────────────────────────────────────
        if (interaction.isButton() && (
            interaction.customId.startsWith('email_') ||
            interaction.customId.startsWith('marry_')
        )) {
            // marriage buttons são tratados nos collectors inline em commands.js
            if (interaction.customId.startsWith('email_')) {
                return handleEmailButton(interaction);
            }
        }

        // ── MODAL: e-mail ───────────────────────────────────────
        if (interaction.isModalSubmit() && interaction.customId === 'email_name_modal') {
            return handleEmailModal(interaction);
        }

        // ── SLASH COMMANDS ──────────────────────────────────────
        if (!interaction.isChatInputCommand()) return;
        await handleCommand(interaction, player);

    } catch (e) {
        console.error('[interactionCreate]', e.message, e.stack?.split('\n')[1] || '');
        try {
            const msg = '❌ Ocorreu um erro. Tente novamente.';
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: msg, flags: 64 }); // 64 = ephemeral
            } else if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ content: msg });
            }
        } catch { /* silencioso */ }
    }
});

// ═══════════════════════════════════════════════════════════════
// 🚀 READY — Registra comandos
// ═══════════════════════════════════════════════════════════════
client.once('clientReady', async () => {
    console.log(`✅ ${client.user.tag} online!`);
    await loadIcons();
    client.user.setActivity('/help | Birutas AI v11', { type: ActivityType.Playing });

    const commands = [
        // MODERAÇÃO
        new SlashCommandBuilder().setName('ban').setDescription('Bane um usuário.').addUserOption(o=>o.setName('usuario').setDescription('Usuário').setRequired(true)).addStringOption(o=>o.setName('motivo').setDescription('Motivo')),
        new SlashCommandBuilder().setName('kick').setDescription('Expulsa um usuário.').addUserOption(o=>o.setName('usuario').setDescription('Usuário').setRequired(true)).addStringOption(o=>o.setName('motivo').setDescription('Motivo')),
        new SlashCommandBuilder().setName('warn').setDescription('Adverte um usuário.').addUserOption(o=>o.setName('usuario').setDescription('Usuário').setRequired(true)).addStringOption(o=>o.setName('motivo').setDescription('Motivo')),
        new SlashCommandBuilder().setName('warnings').setDescription('Vê advertências.').addUserOption(o=>o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('unwarn').setDescription('Remove advertências.').addUserOption(o=>o.setName('usuario').setDescription('Usuário').setRequired(true)),
        new SlashCommandBuilder().setName('mute').setDescription('Muta um usuário.').addUserOption(o=>o.setName('usuario').setDescription('Usuário').setRequired(true)).addStringOption(o=>o.setName('tempo').setDescription('Ex: 10m, 1h').setRequired(true)),
        new SlashCommandBuilder().setName('unmute').setDescription('Desmuta um usuário.').addUserOption(o=>o.setName('usuario').setDescription('Usuário').setRequired(true)),
        new SlashCommandBuilder().setName('clear').setDescription('Limpa mensagens (1-100).').addIntegerOption(o=>o.setName('quantidade').setDescription('Qtd').setRequired(true)),
        new SlashCommandBuilder().setName('nuke').setDescription('Purifica o canal.'),
        new SlashCommandBuilder().setName('lock').setDescription('Tranca o canal.'),
        new SlashCommandBuilder().setName('unlock').setDescription('Destranca o canal.'),
        new SlashCommandBuilder().setName('slowmode').setDescription('Define slowmode.').addIntegerOption(o=>o.setName('segundos').setDescription('Segundos').setRequired(true)),
        new SlashCommandBuilder().setName('setia').setDescription('Define IA de um canal.').addStringOption(o=>o.setName('ia').setDescription('Chave da IA').setRequired(true)).addChannelOption(o=>o.setName('canal').setDescription('Canal').setRequired(true)),
        new SlashCommandBuilder().setName('allowchannel').setDescription('Libera/remove canal para IA.').addChannelOption(o=>o.setName('canal').setDescription('Canal').setRequired(true)).addStringOption(o=>o.setName('acao').setDescription('Ação').setRequired(true).addChoices({name:'Adicionar',value:'add'},{name:'Remover',value:'remove'})),
        new SlashCommandBuilder().setName('banchannel').setDescription('Bane/libera canal da IA.').addChannelOption(o=>o.setName('canal').setDescription('Canal').setRequired(true)).addStringOption(o=>o.setName('acao').setDescription('Ação').setRequired(true).addChoices({name:'Banir',value:'add'},{name:'Liberar',value:'remove'})),
        new SlashCommandBuilder().setName('setwelcome').setDescription('Configura boas-vindas.').addChannelOption(o=>o.setName('canal').setDescription('Canal').setRequired(true)).addStringOption(o=>o.setName('mensagem').setDescription('Use {user}')),
        new SlashCommandBuilder().setName('setadmin').setDescription('Define cargo admin.').addRoleOption(o=>o.setName('cargo').setDescription('Cargo').setRequired(true)),
        new SlashCommandBuilder().setName('setlog').setDescription('Define canal de logs.').addChannelOption(o=>o.setName('canal').setDescription('Canal').setRequired(true)),
        new SlashCommandBuilder().setName('backup').setDescription('Gera backup do servidor.'),
        new SlashCommandBuilder().setName('resetbadges').setDescription('Reseta badges de um usuário.').addUserOption(o=>o.setName('usuario').setDescription('Usuário').setRequired(true)),
        new SlashCommandBuilder().setName('givebadge').setDescription('Concede badge a um usuário.').addUserOption(o=>o.setName('usuario').setDescription('Usuário').setRequired(true)).addStringOption(o=>o.setName('badge').setDescription('ID da badge').setRequired(true)),
        new SlashCommandBuilder().setName('setbotowner').setDescription('Define o dono do bot no servidor.').addUserOption(o=>o.setName('usuario').setDescription('Usuário').setRequired(true)),
        // ECONOMIA
        new SlashCommandBuilder().setName('coins').setDescription('Saldo de coins.').addUserOption(o=>o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('daily').setDescription('Coleta recompensa diária.'),
        new SlashCommandBuilder().setName('work').setDescription('Trabalha para ganhar coins.'),
        new SlashCommandBuilder().setName('crime').setDescription('Tenta cometer um crime.'),
        new SlashCommandBuilder().setName('rob').setDescription('Tenta roubar alguém.').addUserOption(o=>o.setName('usuario').setDescription('Vítima').setRequired(true)),
        new SlashCommandBuilder().setName('give').setDescription('Doa coins.').addUserOption(o=>o.setName('usuario').setDescription('Destinatário').setRequired(true)).addIntegerOption(o=>o.setName('quantidade').setDescription('Valor').setRequired(true)),
        new SlashCommandBuilder().setName('shop').setDescription('Mostra a loja.'),
        new SlashCommandBuilder().setName('buy').setDescription('Compra item.').addStringOption(o=>o.setName('id').setDescription('ID do item').setRequired(true)),
        new SlashCommandBuilder().setName('inventory').setDescription('Seu inventário.'),
        new SlashCommandBuilder().setName('rank').setDescription('Ranking de riqueza.'),
        new SlashCommandBuilder().setName('configvoz').setDescription('Configura coins por minuto em voz (dono exclusivo).').addIntegerOption(o=>o.setName('valor').setDescription('Coins/min').setRequired(true)),
        // CASSINO
        new SlashCommandBuilder().setName('coinflip').setDescription('Cara ou coroa.').addStringOption(o=>o.setName('lado').setDescription('Lado').setRequired(true).addChoices({name:'Cara',value:'cara'},{name:'Coroa',value:'coroa'})).addIntegerOption(o=>o.setName('valor').setDescription('Aposta').setRequired(true)),
        new SlashCommandBuilder().setName('slots').setDescription('Máquina de slots.').addIntegerOption(o=>o.setName('valor').setDescription('Aposta').setRequired(true)),
        new SlashCommandBuilder().setName('roulette').setDescription('Roleta.').addStringOption(o=>o.setName('cor').setDescription('Cor').setRequired(true).addChoices({name:'Vermelho (2x)',value:'red'},{name:'Preto (2x)',value:'black'},{name:'Verde (14x)',value:'green'})).addIntegerOption(o=>o.setName('valor').setDescription('Aposta').setRequired(true)),
        new SlashCommandBuilder().setName('jokenpo').setDescription('Pedra, papel ou tesoura.').addStringOption(o=>o.setName('jogada').setDescription('Jogada').setRequired(true).addChoices({name:'Pedra',value:'pedra'},{name:'Papel',value:'papel'},{name:'Tesoura',value:'tesoura'})).addIntegerOption(o=>o.setName('aposta').setDescription('Aposta (opcional)')),
        new SlashCommandBuilder().setName('dado').setDescription('Lança um dado.').addIntegerOption(o=>o.setName('faces').setDescription('Faces (2-10000)').setRequired(true)),
        // SOCIAL
        new SlashCommandBuilder().setName('profile').setDescription('Perfil canvas.').addUserOption(o=>o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('setbanner').setDescription('Define fundo do perfil (requer item Banner).').addAttachmentOption(o=>o.setName('imagem').setDescription('Imagem de fundo').setRequired(true)),
        new SlashCommandBuilder().setName('stats').setDescription('Estatísticas.').addUserOption(o=>o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('level').setDescription('Nível e XP.').addUserOption(o=>o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('leaderboard').setDescription('Ranking de nível.'),
        new SlashCommandBuilder().setName('badges').setDescription('Conquistas.').addUserOption(o=>o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('marry').setDescription('Pedido de casamento.').addUserOption(o=>o.setName('usuario').setDescription('Noivo(a)').setRequired(true)),
        new SlashCommandBuilder().setName('divorce').setDescription('Divorcia-se.'),
        new SlashCommandBuilder().setName('rep').setDescription('Dá reputação.').addUserOption(o=>o.setName('usuario').setDescription('Usuário').setRequired(true)),
        new SlashCommandBuilder().setName('toprep').setDescription('Ranking de reputação.'),
        new SlashCommandBuilder().setName('setbio').setDescription('Define sua bio.').addStringOption(o=>o.setName('texto').setDescription('Bio').setRequired(true)),
        new SlashCommandBuilder().setName('setcolor').setDescription('Cor do perfil (requer item).').addStringOption(o=>o.setName('hex').setDescription('#RRGGBB').setRequired(true)),
        new SlashCommandBuilder().setName('avatar').setDescription('Avatar de um usuário.').addUserOption(o=>o.setName('usuario').setDescription('Usuário')),
        // MÚSICA
        new SlashCommandBuilder().setName('play').setDescription('Toca música.').addStringOption(o=>o.setName('musica').setDescription('Nome ou URL').setRequired(true)),
        new SlashCommandBuilder().setName('skip').setDescription('Pula música.'),
        new SlashCommandBuilder().setName('stop').setDescription('Para e limpa fila.'),
        new SlashCommandBuilder().setName('queue').setDescription('Fila de músicas.'),
        new SlashCommandBuilder().setName('volume').setDescription('Ajusta volume.').addIntegerOption(o=>o.setName('nivel').setDescription('0-100').setRequired(true)),
        // UTILIDADES
        new SlashCommandBuilder().setName('imagine').setDescription('Gera imagem com IA.').addStringOption(o=>o.setName('prompt').setDescription('Descrição').setRequired(true)),
        new SlashCommandBuilder().setName('analyze-image').setDescription('Analisa imagem com Vision.').addAttachmentOption(o=>o.setName('imagem').setDescription('Imagem').setRequired(true)),
        new SlashCommandBuilder().setName('resumo').setDescription('Résume últimas 50 mensagens.'),
        new SlashCommandBuilder().setName('addia').setDescription('Cria IA personalizada.').addStringOption(o=>o.setName('id').setDescription('ID no OpenRouter').setRequired(true)).addStringOption(o=>o.setName('nome').setDescription('Nome').setRequired(true)).addStringOption(o=>o.setName('prompt').setDescription('Prompt').setRequired(true)).addStringOption(o=>o.setName('cor').setDescription('Cor HEX')),
        new SlashCommandBuilder().setName('delia').setDescription('Remove IA personalizada.').addStringOption(o=>o.setName('nome').setDescription('Nome da IA').setRequired(true)),
        new SlashCommandBuilder().setName('reset').setDescription('Reseta memória da IA no canal.'),
        new SlashCommandBuilder().setName('qrcode').setDescription('Gera QR Code.').addStringOption(o=>o.setName('texto').setDescription('Conteúdo').setRequired(true)),
        new SlashCommandBuilder().setName('shorten').setDescription('Encurta URL.').addStringOption(o=>o.setName('url').setDescription('URL').setRequired(true)),
        new SlashCommandBuilder().setName('weather').setDescription('Clima de uma cidade.').addStringOption(o=>o.setName('cidade').setDescription('Cidade').setRequired(true)),
        new SlashCommandBuilder().setName('crypto').setDescription('Cotação de cripto.').addStringOption(o=>o.setName('moeda').setDescription('Ex: BTC, ETH').setRequired(true)),
        new SlashCommandBuilder().setName('giveaway').setDescription('Inicia sorteio.').addStringOption(o=>o.setName('tempo').setDescription('Ex: 10m, 1h').setRequired(true)).addIntegerOption(o=>o.setName('vencedores').setDescription('Nº vencedores').setRequired(true)).addStringOption(o=>o.setName('premio').setDescription('Prêmio').setRequired(true)),
        new SlashCommandBuilder().setName('tag').setDescription('Gerencia tags.').addStringOption(o=>o.setName('acao').setDescription('Ação').setRequired(true).addChoices({name:'Criar',value:'create'},{name:'Deletar',value:'delete'},{name:'Listar',value:'list'},{name:'Usar',value:'use'})).addStringOption(o=>o.setName('nome').setDescription('Nome da tag').setRequired(true)).addStringOption(o=>o.setName('texto').setDescription('Conteúdo (para criar)')),
        new SlashCommandBuilder().setName('graph').setDescription('Gráfico do servidor.').addStringOption(o=>o.setName('tipo').setDescription('Tipo').setRequired(true).addChoices({name:'Nível',value:'activity'},{name:'Riqueza',value:'coins'})),
        new SlashCommandBuilder().setName('status').setDescription('Status do bot.'),
        // EMAIL
        emailCommand,
        // DONO DO BOT
        new SlashCommandBuilder().setName('addcoins').setDescription('Adiciona ou remove coins de alguém (só dono).').addUserOption(o=>o.setName('usuario').setDescription('Usuário').setRequired(true)).addIntegerOption(o=>o.setName('quantidade').setDescription('Valor (negativo para remover)').setRequired(true)),
        new SlashCommandBuilder().setName('configecon').setDescription('Configura valores da economia (só dono).').addStringOption(o=>o.setName('campo').setDescription('O que configurar').setRequired(true).addChoices(
            {name:'Daily (coins)',          value:'daily'},
            {name:'Work mínimo',            value:'work_min'},
            {name:'Work máximo',            value:'work_max'},
            {name:'Crime mínimo',           value:'crime_min'},
            {name:'Crime máximo',           value:'crime_max'},
            {name:'Voz coins/min',          value:'voz_coins'},
            {name:'Voz XP/min',             value:'voz_xp'},
            {name:'Roubo % mínimo da vítima',value:'rob_min_pct'},
            {name:'Roubo % máximo da vítima',value:'rob_max_pct'}
        )).addIntegerOption(o=>o.setName('valor').setDescription('Novo valor').setRequired(true)),
        new SlashCommandBuilder().setName('pobreza').setDescription('Receba 10.000.000 coins (cooldown 10min).'),
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands.map(c => c.toJSON()) });
        console.log(`✅ ${commands.length} comandos sincronizados.`);
    } catch (e) { console.error('❌ Sync:', e.message); }
});

process.on('unhandledRejection', e => console.error('[Unhandled]', e?.message || e));
process.on('uncaughtException',  e => console.error('[Exception]', e?.message || e));

client.login(process.env.DISCORD_TOKEN);
