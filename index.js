/**
 * ══════════════════════════════════════════════════════════════
 * 🤖 BIRUTAS AI ULTIMATE — REFATORADO (v10)
 * ══════════════════════════════════════════════════════════════
 * Estrutura:
 *   index.js          ← entrada principal (eventos, IA, startup)
 *   src/config.js     ← constantes (badges, IAs, loja)
 *   src/models.js     ← schemas MongoDB
 *   src/helpers.js    ← getData, checkBadges, canvas, etc.
 *   src/commands.js   ← todos os handlers de slash commands
 *   src/email.js      ← e-mail temporário (mail.tm)
 */

import {
    Client, GatewayIntentBits, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    REST, Routes, SlashCommandBuilder,
    PermissionFlagsBits, AttachmentBuilder,
    ActivityType, ChannelType, Partials
} from 'discord.js';
import { Player }              from 'discord-player';
import { YoutubeiExtractor }   from 'discord-player-youtubei';
import mongoose                from 'mongoose';
import { registerFont }        from 'canvas';
import express                 from 'express';
import ms                      from 'ms';
import moment                  from 'moment-timezone';
import path                    from 'path';
import { fileURLToPath }       from 'url';

import { DEFAULT_IAS }         from './src/config.js';
import { Config, Memory }      from './src/models.js';
import { getData, checkBadges, updateAIRole, loadIcons, xpForLevel } from './src/helpers.js';
import { handleCommand }       from './src/commands.js';
import { emailCommand }        from './src/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

moment.tz.setDefault('America/Sao_Paulo');

/* ─── Validação de ENV ────────────────────────────────────── */
['DISCORD_TOKEN','CLIENT_ID','MONGODB_URI','OPENROUTER_API_KEY'].forEach(k => {
    if (!process.env[k]) { console.error(`❌ ${k} não configurado!`); process.exit(1); }
});

/* ─── Fontes ──────────────────────────────────────────────── */
try {
    registerFont(path.join(__dirname, 'fonts', 'DejaVuSans-Bold.ttf'), { family: 'DejaVu Sans', weight: 'bold' });
    registerFont(path.join(__dirname, 'fonts', 'DejaVuSans.ttf'),      { family: 'DejaVu Sans' });
    console.log('✅ Fontes locais (fonts/) carregadas.');
} catch {
    try {
        registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', { family: 'DejaVu Sans', weight: 'bold' });
        registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',      { family: 'DejaVu Sans' });
        console.log('✅ Fontes do sistema carregadas.');
    } catch { console.log('⚠️ Usando fonte padrão.'); }
}

/* ─── Servidor Web (keep-alive Railway) ───────────────────── */
const app = express();
app.get('/', (_, res) => res.json({ status: 'Online', version: '10.0', uptime: process.uptime() }));
app.listen(process.env.PORT || 3000, () => console.log(`🌐 Web rodando na porta ${process.env.PORT || 3000}`));

/* ─── MongoDB ─────────────────────────────────────────────── */
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI, { connectTimeoutMS: 30000, family: 4 })
    .then(() => console.log('✅ MongoDB conectado.'))
    .catch(e => console.error('❌ MongoDB:', e.message));

/* ─── Discord Client ──────────────────────────────────────── */
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction]
});

/* ─── Player de Música ────────────────────────────────────── */
const player = new Player(client, { skipFFmpeg: false });
player.extractors.register(YoutubeiExtractor, {});
player.events.on('error',       (q, e) => console.log(`[Música] Erro: ${e.message}`));
player.events.on('playerError', (q, e) => { console.log(`[Música] Stream error: ${e.message}`); if (q.node.isPlaying()) q.node.skip(); });
player.events.on('playerStart', (q, t) => { if (q.metadata?.channel) q.metadata.channel.send(`🎵 **Tocando agora:** ${t.title}`); });

