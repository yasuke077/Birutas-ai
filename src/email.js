// ═══════════════════════════════════════════════════════════════
// 📧 EMAIL TEMPORÁRIO — mail.tm (prático, botões ActionRow)
// Uso: /email → aparece painel completo com botões
// ═══════════════════════════════════════════════════════════════
import {
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder
} from 'discord.js';
import { TempEmail } from './models.js';

const BASE = 'https://api.mail.tm';

// ─── API helpers ─────────────────────────────────────────────
async function apiGet(path, token) {
    const r = await fetch(`${BASE}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return r.json();
}
async function apiPost(path, body, token) {
    const r = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
    });
    return r.json();
}
async function apiDelete(path, token) {
    await fetch(`${BASE}${path}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
}

async function getDomains() {
    const d = await apiGet('/domains?page=1');
    return d['hydra:member'] || [];
}
async function getToken(address, password) {
    return apiPost('/token', { address, password });
}
async function ensureToken(record) {
    try {
        const t = await getToken(record.address, record.password);
        if (t.token) {
            await TempEmail.updateOne({ _id: record._id }, { token: t.token });
            record.token = t.token;
            return t.token;
        }
    } catch { }
    return record.token;
}

function randPassword() {
    return Math.random().toString(36).slice(2, 9) + Math.random().toString(36).slice(2, 9).toUpperCase() + '!';
}

// ─── PAINEL PRINCIPAL (mensagem com botões) ───────────────────
function buildEmailPanel(record, messages = null) {
    const embed = new EmbedBuilder()
        .setColor('#00C853')
        .setTitle('📧 Seu E-mail Temporário')
        .addFields({ name: '📬 Endereço', value: `\`${record.address}\`` })
        .setFooter({ text: 'E-mail • Birutas AI • Expira em 24h' })
        .setTimestamp();

    if (messages !== null) {
        if (messages.length === 0) {
            embed.addFields({ name: '📭 Inbox', value: '_Nenhuma mensagem ainda. Aguarde..._' });
        } else {
            const list = messages.slice(0, 6).map((m, i) => {
                const seen = m.seen ? '✉️' : '📩';
                const from = m.from?.address || '?';
                const subj = (m.subject || '(sem assunto)').slice(0, 35);
                return `${seen} **${i + 1}.** ${subj}\n> De: \`${from}\` • ID: \`${m.id.slice(0, 8)}\``;
            }).join('\n\n');
            embed.addFields({ name: `📥 Inbox (${messages.length})`, value: list });
        }
    }

    // Row 1: ações do inbox
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('email_refresh').setLabel('🔄 Atualizar').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('email_copy').setLabel('📋 Copiar E-mail').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('email_new').setLabel('🔄 Novo Endereço').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('email_delete').setLabel('🗑️ Apagar').setStyle(ButtonStyle.Danger),
    );
    // Row 2: ler mensagem por número (1-6)
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('email_read_1').setLabel('1').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('email_read_2').setLabel('2').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('email_read_3').setLabel('3').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('email_read_4').setLabel('4').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('email_read_5').setLabel('5').setStyle(ButtonStyle.Success),
    );

    return { embeds: [embed], components: [row1, row2] };
}

// ─── CRIAR OU ABRIR PAINEL ────────────────────────────────────
export async function handleEmailCommand(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const userId = interaction.user.id;
    let record = await TempEmail.findOne({ userId });

    if (!record) {
        // Não tem e-mail → cria com nome aleatório mas oferece opção de custom
        const domains = await getDomains().catch(() => []);
        if (!domains.length) return interaction.editReply('❌ Serviço indisponível no momento. Tente novamente.');

        const domain   = domains[0].domain;
        const user     = `user${Math.random().toString(36).slice(2, 8)}`;
        const address  = `${user}@${domain}`;
        const password = randPassword();
        const account  = await apiPost('/accounts', { address, password });
        if (!account.id) return interaction.editReply('❌ Falha ao criar conta. Tente novamente em instantes.');

        const tokenRes = await getToken(address, password);
        record = await TempEmail.create({ userId, accountId: account.id, address, password, token: tokenRes.token || null });
    }

    const token = await ensureToken(record);
    let messages = [];
    if (token) {
        const inbox = await apiGet('/messages?page=1', token).catch(() => ({}));
        messages = inbox['hydra:member'] || [];
    }

    const panel = buildEmailPanel(record, messages);
    // Adiciona botão "Nome Custom" apenas na criação
    panel.components[0].addComponents(
        new ButtonBuilder().setCustomId('email_custom_name').setLabel('✏️ Nome Custom').setStyle(ButtonStyle.Secondary)
    );

    return interaction.editReply(panel);
}

