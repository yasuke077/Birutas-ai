// ═══════════════════════════════════════════════════════════════
// 🎮 COMMANDS — Todos os slash commands
// ═══════════════════════════════════════════════════════════════
import {
    EmbedBuilder, AttachmentBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, PermissionFlagsBits
} from 'discord.js';
import { createCanvas } from 'canvas';
import QuickChart from 'quickchart-js';
import ms from 'ms';
import { Config, User, Memory } from './models.js';
import { ALL_BADGES, DEFAULT_IAS, SHOP_ITEMS } from './config.js';
import { getData, checkBadges, formatTime, generateProfile, xpForLevel } from './helpers.js';

// ─── Utilitários ─────────────────────────────────────────────
const crypto_random = (min, max) => {
    // Aleatoriedade melhorada usando múltiplas seeds
    const r1 = Math.random();
    const r2 = Math.random();
    const r3 = Math.random();
    const combined = (r1 * 0.5 + r2 * 0.3 + r3 * 0.2);
    return Math.floor(combined * (max - min + 1)) + min;
};

// ─── HANDLER PRINCIPAL ───────────────────────────────────────
export async function handleCommand(interaction, player) {
    const { commandName, options, guild, user: discordUser } = interaction;
    const { config, user } = await getData(guild.id, discordUser.id);
    if (!config || !user) return interaction.reply({ content: '❌ Erro ao acessar dados.', ephemeral: true });

    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator)
        || interaction.member.roles.cache.has(config.adminRole);
    // Dono exclusivo do bot no servidor (para configvoz e comandos sensíveis)
    const isBotOwner = config.botOwnerId === discordUser.id
        || interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    // ═══════════════════════════════════════════════════════════════
    // 🔨 MODERAÇÃO
    // ═══════════════════════════════════════════════════════════════

    if (commandName === 'ban') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target = options.getUser('usuario');
        if (target.id === discordUser.id) {
            if (!user.badges.includes('paradoxo')) { user.badges.push('paradoxo'); await user.save(); }
            return interaction.reply({ content: '♾️ Você tentou se banir. Badge Paradoxo desbloqueada!', ephemeral: true });
        }
        const reason = options.getString('motivo') || 'Sem motivo.';
        await guild.members.ban(target, { reason });
        return interaction.reply({ embeds: [new EmbedBuilder().setColor('Red').setTitle('🔨 Usuário Banido').setDescription(`<@${target.id}> foi banido.\n**Motivo:** ${reason}`)] });
    }

    if (commandName === 'kick') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target = options.getMember('usuario');
        const reason = options.getString('motivo') || 'Sem motivo.';
        await target.kick(reason);
        return interaction.reply({ embeds: [new EmbedBuilder().setColor('Orange').setTitle('👢 Usuário Expulso').setDescription(`<@${target.id}> foi expulso.\n**Motivo:** ${reason}`)] });
    }

    if (commandName === 'warn') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target = options.getUser('usuario');
        const reason = options.getString('motivo') || 'Comportamento inadequado.';
        const td     = (await getData(guild.id, target.id)).user;
        td.warnings = td.warnings || [];
        td.warnings.push({ reason, by: discordUser.id, at: Date.now() });
        await td.save();
        return interaction.reply(`⚠️ <@${target.id}> recebeu uma advertência: **${reason}** (Total: ${td.warnings.length})`);
    }

    if (commandName === 'warnings') {
        const target = options.getUser('usuario') || discordUser;
        const td     = (await getData(guild.id, target.id)).user;
        const w      = td.warnings || [];
        const embed  = new EmbedBuilder().setColor('Yellow').setTitle(`⚠️ Advertências: ${target.username}`)
            .setDescription(w.length ? w.map((x, i) => `**${i+1}.** ${x.reason}`).join('\n') : 'Nenhuma.');
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'unwarn') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target = options.getUser('usuario');
        const td     = (await getData(guild.id, target.id)).user;
        td.warnings  = [];
        await td.save();
        return interaction.reply(`✅ Advertências de <@${target.id}> removidas.`);
    }

    if (commandName === 'mute') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target  = options.getMember('usuario');
        const timeStr = options.getString('tempo');
        const dur     = ms(timeStr);
        if (!dur) return interaction.reply('❌ Formato inválido. Ex: 10m, 1h');
        await target.timeout(dur, 'Muted via bot');
        return interaction.reply(`🔇 <@${target.id}> mutado por **${timeStr}**.`);
    }

    if (commandName === 'unmute') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target = options.getMember('usuario');
        await target.timeout(null);
        return interaction.reply(`🔊 <@${target.id}> desmutado.`);
    }

    if (commandName === 'clear') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const n = options.getInteger('quantidade');
        if (n < 1 || n > 100) return interaction.reply('❌ Use entre 1 e 100.');
        await interaction.channel.bulkDelete(n, true);
        return interaction.reply({ content: `🗑️ **${n}** mensagens apagadas.`, ephemeral: true });
    }

    if (commandName === 'nuke') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const pos = interaction.channel.position;
        const clone = await interaction.channel.clone();
        await interaction.channel.delete();
        await clone.setPosition(pos);
        return clone.send('💣 Canal purificado.');
    }

    if (commandName === 'lock') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
        return interaction.reply('🔒 Canal trancado.');
    }

    if (commandName === 'unlock') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
        return interaction.reply('🔓 Canal destrancado.');
    }

    if (commandName === 'slowmode') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const s = options.getInteger('segundos');
        await interaction.channel.setRateLimitPerUser(s);
        return interaction.reply(`⏱️ Slowmode: **${s}s**`);
    }

    if (commandName === 'setia') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const key = options.getString('ia').toLowerCase();
        const ch  = options.getChannel('canal');
        const all = { ...DEFAULT_IAS, ...(config.customIAs || {}) };
        if (!all[key]) return interaction.reply(`❌ IA \`${key}\` não encontrada. IAs: ${Object.keys(all).join(', ')}`);
        config.channelAIs[ch.id] = key;
        config.markModified('channelAIs');
        await config.save();
        return interaction.reply(`✅ Canal <#${ch.id}> usará **${all[key].name}**.`);
    }

    if (commandName === 'allowchannel') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const ch     = options.getChannel('canal');
        const action = options.getString('acao');
        if (action === 'add') {
            if (!config.allowedChannels.includes(ch.id)) { config.allowedChannels.push(ch.id); config.markModified('allowedChannels'); }
            await config.save();
            return interaction.reply(`✅ <#${ch.id}> adicionado para IA.`);
        } else {
            config.allowedChannels = config.allowedChannels.filter(id => id !== ch.id);
            config.markModified('allowedChannels');
            await config.save();
            return interaction.reply(`✅ <#${ch.id}> removido da IA.`);
        }
    }

    if (commandName === 'banchannel') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const ch     = options.getChannel('canal');
        const action = options.getString('acao');
        if (action === 'add') {
            if (!config.bannedChannels.includes(ch.id)) { config.bannedChannels.push(ch.id); config.markModified('bannedChannels'); }
        } else {
            config.bannedChannels = config.bannedChannels.filter(id => id !== ch.id);
            config.markModified('bannedChannels');
        }
        await config.save();
        return interaction.reply(`✅ Canal <#${ch.id}> ${action === 'add' ? 'banido de' : 'liberado para'} usar IA.`);
    }

    if (commandName === 'setwelcome') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const ch  = options.getChannel('canal');
        const msg = options.getString('mensagem') || 'Bem-vindo ao servidor, {user}!';
        config.welcomeConfig = { enabled: true, channelId: ch.id, message: msg };
        config.markModified('welcomeConfig');
        await config.save();
        return interaction.reply(`✅ Boas-vindas configuradas em <#${ch.id}>.`);
    }

    if (commandName === 'setadmin') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: '🚫', ephemeral: true });
        const role = options.getRole('cargo');
        config.adminRole = role.id;
        await config.save();
        return interaction.reply(`✅ Cargo <@&${role.id}> definido como admin do bot.`);
    }

    if (commandName === 'setlog') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        config.logChannel = options.getChannel('canal').id;
        await config.save();
        return interaction.reply('✅ Canal de logs definido.');
    }

    if (commandName === 'backup') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const users  = await User.find({ guildId: guild.id });
        const buf    = Buffer.from(JSON.stringify({ config, users, ts: Date.now() }, null, 2));
        const attach = new AttachmentBuilder(buf, { name: `backup_${guild.id}.json` });
        return interaction.reply({ content: '📦 Backup gerado.', files: [attach], ephemeral: true });
    }

    if (commandName === 'resetbadges') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target = options.getUser('usuario');
        const td     = (await getData(guild.id, target.id)).user;
        td.badges    = [];
        await td.save();
        return interaction.reply(`✅ Badges de <@${target.id}> resetadas.`);
    }

    if (commandName === 'givebadge') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target  = options.getUser('usuario');
        const badgeId = options.getString('badge');
        if (!ALL_BADGES[badgeId]) return interaction.reply(`❌ Badge \`${badgeId}\` não existe.`);
        const td = (await getData(guild.id, target.id)).user;
        if (!td.badges.includes(badgeId)) td.badges.push(badgeId);
        await td.save();
        return interaction.reply(`✅ Badge **${ALL_BADGES[badgeId].name}** concedida a <@${target.id}>.`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 💰 ECONOMIA
    // ═══════════════════════════════════════════════════════════════

    if (commandName === 'coins') {
        const target = options.getUser('usuario') || discordUser;
        const td     = (await getData(guild.id, target.id)).user;
        const embed  = new EmbedBuilder().setColor('Green').setTitle('💳 SALDO BANCÁRIO')
            .setThumbnail(target.displayAvatarURL())
            .addFields({ name: 'Usuário', value: `<@${target.id}>`, inline: true }, { name: 'Saldo', value: `**${td.coins.toLocaleString('pt-BR')} 🪙**`, inline: true });
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'daily') {
        const cd = 86400000;
        if (Date.now() - user.lastDaily < cd) {
            return interaction.reply({ content: `⏳ Volte em **${formatTime(cd - (Date.now() - user.lastDaily))}**.`, ephemeral: true });
        }
        const bonus  = user.vipUntil > Date.now() ? 2 : 1;
        const amount = (config.economyConfig.dailyAmount || 500) * bonus;
        user.coins   += amount;
        user.lastDaily = Date.now();
        await user.save();
        await checkBadges(user, interaction);
        return interaction.reply(`💰 Você coletou **${amount.toLocaleString('pt-BR')} 🪙**${bonus > 1 ? ' (2x VIP!)' : ''}!`);
    }

    if (commandName === 'work') {
        const cd = 3600000;
        if (Date.now() - user.lastWork < cd) {
            return interaction.reply({ content: `⏳ Descanse por mais **${formatTime(cd - (Date.now() - user.lastWork))}**.`, ephemeral: true });
        }
        let earn = crypto_random(config.economyConfig.workMin || 100, config.economyConfig.workMax || 400);
        if (user.inventory?.includes('Picareta de Ouro')) earn = Math.floor(earn * 1.5);
        if (user.vipUntil > Date.now()) earn = Math.floor(earn * 1.2);
        user.coins   += earn;
        user.lastWork = Date.now();
        await user.save();
        await checkBadges(user, interaction);
        return interaction.reply(`💼 Você trabalhou e ganhou **${earn.toLocaleString('pt-BR')} 🪙**!`);
    }

    if (commandName === 'crime') {
        const cd = 7200000;
        if (Date.now() - user.lastCrime < cd) {
            return interaction.reply({ content: `⏳ Aguarde **${formatTime(cd - (Date.now() - user.lastCrime))}**.`, ephemeral: true });
        }
        user.lastCrime  = Date.now();
        user.crimeCount = (user.crimeCount || 0) + 1;
        const success   = Math.random() < 0.55;
        const amount    = success ? crypto_random(config.economyConfig.crimeMin || 500, config.economyConfig.crimeMax || 1500) : crypto_random(200, 600);
        const crimes    = ['assalto', 'hacking', 'tráfico de memes', 'lavagem de coins', 'fraude de perfil'];
        const crime     = crimes[Math.floor(Math.random() * crimes.length)];
        if (success) { user.coins += amount; }
        else {
            user.coins = Math.max(0, user.coins - amount);
            if (user.coins === 0) { user.wasBankrupt = true; user.bankruptTimestamp = Date.now(); }
        }
        await user.save();
        await checkBadges(user, interaction);
        return interaction.reply(success
            ? `🦹 Seu **${crime}** foi um sucesso! Você ganhou **${amount.toLocaleString('pt-BR')} 🪙**.`
            : `👮 Você foi pego tentando **${crime}** e pagou uma multa de **${amount.toLocaleString('pt-BR')} 🪙**!`
        );
    }

    if (commandName === 'rob') {
        const cd = 3600000;
        if (Date.now() - user.lastRob < cd) {
            return interaction.reply({ content: `⏳ Aguarde **${formatTime(cd - (Date.now() - user.lastRob))}**.`, ephemeral: true });
        }
        const target = options.getUser('usuario');
        if (target.id === discordUser.id) return interaction.reply('❌ Você não pode se roubar.');
        const td  = (await getData(guild.id, target.id)).user;
        if (td.coins < 100) return interaction.reply('❌ A vítima está muito pobre, não vale a pena.');
        if (td.inventory?.includes('Escudo Anti-Roubo')) {
            td.inventory = td.inventory.filter(i => i !== 'Escudo Anti-Roubo');
            await td.save();
            return interaction.reply(`🛡️ <@${target.id}> usou o Escudo Anti-Roubo e você foi bloqueado!`);
        }
        user.lastRob = Date.now();
        const success = Math.random() < 0.45;
        if (success) {
            const stolen = Math.floor(crypto_random(
            Math.floor(td.coins * ((config.economyConfig.robMinPct ?? 10) / 100)),
            Math.floor(td.coins * ((config.economyConfig.robMaxPct ?? 30) / 100))
        ));
            user.coins  += stolen;
            td.coins     = Math.max(0, td.coins - stolen);
            user.robSuccess = (user.robSuccess || 0) + 1;
            await td.save();
            await user.save();
            await checkBadges(user, interaction);
            return interaction.reply(`🦹 Você roubou **${stolen.toLocaleString('pt-BR')} 🪙** de <@${target.id}>!`);
        } else {
            const fine = Math.floor(crypto_random(50, Math.min(300, user.coins)));
            user.coins = Math.max(0, user.coins - fine);
            await user.save();
            return interaction.reply(`👮 Você foi pego tentando roubar <@${target.id}> e pagou **${fine.toLocaleString('pt-BR')} 🪙** de multa!`);
        }
    }

    if (commandName === 'give') {
        const target = options.getUser('usuario');
        if (target.id === discordUser.id) return interaction.reply('❌ Não pode dar para si mesmo.');
        const amount = options.getInteger('quantidade');
        if (amount <= 0 || user.coins < amount) return interaction.reply('❌ Saldo insuficiente ou valor inválido.');
        const td   = (await getData(guild.id, target.id)).user;
        user.coins -= amount;
        td.coins   += amount;
        user.totalDonated = (user.totalDonated || 0) + amount;
        // Badge hacker1337 e caderno
        if (amount === 1337) { if (!user.badges.includes('hacker1337')) { user.badges.push('hacker1337'); } }
        if (amount === 666)  { if (!user.badges.includes('caderno'))    { user.badges.push('caderno');    } }
        // Corrente de doações
        const now = Date.now();
        if (now - (user.lastDonationTime || 0) < 3600000) {
            user.donationChain = [...(user.donationChain || []), target.id].slice(-5);
        } else { user.donationChain = [target.id]; }
        user.lastDonationTime = now;
        await user.save();
        await td.save();
        await checkBadges(user, interaction);
        return interaction.reply(`✅ Você transferiu **${amount.toLocaleString('pt-BR')} 🪙** para <@${target.id}>.`);
    }

    if (commandName === 'shop') {
        const fields = Object.entries(SHOP_ITEMS).map(([id, item]) => ({
            name: `${item.emoji} **${item.name}** — ${item.price.toLocaleString('pt-BR')} 🪙`,
            value: `> *${item.desc}*\nID: \`${id}\``
        }));
        const embed = new EmbedBuilder().setColor('Gold').setTitle('🛒 LOJA DO SERVIDOR').addFields(fields).setFooter({ text: 'Use /buy <id> para comprar' });
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'buy') {
        const id   = options.getString('id').toLowerCase();
        const item = SHOP_ITEMS[id];
        if (!item) return interaction.reply(`❌ Item \`${id}\` não encontrado.`);
        if (user.coins < item.price) return interaction.reply(`❌ Você precisa de **${item.price.toLocaleString('pt-BR')} 🪙** mas tem apenas **${user.coins.toLocaleString('pt-BR')}**.`);
        user.coins     -= item.price;
        user.totalSpent = (user.totalSpent || 0) + item.price;
        if (item.type === 'vip') {
            user.vipUntil = Math.max(user.vipUntil || 0, Date.now()) + item.duration;
        } else {
            if (!user.inventory) user.inventory = [];
            if (!user.inventory.includes(item.name)) user.inventory.push(item.name);
        }
        // Badge consumista: comprou todos os itens
        const shopNames = Object.values(SHOP_ITEMS).filter(i => i.type === 'item').map(i => i.name);
        if (shopNames.every(n => (user.inventory || []).includes(n) || n === item.name)) award_direct(user, 'consumista');
        await user.save();
        await checkBadges(user, interaction);
        return interaction.reply(`✅ Você comprou **${item.emoji} ${item.name}**!`);
    }

    if (commandName === 'inventory') {
        const vipStatus = user.vipUntil > Date.now() ? `VIP até <t:${Math.floor(user.vipUntil/1000)}:R>` : 'Sem VIP';
        const inv = (user.inventory || []).length ? user.inventory.join('\n') : 'Inventário vazio.';
        const embed = new EmbedBuilder().setColor('Blue').setTitle(`🎒 Inventário — ${discordUser.username}`)
            .addFields({ name: '👑 Status', value: vipStatus }, { name: '📦 Itens', value: inv });
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'rank') {
        const top = await User.find({ guildId: guild.id }).sort({ coins: -1 }).limit(10);
        const desc = top.map((u, i) => `**${i+1}.** <@${u.userId}> — **${u.coins.toLocaleString('pt-BR')} 🪙**`).join('\n');
        const embed = new EmbedBuilder().setColor('Gold').setTitle('💰 RANKING DE RIQUEZA').setDescription(desc);
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'configvoz') {
        // Somente o dono do bot pode alterar (admin + botOwner)
        if (!isBotOwner) return interaction.reply({ content: '🚫 Apenas o dono do bot no servidor pode alterar isso.\nUse `/setbotowner` primeiro para registrar quem é o dono.', ephemeral: true });
        const valor = options.getInteger('valor');
        if (valor < 0 || valor > 10000) return interaction.reply('❌ Valor entre 0 e 10000.');
        config.voiceConfig.coinsPerMin = valor;
        config.markModified('voiceConfig');
        await config.save();
        return interaction.reply(`✅ Coins por minuto em voz definido para **${valor} 🪙/min**.`);
    }

    if (commandName === 'setbotowner') {
        // Apenas o admin do Discord pode definir quem é o dono
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: '🚫', ephemeral: true });
        const target = options.getUser('usuario');
        config.botOwnerId = target.id;
        await config.save();
        return interaction.reply(`✅ <@${target.id}> definido como dono exclusivo do bot no servidor.`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎰 CASSINO (Aleatoriedade melhorada)
    // ═══════════════════════════════════════════════════════════════

    if (commandName === 'coinflip') {
        const side = options.getString('lado');
        const bet  = options.getInteger('valor');
        if (bet <= 0 || user.coins < bet) return interaction.reply('❌ Aposta inválida.');
        // Aleatoriedade melhorada: usa 3 random calls
        const result = (Math.random() + Math.random() + Math.random()) / 3 > 0.5 ? 'cara' : 'coroa';
        if (result === side) {
            user.coins += bet; user.coinflipWins++; user.gambleWinStreak++; user.gambleLossStreak = 0;
            await user.save(); await checkBadges(user, interaction);
            return interaction.reply(`🪙 Saiu **${result}**! Você **ganhou** **${bet.toLocaleString('pt-BR')} 🪙**! 🎉`);
        } else {
            user.coins -= bet; user.gambleLossStreak++; user.gambleWinStreak = 0;
            if (user.coins === 0) { user.wasBankrupt = true; user.bankruptTimestamp = Date.now(); }
            await user.save(); await checkBadges(user, interaction);
            return interaction.reply(`🪙 Saiu **${result}**! Você **perdeu** **${bet.toLocaleString('pt-BR')} 🪙**. 😢`);
        }
    }

    if (commandName === 'slots') {
        const bet = options.getInteger('valor');
        if (bet <= 0 || user.coins < bet) return interaction.reply('❌ Aposta inválida.');
        const symbols = ['🍒', '🍋', '🍊', '⭐', '💎', '7️⃣', '🎰'];
        const s1 = symbols[crypto_random(0, symbols.length - 1)];
        const s2 = symbols[crypto_random(0, symbols.length - 1)];
        const s3 = symbols[crypto_random(0, symbols.length - 1)];
        let mult = 0;
        if (s1 === s2 && s2 === s3) {
            mult = s1 === '💎' ? 50 : s1 === '7️⃣' ? 25 : s1 === '⭐' ? 15 : 8;
            if (mult >= 25) { user.slotsJackpots = (user.slotsJackpots || 0) + 1; }
        } else if (s1 === s2 || s2 === s3 || s1 === s3) { mult = 2; }
        const win = Math.floor(bet * mult);
        user.coins += mult > 0 ? win - bet : -bet;
        user.gambleWinStreak = mult > 0 ? (user.gambleWinStreak || 0) + 1 : 0;
        user.gambleLossStreak = mult > 0 ? 0 : (user.gambleLossStreak || 0) + 1;
        if (user.coins === 0) { user.wasBankrupt = true; user.bankruptTimestamp = Date.now(); }
        await user.save(); await checkBadges(user, interaction);
        const resultLine = mult > 0 ? `✅ GANHOU **${win.toLocaleString('pt-BR')} 🪙** (${mult}x)!` : `❌ Perdeu **${bet.toLocaleString('pt-BR')} 🪙**.`;
        return interaction.reply(`🎰 **| ${s1} | ${s2} | ${s3} |**\n${resultLine}`);
    }

    if (commandName === 'roulette') {
        const color = options.getString('cor');
        const bet   = options.getInteger('valor');
        if (bet <= 0 || user.coins < bet) return interaction.reply('❌ Aposta inválida.');
        // Roleta: 18 vermelho, 18 preto, 2 verde (mais realista)
        const roll   = crypto_random(0, 37);
        const result = roll === 0 || roll === 37 ? 'green' : roll % 2 === 0 ? 'red' : 'black';
        const emojis = { red: '🔴', black: '⚫', green: '🟢' };
        if (result === color) {
            const mult = color === 'green' ? 14 : 2;
            const win  = bet * mult;
            user.coins += win - bet; user.rouletteWins++; user.gambleWinStreak++; user.gambleLossStreak = 0;
            await user.save(); await checkBadges(user, interaction);
            return interaction.reply(`🎡 A roleta parou no ${emojis[result]}! Você **ganhou ${win.toLocaleString('pt-BR')} 🪙** (${mult}x)!`);
        } else {
            user.coins -= bet; user.gambleLossStreak++; user.gambleWinStreak = 0;
            if (user.coins === 0) { user.wasBankrupt = true; user.bankruptTimestamp = Date.now(); }
            await user.save(); await checkBadges(user, interaction);
            return interaction.reply(`🎡 A roleta parou no ${emojis[result]}! Você **perdeu ${bet.toLocaleString('pt-BR')} 🪙**.`);
        }
    }

    if (commandName === 'jokenpo') {
        const play = options.getString('jogada');
        const bet  = options.getInteger('aposta') || 0;
        if (bet > 0 && user.coins < bet) return interaction.reply('❌ Saldo insuficiente.');
        const choices = ['pedra', 'papel', 'tesoura'];
        const bot     = choices[crypto_random(0, 2)];
        const wins    = { pedra: 'tesoura', papel: 'pedra', tesoura: 'papel' };
        let result;
        if (play === bot) result = 'draw';
        else if (wins[play] === bot) result = 'win';
        else result = 'loss';
        const emojis  = { pedra: '✊', papel: '✋', tesoura: '✌️' };
        const line1   = `${emojis[play]} vs ${emojis[bot]}`;
        if (result === 'win') {
            if (bet > 0) { user.coins += bet; user.jokenpoWins++; user.gambleWinStreak++; user.gambleLossStreak = 0; }
            await user.save(); await checkBadges(user, interaction);
            return interaction.reply(`${line1} — Você **VENCEU**!${bet > 0 ? ` +${bet.toLocaleString('pt-BR')} 🪙` : ''}`);
        } else if (result === 'loss') {
            if (bet > 0) { user.coins -= bet; user.gambleLossStreak++; user.gambleWinStreak = 0; }
            await user.save(); await checkBadges(user, interaction);
            return interaction.reply(`${line1} — Você **PERDEU**!${bet > 0 ? ` -${bet.toLocaleString('pt-BR')} 🪙` : ''}`);
        } else {
            return interaction.reply(`${line1} — **EMPATE**! Nada acontece.`);
        }
    }

    if (commandName === 'dado') {
        const faces  = options.getInteger('faces');
        if (faces < 2 || faces > 10000) return interaction.reply('❌ Use entre 2 e 10000 faces.');
        const result = crypto_random(1, faces);
        if (Math.random() < 0.001) {
            if (!user.badges.includes('escolhido')) { user.badges.push('escolhido'); await user.save(); }
            return interaction.reply(`🎲 **${result}** — ✨ **O Escolhido!** Badge secreta desbloqueada.`);
        }
        return interaction.reply(`🎲 Dado de ${faces} faces: **${result}**`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 👤 SOCIAL
    // ═══════════════════════════════════════════════════════════════

    if (commandName === 'profile') {
        await interaction.deferReply();
        const target = options.getUser('usuario') || discordUser;
        const td     = (await getData(guild.id, target.id)).user;
        if (!td) return interaction.editReply('❌ Usuário não encontrado.');
        try {
            const buffer = await generateProfile(target, td);
            const attach = new AttachmentBuilder(buffer, { name: 'profile.png' });
            return interaction.editReply({ files: [attach] });
        } catch (e) {
            console.error('[Profile]', e);
            return interaction.editReply('❌ Erro ao gerar perfil.');
        }
    }

    if (commandName === 'setbanner') {
        const attach = options.getAttachment('imagem');
        if (!user.inventory?.includes('Banner Customizado')) {
            return interaction.reply('❌ Você precisa comprar o item **Banner Customizado** na `/shop` primeiro.');
        }
        if (!attach.contentType?.startsWith('image/')) return interaction.reply('❌ Envie uma imagem válida.');
        user.bannerUrl = attach.url;
        await user.save();
        return interaction.reply({ content: '✅ Banner do perfil atualizado! Use `/profile` para ver.', ephemeral: true });
    }

    if (commandName === 'stats') {
        const target = options.getUser('usuario') || discordUser;
        const td     = (await getData(guild.id, target.id)).user;
        const embed  = new EmbedBuilder().setColor('Blue').setTitle(`📊 ESTATÍSTICAS — ${target.username}`)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: '💬 Mensagens',     value: `${(td.messages||0).toLocaleString('pt-BR')}`, inline: true },
                { name: '🎙️ Voz (min)',     value: `${td.voiceMinutes || 0}`,                     inline: true },
                { name: '🤖 Msgs IA',       value: `${td.iaMessages || 0}`,                       inline: true },
                { name: '🕵️ Roubos',        value: `${td.robSuccess || 0}`,                       inline: true },
                { name: '🔫 Crimes',        value: `${td.crimeCount || 0}`,                       inline: true },
                { name: '🤝 Total Doado',   value: `${(td.totalDonated||0).toLocaleString('pt-BR')} 🪙`, inline: true },
                { name: '🎲 Ganhos Cassino',value: `${(td.coinflipWins||0)+(td.rouletteWins||0)+(td.jokenpoWins||0)}`, inline: true },
                { name: '🏅 Conquistas',    value: `${[...new Set(td.badges||[])].length}`,        inline: true },
                { name: '💍 Civil',         value: td.marriedTo ? `Casado(a)` : 'Solteiro(a)',     inline: true }
            ).setTimestamp();
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'level') {
        const target = options.getUser('usuario') || discordUser;
        const td     = (await getData(guild.id, target.id)).user;
        const nextXP = xpForLevel(td.level + 1);
        const pct    = Math.min(100, Math.floor(((td.xp || 0) / nextXP) * 100));
        const bar    = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
        return interaction.reply(
            `📈 **${target.username}** — Nível **${td.level}**\n` +
            `XP: \`${(td.xp||0).toLocaleString()}\` / \`${nextXP.toLocaleString()}\`\n` +
            `\`${bar}\` ${pct}%`
        );
    }

    if (commandName === 'leaderboard') {
        const top = await User.find({ guildId: guild.id }).sort({ level: -1, xp: -1 }).limit(10);
        const desc = top.map((u, i) => `**${i+1}.** <@${u.userId}> — Nível **${u.level}** | ${(u.xp||0).toLocaleString()} XP`).join('\n');
        const embed = new EmbedBuilder().setColor('Blue').setTitle('🏆 RANKING DE NÍVEL').setDescription(desc || 'Nenhum dado.');
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'badges') {
        const target = options.getUser('usuario') || discordUser;
        const td     = (await getData(guild.id, target.id)).user;
        // DEDUPLICA aqui também
        const uniq   = [...new Set(td.badges || [])].filter(id => ALL_BADGES[id]);
        if (uniq.length !== (td.badges || []).length) { td.badges = uniq; await td.save(); }
        const pub = uniq.filter(id => !ALL_BADGES[id].secret);
        const sec = uniq.filter(id =>  ALL_BADGES[id].secret);
        const fmt = (ids) => ids.length ? ids.map(id => `${ALL_BADGES[id].emoji} **${ALL_BADGES[id].name}**\n> *${ALL_BADGES[id].desc}*`).join('\n\n') : '_Nenhuma._';
        const embed = new EmbedBuilder().setColor('Gold').setTitle(`🏅 CONQUISTAS — ${target.username}`)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: `🌟 Públicas (${pub.length})`, value: fmt(pub).slice(0, 1024) },
                { name: `🔒 Secretas (${sec.length})`, value: fmt(sec).slice(0, 1024) }
            )
            .setFooter({ text: `Total: ${uniq.length} / ${Object.keys(ALL_BADGES).length} conquistas` });
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'marry') {
        const target = options.getUser('usuario');
        if (target.id === discordUser.id) return interaction.reply('❌ Não pode casar consigo mesmo.');
        if (user.marriedTo) return interaction.reply('❌ Você já é casado(a). Use /divorce primeiro.');
        if (!user.inventory?.includes('Anel de Casamento')) return interaction.reply('❌ Compre um **Anel de Casamento** na `/shop` primeiro.');
        const td = (await getData(guild.id, target.id)).user;
        if (td.marriedTo) return interaction.reply(`❌ <@${target.id}> já está casado(a).`);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('marry_yes').setLabel('💍 Aceito').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('marry_no').setLabel('💔 Recuso').setStyle(ButtonStyle.Danger)
        );
        const msg = await interaction.reply({ content: `💍 <@${target.id}>, você aceita se casar com <@${discordUser.id}>?`, components: [row], fetchReply: true });
        const col = msg.createMessageComponentCollector({ filter: i => i.user.id === target.id, time: 60000 });
        col.on('collect', async i => {
            if (i.customId === 'marry_yes') {
                user.marriedTo = target.id; user.marryDate = Date.now();
                user.inventory = user.inventory.filter(x => x !== 'Anel de Casamento');
                td.marriedTo = discordUser.id; td.marryDate = Date.now();
                await user.save(); await td.save();
                await i.update({ content: `🎉 **VIVAM OS NOIVOS!** <@${discordUser.id}> e <@${target.id}> estão casados! 💍`, components: [] });
            } else {
                await i.update({ content: `💔 <@${target.id}> recusou o pedido.`, components: [] });
            }
        });
        return;
    }

    if (commandName === 'divorce') {
        if (!user.marriedTo) return interaction.reply('❌ Você não está casado(a).');
        const exId = user.marriedTo;
        const td   = (await getData(guild.id, exId)).user;
        user.marriedTo = null; user.marryDate = 0;
        if (td) { td.marriedTo = null; td.marryDate = 0; await td.save(); }
        await user.save();
        return interaction.reply(`💔 Você se divorciou de <@${exId}>.`);
    }

    if (commandName === 'rep') {
        const target = options.getUser('usuario');
        if (target.id === discordUser.id) return interaction.reply('❌ Você não pode dar rep para si mesmo.');
        const cd = 86400000;
        if (Date.now() - user.lastRep < cd) return interaction.reply({ content: `⏳ Volte em **${formatTime(cd - (Date.now() - user.lastRep))}**.`, ephemeral: true });
        const td = (await getData(guild.id, target.id)).user;
        td.reputation++;
        user.lastRep = Date.now();
        if (user.lastRepTargetId === target.id) { user.repSameTargetStreak++; } else { user.lastRepTargetId = target.id; user.repSameTargetStreak = 1; }
        await user.save(); await td.save();
        await checkBadges(user, interaction);
        return interaction.reply(`⭐ Você deu +1 rep para <@${target.id}>! Ele(a) tem ${td.reputation} rep.`);
    }

    if (commandName === 'toprep') {
        const top = await User.find({ guildId: guild.id }).sort({ reputation: -1 }).limit(10);
        const desc = top.map((u, i) => `**${i+1}.** <@${u.userId}> — ⭐ **${u.reputation}**`).join('\n');
        const embed = new EmbedBuilder().setColor('Gold').setTitle('⭐ RANKING DE REPUTAÇÃO').setDescription(desc || 'Nenhum dado.');
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'setbio') {
        const txt = options.getString('texto').slice(0, 100);
        user.bio = txt;
        await user.save();
        await checkBadges(user, interaction);
        return interaction.reply({ content: `✅ Bio atualizada: *"${txt}"*`, ephemeral: true });
    }

    if (commandName === 'setcolor') {
        if (!user.inventory?.includes('Cor Personalizada')) return interaction.reply('❌ Compre o item **Cor Personalizada** na `/shop` primeiro.');
        const hex = options.getString('hex');
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return interaction.reply('❌ Cor inválida. Use formato HEX: `#FF0000`');
        user.profileColor = hex;
        await user.save();
        return interaction.reply({ content: `✅ Cor do perfil definida para \`${hex}\`.`, ephemeral: true });
    }

    if (commandName === 'avatar') {
        const target = options.getUser('usuario') || discordUser;
        const embed  = new EmbedBuilder().setColor('Blue').setTitle(`🖼️ Avatar — ${target.username}`).setImage(target.displayAvatarURL({ size: 512, extension: 'png' }));
        return interaction.reply({ embeds: [embed] });
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎵 MÚSICA (corrigida com YoutubeiExtractor)
    // ═══════════════════════════════════════════════════════════════

    if (commandName === 'play') {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.reply({ content: '❌ Você precisa estar em um canal de voz.', ephemeral: true });
        await interaction.deferReply();
        const query = options.getString('musica');
        try {
            const result = await player.search(query, { requestedBy: discordUser });
            if (!result || !result.tracks.length) return interaction.editReply('❌ Nenhuma música encontrada.');
            const queue = player.nodes.create(guild, {
                metadata: { channel: interaction.channel },
                selfDeaf: true,
                volume: 80,
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 300000,
                leaveOnEnd: false,
            });
            if (!queue.connection) await queue.connect(voiceChannel);
            result.playlist ? queue.addTrack(result.tracks) : queue.addTrack(result.tracks[0]);
            if (!queue.node.isPlaying()) await queue.node.play();
            const track = result.tracks[0];
            const embed = new EmbedBuilder().setColor('Green').setTitle('🎵 ADICIONADO À FILA')
                .setThumbnail(track.thumbnail)
                .addFields({ name: 'Título', value: track.title }, { name: 'Duração', value: track.duration, inline: true }, { name: 'Pedido por', value: discordUser.username, inline: true });
            return interaction.editReply({ embeds: [embed] });
        } catch (e) {
            console.error('[Play]', e.message);
            return interaction.editReply(`❌ Erro: ${e.message.slice(0, 200)}`);
        }
    }

    if (commandName === 'skip') {
        const queue = player.nodes.get(guild.id);
        if (!queue?.node?.isPlaying()) return interaction.reply('❌ Não há música tocando.');
        queue.node.skip();
        return interaction.reply('⏭️ Música pulada.');
    }

    if (commandName === 'stop') {
        const queue = player.nodes.get(guild.id);
        if (!queue) return interaction.reply('❌ Sem música ativa.');
        queue.delete();
        return interaction.reply('⏹️ Player parado e fila limpa.');
    }

    if (commandName === 'queue') {
        const queue = player.nodes.get(guild.id);
        if (!queue?.currentTrack) return interaction.reply('❌ Fila vazia.');
        const tracks = queue.tracks.toArray().slice(0, 10);
        const embed  = new EmbedBuilder().setColor('Blue').setTitle('📜 FILA DE MÚSICA')
            .setDescription(`**Tocando:** ${queue.currentTrack.title}\n\n**Próximas:**\n${tracks.map((t, i) => `${i+1}. ${t.title}`).join('\n') || 'Nenhuma.'}`);
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'volume') {
        const queue = player.nodes.get(guild.id);
        if (!queue) return interaction.reply('❌ Sem música ativa.');
        const vol = options.getInteger('nivel');
        if (vol < 0 || vol > 100) return interaction.reply('❌ Use entre 0 e 100.');
        queue.node.setVolume(vol);
        return interaction.reply(`🔊 Volume: **${vol}%**`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛠️ UTILIDADES & IA
    // ═══════════════════════════════════════════════════════════════

    if (commandName === 'imagine') {
        await interaction.deferReply();
        const prompt = options.getString('prompt');
        user.imagineCount = (user.imagineCount || 0) + 1;
        await user.save();
        await checkBadges(user, interaction);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
        const embed = new EmbedBuilder().setColor('Random').setTitle('🎨 IMAGEM GERADA COM IA')
            .setDescription(`**Prompt:** ${prompt}`)
            .setImage(url)
            .setFooter({ text: `Gerado por ${discordUser.username}` });
        return interaction.editReply({ embeds: [embed] });
    }

    if (commandName === 'analyze-image') {
        await interaction.deferReply();
        const attachment = options.getAttachment('imagem');
        if (!attachment?.contentType?.startsWith('image/')) return interaction.editReply('❌ Envie uma imagem válida.');

        user.analyzeCount = (user.analyzeCount || 0) + 1;
        await user.save();
        await checkBadges(user, interaction);

        try {
            // Usa Gemini Vision via OpenRouter para análise real
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://birutas.ai',
                    'X-Title': 'Birutas AI'
                },
                body: JSON.stringify({
                    model: 'google/gemini-flash-1.5:free',
                    messages: [{
                        role: 'user',
                        content: [
                            { type: 'text', text: 'Analise esta imagem detalhadamente em Português Brasileiro. Descreva o que você vê, objetos, pessoas, cores, contexto e qualquer detalhe relevante.' },
                            { type: 'image_url', image_url: { url: attachment.url } }
                        ]
                    }],
                    max_tokens: 800
                })
            });
            const data   = await response.json();
            const result = data.choices?.[0]?.message?.content;
            if (!result) throw new Error('API não retornou resultado.');
            const embed = new EmbedBuilder().setColor('Blue').setTitle('👁️ ANÁLISE DE IMAGEM — Vision')
                .setImage(attachment.url)
                .setDescription(result.slice(0, 2048))
                .setFooter({ text: `Analisado por Gemini Flash • ${discordUser.username}` });
            return interaction.editReply({ embeds: [embed] });
        } catch (e) {
            return interaction.editReply(`❌ Erro na análise: ${e.message.slice(0, 200)}`);
        }
    }

    if (commandName === 'resumo') {
        await interaction.deferReply();
        const messages = await interaction.channel.messages.fetch({ limit: 50 });
        const chatLog  = messages.reverse().map(m => `${m.author.username}: ${m.content}`).filter(l => l.includes(':')).join('\n');
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'google/gemini-flash-1.5:free',
                messages: [
                    { role: 'system', content: 'Você resume conversas de forma clara e objetiva em Português Brasileiro.' },
                    { role: 'user', content: `Resuma:\n\n${chatLog.slice(0, 3000)}` }
                ],
                max_tokens: 500
            })
        });
        const data    = await response.json();
        const summary = data.choices?.[0]?.message?.content || 'Não foi possível resumir.';
        const embed   = new EmbedBuilder().setColor('Blue').setTitle('📝 RESUMO DAS ÚLTIMAS 50 MENSAGENS').setDescription(summary).setTimestamp();
        return interaction.editReply({ embeds: [embed] });
    }

    if (commandName === 'addia') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const id     = options.getString('id');
        const name   = options.getString('nome');
        const prompt = options.getString('prompt');
        const color  = options.getString('cor') || '#ffffff';
        const key    = name.toLowerCase().replace(/\s+/g, '_');
        config.customIAs = config.customIAs || {};
        config.customIAs[key] = { id, name, color, prompt };
        config.markModified('customIAs');
        await config.save();
        return interaction.reply(`✅ IA **${name}** criada com chave \`${key}\`.`);
    }

    if (commandName === 'delia') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const key = options.getString('nome').toLowerCase().replace(/\s+/g, '_');
        if (DEFAULT_IAS[key]) return interaction.reply('❌ Não é possível remover IAs padrão.');
        delete config.customIAs[key];
        config.markModified('customIAs');
        await config.save();
        return interaction.reply(`🗑️ IA \`${key}\` removida.`);
    }

    if (commandName === 'reset') {
        await Memory.deleteOne({ channelId: interaction.channel.id });
        return interaction.reply('🧹 Memória da IA neste canal foi resetada.');
    }

    if (commandName === 'qrcode') {
        const text = options.getString('texto');
        const url  = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
        const embed = new EmbedBuilder().setColor('White').setTitle('📱 QR CODE').setImage(url).setDescription(`Conteúdo: \`${text.slice(0, 100)}\``);
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'shorten') {
        const url = options.getString('url');
        try {
            const res  = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
            const data = await res.json();
            if (data.shorturl) return interaction.reply(`🔗 **Link Encurtado:** ${data.shorturl}`);
            return interaction.reply('❌ Erro ao encurtar. Verifique a URL.');
        } catch { return interaction.reply('❌ Serviço indisponível.'); }
    }

    if (commandName === 'weather') {
        await interaction.deferReply();
        const city = options.getString('cidade');
        const key  = process.env.OPENWEATHER_API_KEY;
        if (!key) return interaction.editReply('❌ OPENWEATHER_API_KEY não configurada.');
        const res  = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric&lang=pt_br`);
        const data = await res.json();
        if (data.cod !== 200) return interaction.editReply('❌ Cidade não encontrada.');
        const embed = new EmbedBuilder().setColor('Blue').setTitle(`🌤️ ${data.name}, ${data.sys.country}`)
            .setThumbnail(`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`)
            .addFields(
                { name: '🌡️ Temperatura', value: `${data.main.temp}°C (sensação ${data.main.feels_like}°C)`, inline: true },
                { name: '💧 Umidade',     value: `${data.main.humidity}%`,                                    inline: true },
                { name: '☁️ Condição',    value: data.weather[0].description,                                  inline: true },
                { name: '💨 Vento',       value: `${data.wind.speed} m/s`,                                    inline: true }
            );
        return interaction.editReply({ embeds: [embed] });
    }

    if (commandName === 'crypto') {
        await interaction.deferReply();
        const coin = options.getString('moeda').toUpperCase();
        const res  = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin}USDT`);
        const data = await res.json();
        if (!data.price) return interaction.editReply(`❌ Par **${coin}USDT** não encontrado.`);
        return interaction.editReply(`💰 **${coin}** = **$${parseFloat(data.price).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT**`);
    }

    if (commandName === 'giveaway') {
        const timeStr      = options.getString('tempo');
        const winnersCount = options.getInteger('vencedores');
        const prize        = options.getString('premio');
        const duration     = ms(timeStr);
        if (!duration) return interaction.reply('❌ Formato inválido. Ex: 10m, 1h, 1d');
        const embed = new EmbedBuilder().setColor('Gold').setTitle('🎉 NOVO SORTEIO!')
            .setDescription(`**Prêmio:** ${prize}\n**Vencedores:** ${winnersCount}\n**Iniciado por:** <@${discordUser.id}>\n\nReaja com 🎉 para participar!\nTermina <t:${Math.floor((Date.now() + duration) / 1000)}:R>`)
            .setTimestamp(Date.now() + duration);
        const msg = await interaction.channel.send({ embeds: [embed] });
        await msg.react('🎉');
        user.giveawaysCreated = (user.giveawaysCreated || 0) + 1;
        await user.save();
        await interaction.reply({ content: '✅ Sorteio iniciado!', ephemeral: true });
        setTimeout(async () => {
            const fetched = await interaction.channel.messages.fetch(msg.id).catch(() => null);
            if (!fetched) {
                if (!user.badges.includes('ilusionista')) { user.badges.push('ilusionista'); await user.save(); }
                return;
            }
            const reaction     = fetched.reactions.cache.get('🎉');
            const users        = await reaction?.users.fetch().catch(() => null);
            const participants = users?.filter(u => !u.bot);
            if (!participants?.size) return interaction.channel.send(`❌ Sorteio de **${prize}** encerrado sem participantes.`);
            const winners = [...participants.values()].sort(() => Math.random() - 0.5).slice(0, winnersCount);
            // Badge manipulador (20+ participantes)
            if (participants.size >= 20 && !user.badges.includes('manipulador')) { user.badges.push('manipulador'); await user.save(); }
            interaction.channel.send(`🎉 **PARABÉNS!** ${winners.join(', ')} ganhou(aram) **${prize}**!`);
        }, duration);
        return;
    }

    if (commandName === 'tag') {
        const action = options.getString('acao');
        const name   = options.getString('nome');
        if (action === 'create') {
            if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
            const text = options.getString('texto');
            if (!text) return interaction.reply('❌ Forneça o conteúdo da tag.');
            config.tags[name]     = text;
            config.tagUsage[name] = 0;
            config.markModified('tags'); config.markModified('tagUsage');
            await config.save();
            return interaction.reply(`✅ Tag **${name}** criada.`);
        }
        if (action === 'delete') {
            if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
            delete config.tags[name]; delete config.tagUsage[name];
            config.markModified('tags'); config.markModified('tagUsage');
            await config.save();
            return interaction.reply(`🗑️ Tag **${name}** removida.`);
        }
        if (action === 'list') {
            const tags = Object.keys(config.tags || {});
            return interaction.reply(tags.length ? `📋 Tags: ${tags.map(t => `\`${t}\``).join(', ')}` : '❌ Nenhuma tag cadastrada.');
        }
        if (action === 'use') {
            const text = config.tags?.[name];
            if (!text) return interaction.reply(`❌ Tag \`${name}\` não existe.`);
            config.tagUsage[name] = (config.tagUsage[name] || 0) + 1;
            config.markModified('tagUsage');
            await config.save();
            // Badge ideia (50 usos)
            if (config.tagUsage[name] >= 50) {
                // Acha quem criou a tag (não temos o createdBy, então award ao caller por ora)
                if (!user.badges.includes('ideia')) { user.badges.push('ideia'); await user.save(); }
            }
            return interaction.reply(text);
        }
    }

    if (commandName === 'graph') {
        await interaction.deferReply();
        const tipo  = options.getString('tipo');
        const users = await User.find({ guildId: guild.id }).sort({ [tipo === 'coins' ? 'coins' : 'level']: -1 }).limit(8);
        const chart = new QuickChart();
        chart.setConfig({
            type: 'bar',
            data: {
                labels: users.map(u => u.userId.slice(-4)),
                datasets: [{ label: tipo === 'coins' ? 'Coins' : 'Nível', data: users.map(u => tipo === 'coins' ? u.coins : u.level), backgroundColor: 'rgba(0,153,255,0.8)' }]
            },
            options: { plugins: { title: { display: true, text: tipo === 'coins' ? 'Top Ricos' : 'Top Nível' } } }
        });
        chart.setWidth(500).setHeight(300);
        const url  = await chart.getShortUrl();
        const embed = new EmbedBuilder().setColor('Blue').setTitle(`📊 Gráfico — ${tipo === 'coins' ? 'Riqueza' : 'Nível'}`).setImage(url);
        return interaction.editReply({ embeds: [embed] });
    }

    if (commandName === 'status') {
        const embed = new EmbedBuilder().setColor('Green').setTitle('🤖 STATUS DO BOT')
            .addFields(
                { name: '⏱️ Uptime',    value: formatTime(process.uptime() * 1000),                   inline: true },
                { name: '🏓 Latência',  value: `${client?.ws?.ping || interaction.client.ws.ping}ms`,  inline: true },
                { name: '🌐 Servidores',value: `${interaction.client.guilds.cache.size}`,               inline: true },
                { name: '💾 Memória',   value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`, inline: true }
            ).setTimestamp();
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'email') {
        const { handleEmailCommand } = await import('./email.js');
        return handleEmailCommand(interaction);
    }

    // ═══════════════════════════════════════════════════════════════
    // 💸 ADDCOINS — só o dono do bot pode usar
    // ═══════════════════════════════════════════════════════════════
    if (commandName === 'addcoins') {
        if (!isBotOwner) return interaction.reply({ content: '🚫 Apenas o dono do bot pode usar esse comando.', ephemeral: true });
        const target = options.getUser('usuario');
        const amount = options.getInteger('quantidade');
        if (amount === 0) return interaction.reply({ content: '❌ Valor inválido.', ephemeral: true });
        const td = (await getData(guild.id, target.id)).user;
        td.coins = Math.max(0, td.coins + amount);
        await td.save();
        const sinal = amount > 0 ? `+${amount.toLocaleString('pt-BR')}` : amount.toLocaleString('pt-BR');
        return interaction.reply({ content: `✅ **${sinal} 🪙** ${amount > 0 ? 'adicionados' : 'removidos'} de <@${target.id}>. Saldo: **${td.coins.toLocaleString('pt-BR')} 🪙**`, ephemeral: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // ⚙️ CONFIGECON — configura valores da economia (só dono)
    // ═══════════════════════════════════════════════════════════════
    if (commandName === 'configecon') {
        if (!isBotOwner) return interaction.reply({ content: '🚫 Apenas o dono do bot pode usar esse comando.', ephemeral: true });
        const campo = options.getString('campo');
        const valor = options.getInteger('valor');
        if (valor < 0) return interaction.reply({ content: '❌ Valor não pode ser negativo.', ephemeral: true });

        const campos = {
            'daily':       () => { config.economyConfig.dailyAmount = valor; },
            'work_min':    () => { config.economyConfig.workMin = valor; },
            'work_max':    () => { config.economyConfig.workMax = valor; },
            'crime_min':   () => { config.economyConfig.crimeMin = valor; },
            'crime_max':   () => { config.economyConfig.crimeMax = valor; },
            'voz_coins':   () => { config.voiceConfig.coinsPerMin = valor; },
            'voz_xp':      () => { config.voiceConfig.xpPerMin = valor; },
            'rob_min_pct': () => { config.economyConfig.robMinPct = valor; },  // % mínimo do roubo
            'rob_max_pct': () => { config.economyConfig.robMaxPct = valor; },  // % máximo do roubo
        };

        if (!campos[campo]) return interaction.reply({ content: '❌ Campo inválido.', ephemeral: true });
        campos[campo]();
        config.markModified('economyConfig');
        config.markModified('voiceConfig');
        await config.save();

        const nomes = {
            daily: 'Daily', work_min: 'Work mínimo', work_max: 'Work máximo',
            crime_min: 'Crime mínimo', crime_max: 'Crime máximo',
            voz_coins: 'Coins/min voz', voz_xp: 'XP/min voz',
            rob_min_pct: 'Roubo % mínimo', rob_max_pct: 'Roubo % máximo'
        };
        return interaction.reply({ content: `✅ **${nomes[campo]}** definido para **${valor}${campo.includes('pct') ? '%' : ' 🪙'}**`, ephemeral: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // 💰 POBREZA — dá 10M, cooldown de 10 minutos, qualquer um usa
    // ═══════════════════════════════════════════════════════════════
    if (commandName === 'pobreza') {
        const cd = 600000; // 10 minutos
        const restante = cd - (Date.now() - (user.lastPobreza || 0));
        if (restante > 0) {
            return interaction.reply({ content: `⏳ Aguarde **${formatTime(restante)}** para usar /pobreza novamente.`, ephemeral: true });
        }
        user.coins      += 10000000;
        user.lastPobreza = Date.now();
        await user.save();
        await checkBadges(user, interaction);
        return interaction.reply(`💸 <@${discordUser.id}> recebeu **10.000.000 🪙**! Pobreza resolvida (por 10 minutos).`);
    }
}

// Helper interno para dar badge sem duplicata
function award_direct(user, id) {
    if (!user.badges.includes(id)) user.badges.push(id);
}
