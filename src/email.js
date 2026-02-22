// =================================================================
// EMAIL TEMPORARIO -- mail.tm (pratico, botoes ActionRow)
// =================================================================
import {
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder
} from 'discord.js';
import { TempEmail } from './models.js';

const BASE = 'https://api.mail.tm';

async function apiGet(path, token) {
    const r = await fetch(`${BASE}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!r.ok) throw new Error(`API ${r.status}: ${r.statusText}`);
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
    const d = await apiGet('/domains?page=1').catch(() => ({ 'hydra:member': [] }));
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
    return Math.random().toString(36).slice(2, 9) +
           Math.random().toString(36).slice(2, 9).toUpperCase() + '!9';
}

// Painel principal com botoes
function buildEmailPanel(record, messages) {
    const embed = new EmbedBuilder()
        .setColor('#00C853')
        .setTitle('Email Temporario')
        .addFields({ name: 'Endereco', value: `\`${record.address}\`` })
        .setFooter({ text: 'Email - Birutas AI - Expira em 24h' })
        .setTimestamp();

    if (messages !== null) {
        if (messages.length === 0) {
            embed.addFields({ name: 'Inbox', value: '_Nenhuma mensagem ainda. Aguarde e clique em Atualizar._' });
        } else {
            const list = messages.slice(0, 5).map((m, i) => {
                const seen = m.seen ? '[lida]' : '[NOVA]';
                const from = (m.from?.address || '?').slice(0, 30);
                const subj = (m.subject || '(sem assunto)').slice(0, 40);
                return `${seen} **${i + 1}.** ${subj}\n> De: \`${from}\``;
            }).join('\n\n');
            embed.addFields({ name: `Inbox (${messages.length} mensagem(ns))`, value: list });
        }
    }

    // Row 1: acoes principais
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('email_refresh').setLabel('Atualizar Inbox').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('email_copy').setLabel('Copiar Email').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('email_custom_name').setLabel('Nome Custom').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('email_new').setLabel('Novo Endereco').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('email_delete').setLabel('Apagar Conta').setStyle(ButtonStyle.Danger)
    );

    // Row 2: ler mensagem por numero
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('email_read_1').setLabel('Msg 1').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('email_read_2').setLabel('Msg 2').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('email_read_3').setLabel('Msg 3').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('email_read_4').setLabel('Msg 4').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('email_read_5').setLabel('Msg 5').setStyle(ButtonStyle.Success)
    );

    return { embeds: [embed], components: [row1, row2] };
}

// Criar ou abrir painel
export async function handleEmailCommand(interaction) {
    await interaction.deferReply({ flags: 64 });
    const userId = interaction.user.id;

    try {
        let record = await TempEmail.findOne({ userId });

        if (!record) {
            const domains = await getDomains();
            if (!domains.length) return interaction.editReply({ content: 'Servico indisponivel no momento. Tente novamente em alguns minutos.' });

            const domain   = domains[Math.floor(Math.random() * domains.length)].domain;
            const user     = `user${Math.random().toString(36).slice(2, 8)}`;
            const address  = `${user}@${domain}`;
            const password = randPassword();
            const account  = await apiPost('/accounts', { address, password });
            if (!account.id) return interaction.editReply({ content: 'Falha ao criar conta. Tente novamente.' });

            const tokenRes = await getToken(address, password).catch(() => ({}));
            record = await TempEmail.create({
                userId, accountId: account.id, address, password,
                token: tokenRes.token || null
            });
        }

        const token = await ensureToken(record);
        let messages = [];
        if (token) {
            const inbox = await apiGet('/messages?page=1', token).catch(() => ({}));
            messages = inbox['hydra:member'] || [];
        }

        return interaction.editReply(buildEmailPanel(record, messages));
    } catch (err) {
        console.error('[email command]', err.message);
        return interaction.editReply({ content: `Erro: ${err.message.slice(0, 100)}` });
    }
}

