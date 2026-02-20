// ═══════════════════════════════════════════════════════════════
// 🛠️ HELPERS — getData, checkBadges, generateProfile, updateAIRole
// ═══════════════════════════════════════════════════════════════
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import { Config, User, Memory } from './models.js';
import { ALL_BADGES, DEFAULT_IAS } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Ícones compartilhados
export const icons = {};

export async function loadIcons() {
    try {
        const { loadImage } = await import('canvas');
        icons.coin = await loadImage(path.join(__dirname, '..', 'emojis', 'coin.png'));
        icons.star = await loadImage(path.join(__dirname, '..', 'emojis', 'star.png'));
        icons.ring = await loadImage(path.join(__dirname, '..', 'emojis', 'ring.png'));
        console.log('✅ Ícones carregados com sucesso.');
    } catch (e) {
        console.log('⚠️ Ícones não encontrados:', e.message);
    }
}

// ─── XP ───────────────────────────────────────────────────────
export const xpForLevel = (l) => Math.floor(100 * Math.pow(l, 1.5));

// ─── FORMAT TIME ──────────────────────────────────────────────
export function formatTime(ms) {
    const s = Math.floor((ms / 1000) % 60);
    const m = Math.floor((ms / 60000) % 60);
    const h = Math.floor((ms / 3600000) % 24);
    const d = Math.floor(ms / 86400000);
    let r = '';
    if (d > 0) r += `${d}d `;
    if (h > 0) r += `${h}h `;
    if (m > 0) r += `${m}m `;
    if (s > 0) r += `${s}s`;
    return r.trim() || '0s';
}

// ─── GET DATA ─────────────────────────────────────────────────
export async function getData(guildId, userId = null) {
    try {
        let config = await Config.findOneAndUpdate(
            { guildId },
            { $setOnInsert: { guildId } },
            { upsert: true, new: true }
        );
        // DEFAULT_IAS sempre prevalece sobre entradas antigas do banco
        const dbCustomOnly = Object.fromEntries(
            Object.entries(config.customIAs || {}).filter(([k]) => !DEFAULT_IAS[k])
        );
        config.customIAs = { ...DEFAULT_IAS, ...dbCustomOnly };
        let user = null;
        if (userId) {
            user = await User.findOneAndUpdate(
                { guildId, userId },
                { $setOnInsert: { guildId, userId } },
                { upsert: true, new: true }
            );
        }
        return { config, user };
    } catch (error) {
        console.error('[getData] Erro:', error.message);
        return { config: null, user: null };
    }
}

