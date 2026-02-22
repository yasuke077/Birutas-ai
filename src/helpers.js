// ═══════════════════════════════════════════════════════════════
// 🛠️ HELPERS — getData, XP, checkBadges (47), canvas, updateAIRole
// ═══════════════════════════════════════════════════════════════
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import { Config, User, Memory } from './models.js';
import { ALL_BADGES, DEFAULT_IAS } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const icons = {};
export async function loadIcons() {
    try {
        icons.coin = await loadImage(path.join(__dirname, '..', 'emojis', 'coin.png'));
        icons.star = await loadImage(path.join(__dirname, '..', 'emojis', 'star.png'));
        icons.ring = await loadImage(path.join(__dirname, '..', 'emojis', 'ring.png'));
        console.log('✅ Ícones carregados.');
    } catch (e) {
        console.log('⚠️ Ícones não encontrados:', e.message);
    }
}

// ─── XP PROFISSIONAL (estilo Arcane/Loritta) ─────────────────
// Requer muito mais XP em níveis altos, igual bots famosos
export const xpForLevel = (l) => Math.floor(5 * Math.pow(l, 2) + 50 * l + 100);

// XP POR MENSAGEM: cooldown de 60s entre ganhos (evita spam)
// Ganho: entre 15 e 40 XP por mensagem
export const XP_COOLDOWN_MS = 60000; // 1 minuto
export const XP_MIN = 15;
export const XP_MAX = 40;

// ─── FORMAT TIME ─────────────────────────────────────────────
export function formatTime(ms) {
    const s = Math.floor((ms / 1000) % 60);
    const m = Math.floor((ms / 60000) % 60);
    const h = Math.floor((ms / 3600000) % 24);
    const d = Math.floor(ms / 86400000);
    let r = '';
    if (d) r += `${d}d `;
    if (h) r += `${h}h `;
    if (m) r += `${m}m `;
    if (s) r += `${s}s`;
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
        // DEFAULT_IAS sempre prevalece, customIAs apenas adiciona novas
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
    } catch (e) {
        console.error('[getData]', e.message);
        return { config: null, user: null };
    }
}

// ─── CHECK BADGES (47 COMPLETAS, SEM DUPLICATAS) ──────────────
export async function checkBadges(user, interactionOrChannel, message = null) {
    if (!user) return;
    const newBadges = [];
    const award = (id) => {
        if (!ALL_BADGES[id]) return;
        if (!user.badges.includes(id)) {
            user.badges.push(id);
            newBadges.push(ALL_BADGES[id]);
        }
    };

    // ECONOMIA
    if (user.coins >= 100000)      award('magnata');
    if (user.coins >= 1000000)     award('imperador');
    if (user.coins >= 5000000)     award('diamante');
    if (user.coins >= 50000000)    award('tita');
    if (user.coins >= 1000000000)  award('deus');
    if (user.totalDonated >= 100000) award('filantropo');
    if (user.inventory?.includes('Cubo Cósmico')) award('cubo');

    // NÍVEL E ATIVIDADE
    if (user.level >= 5)   award('aprendiz');
    if (user.level >= 20)  award('veterano');
    if (user.level >= 50)  award('lenda');
    if (user.voiceMinutes >= 600) award('podcaster');
    if (user.iaMessages >= 500)   award('bestfriend');
    if (user.reputation >= 50)    award('famosinho');
    if (user.imagineCount >= 50)  award('visionario');
    if (user.analyzeCount >= 20)  award('influencer');

    // HABILIDADES
    if (user.gambleWinStreak >= 10) award('oraculo');
    if (user.robSuccess >= 50)      award('agente007');

    // SOCIAL
    if (user.marriedTo && user.marryDate && (Date.now() - user.marryDate >= 7 * 86400000)) award('alianca');

    // CASSINO SECRETAS
    if (user.gambleLossStreak >= 5) award('azar');
    if (user.slotsJackpots >= 1)    award('sorte');

    // RIQUEZA SECRETAS
    if (user.richDaysStreak >= 7)   award('ilha');

    // COMPORTAMENTO SECRETO
    const hour = new Date().getHours();
    if (hour === 4)  award('coruja');
    if (hour >= 0 && hour < 5 && message?.content?.toLowerCase().includes('alien')) {
        user.nightActivityCount = (user.nightActivityCount || 0) + 1;
        if (user.nightActivityCount >= 3) award('abduzido');
    }

    if (user.bio === 'There is no spoon.') award('despertado');
    if (/^[01\s]+$/.test(user.bio) && user.bio.length > 10) award('cripto');
    if (user.robotBehaviorCount >= 20) award('infiltracao');
    if (user.vStreak >= 7) award('mascara');

    if (message) {
        const lc = message.content.toLowerCase();
        if (lc.includes('vi veri veniversum vivus vici')) award('v_vinganca');
        if (lc.includes('novus ordo seclorum') || lc.includes('annuit coeptis')) award('illuminati');
    }

    if (user.wasBankrupt && user.coins >= 10000 && Date.now() - user.bankruptTimestamp <= 86400000) award('quarto5');
    if (user.repSameTargetStreak >= 5) award('rosa');
    if (user.donationChain?.length >= 5) award('domino');

    if (newBadges.length > 0) {
        // DEDUPLICA antes de salvar
        user.badges = [...new Set(user.badges)];
        await User.updateOne({ _id: user._id }, { badges: user.badges });

        const embed = new EmbedBuilder()
            .setTitle('🏆 NOVA CONQUISTA DESBLOQUEADA!')
            .setColor('#FFD700')
            .setDescription(newBadges.map(b => `${b.emoji} **${b.name}**\n> *${b.desc}*`).join('\n\n'))
            .setFooter({ text: 'Birutas AI Ultimate • Sistema de Conquistas' })
            .setTimestamp();

        try {
            if (interactionOrChannel && typeof interactionOrChannel.followUp === 'function') {
                if (!interactionOrChannel.replied && !interactionOrChannel.deferred) {
                    await interactionOrChannel.followUp({ embeds: [embed] }).catch(() => {});
                }
            } else if (message) {
                await message.channel.send({ content: `🎊 <@${user.userId}>`, embeds: [embed] }).catch(() => {});
            }
        } catch { /* silencioso */ }
    }
}