// ─── HANDLER DE BOTÕES ────────────────────────────────────────
export async function handleEmailButton(interaction) {
    const userId = interaction.user.id;
    const id     = interaction.customId;

    // ── Copiar e-mail ─────────────────────────────────────────
    if (id === 'email_copy') {
        await interaction.deferUpdate();
        const record = await TempEmail.findOne({ userId });
        if (!record) return;
        return interaction.followUp({
            content: `📋 Seu e-mail:\n\`\`\`\n${record.address}\n\`\`\`\nSelecione o texto acima para copiar.`,
            ephemeral: true
        });
    }

    // ── Atualizar inbox ───────────────────────────────────────
    if (id === 'email_refresh') {
        await interaction.deferUpdate();
        const record = await TempEmail.findOne({ userId });
        if (!record) return interaction.followUp({ content: '❌ Nenhum e-mail ativo.', ephemeral: true });
        const token = await ensureToken(record);
        const inbox = token ? await apiGet('/messages?page=1', token).catch(() => ({})) : {};
        const msgs  = inbox['hydra:member'] || [];
        return interaction.editReply(buildEmailPanel(record, msgs));
    }

    // ── Ler mensagem N ────────────────────────────────────────
    if (id.startsWith('email_read_')) {
        await interaction.deferReply({ ephemeral: true });
        const n = parseInt(id.replace('email_read_', ''));
        const record = await TempEmail.findOne({ userId });
        if (!record) return interaction.editReply('❌ Nenhum e-mail ativo.');
        const token  = await ensureToken(record);
        if (!token)  return interaction.editReply('❌ Falha ao autenticar.');
        const inbox  = await apiGet('/messages?page=1', token).catch(() => ({}));
        const msgs   = inbox['hydra:member'] || [];
        const msg    = msgs[n - 1];
        if (!msg) return interaction.editReply(`❌ Mensagem ${n} não existe. Use 🔄 para atualizar.`);

        const full  = await apiGet(`/messages/${msg.id}`, token).catch(() => ({}));
        const body  = (full.text || full.html?.replace(/<[^>]+>/g, '') || '(sem conteúdo)').slice(0, 1800);
        const from  = msg.from?.address || '?';
        const subj  = (msg.subject || '(sem assunto)').slice(0, 80);
        const date  = new Date(msg.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        const embed = new EmbedBuilder()
            .setColor('#4285F4')
            .setTitle(`📨 ${subj}`)
            .addFields(
                { name: '👤 De',   value: `\`${from}\``, inline: true },
                { name: '📅 Data', value: date,          inline: true },
                { name: '📝 Conteúdo', value: `\`\`\`\n${body}\n\`\`\`` }
            )
            .setFooter({ text: `ID: ${msg.id}` });

        // Botão copiar conteúdo
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`email_copy_body_${msg.id}`)
                .setLabel('📋 Copiar Conteúdo')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`email_del_msg_${msg.id}`)
                .setLabel('🗑️ Apagar Mensagem')
                .setStyle(ButtonStyle.Danger)
        );
        return interaction.editReply({ embeds: [embed], components: [row] });
    }

    // ── Copiar corpo ──────────────────────────────────────────
    if (id.startsWith('email_copy_body_')) {
        await interaction.deferReply({ ephemeral: true });
        const msgId  = id.replace('email_copy_body_', '');
        const record = await TempEmail.findOne({ userId });
        if (!record) return interaction.editReply('❌');
        const token  = await ensureToken(record);
        const full   = await apiGet(`/messages/${msgId}`, token).catch(() => ({}));
        const body   = (full.text || full.html?.replace(/<[^>]+>/g, '') || '(vazio)').slice(0, 1900);
        return interaction.editReply({ content: `\`\`\`\n${body}\n\`\`\`` });
    }

    // ── Apagar mensagem específica ────────────────────────────
    if (id.startsWith('email_del_msg_')) {
        await interaction.deferUpdate();
        const msgId  = id.replace('email_del_msg_', '');
        const record = await TempEmail.findOne({ userId });
        if (!record) return;
        const token  = await ensureToken(record);
        if (token) await apiDelete(`/messages/${msgId}`, token).catch(() => {});
        return interaction.followUp({ content: '🗑️ Mensagem apagada.', ephemeral: true });
    }

    // ── Novo endereço ─────────────────────────────────────────
    if (id === 'email_new') {
        await interaction.deferUpdate();
        const record = await TempEmail.findOne({ userId });
        if (record?.token) await apiDelete(`/accounts/${record.accountId}`, record.token).catch(() => {});
        if (record) await TempEmail.deleteOne({ userId });

        const domains = await getDomains().catch(() => []);
        if (!domains.length) return interaction.followUp({ content: '❌ Serviço indisponível.', ephemeral: true });

        const domain   = domains[Math.floor(Math.random() * domains.length)].domain;
        const user     = `user${Math.random().toString(36).slice(2, 8)}`;
        const address  = `${user}@${domain}`;
        const password = randPassword();
        const account  = await apiPost('/accounts', { address, password });
        if (!account.id) return interaction.followUp({ content: '❌ Falha ao criar.', ephemeral: true });
        const tokenRes = await getToken(address, password);
        const newRec   = await TempEmail.create({ userId, accountId: account.id, address, password, token: tokenRes.token || null });

        return interaction.editReply(buildEmailPanel(newRec, []));
    }

    // ── Nome customizado (modal) ──────────────────────────────
    if (id === 'email_custom_name') {
        const modal = new ModalBuilder()
            .setCustomId('email_name_modal')
            .setTitle('Escolher nome do e-mail');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('email_name_input')
                    .setLabel('Nome de usuário (antes do @)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: meubot2024')
                    .setMinLength(3)
                    .setMaxLength(20)
                    .setRequired(true)
            )
        );
        return interaction.showModal(modal);
    }

    // ── Apagar e-mail ─────────────────────────────────────────
    if (id === 'email_delete') {
        await interaction.deferUpdate();
        const record = await TempEmail.findOne({ userId });
        if (!record) return;
        const token  = await ensureToken(record);
        if (token) await apiDelete(`/accounts/${record.accountId}`, token).catch(() => {});
        await TempEmail.deleteOne({ userId });
        const embed = new EmbedBuilder().setColor('#FF6B6B').setTitle('🗑️ E-mail Deletado').setDescription('Seu e-mail temporário foi completamente apagado.\nUse `/email` para criar um novo quando quiser.');
        return interaction.editReply({ embeds: [embed], components: [] });
    }
}