// Handler de botoes
export async function handleEmailButton(interaction) {
    const userId = interaction.user.id;
    const id     = interaction.customId;

    // Copiar email
    if (id === 'email_copy') {
        await interaction.deferReply({ flags: 64 });
        try {
            const record = await TempEmail.findOne({ userId });
            if (!record) return interaction.editReply({ content: 'Nenhum email ativo.' });
            return interaction.editReply({
                content: `Seu email:\n\`\`\`\n${record.address}\n\`\`\`\nSelecione o texto acima para copiar.`
            });
        } catch (err) {
            return interaction.editReply({ content: `Erro: ${err.message.slice(0, 100)}` });
        }
    }

    // Atualizar inbox
    if (id === 'email_refresh') {
        await interaction.deferUpdate();
        try {
            const record = await TempEmail.findOne({ userId });
            if (!record) return interaction.followUp({ content: 'Nenhum email ativo.', flags: 64 });
            const token  = await ensureToken(record);
            const inbox  = token ? await apiGet('/messages?page=1', token).catch(() => ({})) : {};
            const msgs   = inbox['hydra:member'] || [];
            return interaction.editReply(buildEmailPanel(record, msgs));
        } catch (err) {
            console.error('[email_refresh]', err.message);
            return interaction.followUp({ content: `Erro ao atualizar: ${err.message.slice(0, 100)}`, flags: 64 });
        }
    }

    // Ler mensagem N
    if (id.startsWith('email_read_')) {
        await interaction.deferReply({ flags: 64 });
        try {
            const n      = parseInt(id.replace('email_read_', ''));
            const record = await TempEmail.findOne({ userId });
            if (!record) return interaction.editReply({ content: 'Nenhum email ativo. Use /email para criar.' });

            const token = await ensureToken(record);
            if (!token) return interaction.editReply({ content: 'Falha ao autenticar. Clique em Atualizar Inbox.' });

            const inbox = await apiGet('/messages?page=1', token).catch(() => null);
            if (!inbox) return interaction.editReply({ content: 'Nao foi possivel acessar a caixa. Tente Atualizar Inbox.' });

            const msgs = inbox['hydra:member'] || [];
            const msg  = msgs[n - 1];
            if (!msg) return interaction.editReply({
                content: `Mensagem ${n} nao existe. A caixa tem ${msgs.length} mensagem(ns). Clique em Atualizar Inbox.`
            });

            const full    = await apiGet(`/messages/${msg.id}`, token).catch(() => ({}));
            const rawBody = full.text
                || (full.html || '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                               .replace(/<[^>]+>/g, ' ')
                               .replace(/\s+/g, ' ')
                               .trim();
            const body = (rawBody || '(mensagem sem conteudo de texto)').slice(0, 1700);
            const from = msg.from?.address || 'desconhecido';
            const subj = (msg.subject || '(sem assunto)').slice(0, 80);
            const date = new Date(msg.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

            const embed = new EmbedBuilder()
                .setColor('#4285F4')
                .setTitle(subj)
                .addFields(
                    { name: 'De',      value: `\`${from}\``,              inline: true },
                    { name: 'Data',    value: date,                        inline: true },
                    { name: 'Conteudo', value: `\`\`\`\n${body}\n\`\`\`` }
                )
                .setFooter({ text: `ID: ${msg.id.slice(0, 24)}` });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`email_copy_body_${msg.id}`)
                    .setLabel('Copiar Conteudo')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`email_del_msg_${msg.id}`)
                    .setLabel('Apagar Mensagem')
                    .setStyle(ButtonStyle.Danger)
            );
            return interaction.editReply({ embeds: [embed], components: [row] });
        } catch (err) {
            console.error('[email_read]', err.message);
            return interaction.editReply({ content: `Erro ao ler mensagem: ${err.message.slice(0, 150)}` });
        }
    }

    // Copiar corpo da mensagem
    if (id.startsWith('email_copy_body_')) {
        await interaction.deferReply({ flags: 64 });
        try {
            const msgId  = id.replace('email_copy_body_', '');
            const record = await TempEmail.findOne({ userId });
            if (!record) return interaction.editReply({ content: 'Sessao expirada.' });
            const token  = await ensureToken(record);
            const full   = await apiGet(`/messages/${msgId}`, token).catch(() => ({}));
            const body   = (full.text || (full.html || '').replace(/<[^>]+>/g, '') || '(vazio)').slice(0, 1900);
            return interaction.editReply({ content: `\`\`\`\n${body}\n\`\`\`` });
        } catch (err) {
            return interaction.editReply({ content: `Erro: ${err.message.slice(0, 100)}` });
        }
    }

    // Apagar mensagem especifica
    if (id.startsWith('email_del_msg_')) {
        await interaction.deferUpdate();
        try {
            const msgId  = id.replace('email_del_msg_', '');
            const record = await TempEmail.findOne({ userId });
            if (!record) return;
            const token  = await ensureToken(record);
            if (token) await apiDelete(`/messages/${msgId}`, token).catch(() => {});
            return interaction.followUp({ content: 'Mensagem apagada.', flags: 64 });
        } catch (err) {
            console.error('[email_del_msg]', err.message);
        }
    }

    // Novo endereco
    if (id === 'email_new') {
        await interaction.deferUpdate();
        try {
            const record = await TempEmail.findOne({ userId });
            if (record?.token) await apiDelete(`/accounts/${record.accountId}`, record.token).catch(() => {});
            if (record) await TempEmail.deleteOne({ userId });

            const domains = await getDomains();
            if (!domains.length) return interaction.followUp({ content: 'Servico indisponivel.', flags: 64 });

            const domain   = domains[Math.floor(Math.random() * domains.length)].domain;
            const user     = `user${Math.random().toString(36).slice(2, 8)}`;
            const address  = `${user}@${domain}`;
            const password = randPassword();
            const account  = await apiPost('/accounts', { address, password });
            if (!account.id) return interaction.followUp({ content: 'Falha ao criar novo email.', flags: 64 });
            const tokenRes = await getToken(address, password).catch(() => ({}));
            const newRec   = await TempEmail.create({
                userId, accountId: account.id, address, password,
                token: tokenRes.token || null
            });
            return interaction.editReply(buildEmailPanel(newRec, []));
        } catch (err) {
            console.error('[email_new]', err.message);
            return interaction.followUp({ content: `Erro: ${err.message.slice(0, 100)}`, flags: 64 });
        }
    }

    // Nome customizado (modal)
    if (id === 'email_custom_name') {
        const modal = new ModalBuilder()
            .setCustomId('email_name_modal')
            .setTitle('Escolher nome do email');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('email_name_input')
                    .setLabel('Nome de usuario (antes do @)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: meubot2024')
                    .setMinLength(3)
                    .setMaxLength(20)
                    .setRequired(true)
            )
        );
        return interaction.showModal(modal);
    }

    // Apagar conta
    if (id === 'email_delete') {
        await interaction.deferUpdate();
        try {
            const record = await TempEmail.findOne({ userId });
            if (!record) return;
            const token  = await ensureToken(record);
            if (token) await apiDelete(`/accounts/${record.accountId}`, token).catch(() => {});
            await TempEmail.deleteOne({ userId });
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('Email Deletado')
                .setDescription('Sua conta de email temporario foi apagada.\nUse `/email` para criar uma nova quando quiser.');
            return interaction.editReply({ embeds: [embed], components: [] });
        } catch (err) {
            console.error('[email_delete]', err.message);
        }
    }
}