// ─── UPDATE AI ROLE ───────────────────────────────────────────
export async function updateAIRole(guild, member, iaName, iaColor, allIAs) {
    if (!guild?.members?.me?.permissions?.has(PermissionFlagsBits.ManageRoles)) return;
    try {
        let role = guild.roles.cache.find(r => r.name === iaName);
        if (!role) {
            role = await guild.roles.create({ name: iaName, color: iaColor, permissions: [] });
            const botPos = guild.members.me.roles.highest.position;
            await role.setPosition(Math.max(botPos - 1, 0)).catch(() => {});
        } else if (role.hexColor !== iaColor.toLowerCase()) {
            await role.edit({ color: iaColor }).catch(() => {});
        }
        const allNames = Object.values(allIAs).map(i => i.name);
        const toRemove = member.roles.cache.filter(r => allNames.includes(r.name) && r.id !== role.id);
        if (toRemove.size > 0) await member.roles.remove(toRemove).catch(() => {});
        if (!member.roles.cache.has(role.id)) await member.roles.add(role).catch(() => {});
        if (guild.members.me.permissions.has(PermissionFlagsBits.ChangeNickname)) {
            const nick = `Birutas | ${iaName}`;
            if (member.nickname !== nick) await member.setNickname(nick).catch(() => {});
        }
    } catch (e) { console.error('[Cargos]', e.message); }
}