// ─── CHECK BADGES ─────────────────────────────────────────────
export async function checkBadges(user, interaction, message = null) {
    if (!user) return;
    const earned = [];
    const award = (id) => {
        if (ALL_BADGES[id] && !user.badges.includes(id)) {
            user.badges.push(id);
            earned.push(ALL_BADGES[id]);
        }
    };
    // Riqueza
    if (user.coins >= 100000)    award('magnata');
    if (user.coins >= 1000000)   award('imperador');
    if (user.coins >= 5000000)   award('diamante');
    if (user.coins >= 50000000)  award('tita');
    if (user.coins >= 1000000000) award('deus');
    if (user.totalDonated >= 100000) award('filantropo');
    if (user.inventory?.includes('Cubo Cósmico')) award('cubo');
    // Nível / atividade
    if (user.level >= 5)  award('aprendiz');
    if (user.level >= 20) award('veterano');
    if (user.level >= 50) award('lenda');
    if (user.voiceMinutes >= 600) award('podcaster');
    if (user.iaMessages >= 500)   award('bestfriend');
    if (user.reputation >= 50)    award('famosinho');
    if (user.imagineCount >= 50)  award('visionario');
    if (user.analyzeCount >= 20)  award('influencer');
    // Cassino
    if (user.gambleLossStreak >= 5)  award('azar');
    if (user.gambleWinStreak >= 10)  award('oraculo');
    if (user.slotsJackpots >= 1)     award('sorte');
    // Segredos
    const hour = new Date().getHours();
    if (hour === 4) award('coruja');
    if (user.bio === 'There is no spoon.') award('despertado');
    if (/^[01\s]+$/.test(user.bio) && user.bio.length > 10) award('cripto');
    if (user.robotBehaviorCount >= 20) award('infiltracao');
    if (user.vStreak >= 7) award('mascara');
    if (message?.content?.toLowerCase().includes('vi veri veniversum vivus vici')) award('v_vinganca');
    if (message?.content?.toLowerCase().includes('novus ordo seclorum') ||
        message?.content?.toLowerCase().includes('annuit coeptis')) award('illuminati');
    if (user.wasBankrupt && user.coins >= 10000 && (Date.now() - user.bankruptTimestamp <= 86400000)) award('quarto5');
    if (user.repSameTargetStreak >= 5) award('rosa');
    if (user.donationChain?.length >= 5) award('domino');

    if (earned.length > 0) {
        await User.updateOne({ _id: user._id }, { badges: user.badges });
        const embed = new EmbedBuilder()
            .setTitle('🏆 NOVA CONQUISTA DESBLOQUEADA!')
            .setColor('#FFD700')
            .setDescription(earned.map(b => `### ${b.emoji} **${b.name}**\n> *${b.desc}*`).join('\n\n'))
            .setFooter({ text: 'Birutas AI Ultimate - Sistema de Conquistas' })
            .setTimestamp();
        try {
            if (interaction && !interaction.replied && !interaction.deferred) {
                await interaction.followUp({ embeds: [embed] }).catch(() => {});
            } else if (message) {
                await message.channel.send({ content: `🎊 <@${user.userId}>`, embeds: [embed] }).catch(() => {});
            }
        } catch (e) { /* silencioso */ }
    }
}

// ─── UPDATE AI ROLE ───────────────────────────────────────────
export async function updateAIRole(guild, member, iaName, iaColor, allIAs) {
    if (!guild?.members?.me?.permissions?.has(PermissionFlagsBits.ManageRoles)) return;
    try {
        let role = guild.roles.cache.find(r => r.name === iaName);
        if (!role) {
            role = await guild.roles.create({
                name: iaName,
                colors: [iaColor],
                permissions: [],
                reason: `Criação automática: ${iaName}`
            });
            const botRole = guild.members.me.roles.highest;
            await role.setPosition(botRole.position > 0 ? botRole.position - 1 : 0).catch(() => {});
        } else if (role.hexColor !== iaColor.toLowerCase()) {
            await role.edit({ colors: [iaColor] }).catch(() => {});
        }
        const allIaNames = Object.values(allIAs).map(i => i.name);
        const toRemove = member.roles.cache.filter(r => allIaNames.includes(r.name) && r.id !== role.id);
        if (toRemove.size > 0) await member.roles.remove(toRemove).catch(() => {});
        if (!member.roles.cache.has(role.id)) await member.roles.add(role).catch(() => {});
        if (guild.members.me.permissions.has(PermissionFlagsBits.ChangeNickname)) {
            const nick = `Birutas | ${iaName}`;
            if (member.nickname !== nick) await member.setNickname(nick).catch(() => {});
        }
    } catch (e) {
        console.error(`[Cargos] Erro: ${e.message}`);
    }
}