// ─── HANDLER DO MODAL (nome customizado) ─────────────────────
export async function handleEmailModal(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const userId = interaction.user.id;
    const name   = interaction.fields.getTextInputValue('email_name_input').toLowerCase().replace(/[^a-z0-9._-]/g, '');

    let record = await TempEmail.findOne({ userId });
    if (record?.token) await apiDelete(`/accounts/${record.accountId}`, record.token).catch(() => {});
    if (record) await TempEmail.deleteOne({ userId });

    const domains = await getDomains().catch(() => []);
    if (!domains.length) return interaction.editReply('❌ Serviço indisponível.');

    const domain   = domains[0].domain;
    const address  = `${name}@${domain}`;
    const password = randPassword();
    const account  = await apiPost('/accounts', { address, password });
    if (!account.id) return interaction.editReply(`❌ Nome \`${name}\` indisponível ou inválido. Tente outro.`);
    const tokenRes = await getToken(address, password);
    const newRec   = await TempEmail.create({ userId, accountId: account.id, address, password, token: tokenRes.token || null });

    const panel = buildEmailPanel(newRec, []);
    return interaction.editReply(panel);
}

// ─── Definição do comando slash ───────────────────────────────
export const emailCommand = new SlashCommandBuilder()
    .setName('email')
    .setDescription('Abre seu painel de e-mail temporário. Rápido e prático.');
