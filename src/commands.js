// ═══════════════════════════════════════════════════════════════
// 🎮 COMMANDS — Todos os handlers de slash commands
// ═══════════════════════════════════════════════════════════════
import {
    EmbedBuilder, AttachmentBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, PermissionFlagsBits
} from 'discord.js';
import QuickChart from 'quickchart-js';
import ms from 'ms';
import { User, Memory, Config } from './models.js';
import { SHOP_ITEMS, ALL_BADGES, DEFAULT_IAS } from './config.js';
import { getData, formatTime, xpForLevel, checkBadges, generateProfile } from './helpers.js';
import { handleEmail } from './email.js';

export async function handleCommand(interaction, player) {
    const { commandName, options } = interaction;
    const { config, user } = await getData(interaction.guild.id, interaction.user.id);
    if (!config || !user) {
        return interaction.reply({ content: '❌ Erro ao carregar dados.', ephemeral: true });
    }
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
        (config.adminRole && interaction.member.roles.cache.has(config.adminRole));

    // ═══════════════════════════════════════════════════════════
    // 🛡️ MODERAÇÃO
    // ═══════════════════════════════════════════════════════════
    if (commandName === 'ban') {
        if (!isAdmin) return interaction.reply({ content: '🚫 Sem permissão.', ephemeral: true });
        const target = options.getUser('usuario');
        const reason = options.getString('motivo') || 'Sem motivo';
        if (target.id === interaction.user.id) return interaction.reply('❌ Você não pode banir a si mesmo.');
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) return interaction.reply('❌ Usuário não encontrado.');
        await member.ban({ reason });
        return interaction.reply(`🔨 **${target.tag}** foi banido. Motivo: ${reason}`);
    }
    if (commandName === 'kick') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target = options.getUser('usuario');
        const reason = options.getString('motivo') || 'Sem motivo';
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) return interaction.reply('❌ Usuário não encontrado.');
        await member.kick(reason);
        return interaction.reply(`👢 **${target.tag}** foi expulso. Motivo: ${reason}`);
    }
    if (commandName === 'clear') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const amount = options.getInteger('quantidade');
        if (amount < 1 || amount > 100) return interaction.reply('❌ Quantidade inválida (1-100).');
        const msgs = await interaction.channel.messages.fetch({ limit: amount });
        await interaction.channel.bulkDelete(msgs);
        return interaction.reply({ content: `🗑️ ${msgs.size} mensagens deletadas.`, ephemeral: true });
    }
    if (commandName === 'nuke') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels))
            return interaction.reply('❌ Sem permissão para gerenciar canais.');
        const channel = interaction.channel;
        const pos = channel.position;
        const newCh = await channel.clone();
        await newCh.setPosition(pos);
        await channel.delete();
        return newCh.send('💥 Canal limpo com sucesso!');
    }
    if (commandName === 'lock') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        return interaction.reply('🔒 Canal bloqueado.');
    }
    if (commandName === 'unlock') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
        return interaction.reply('🔓 Canal desbloqueado.');
    }
    if (commandName === 'slowmode') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const sec = options.getInteger('segundos');
        await interaction.channel.setRateLimitPerUser(sec);
        return interaction.reply(`⏱️ Slowmode definido para **${sec}s**.`);
    }
    if (commandName === 'warn') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target = options.getUser('usuario');
        const motivo = options.getString('motivo') || 'Sem motivo';
        const tData = (await getData(interaction.guild.id, target.id)).user;
        if (!tData.warnings) tData.warnings = [];
        tData.warnings = [...(tData.warnings || []), { reason: motivo, date: Date.now() }];
        await User.updateOne({ _id: tData._id }, { warnings: tData.warnings });
        return interaction.reply(`⚠️ **${target.tag}** foi advertido. Motivo: ${motivo}`);
    }
    if (commandName === 'warnings') {
        const target = options.getUser('usuario') || interaction.user;
        const tData = (await getData(interaction.guild.id, target.id)).user;
        const warns = tData.warnings || [];
        const embed = new EmbedBuilder()
            .setTitle(`⚠️ Advertências de ${target.username}`)
            .setColor('Orange')
            .setDescription(warns.length === 0 ? 'Nenhuma advertência.' :
                warns.map((w, i) => `**${i+1}.** ${w.reason} — <t:${Math.floor(w.date/1000)}:R>`).join('\n'));
        return interaction.reply({ embeds: [embed] });
    }
    if (commandName === 'unwarn') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target = options.getUser('usuario');
        const tData = (await getData(interaction.guild.id, target.id)).user;
        await User.updateOne({ _id: tData._id }, { warnings: [] });
        return interaction.reply(`✅ Advertências de **${target.tag}** removidas.`);
    }
    if (commandName === 'mute') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target = options.getUser('usuario');
        const tempo  = options.getString('tempo');
        const dur    = ms(tempo);
        if (!dur) return interaction.reply('❌ Formato inválido. Ex: 10m, 1h');
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) return interaction.reply('❌ Usuário não encontrado.');
        await member.timeout(dur, 'Mutado via bot');
        return interaction.reply(`🔇 **${target.tag}** mutado por **${tempo}**.`);
    }
    if (commandName === 'unmute') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target = options.getUser('usuario');
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) return interaction.reply('❌ Usuário não encontrado.');
        await member.timeout(null);
        return interaction.reply(`🔊 **${target.tag}** desmutado.`);
    }
    if (commandName === 'setia') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const iaKey  = options.getString('ia');
        const canal  = options.getChannel('canal');
        const allAIs = { ...DEFAULT_IAS, ...config.customIAs };
        if (!allAIs[iaKey]) return interaction.reply('❌ IA não encontrada.');
        await Config.updateOne({ guildId: interaction.guild.id }, { [`channelAIs.${canal.id}`]: iaKey });
        return interaction.reply(`✅ Canal ${canal} definido para usar **${allAIs[iaKey].name}**.`);
    }
    if (commandName === 'allowchannel') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const canal = options.getChannel('canal');
        const acao  = options.getString('acao');
        if (acao === 'add') {
            config.allowedChannels = [...new Set([...config.allowedChannels, canal.id])];
        } else {
            config.allowedChannels = config.allowedChannels.filter(c => c !== canal.id);
        }
        await config.save();
        return interaction.reply(`✅ Canal ${canal} ${acao === 'add' ? 'liberado' : 'removido'} para IA.`);
    }
    if (commandName === 'setwelcome') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const canal = options.getChannel('canal');
        const msg   = options.getString('mensagem') || 'Bem-vindo, {user}!';
        config.welcomeConfig = { enabled: true, channelId: canal.id, message: msg };
        await config.save();
        return interaction.reply(`✅ Boas-vindas configurado no canal ${canal}.`);
    }
    if (commandName === 'setadmin') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({ content: '🚫', ephemeral: true });
        const cargo = options.getRole('cargo');
        config.adminRole = cargo.id;
        await config.save();
        return interaction.reply(`✅ Cargo admin definido para ${cargo}.`);
    }
    if (commandName === 'setlog') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const canal = options.getChannel('canal');
        config.logChannel = canal.id;
        await config.save();
        return interaction.reply(`✅ Canal de logs definido: ${canal}.`);
    }
    if (commandName === 'banchannel') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const canal = options.getChannel('canal');
        const acao  = options.getString('acao');
        if (acao === 'add') {
            config.bannedChannels = [...new Set([...config.bannedChannels, canal.id])];
        } else {
            config.bannedChannels = config.bannedChannels.filter(c => c !== canal.id);
        }
        await config.save();
        return interaction.reply(`✅ Canal ${canal} ${acao === 'add' ? 'banido da' : 'liberado na'} IA.`);
    }
    if (commandName === 'backup') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const channels = interaction.guild.channels.cache.map(c => ({ name: c.name, type: c.type, id: c.id }));
        const roles    = interaction.guild.roles.cache.map(r => ({ name: r.name, color: r.hexColor }));
        const data     = JSON.stringify({ channels, roles, timestamp: Date.now() }, null, 2);
        const buffer   = Buffer.from(data, 'utf-8');
        return interaction.reply({
            content: '✅ Backup gerado!',
            files: [{ attachment: buffer, name: `backup_${interaction.guild.id}.json` }],
            ephemeral: true
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 💰 ECONOMIA
    // ═══════════════════════════════════════════════════════════
    if (commandName === 'coins') {
        const target = options.getUser('usuario') || interaction.user;
        const tData  = (await getData(interaction.guild.id, target.id)).user;
        return interaction.reply(`💰 **${target.username}** tem **${tData.coins.toLocaleString('pt-BR')} coins**.`);
    }
    if (commandName === 'daily') {
        const cooldown = 86400000;
        if (Date.now() - user.lastDaily < cooldown) {
            const rem = cooldown - (Date.now() - user.lastDaily);
            return interaction.reply({ content: `⏳ Você já coletou hoje. Volte em **${formatTime(rem)}**.`, ephemeral: true });
        }
        const amount = config.economyConfig.dailyAmount || 500;
        const bonus  = user.vipUntil > Date.now() ? amount : 0;
        user.coins    += amount + bonus;
        user.lastDaily = Date.now();
        await user.save();
        await checkBadges(user, interaction);
        return interaction.reply(`💸 Você coletou **${amount + bonus} coins**${bonus > 0 ? ` (${bonus} bônus VIP!)` : ''}!`);
    }
    if (commandName === 'work') {
        const cooldown = 3600000; // 1h
        if (Date.now() - user.lastWork < cooldown) {
            const rem = cooldown - (Date.now() - user.lastWork);
            return interaction.reply({ content: `⏳ Você já trabalhou recentemente. Volte em **${formatTime(rem)}**.`, ephemeral: true });
        }
        const min = config.economyConfig.workMin || 100;
        const max = config.economyConfig.workMax || 400;
        let earned = Math.floor(Math.random() * (max - min + 1)) + min;
        if (user.inventory?.includes('Picareta de Ouro')) earned = Math.floor(earned * 1.5);
        user.coins   += earned;
        user.lastWork = Date.now();
        await user.save();
        await checkBadges(user, interaction);
        return interaction.reply(`⚒️ Você trabalhou e ganhou **${earned} coins**!`);
    }
    if (commandName === 'crime') {
        const cooldown = 7200000; // 2h
        if (Date.now() - user.lastCrime < cooldown) {
            const rem = cooldown - (Date.now() - user.lastCrime);
            return interaction.reply({ content: `⏳ A polícia está te procurando. Espere **${formatTime(rem)}**.`, ephemeral: true });
        }
        user.lastCrime = Date.now();
        const success  = Math.random() > 0.6;
        if (success) {
            const loot = Math.floor(Math.random() * (config.economyConfig.crimeMax - config.economyConfig.crimeMin + 1)) + config.economyConfig.crimeMin;
            user.coins += loot;
            user.crimeCount = (user.crimeCount || 0) + 1;
            await user.save();
            await checkBadges(user, interaction);
            return interaction.reply(`🔫 **SUCESSO!** Você assaltou um banco e fugiu com **${loot} coins**!`);
        } else {
            const fine = 500;
            user.coins = Math.max(0, user.coins - fine);
            if (user.coins === 0) { user.wasBankrupt = true; user.bankruptTimestamp = Date.now(); }
            await user.save();
            return interaction.reply(`🚔 **FRACASSO!** Você foi preso e pagou **${fine} coins** de fiança.`);
        }
    }
    if (commandName === 'rob') {
        const target = options.getUser('usuario');
        if (target.id === interaction.user.id) return interaction.reply('❌ Você não pode roubar a si mesmo.');
        const cooldown = 86400000;
        if (Date.now() - user.lastRob < cooldown) {
            const rem = cooldown - (Date.now() - user.lastRob);
            return interaction.reply({ content: `⏳ Espere **${formatTime(rem)}** para roubar novamente.`, ephemeral: true });
        }
        const targetData = (await getData(interaction.guild.id, target.id)).user;
        if (targetData.coins < 500) return interaction.reply('❌ A vítima é muito pobre, não vale o risco.');
        if (targetData.inventory?.includes('Escudo Anti-Roubo')) {
            user.lastRob = Date.now();
            targetData.inventory = targetData.inventory.filter(i => i !== 'Escudo Anti-Roubo');
            await user.save(); await targetData.save();
            return interaction.reply(`🛡️ **FALHA!** ${target} tinha um Escudo Anti-Roubo!`);
        }
        user.lastRob = Date.now();
        if (Math.random() > 0.5) {
            const steal = Math.floor(targetData.coins * 0.1);
            user.coins += steal; targetData.coins -= steal;
            user.robSuccess = (user.robSuccess || 0) + 1;
            await user.save(); await targetData.save();
            await checkBadges(user, interaction);
            return interaction.reply(`🔫 **SUCESSO!** Você roubou **${steal} coins** de ${target}!`);
        } else {
            user.coins = Math.max(0, user.coins - 200);
            await user.save();
            return interaction.reply(`🚔 **FRACASSO!** Você foi pego e pagou **200 coins** de fiança.`);
        }
    }
    if (commandName === 'give') {
        const target = options.getUser('usuario');
        const amount = options.getInteger('quantidade');
        if (target.id === interaction.user.id) return interaction.reply('❌ Não pode doar para si mesmo.');
        if (amount < 1) return interaction.reply('❌ Quantidade inválida.');
        if (user.coins < amount) return interaction.reply(`❌ Saldo insuficiente (${user.coins.toLocaleString()} coins).`);
        const targetData = (await getData(interaction.guild.id, target.id)).user;
        user.coins -= amount;
        targetData.coins += amount;
        user.totalDonated = (user.totalDonated || 0) + amount;
        const now = Date.now();
        user.donationChain = (now - (user.lastDonationTime || 0) < 300000)
            ? [...(user.donationChain || []), target.id]
            : [target.id];
        user.lastDonationTime = now;
        await User.updateOne({ _id: user._id }, { coins: user.coins, totalDonated: user.totalDonated, donationChain: user.donationChain, lastDonationTime: now });
        await targetData.save();
        if (amount === 666) await checkBadges(user, interaction);
        return interaction.reply(`🤝 Você transferiu **${amount} coins** para <@${target.id}>.`);
    }

    // ═══════════════════════════════════════════════════════════
    // 🛒 LOJA
    // ═══════════════════════════════════════════════════════════
    if (commandName === 'shop') {
        const embed = new EmbedBuilder()
            .setTitle('🛒 MERCADO NEGRO DO BIRUTAS').setColor('Gold')
            .setDescription('Use `/buy <id>` para comprar.');
        Object.entries(SHOP_ITEMS).forEach(([id, item]) => {
            embed.addFields({ name: `${item.emoji} ${item.name} (ID: \`${id}\`)`, value: `> **${item.price.toLocaleString()} coins** — *${item.desc}*` });
        });
        return interaction.reply({ embeds: [embed] });
    }
    if (commandName === 'buy') {
        const itemId = options.getString('id');
        const item   = SHOP_ITEMS[itemId];
        if (!item) return interaction.reply('❌ Item não encontrado.');
        if (user.coins < item.price) return interaction.reply(`❌ Saldo insuficiente. Faltam **${(item.price - user.coins).toLocaleString()} coins**.`);
        user.coins -= item.price;
        user.totalSpent = (user.totalSpent || 0) + item.price;
        if (item.type === 'vip') {
            user.vipUntil = (user.vipUntil > Date.now() ? user.vipUntil : Date.now()) + item.duration;
        } else {
            if (!user.inventory) user.inventory = [];
            user.inventory.push(item.name);
        }
        const allNames = Object.values(SHOP_ITEMS).filter(i => i.type === 'item').map(i => i.name);
        if (allNames.every(n => user.inventory?.includes(n))) await checkBadges(user, interaction);
        await user.save();
        return interaction.reply(`✅ Você comprou **${item.name}** por **${item.price.toLocaleString()} coins**!`);
    }
    if (commandName === 'inventory') {
        const items = user.inventory || [];
        const embed = new EmbedBuilder().setTitle('🎒 SEU INVENTÁRIO').setColor('Blue').setThumbnail(interaction.user.displayAvatarURL());
        if (items.length === 0) {
            embed.setDescription('*Inventário vazio. Use `/shop`!*');
        } else {
            const counts = {};
            items.forEach(i => counts[i] = (counts[i] || 0) + 1);
            embed.setDescription(Object.entries(counts).map(([n, c]) => `• **${n}** x${c}`).join('\n'));
        }
        if (user.vipUntil > Date.now()) embed.addFields({ name: '👑 VIP', value: `Ativo até <t:${Math.floor(user.vipUntil / 1000)}:F>` });
        return interaction.reply({ embeds: [embed] });
    }
    if (commandName === 'rank') {
        const top = await User.find({ guildId: interaction.guild.id }).sort({ coins: -1 }).limit(10);
        return interaction.reply({ embeds: [new EmbedBuilder()
            .setTitle('💰 RANKING DE RIQUEZA').setColor('Gold')
            .setDescription(top.map((u, i) => `**${i+1}.** <@${u.userId}> — **${u.coins.toLocaleString()} coins**`).join('\n'))
        ]});
    }
    if (commandName === 'configvoz') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        config.voiceConfig.coinsPerMin = options.getInteger('valor');
        await config.save();
        return interaction.reply(`✅ Ganhos de voz: **${options.getInteger('valor')} coins/min**.`);
    }

    // ═══════════════════════════════════════════════════════════
    // 🎰 CASSINO
    // ═══════════════════════════════════════════════════════════
    if (commandName === 'coinflip') {
        const lado   = options.getString('lado');
        const aposta = options.getInteger('aposta');
        if (aposta < 1) return interaction.reply('❌ Aposta mínima: 1 coin.');
        if (user.coins < aposta) return interaction.reply('❌ Saldo insuficiente.');
        const result = Math.random() > 0.5 ? 'cara' : 'coroa';
        if (lado === result) {
            user.coins += aposta; user.gambleWinStreak = (user.gambleWinStreak || 0) + 1; user.gambleLossStreak = 0; user.coinflipWins = (user.coinflipWins || 0) + 1;
            await user.save(); await checkBadges(user, interaction);
            return interaction.reply(`🪙 **${result.toUpperCase()}!** Ganhou **${aposta} coins**!`);
        } else {
            user.coins -= aposta; user.gambleLossStreak = (user.gambleLossStreak || 0) + 1; user.gambleWinStreak = 0;
            await user.save(); await checkBadges(user, interaction);
            return interaction.reply(`🪙 **${result.toUpperCase()}!** Perdeu **${aposta} coins**!`);
        }
    }
    if (commandName === 'slots') {
        const aposta = options.getInteger('valor');
        if (aposta < 1) return interaction.reply('❌ Aposta mínima: 1 coin.');
        if (user.coins < aposta) return interaction.reply('❌ Saldo insuficiente.');
        const sym = ['🍒','🍋','🍇','💎','7️⃣'];
        const roll = () => sym[Math.floor(Math.random() * sym.length)];
        const [s1, s2, s3] = [roll(), roll(), roll()];
        let win = 0;
        if (s1 === s2 && s2 === s3) {
            win = s1 === '7️⃣' ? aposta * 50 : aposta * 10;
            user.slotsJackpots = (user.slotsJackpots || 0) + 1;
        } else if (s1 === s2 || s2 === s3 || s1 === s3) win = aposta * 2;
        if (win > 0) {
            user.coins += win; user.gambleWinStreak = (user.gambleWinStreak || 0) + 1; user.gambleLossStreak = 0;
            await user.save(); await checkBadges(user, interaction);
            return interaction.reply(`🎰 | ${s1} | ${s2} | ${s3} |\n🎉 **JACKPOT!** Ganhou **${win} coins**!`);
        } else {
            user.coins -= aposta; user.gambleLossStreak = (user.gambleLossStreak || 0) + 1; user.gambleWinStreak = 0;
            await user.save(); await checkBadges(user, interaction);
            return interaction.reply(`🎰 | ${s1} | ${s2} | ${s3} |\n😢 Perdeu **${aposta} coins**.`);
        }
    }
    if (commandName === 'roulette') {
        const cor    = options.getString('cor');
        const aposta = options.getInteger('aposta');
        if (aposta < 1) return interaction.reply('❌ Aposta mínima: 1 coin.');
        if (user.coins < aposta) return interaction.reply('❌ Saldo insuficiente.');
        const roll  = Math.random();
        const result = roll < 0.48 ? 'red' : roll < 0.96 ? 'black' : 'green';
        const win   = (cor === 'green' && result === 'green') ? aposta * 14 : cor === result ? aposta * 2 : 0;
        if (win > 0) {
            user.coins += win; user.rouletteWins = (user.rouletteWins || 0) + 1; user.gambleWinStreak = (user.gambleWinStreak || 0) + 1; user.gambleLossStreak = 0;
            await user.save(); await checkBadges(user, interaction);
            return interaction.reply(`🎡 **${result.toUpperCase()}!** Ganhou **${win} coins**!`);
        } else {
            user.coins -= aposta; user.gambleLossStreak = (user.gambleLossStreak || 0) + 1; user.gambleWinStreak = 0;
            await user.save(); await checkBadges(user, interaction);
            return interaction.reply(`🎡 **${result.toUpperCase()}!** Perdeu **${aposta} coins**.`);
        }
    }
    if (commandName === 'jokenpo') {
        const jogada = options.getString('jogada');
        const aposta = options.getInteger('aposta') || 0;
        if (aposta > 0 && user.coins < aposta) return interaction.reply('❌ Saldo insuficiente.');
        const choices = ['pedra','papel','tesoura'];
        const botChoice = choices[Math.floor(Math.random() * 3)];
        const win = (jogada === 'pedra' && botChoice === 'tesoura') || (jogada === 'papel' && botChoice === 'pedra') || (jogada === 'tesoura' && botChoice === 'papel');
        if (jogada === botChoice) return interaction.reply(`✊ **${jogada}** vs **${botChoice}** — Empate!`);
        if (win) { user.coins += aposta; await user.save(); return interaction.reply(`✊ **${jogada}** vs **${botChoice}** 🎉 Ganhou **${aposta} coins**!`); }
        else { user.coins -= aposta; await user.save(); return interaction.reply(`✊ **${jogada}** vs **${botChoice}** 😢 Perdeu **${aposta} coins**.`); }
    }
    if (commandName === 'dado') {
        const faces = options.getInteger('faces');
        if (faces < 2 || faces > 1000) return interaction.reply('❌ Faces inválido (2-1000).');
        const roll  = Math.floor(Math.random() * faces) + 1;
        if (roll === 1 && Math.random() < 0.001 && !user.badges.includes('escolhido')) {
            user.badges.push('escolhido'); await user.save();
        }
        return interaction.reply(`🎲 Você rolou **${roll}** (de 1 a ${faces})!`);
    }

    // ═══════════════════════════════════════════════════════════
    // 👤 SOCIAL
    // ═══════════════════════════════════════════════════════════
    if (commandName === 'profile') {
        await interaction.deferReply();
        try {
            const target = options.getUser('usuario') || interaction.user;
            const td     = (await getData(interaction.guild.id, target.id)).user;
            const buffer = await generateProfile(target, td);
            const attach = new AttachmentBuilder(buffer, { name: `profile-${target.id}.png` });
            return interaction.editReply({ files: [attach] });
        } catch (err) {
            console.error('[PROFILE ERROR]', err);
            return interaction.editReply('❌ Erro ao gerar o perfil.');
        }
    }
    if (commandName === 'stats') {
        const target = options.getUser('usuario') || interaction.user;
        const td = (await getData(interaction.guild.id, target.id)).user;
        return interaction.reply({ embeds: [new EmbedBuilder()
            .setTitle(`📊 ESTATÍSTICAS: ${target.username}`).setColor('Blue').setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: '💬 Mensagens',     value: `${(td.messages||0).toLocaleString()}`, inline: true },
                { name: '🎙️ Voz',           value: `${td.voiceMinutes||0} min`,            inline: true },
                { name: '🤖 IA',            value: `${td.iaMessages||0}`,                  inline: true },
                { name: '🕵️ Roubos',        value: `${td.robSuccess||0}`,                  inline: true },
                { name: '🔫 Crimes',        value: `${td.crimeCount||0}`,                  inline: true },
                { name: '🤝 Doado',         value: `${(td.totalDonated||0).toLocaleString()}`, inline: true },
                { name: '🎰 Vitórias',      value: `${(td.coinflipWins||0)+(td.slotsJackpots||0)+(td.rouletteWins||0)}`, inline: true },
                { name: '💍 Estado Civil',  value: td.marriedTo ? `Casado com <@${td.marriedTo}>` : 'Solteiro', inline: true }
            ).setTimestamp()
        ]});
    }
    if (commandName === 'level') {
        const target = options.getUser('usuario') || interaction.user;
        const td = (await getData(interaction.guild.id, target.id)).user;
        return interaction.reply(`📈 **${target.username}** — Nível **${td.level}** | **${td.xp}/${xpForLevel(td.level+1)} XP**`);
    }
    if (commandName === 'leaderboard') {
        const top = await User.find({ guildId: interaction.guild.id }).sort({ level: -1, xp: -1 }).limit(10);
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🏆 RANKING DE EXPERIÊNCIA').setColor('Blue')
            .setDescription(top.map((u,i) => `**${i+1}.** <@${u.userId}> — Nível **${u.level}**`).join('\n'))
        ]});
    }
    if (commandName === 'badges') {
        const target = options.getUser('usuario') || interaction.user;
        const td = (await getData(interaction.guild.id, target.id)).user;
        const list = (td.badges||[]).filter(id => ALL_BADGES[id])
            .map(id => `${ALL_BADGES[id].emoji} **${ALL_BADGES[id].name}**\n> *${ALL_BADGES[id].desc}*`).join('\n\n')
            || '*Nenhuma conquista ainda.*';
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`🏅 CONQUISTAS DE ${target.username}`).setColor('Gold')
            .setDescription(list).setFooter({ text: `${td.badges?.length||0} badges` })
        ]});
    }
    if (commandName === 'marry') {
        const target = options.getUser('usuario');
        if (target.id === interaction.user.id) return interaction.reply('❌ Não pode casar consigo mesmo.');
        if (user.marriedTo) return interaction.reply('❌ Você já está casado!');
        const td = (await getData(interaction.guild.id, target.id)).user;
        if (td.marriedTo) return interaction.reply(`❌ ${target} já está casado!`);
        if (!user.inventory?.includes('Anel de Casamento')) return interaction.reply('❌ Você precisa de um Anel de Casamento (compre na `/shop`)!');
        user.inventory = user.inventory.filter(i => i !== 'Anel de Casamento');
        user.marriedTo = target.id; td.marriedTo = interaction.user.id;
        await user.save(); await td.save();
        return interaction.reply(`💍 <@${interaction.user.id}> e <@${target.id}> se casaram! 🎉`);
    }
    if (commandName === 'divorce') {
        if (!user.marriedTo) return interaction.reply('❌ Você não está casado.');
        const td = (await getData(interaction.guild.id, user.marriedTo)).user;
        user.marriedTo = null; if (td) td.marriedTo = null;
        await user.save(); if (td) await td.save();
        return interaction.reply('💔 Você se divorciou.');
    }
    if (commandName === 'rep') {
        const target = options.getUser('usuario');
        if (target.id === interaction.user.id) return interaction.reply('❌ Não pode dar rep para si mesmo.');
        const cooldown = 86400000;
        if (Date.now() - (user.lastRepTime||0) < cooldown) {
            return interaction.reply({ content: `⏳ Espere **${formatTime(cooldown-(Date.now()-(user.lastRepTime||0)))}**.`, ephemeral: true });
        }
        const td = (await getData(interaction.guild.id, target.id)).user;
        td.reputation = (td.reputation || 0) + 1;
        user.lastRepTime = Date.now();
        user.repSameTargetStreak = user.lastRepTarget === target.id ? (user.repSameTargetStreak||0)+1 : 1;
        user.lastRepTarget = target.id;
        await user.save(); await td.save(); await checkBadges(td, interaction);
        return interaction.reply(`⭐ Você deu reputação para <@${target.id}>!`);
    }
    if (commandName === 'toprep') {
        const top = await User.find({ guildId: interaction.guild.id }).sort({ reputation: -1 }).limit(10);
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('⭐ RANKING DE REPUTAÇÃO').setColor('Purple')
            .setDescription(top.map((u,i) => `**${i+1}.** <@${u.userId}> — **${u.reputation||0} reps**`).join('\n'))
        ]});
    }
    if (commandName === 'setbio') {
        const texto = options.getString('texto');
        if (texto.length > 100) return interaction.reply('❌ Bio muito longa (máx 100 chars).');
        user.bio = texto; await user.save(); await checkBadges(user, interaction);
        return interaction.reply(`✅ Bio atualizada para: "${texto}"`);
    }
    if (commandName === 'setcolor') {
        const hex = options.getString('hex');
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return interaction.reply('❌ Formato HEX inválido. Ex: #FF0000');
        if (!user.inventory?.includes('Cor Personalizada')) return interaction.reply('❌ Compre o item "Cor Personalizada" na `/shop` primeiro.');
        user.profileColor = hex; await user.save();
        return interaction.reply(`✅ Cor do perfil: ${hex}`);
    }
    if (commandName === 'avatar') {
        const target = options.getUser('usuario') || interaction.user;
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`🖼️ AVATAR DE ${target.username}`).setImage(target.displayAvatarURL({ size: 1024 }))] });
    }
    if (commandName === 'resetbadges') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const target = options.getUser('usuario');
        const td = (await getData(interaction.guild.id, target.id)).user;
        if (!td) return interaction.reply('❌ Usuário não encontrado.');
        td.badges = []; await td.save();
        return interaction.reply(`✅ Badges de **${target.tag}** resetadas.`);
    }

    // ═══════════════════════════════════════════════════════════
    // 🎵 MÚSICA
    // ═══════════════════════════════════════════════════════════
    if (commandName === 'play') {
        const query   = options.getString('musica');
        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.reply('❌ Você precisa estar em um canal de voz.');
        await interaction.deferReply();
        try {
            const { track } = await player.play(channel, query, {
                nodeOptions: { metadata: { channel: interaction.channel } }
            });
            return interaction.editReply(`🎵 **${track.title}** adicionado à fila!`);
        } catch (err) {
            console.error('[PLAY ERROR]', err.message);
            return interaction.editReply('❌ Erro ao tocar. Verifique o link ou tente outra música.');
        }
    }
    if (commandName === 'skip') {
        const queue = player.nodes.get(interaction.guild.id);
        if (!queue || !queue.isPlaying()) return interaction.reply('❌ Nenhuma música tocando.');
        queue.node.skip();
        return interaction.reply('⏭️ Música pulada!');
    }
    if (commandName === 'stop') {
        const queue = player.nodes.get(interaction.guild.id);
        if (!queue) return interaction.reply('❌ Nenhuma música tocando.');
        queue.delete();
        return interaction.reply('🛑 Fila limpa!');
    }
    if (commandName === 'queue') {
        const queue = player.nodes.get(interaction.guild.id);
        if (!queue || !queue.isPlaying()) return interaction.reply('❌ Nenhuma música na fila.');
        const tracks = queue.tracks.toArray();
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🎵 FILA DE REPRODUÇÃO')
            .setDescription(tracks.slice(0,10).map((t,i) => `**${i+1}.** ${t.title}`).join('\n') || 'Fila vazia')
            .setFooter({ text: `${tracks.length} músicas` })
        ]});
    }
    if (commandName === 'volume') {
        const nivel = options.getInteger('nivel');
        if (nivel < 0 || nivel > 100) return interaction.reply('❌ Volume 0-100.');
        const queue = player.nodes.get(interaction.guild.id);
        if (!queue) return interaction.reply('❌ Nenhuma música tocando.');
        queue.node.setVolume(nivel);
        return interaction.reply(`🔊 Volume: **${nivel}%**`);
    }

    // ═══════════════════════════════════════════════════════════
    // 🛠️ UTILIDADES & IA
    // ═══════════════════════════════════════════════════════════
    if (commandName === 'imagine') {
        const prompt = options.getString('prompt');
        await interaction.deferReply();
        try {
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
            const r   = await fetch(url, { method: 'HEAD' });
            if (!r.ok) throw new Error('Falha');
            user.imagineCount = (user.imagineCount||0) + 1; await user.save(); await checkBadges(user, interaction);
            return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('🎨 IMAGEM GERADA').setDescription(`Prompt: "${prompt}"`).setImage(url).setFooter({ text: 'Pollinations.AI' })] });
        } catch { return interaction.editReply('❌ Erro ao gerar imagem. Tente outro prompt.'); }
    }
    if (commandName === 'analyze-image') {
        const attachment = options.getAttachment('imagem');
        if (!attachment?.contentType?.startsWith('image/')) return interaction.reply('❌ Envie uma imagem válida.');
        await interaction.deferReply();
        try {
            const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://birutas.ai', 'X-Title': 'Birutas AI' },
                body: JSON.stringify({
                    model: 'google/gemini-flash-1.5:free',
                    messages: [{ role: 'user', content: [{ type: 'text', text: 'Descreva esta imagem em português brasileiro.' }, { type: 'image_url', image_url: { url: attachment.url } }] }]
                })
            });
            const d = await r.json();
            if (!d.choices?.[0]) throw new Error('Resposta inválida');
            user.analyzeCount = (user.analyzeCount||0) + 1; await user.save(); await checkBadges(user, interaction);
            return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('🔍 ANÁLISE DE IMAGEM').setDescription(d.choices[0].message.content).setImage(attachment.url).setFooter({ text: 'Gemini Vision' })] });
        } catch (e) { return interaction.editReply('❌ Erro ao analisar imagem.'); }
    }
    if (commandName === 'resumo') {
        await interaction.deferReply();
        try {
            const msgs    = await interaction.channel.messages.fetch({ limit: 50 });
            const content = msgs.map(m => `${m.author.username}: ${m.content}`).reverse().join('\n');
            const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'google/gemini-flash-1.5:free',
                    messages: [
                        { role: 'system', content: 'Resuma o chat abaixo de forma concisa em português brasileiro.' },
                        { role: 'user', content: content.slice(0, 4000) }
                    ]
                })
            });
            const d = await r.json();
            if (!d.choices) throw new Error('Falha');
            return interaction.editReply(`📝 **RESUMO:**\n\n${d.choices[0].message.content}`);
        } catch { return interaction.editReply('❌ Erro ao gerar resumo.'); }
    }
    if (commandName === 'addia') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const id = options.getString('id'); const nome = options.getString('nome');
        const prompt = options.getString('prompt'); const cor = options.getString('cor') || '#0099ff';
        config.customIAs[nome.toLowerCase()] = { id, name: nome, desc: '(Custom)', color: cor, prompt };
        config.markModified('customIAs'); await config.save();
        return interaction.reply(`✅ IA **${nome}** criada!`);
    }
    if (commandName === 'delia') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const nome = options.getString('nome');
        if (!config.customIAs[nome.toLowerCase()]) return interaction.reply('❌ IA não encontrada.');
        delete config.customIAs[nome.toLowerCase()]; config.markModified('customIAs'); await config.save();
        return interaction.reply(`🗑️ IA **${nome}** removida.`);
    }
    if (commandName === 'reset') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        await Memory.deleteOne({ channelId: interaction.channel.id });
        return interaction.reply('🧠 Memória da IA resetada neste canal.');
    }
    if (commandName === 'qrcode') {
        const texto = options.getString('texto');
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('📱 QR CODE')
            .setImage(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(texto)}`)
            .setFooter({ text: texto.slice(0, 60) })
        ]});
    }
    if (commandName === 'shorten') {
        await interaction.deferReply();
        try {
            const url = options.getString('url');
            const r   = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
            if (!r.ok) throw new Error('Falha');
            const short = await r.text();
            if (short.startsWith('Error')) throw new Error(short);
            return interaction.editReply(`🔗 **URL Encurtada:** ${short}`);
        } catch { return interaction.editReply('❌ Erro ao encurtar URL.'); }
    }
    if (commandName === 'weather') {
        await interaction.deferReply();
        try {
            const apiKey = process.env.WEATHER_API_KEY;
            if (!apiKey) return interaction.editReply('❌ API de clima não configurada (WEATHER_API_KEY).');
            const cidade = options.getString('cidade');
            const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`);
            if (r.status === 404) return interaction.editReply('❌ Cidade não encontrada.');
            const d = await r.json();
            return interaction.editReply({ embeds: [new EmbedBuilder()
                .setTitle(`🌤️ CLIMA EM ${d.name.toUpperCase()}`)
                .setDescription(`**${d.weather[0].description}**`)
                .addFields(
                    { name: '🌡️ Temp',    value: `${d.main.temp}°C`,       inline: true },
                    { name: '💧 Umidade', value: `${d.main.humidity}%`,     inline: true },
                    { name: '💨 Vento',   value: `${d.wind.speed} m/s`,     inline: true }
                )
                .setThumbnail(`https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`)
            ]});
        } catch { return interaction.editReply('❌ Erro ao buscar clima.'); }
    }
    if (commandName === 'crypto') {
        await interaction.deferReply();
        try {
            const moeda = options.getString('moeda').toLowerCase();
            const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${moeda}&vs_currencies=brl,usd`);
            const d = await r.json();
            if (!d[moeda]) return interaction.editReply('❌ Moeda não encontrada. Tente: bitcoin, ethereum...');
            return interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`💰 ${moeda.toUpperCase()}`)
                .addFields(
                    { name: '🇧🇷 BRL', value: `R$ ${d[moeda].brl.toLocaleString('pt-BR')}`, inline: true },
                    { name: '🇺🇸 USD', value: `$ ${d[moeda].usd.toLocaleString()}`,          inline: true }
                )
            ]});
        } catch { return interaction.editReply('❌ Erro ao buscar cotação.'); }
    }
    if (commandName === 'giveaway') {
        if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
        const tempo = options.getString('tempo');
        const vencedores = options.getInteger('vencedores');
        const premio = options.getString('premio');
        const duration = ms(tempo);
        if (!duration) return interaction.reply('❌ Formato inválido. Ex: 10m, 1h, 1d');
        const embed = new EmbedBuilder().setTitle('🎉 SORTEIO!').setColor('Gold')
            .setDescription(`**Prêmio:** ${premio}\n**Vencedores:** ${vencedores}\n**Termina:** <t:${Math.floor((Date.now()+duration)/1000)}:R>`)
            .setFooter({ text: 'Reaja com 🎉 para participar!' });
        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
        await msg.react('🎉');
        const participants = new Set();
        const collector = msg.createReactionCollector({ filter: (r, u) => r.emoji.name === '🎉' && !u.bot, time: duration });
        collector.on('collect', (_, u) => participants.add(u.id));
        collector.on('end', async () => {
            if (participants.size === 0) return interaction.channel.send(`❌ Sorteio de **${premio}** encerrado sem participantes.`);
            const winners = Array.from(participants).sort(() => 0.5 - Math.random()).slice(0, vencedores).map(id => `<@${id}>`).join(', ');
            await interaction.channel.send(`🎉 **PARABÉNS!** ${winners} ganhou(aram) **${premio}**!`);
        });
        return;
    }
    if (commandName === 'tag') {
        const action = options.getString('acao');
        const name   = options.getString('nome');
        if (action === 'create') {
            if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
            const texto = options.getString('texto');
            if (!config.tags) config.tags = {};
            config.tags[name] = texto; config.markModified('tags'); await config.save();
            return interaction.reply(`✅ Tag **${name}** criada.`);
        }
        if (action === 'delete') {
            if (!isAdmin) return interaction.reply({ content: '🚫', ephemeral: true });
            if (!config.tags?.[name]) return interaction.reply('❌ Tag não encontrada.');
            delete config.tags[name]; config.markModified('tags'); await config.save();
            return interaction.reply(`🗑️ Tag **${name}** removida.`);
        }
        if (action === 'list') {
            const tags = config.tags ? Object.keys(config.tags) : [];
            return interaction.reply(`🏷️ **Tags:** ${tags.join(', ') || 'Nenhuma.'}`);
        }
    }
    if (commandName === 'graph') {
        const tipo  = options.getString('tipo');
        const chart = new QuickChart();
        if (tipo === 'coins') {
            const top = await User.find({ guildId: interaction.guild.id }).sort({ coins: -1 }).limit(5);
            chart.setConfig({ type: 'bar', data: { labels: top.map(u => u.userId.slice(0,5)), datasets: [{ label: 'Coins', data: top.map(u => u.coins), backgroundColor: '#4285F4' }] } });
        } else {
            chart.setConfig({ type: 'line', data: { labels: ['Seg','Ter','Qua','Qui','Sex','Sab','Dom'], datasets: [{ label: 'Msgs', data: [12,19,3,5,2,3,10], borderColor: '#0099ff' }] } });
        }
        return interaction.reply({ files: [{ attachment: chart.getUrl(), name: 'chart.png' }] });
    }
    if (commandName === 'status') {
        const up = process.uptime();
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🤖 STATUS').setColor('Green')
            .addFields(
                { name: '📡 Ping',      value: `${interaction.client.ws.ping}ms`,                     inline: true },
                { name: '⏱️ Uptime',    value: `${Math.floor(up/3600)}h ${Math.floor((up%3600)/60)}m`, inline: true },
                { name: '🧠 RAM',       value: `${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`, inline: true },
                { name: '🌐 Servidores', value: `${interaction.client.guilds.cache.size}`,              inline: true }
            ).setTimestamp()
        ]});
    }

    // 📧 EMAIL
    if (commandName === 'email') {
        return handleEmail(interaction);
    }

    // Tags customizadas
    if (config.tags?.[commandName]) {
        return interaction.reply(config.tags[commandName]);
    }

    await checkBadges(user, interaction);
}