// ═══════════════════════════════════════════════════════════════
// 💬 EVENTO: MENSAGENS (XP + IA)
// ═══════════════════════════════════════════════════════════════
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const { config, user } = await getData(message.guild.id, message.author.id);
    if (!config || !user) return;

    // ── XP & Level up ──────────────────────────────────────
    user.messages = (user.messages || 0) + 1;
    user.xp += Math.floor(Math.random() * 10) + 5;
    const xpNeeded = xpForLevel(user.level + 1);
    if (user.xp >= xpNeeded) {
        user.level++;
        user.xp -= xpNeeded;
        message.channel.send(`🎉 <@${message.author.id}> subiu para o **Nível ${user.level}**!`).catch(() => {});
    }
    await checkBadges(user, null, message);
    await user.save();

    // ── IA ──────────────────────────────────────────────────
    const isAllowed = config.allowedChannels.includes(message.channel.id);
    const isBanned  = config.bannedChannels.includes(message.channel.id);
    const isMentioned = message.mentions.has(client.user);
    if ((!isAllowed && !isMentioned) || isBanned) return;

    if (!process.env.OPENROUTER_API_KEY) {
        return message.reply('❌ OPENROUTER_API_KEY não configurada.');
    }

    const allAIs = { ...DEFAULT_IAS, ...(config.customIAs || {}) };
    const iaKey  = config.channelAIs?.[message.channel.id] || 'gemini';
    const ia     = allAIs[iaKey] || DEFAULT_IAS.gemini;

    await updateAIRole(message.guild, message.guild.members.me, ia.name, ia.color, allAIs);

    // Mensagem "pensando"
    const thinkingMsg = await message.reply(`🤔 **${ia.name}** está pensando...`).catch(() => null);

    // Memória do canal
    const cleanContent = message.content.replace(/<@!?\d+>/g, '').trim();
    const memory = await Memory.findOneAndUpdate(
        { channelId: message.channel.id },
        { $push: { messages: { $each: [{ role: 'user', content: cleanContent }], $slice: -20 } } },
        { upsert: true, new: true }
    );

    // ── CORREÇÃO CRÍTICA: Limite de 5 botões por row no Discord ──
    // Se tiver mais de 5 IAs, divide em 2 rows (máx 10 IAs mostradas)
    const buildRows = (activeKey) => {
        const rows = [];
        const keys = Object.keys(allAIs).slice(0, 10);
        for (let i = 0; i < keys.length; i += 5) {
            const chunk = keys.slice(i, i + 5);
            const row = new ActionRowBuilder();
            chunk.forEach(k => {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`swap_${k}`)
                        .setLabel(`${allAIs[k].name} ${allAIs[k].desc || ''}`.trim().slice(0, 80))
                        .setStyle(k === activeKey ? ButtonStyle.Success : ButtonStyle.Secondary)
                        .setDisabled(k === activeKey)
                );
            });
            rows.push(row);
        }
        return rows.slice(0, 5); // Discord aceita no máximo 5 rows por mensagem
    };

    try {
        console.log(`[IA] Enviando para ${ia.name} (${ia.id})`);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://birutas.ai',
                'X-Title': 'Birutas AI'
            },
            body: JSON.stringify({
                model: ia.id,
                messages: [
                    { role: 'system', content: ia.prompt },
                    ...memory.messages
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        const data = await response.json();
        console.log(`[IA] Status: ${response.status} | Model: ${data.model || 'N/A'}`);

        if (!response.ok) throw new Error(data.error?.message || response.statusText);
        if (!data.choices?.[0]?.message?.content) throw new Error('Resposta vazia da API: ' + JSON.stringify(data).slice(0, 200));

        const aiReply = data.choices[0].message.content;

        await Memory.updateOne(
            { channelId: message.channel.id },
            { $push: { messages: { $each: [{ role: 'assistant', content: aiReply }], $slice: -20 } } }
        );
        user.iaMessages = (user.iaMessages || 0) + 1;
        await user.save();

        const components = buildRows(iaKey);
        const content    = aiReply.slice(0, 2000);

        if (thinkingMsg) {
            await thinkingMsg.edit({ content, components }).catch(async () => {
                // Se editar falhar, tenta enviar nova mensagem
                await message.channel.send({ content, components }).catch(() => {});
            });
        } else {
            await message.channel.send({ content, components }).catch(() => {});
        }

    } catch (err) {
        console.error(`[IA ERROR] ${ia.name}:`, err.message);
        const errorText = `❌ **${ia.name}** falhou: ${err.message.slice(0, 200)}\nTente trocar de IA nos botões abaixo.`;
        const components = buildRows(iaKey);
        if (thinkingMsg) {
            await thinkingMsg.edit({ content: errorText, components }).catch(() => {});
        } else {
            await message.channel.send({ content: errorText, components }).catch(() => {});
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// 🎙️ EVENTO: VOZ
// ═══════════════════════════════════════════════════════════════
client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.member?.user?.bot) return;
    try {
        const { user } = await getData(newState.guild.id, newState.member.id);
        if (!user) return;
        if (!oldState.channelId && newState.channelId) {
            user.voiceJoinTime = Date.now();
            await user.save();
        } else if (oldState.channelId && !newState.channelId && user.voiceJoinTime > 0) {
            const mins = Math.floor((Date.now() - user.voiceJoinTime) / 60000);
            if (mins >= 1) {
                const { config } = await getData(newState.guild.id);
                user.voiceMinutes += mins;
                user.coins        += mins * (config.voiceConfig.coinsPerMin || 10);
                user.xp           += mins * (config.voiceConfig.xpPerMin    || 5);
                user.voiceJoinTime = 0;
                await user.save();
                await checkBadges(user, null, null);
            }
        }
    } catch (e) { console.error('[VOZ]', e.message); }
});

// ═══════════════════════════════════════════════════════════════
// 🎉 EVENTO: MEMBROS (BOAS-VINDAS)
// ═══════════════════════════════════════════════════════════════
client.on('guildMemberAdd', async (member) => {
    try {
        const { config } = await getData(member.guild.id);
        if (!config?.welcomeConfig?.enabled || !config.welcomeConfig.channelId) return;
        const channel = member.guild.channels.cache.get(config.welcomeConfig.channelId);
        if (!channel) return;
        const msg = (config.welcomeConfig.message || 'Bem-vindo, {user}!').replace('{user}', `<@${member.id}>`);
        await channel.send(msg);
    } catch (e) { console.error('[WELCOME]', e.message); }
});

// ═══════════════════════════════════════════════════════════════
// 🎮 EVENTO: INTERACTIONS (comandos + botões)
// ═══════════════════════════════════════════════════════════════
client.on('interactionCreate', async (interaction) => {
    try {
        // ── Botão de troca de IA ───────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('swap_')) {
            await interaction.deferUpdate().catch(() => {});
            const key = interaction.customId.replace('swap_', '');
            const { config } = await getData(interaction.guild.id);
            if (!config) return;
            const allAIs = { ...DEFAULT_IAS, ...(config.customIAs || {}) };
            const ia = allAIs[key];
            if (!ia) {
                return interaction.followUp({ content: '❌ IA não encontrada.', ephemeral: true }).catch(() => {});
            }
            await updateAIRole(interaction.guild, interaction.guild.members.me, ia.name, ia.color, allAIs);
            await Config.updateOne({ guildId: interaction.guild.id }, { [`channelAIs.${interaction.channelId}`]: key });
            return interaction.followUp({ content: `✅ IA alterada para **${ia.name}** neste canal.`, ephemeral: true }).catch(() => {});
        }

        // ── Slash commands ────────────────────────────────
        if (!interaction.isChatInputCommand()) return;
        await handleCommand(interaction, player);

    } catch (error) {
        console.error('[INTERACTION ERROR]', error);
        try {
            const msg = { content: '❌ Ocorreu um erro ao executar este comando.', ephemeral: true };
            if (!interaction.replied && !interaction.deferred) await interaction.reply(msg);
            else if (interaction.deferred) await interaction.editReply(msg.content);
        } catch { /* silencioso */ }
    }
});