// Handler do modal (nome customizado)
export async function handleEmailModal(interaction) {
    await interaction.deferReply({ flags: 64 });
    const userId = interaction.user.id;
    const name   = interaction.fields.getTextInputValue('email_name_input')
        .toLowerCase().replace(/[^a-z0-9._-]/g, '');

    try {
        let record = await TempEmail.findOne({ userId });
        if (record?.token) await apiDelete(`/accounts/${record.accountId}`, record.token).catch(() => {});
        if (record) await TempEmail.deleteOne({ userId });

        const domains = await getDomains();
        if (!domains.length) return interaction.editReply({ content: 'Servico indisponivel.' });

        const domain   = domains[0].domain;
        const address  = `${name}@${domain}`;
        const password = randPassword();
        const account  = await apiPost('/accounts', { address, password });
        if (!account.id) return interaction.editReply({
            content: `Nome \`${name}\` indisponivel ou invalido. Tente outro nome.`
        });
        const tokenRes = await getToken(address, password).catch(() => ({}));
        const newRec   = await TempEmail.create({
            userId, accountId: account.id, address, password,
            token: tokenRes.token || null
        });
        return interaction.editReply(buildEmailPanel(newRec, []));
    } catch (err) {
        console.error('[email_modal]', err.message);
        return interaction.editReply({ content: `Erro: ${err.message.slice(0, 100)}` });
    }
}

// Definicao do comando slash
export const emailCommand = new SlashCommandBuilder()
    .setName('email')
    .setDescription('Abre seu painel de email temporario (inbox, copiar, ler mensagens).');