// ─── DESENHAR RETÂNGULO ARREDONDADO (compatível Linux) ────────
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ─── GENERATE PROFILE CANVAS (profissional, estilo Arcane) ────
export async function generateProfile(target, td) {
    const W = 900, H = 500;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    const color = td.profileColor || '#0099ff';

    // ── 1. BACKGROUND ────────────────────────────────────────
    if (td.bannerUrl) {
        try {
            const bg = await loadImage(td.bannerUrl);
            ctx.drawImage(bg, 0, 0, W, H);
            // overlay escuro para legibilidade
            ctx.fillStyle = 'rgba(0,0,0,0.60)';
            ctx.fillRect(0, 0, W, H);
        } catch {
            drawDefaultBg(ctx, W, H, color);
        }
    } else {
        drawDefaultBg(ctx, W, H, color);
    }

    // ── 2. LINHA SUPERIOR NA COR DO PERFIL ───────────────────
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, 6);

    // ── 3. PAINEL LATERAL ESQUERDO ───────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, 20, 20, 230, H - 40, 16);
    ctx.fill();

    // ── 4. PAINEL PRINCIPAL DIREITO ───────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, 270, 20, W - 290, H - 40, 16);
    ctx.fill();

    // ── 5. AVATAR CIRCULAR ────────────────────────────────────
    try {
        const avatar = await loadImage(target.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(135, 160, 90, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 45, 70, 180, 180);
        ctx.restore();
        // Borda
        ctx.beginPath();
        ctx.arc(135, 160, 93, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.stroke();
    } catch { /* avatar falhou */ }

    // VIP badge
    if (td.vipUntil > Date.now()) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 13px "DejaVu Sans"';
        ctx.textAlign = 'center';
        ctx.fillText('✦ VIP ✦', 135, 272);
    }

    // Username no painel esquerdo
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "DejaVu Sans"';
    ctx.fillText(target.username.slice(0, 18), 135, 300);

    // Stats abaixo do avatar
    const statItems = [
        ['💬', `${(td.messages || 0).toLocaleString('pt-BR')} msgs`],
        ['🎙️', `${td.voiceMinutes || 0} min voz`],
        ['🤖', `${td.iaMessages || 0} IA msgs`],
        ['⭐', `${td.reputation || 0} rep`],
    ];
    ctx.font = '13px "DejaVu Sans"';
    ctx.textAlign = 'left';
    statItems.forEach(([icon, txt], i) => {
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`${icon} ${txt}`, 30, 330 + i * 22);
    });

    // ── 6. CONTEÚDO PAINEL DIREITO ────────────────────────────
    ctx.textAlign = 'left';

    // Username grande
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px "DejaVu Sans"';
    ctx.fillText(target.username.slice(0, 16), 290, 80);

    // Bio
    ctx.font = 'italic 16px "DejaVu Sans"';
    ctx.fillStyle = '#bbbbbb';
    ctx.fillText(`"${(td.bio || '').slice(0, 55)}"`, 290, 110);

    // Linha separadora
    ctx.strokeStyle = color + '88';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(290, 125);
    ctx.lineTo(W - 30, 125);
    ctx.stroke();

    // Nível e XP
    ctx.fillStyle = color;
    ctx.font = 'bold 28px "DejaVu Sans"';
    ctx.fillText(`Nível ${td.level}`, 290, 165);

    // Barra de XP
    const curXP  = td.xp || 0;
    const nextXP = xpForLevel(td.level + 1);
    const pct    = Math.min(curXP / nextXP, 1);
    const barX = 290, barY = 178, barW = W - 320, barH = 18;

    ctx.fillStyle = '#333333';
    roundRect(ctx, barX, barY, barW, barH, 9);
    ctx.fill();

    ctx.fillStyle = color;
    roundRect(ctx, barX, barY, Math.max(barW * pct, barH), barH, 9);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "DejaVu Sans"';
    ctx.textAlign = 'center';
    ctx.fillText(`${curXP.toLocaleString('pt-BR')} / ${nextXP.toLocaleString('pt-BR')} XP`, barX + barW / 2, barY + 13);
    ctx.textAlign = 'left';

    // Coins e casamento
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "DejaVu Sans"';
    ctx.fillText(`💰 ${td.coins.toLocaleString('pt-BR')} coins`, 290, 225);
    ctx.fillText(`💍 ${td.marriedTo ? `Casado(a)` : 'Solteiro(a)'}`, 560, 225);

    // Linha
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(290, 240);
    ctx.lineTo(W - 30, 240);
    ctx.stroke();

    // Título badges
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "DejaVu Sans"';
    ctx.fillText('CONQUISTAS', 290, 268);

    const validBadges = [...new Set(td.badges || [])].filter(id => ALL_BADGES[id]);
    if (validBadges.length === 0) {
        ctx.font = 'italic 14px "DejaVu Sans"';
        ctx.fillStyle = '#666666';
        ctx.fillText('Nenhuma conquista ainda.', 290, 300);
    } else {
        // Badge cards - sem emoji Unicode (Linux canvas nao suporta), usa tag colorida
        const show = validBadges.slice(0, 8);
        show.forEach((id, i) => {
            const b = ALL_BADGES[id];
            const col = i % 2;
            const row = Math.floor(i / 2);
            const bx = 290 + col * 300;
            const by = 295 + row * 46;
            // fundo do card
            ctx.fillStyle = 'rgba(255,255,255,0.07)';
            roundRect(ctx, bx, by, 280, 38, 8);
            ctx.fill();
            // tag colorida no lugar do emoji (compativel com Linux canvas)
            const tagColors = ['#FFD700','#FF6B6B','#00C853','#4285F4','#FF6A00','#9C27B0','#00BCD4','#FF5722'];
            ctx.fillStyle = tagColors[i % tagColors.length];
            roundRect(ctx, bx + 6, by + 8, 22, 22, 4);
            ctx.fill();
            // inicial da badge dentro da tag
            ctx.font = 'bold 11px "DejaVu Sans"';
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.fillText(b.name.slice(0, 1).toUpperCase(), bx + 17, by + 23);
            ctx.textAlign = 'left';
            // nome da badge
            ctx.font = 'bold 13px "DejaVu Sans"';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(b.name.slice(0, 22), bx + 35, by + 23);
            // se secreta, ponto dourado
            if (b.secret) {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(bx + 268, by + 19, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        if (validBadges.length > 8) {
            ctx.font = '12px "DejaVu Sans"';
            ctx.fillStyle = '#888888';
            ctx.fillText(`+${validBadges.length - 8} conquistas...`, 290, H - 35);
        }
    }

    // Footer
    ctx.font = '11px "DejaVu Sans"';
    ctx.fillStyle = '#444444';
    ctx.textAlign = 'right';
    ctx.fillText('Birutas AI Ultimate', W - 25, H - 12);

    return canvas.toBuffer();
}

function drawDefaultBg(ctx, W, H, color) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0f0c29');
    g.addColorStop(0.5, '#302b63');
    g.addColorStop(1, '#24243e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // padrão sutil
    ctx.fillStyle = color + '11';
    for (let i = 0; i < W; i += 40) {
        ctx.fillRect(i, 0, 1, H);
    }
}