// ═══════════════════════════════════════════════════════════════
// 🚀 BOT PRONTO — Registra comandos slash
// ═══════════════════════════════════════════════════════════════
client.once('clientReady', async () => {
    console.log(`✅ Bot logado como ${client.user.tag}`);
    await loadIcons();
    client.user.setActivity('/help | Birutas AI Ultimate', { type: ActivityType.Playing });

    const commands = [
        // MODERAÇÃO
        new SlashCommandBuilder().setName('ban').setDescription('Bane um usuário.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true))
            .addStringOption(o => o.setName('motivo').setDescription('Motivo')),
        new SlashCommandBuilder().setName('kick').setDescription('Expulsa um usuário.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true))
            .addStringOption(o => o.setName('motivo').setDescription('Motivo')),
        new SlashCommandBuilder().setName('clear').setDescription('Limpa mensagens (1-100).')
            .addIntegerOption(o => o.setName('quantidade').setDescription('Quantidade').setRequired(true)),
        new SlashCommandBuilder().setName('nuke').setDescription('Limpa completamente um canal.'),
        new SlashCommandBuilder().setName('lock').setDescription('Bloqueia envio no canal.'),
        new SlashCommandBuilder().setName('unlock').setDescription('Desbloqueia envio no canal.'),
        new SlashCommandBuilder().setName('slowmode').setDescription('Define slowmode.')
            .addIntegerOption(o => o.setName('segundos').setDescription('Segundos').setRequired(true)),
        new SlashCommandBuilder().setName('warn').setDescription('Adverte um usuário.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true))
            .addStringOption(o => o.setName('motivo').setDescription('Motivo')),
        new SlashCommandBuilder().setName('warnings').setDescription('Vê advertências.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('unwarn').setDescription('Remove advertências.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true)),
        new SlashCommandBuilder().setName('mute').setDescription('Muta um usuário.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true))
            .addStringOption(o => o.setName('tempo').setDescription('Ex: 10m, 1h').setRequired(true)),
        new SlashCommandBuilder().setName('unmute').setDescription('Desmuta um usuário.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true)),
        new SlashCommandBuilder().setName('setia').setDescription('Define a IA de um canal.')
            .addStringOption(o => o.setName('ia').setDescription('Chave da IA').setRequired(true))
            .addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(true)),
        new SlashCommandBuilder().setName('allowchannel').setDescription('Libera/remove canal para IA.')
            .addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(true))
            .addStringOption(o => o.setName('acao').setDescription('Ação').setRequired(true)
                .addChoices({ name: 'Adicionar', value: 'add' }, { name: 'Remover', value: 'remove' })),
        new SlashCommandBuilder().setName('banchannel').setDescription('Bane/libera canal da IA.')
            .addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(true))
            .addStringOption(o => o.setName('acao').setDescription('Ação').setRequired(true)
                .addChoices({ name: 'Banir', value: 'add' }, { name: 'Liberar', value: 'remove' })),
        new SlashCommandBuilder().setName('setwelcome').setDescription('Configura boas-vindas.')
            .addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(true))
            .addStringOption(o => o.setName('mensagem').setDescription('Use {user} para mencionar')),
        new SlashCommandBuilder().setName('setadmin').setDescription('Define cargo admin do bot.')
            .addRoleOption(o => o.setName('cargo').setDescription('Cargo').setRequired(true)),
        new SlashCommandBuilder().setName('setlog').setDescription('Define canal de logs.')
            .addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(true)),
        new SlashCommandBuilder().setName('backup').setDescription('Gera backup do servidor.'),

        // ECONOMIA
        new SlashCommandBuilder().setName('coins').setDescription('Vê saldo de coins.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('daily').setDescription('Coleta recompensa diária.'),
        new SlashCommandBuilder().setName('work').setDescription('Trabalha para ganhar coins.'),
        new SlashCommandBuilder().setName('crime').setDescription('Tenta cometer um crime.'),
        new SlashCommandBuilder().setName('rob').setDescription('Tenta roubar um usuário.')
            .addUserOption(o => o.setName('usuario').setDescription('Vítima').setRequired(true)),
        new SlashCommandBuilder().setName('give').setDescription('Doa coins para alguém.')
            .addUserOption(o => o.setName('usuario').setDescription('Destinatário').setRequired(true))
            .addIntegerOption(o => o.setName('quantidade').setDescription('Quantidade').setRequired(true)),
        new SlashCommandBuilder().setName('shop').setDescription('Mostra a loja.'),
        new SlashCommandBuilder().setName('buy').setDescription('Compra um item.')
            .addStringOption(o => o.setName('id').setDescription('ID do item').setRequired(true)),
        new SlashCommandBuilder().setName('inventory').setDescription('Mostra inventário.'),
        new SlashCommandBuilder().setName('rank').setDescription('Ranking de riqueza.'),
        new SlashCommandBuilder().setName('configvoz').setDescription('Configura coins por minuto de voz.')
            .addIntegerOption(o => o.setName('valor').setDescription('Coins/min').setRequired(true)),

        // CASSINO
        new SlashCommandBuilder().setName('coinflip').setDescription('Cara ou coroa.')
            .addStringOption(o => o.setName('lado').setDescription('Lado').setRequired(true)
                .addChoices({ name: 'Cara', value: 'cara' }, { name: 'Coroa', value: 'coroa' }))
            .addIntegerOption(o => o.setName('aposta').setDescription('Valor').setRequired(true)),
        new SlashCommandBuilder().setName('slots').setDescription('Máquina de slots.')
            .addIntegerOption(o => o.setName('valor').setDescription('Aposta').setRequired(true)),
        new SlashCommandBuilder().setName('roulette').setDescription('Roleta russa.')
            .addStringOption(o => o.setName('cor').setDescription('Cor').setRequired(true)
                .addChoices({ name: 'Vermelho (2x)', value: 'red' }, { name: 'Preto (2x)', value: 'black' }, { name: 'Verde (14x)', value: 'green' }))
            .addIntegerOption(o => o.setName('aposta').setDescription('Valor').setRequired(true)),
        new SlashCommandBuilder().setName('jokenpo').setDescription('Pedra, papel ou tesoura.')
            .addStringOption(o => o.setName('jogada').setDescription('Jogada').setRequired(true)
                .addChoices({ name: 'Pedra', value: 'pedra' }, { name: 'Papel', value: 'papel' }, { name: 'Tesoura', value: 'tesoura' }))
            .addIntegerOption(o => o.setName('aposta').setDescription('Aposta (opcional)')),
        new SlashCommandBuilder().setName('dado').setDescription('Lança um dado.')
            .addIntegerOption(o => o.setName('faces').setDescription('Nº de faces').setRequired(true)),

        // SOCIAL
        new SlashCommandBuilder().setName('profile').setDescription('Mostra o perfil.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('stats').setDescription('Mostra estatísticas.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('level').setDescription('Verifica nível e XP.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('leaderboard').setDescription('Ranking de nível.'),
        new SlashCommandBuilder().setName('badges').setDescription('Mostra conquistas.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('marry').setDescription('Pede alguém em casamento.')
            .addUserOption(o => o.setName('usuario').setDescription('Noivo(a)').setRequired(true)),
        new SlashCommandBuilder().setName('divorce').setDescription('Divorcia-se.'),
        new SlashCommandBuilder().setName('rep').setDescription('Dá reputação a alguém.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true)),
        new SlashCommandBuilder().setName('toprep').setDescription('Ranking de reputação.'),
        new SlashCommandBuilder().setName('setbio').setDescription('Define sua bio.')
            .addStringOption(o => o.setName('texto').setDescription('Bio (máx 100 chars)').setRequired(true)),
        new SlashCommandBuilder().setName('setcolor').setDescription('Define cor do perfil.')
            .addStringOption(o => o.setName('hex').setDescription('Cor HEX (#FF0000)').setRequired(true)),
        new SlashCommandBuilder().setName('avatar').setDescription('Mostra avatar.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário')),
        new SlashCommandBuilder().setName('resetbadges').setDescription('Reseta badges de um usuário.')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(true)),

        // MÚSICA
        new SlashCommandBuilder().setName('play').setDescription('Toca uma música.')
            .addStringOption(o => o.setName('musica').setDescription('Nome ou Link').setRequired(true)),
        new SlashCommandBuilder().setName('skip').setDescription('Pula a música atual.'),
        new SlashCommandBuilder().setName('stop').setDescription('Para e limpa a fila.'),
        new SlashCommandBuilder().setName('queue').setDescription('Mostra a fila de reprodução.'),
        new SlashCommandBuilder().setName('volume').setDescription('Ajusta o volume (0-100).')
            .addIntegerOption(o => o.setName('nivel').setDescription('0-100').setRequired(true)),

        // UTILIDADES & IA
        new SlashCommandBuilder().setName('imagine').setDescription('Gera uma imagem com IA.')
            .addStringOption(o => o.setName('prompt').setDescription('Descrição').setRequired(true)),
        new SlashCommandBuilder().setName('analyze-image').setDescription('Analisa uma imagem com IA.')
            .addAttachmentOption(o => o.setName('imagem').setDescription('Imagem').setRequired(true)),
        new SlashCommandBuilder().setName('resumo').setDescription('Resume as últimas mensagens do canal.'),
        new SlashCommandBuilder().setName('addia').setDescription('Cria uma IA personalizada.')
            .addStringOption(o => o.setName('id').setDescription('ID do modelo OpenRouter').setRequired(true))
            .addStringOption(o => o.setName('nome').setDescription('Nome').setRequired(true))
            .addStringOption(o => o.setName('prompt').setDescription('Prompt do sistema').setRequired(true))
            .addStringOption(o => o.setName('cor').setDescription('Cor HEX')),
        new SlashCommandBuilder().setName('delia').setDescription('Remove uma IA personalizada.')
            .addStringOption(o => o.setName('nome').setDescription('Nome').setRequired(true)),
        new SlashCommandBuilder().setName('reset').setDescription('Reseta a memória da IA no canal.'),
        new SlashCommandBuilder().setName('qrcode').setDescription('Gera um QR Code.')
            .addStringOption(o => o.setName('texto').setDescription('Conteúdo').setRequired(true)),
        new SlashCommandBuilder().setName('shorten').setDescription('Encurta uma URL.')
            .addStringOption(o => o.setName('url').setDescription('URL').setRequired(true)),
        new SlashCommandBuilder().setName('weather').setDescription('Verifica o clima.')
            .addStringOption(o => o.setName('cidade').setDescription('Cidade').setRequired(true)),
        new SlashCommandBuilder().setName('crypto').setDescription('Cotação de criptomoeda.')
            .addStringOption(o => o.setName('moeda').setDescription('Ex: bitcoin, ethereum').setRequired(true)),
        new SlashCommandBuilder().setName('giveaway').setDescription('Inicia um sorteio.')
            .addStringOption(o => o.setName('tempo').setDescription('Duração (Ex: 10m, 1h)').setRequired(true))
            .addIntegerOption(o => o.setName('vencedores').setDescription('Nº de vencedores').setRequired(true))
            .addStringOption(o => o.setName('premio').setDescription('Prêmio').setRequired(true)),
        new SlashCommandBuilder().setName('tag').setDescription('Gerencia tags personalizadas.')
            .addStringOption(o => o.setName('acao').setDescription('Ação').setRequired(true)
                .addChoices({ name: 'Criar', value: 'create' }, { name: 'Deletar', value: 'delete' }, { name: 'Listar', value: 'list' }))
            .addStringOption(o => o.setName('nome').setDescription('Nome da tag').setRequired(true))
            .addStringOption(o => o.setName('texto').setDescription('Conteúdo (para criar)')),
        new SlashCommandBuilder().setName('graph').setDescription('Gera um gráfico do servidor.')
            .addStringOption(o => o.setName('tipo').setDescription('Tipo').setRequired(true)
                .addChoices({ name: 'Atividade', value: 'activity' }, { name: 'Riqueza', value: 'coins' })),
        new SlashCommandBuilder().setName('status').setDescription('Status e métricas do bot.'),

        // 📧 E-MAIL TEMPORÁRIO
        emailCommand,
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('📡 Sincronizando comandos slash...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands.map(c => c.toJSON()) });
        console.log('✅ Comandos sincronizados!');
    } catch (e) { console.error('❌ Erro ao sincronizar:', e.message); }
});

/* ─── Erros globais ───────────────────────────────────────── */
process.on('unhandledRejection', e => console.error('[UnhandledRejection]', e));
process.on('uncaughtException',  e => console.error('[UncaughtException]', e));

client.login(process.env.DISCORD_TOKEN);