// ─── GENERATE PROFILE CANVAS ──────────────────────────────────
export async function generateProfile(target, td) {
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');

    // Background gradiente (sem dependência de URL externa)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0,   '#0f0c29');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1,   '#24243e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Linha decorativa superior na cor do perfil
    ctx.fillStyle = td.profileColor || '#0099ff';
    ctx.fillRect(0, 0, canvas.width, 5);

    // Painel semi-transparente
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.roundRect(20, 20, 220, canvas.height - 40, 16);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.roundRect(260, 20, canvas.width - 280, canvas.height - 40, 16);
    ctx.fill();

    // Avatar circular
    try {
        const avatar = await loadImage(target.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(130, 145, 85, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 45, 60, 170, 170);
        ctx.restore();
        // Borda do avatar
        ctx.beginPath();
        ctx.arc(130, 145, 87, 0, Math.PI * 2);
        ctx.strokeStyle = td.profileColor || '#0099ff';
        ctx.lineWidth = 4;
        ctx.stroke();
    } catch (e) { /* avatar falhou */ }

    // Nome
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "DejaVu Sans"';
    ctx.fillText(target.username.slice(0, 18), 275, 75);

    // VIP badge
    if (td.vipUntil > Date.now()) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px "DejaVu Sans"';
        ctx.fillText('[★ VIP]', 275, 100);
    }

    // Bio
    ctx.font = 'italic 17px "DejaVu Sans"';
    ctx.fillStyle = '#aaaaaa';
    const bio = (td.bio || '').slice(0, 55);
    ctx.fillText(`"${bio}"`, 275, 130);

    // Linha separadora
    ctx.strokeStyle = td.profileColor || '#0099ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(275, 145);
    ctx.lineTo(760, 145);
    ctx.stroke();

    // Stats (lado direito)
    ctx.font = 'bold 18px "DejaVu Sans"';
    ctx.fillStyle = '#ffffff';
    const statsY = 175;
    const statsData = [
        ['Nivel',     `${td.level}`,                    275, statsY],
        ['XP',        `${td.xp} / ${xpForLevel(td.level + 1)}`, 275, statsY + 30],
        ['Coins',     td.coins.toLocaleString('pt-BR'), 275, statsY + 60],
        ['Reputacao', `${td.reputation}`,               520, statsY],
        ['Casado',    td.marriedTo ? 'Sim' : 'Nao',     520, statsY + 30],
        ['Mensagens', `${td.messages || 0}`,            520, statsY + 60],
    ];
    for (const [label, value, x, y] of statsData) {
        ctx.fillStyle = '#888888';
        ctx.font = '14px "DejaVu Sans"';
        ctx.fillText(label.toUpperCase(), x, y - 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "DejaVu Sans"';
        ctx.fillText(value, x, y + 16);
    }

    // Conquistas
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "DejaVu Sans"';
    ctx.fillText('CONQUISTAS:', 275, 310);
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(275, 318);
    ctx.lineTo(760, 318);
    ctx.stroke();

    const validBadges = (td.badges || []).filter(id => ALL_BADGES[id]);
    if (validBadges.length === 0) {
        ctx.font = 'italic 15px "DejaVu Sans"';
        ctx.fillStyle = '#555555';
        ctx.fillText('Nenhuma conquista ainda.', 275, 345);
    } else {
        let bx = 275, by = 345;
        validBadges.slice(0, 6).forEach((id, i) => {
            const badge = ALL_BADGES[id];
            ctx.font = '15px "DejaVu Sans"';
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`[+] ${badge.name}`, bx, by);
            by += 22;
            if (i === 2) { bx = 520; by = 345; }
        });
    }

    // Info no painel esquerdo (inferior)
    ctx.font = '14px "DejaVu Sans"';
    ctx.fillStyle = '#888888';
    ctx.fillText('Voz', 45, 270);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "DejaVu Sans"';
    ctx.fillText(`${td.voiceMinutes || 0} min`, 45, 290);

    ctx.font = '14px "DejaVu Sans"';
    ctx.fillStyle = '#888888';
    ctx.fillText('Msgs IA', 45, 320);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "DejaVu Sans"';
    ctx.fillText(`${td.iaMessages || 0}`, 45, 340);

    // Footer
    ctx.font = '12px "DejaVu Sans"';
    ctx.fillStyle = '#555555';
    ctx.fillText('Birutas AI Ultimate', canvas.width - 155, canvas.height - 15);

    return canvas.toBuffer();
}
