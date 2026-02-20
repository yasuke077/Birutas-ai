// ═══════════════════════════════════════════════════════════════
// 📧 EMAIL TEMPORÁRIO — mail.tm API (Firemail)
// Comandos: /email criar | /email caixa | /email ler | /email deletar | /email nova
// ═══════════════════════════════════════════════════════════════
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { TempEmail } from './models.js';

const BASE = 'https://api.mail.tm';

// ─── Funções auxiliares da API ────────────────────────────────
async function getDomains() {
    const r = await fetch(`${BASE}/domains?page=1`);
    const d = await r.json();
    return d['hydra:member'] || [];
}

async function createAccount(address, password) {
    const r = await fetch(`${BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password })
    });
    return r.json();
}

async function getToken(address, password) {
    const r = await fetch(`${BASE}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password })
    });
    return r.json();
}

async function getMessages(token) {
    const r = await fetch(`${BASE}/messages?page=1`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return r.json();
}

async function getMessage(token, id) {
    const r = await fetch(`${BASE}/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return r.json();
}

async function deleteMessage(token, id) {
    await fetch(`${BASE}/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
}

async function deleteAccount(token, id) {
    await fetch(`${BASE}/accounts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
}

// ─── Garante token válido (reautentica se necessário) ─────────
async function ensureToken(record) {
    try {
        const t = await getToken(record.address, record.password);
        if (t.token) {
            record.token = t.token;
            await TempEmail.updateOne({ _id: record._id }, { token: t.token });
            return t.token;
        }
    } catch (e) { /* falhou */ }
    return null;
}

// ─── Gera senha aleatória ─────────────────────────────────────
function randomPassword() {
    return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────
export async function handleEmail(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    await interaction.deferReply({ ephemeral: true });

    // ── /email criar ──────────────────────────────────────────
    if (sub === 'criar') {
        try {
            const existing = await TempEmail.findOne({ userId });
            if (existing) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#FF6B6B')
                        .setTitle('📧 Você já tem um e-mail temporário!')
                        .setDescription(`**Endereço:** \`${existing.address}\`\nUse \`/email nova\` para gerar um novo endereço ou \`/email deletar\` para excluir.`)
                    ]
                });
            }
            const domains = await getDomains();
            if (!domains.length) throw new Error('Nenhum domínio disponível.');
            const domain = domains[Math.floor(Math.random() * domains.length)].domain;
            const user   = `user_${Math.random().toString(36).slice(2, 9)}`;
            const address  = `${user}@${domain}`;
            const password = randomPassword();

            const account = await createAccount(address, password);
            if (!account.id) throw new Error(account['hydra:description'] || 'Erro ao criar conta.');

            const tokenRes = await getToken(address, password);
            if (!tokenRes.token) throw new Error('Erro ao obter token.');

            await TempEmail.create({
                userId,
                accountId: account.id,
                address,
                password,
                token: tokenRes.token,
            });

            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#00C853')
                    .setTitle('✅ E-mail Temporário Criado!')
                    .setDescription('Seu endereço de e-mail temporário foi criado com sucesso.')
                    .addFields(
                        { name: '📬 Endereço', value: `\`${address}\``, inline: false },
                        { name: '🔑 Senha',    value: `||${password}||`,  inline: false },
                        { name: 'ℹ️ Info',     value: 'Use `/email caixa` para ver mensagens recebidas.\nO e-mail pode ser excluído a qualquer momento com `/email deletar`.', inline: false }
                    )
                    .setFooter({ text: 'Powered by mail.tm • Birutas AI' })
                    .setTimestamp()
                ]
            });
        } catch (e) {
            console.error('[EMAIL criar]', e.message);
            return interaction.editReply(`❌ Erro ao criar e-mail: ${e.message}`);
        }
    }

    // ── /email caixa ──────────────────────────────────────────
    if (sub === 'caixa') {
        try {
            const record = await TempEmail.findOne({ userId });
            if (!record) return interaction.editReply('❌ Você não tem e-mail temporário. Use `/email criar` primeiro.');

            const token = await ensureToken(record);
            if (!token) return interaction.editReply('❌ Não foi possível autenticar. Tente `/email nova`.');

            const data = await getMessages(token);
            const msgs = data['hydra:member'] || [];

            const embed = new EmbedBuilder()
                .setColor('#4285F4')
                .setTitle('📥 Caixa de Entrada')
                .setDescription(`**Endereço:** \`${record.address}\``)
                .setFooter({ text: `${msgs.length} mensagem(ns) • Birutas AI` })
                .setTimestamp();

            if (msgs.length === 0) {
                embed.addFields({ name: '📭 Inbox vazio', value: 'Nenhuma mensagem recebida ainda.' });
            } else {
                msgs.slice(0, 8).forEach((m, i) => {
                    const from = m.from?.address || 'Desconhecido';
                    const date = new Date(m.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                    const seen = m.seen ? '✉️' : '📩';
                    embed.addFields({
                        name: `${seen} #${i + 1} — ${m.subject?.slice(0, 40) || '(sem assunto)'}`,
                        value: `**De:** ${from}\n**Data:** ${date}\n**ID:** \`${m.id}\``,
                        inline: false
                    });
                });
            }
            return interaction.editReply({ embeds: [embed] });
        } catch (e) {
            console.error('[EMAIL caixa]', e.message);
            return interaction.editReply('❌ Erro ao buscar caixa de entrada.');
        }
    }

    // ── /email ler ────────────────────────────────────────────
    if (sub === 'ler') {
        const msgId = interaction.options.getString('id');
        try {
            const record = await TempEmail.findOne({ userId });
            if (!record) return interaction.editReply('❌ Você não tem e-mail temporário. Use `/email criar` primeiro.');

            const token = await ensureToken(record);
            if (!token) return interaction.editReply('❌ Não foi possível autenticar.');

            const msg = await getMessage(token, msgId);
            if (!msg.id) return interaction.editReply('❌ Mensagem não encontrada. Verifique o ID em `/email caixa`.');

            const body = (msg.text || msg.html?.replace(/<[^>]+>/g, '') || '(sem conteúdo)').slice(0, 1000);
            const from = msg.from?.address || 'Desconhecido';
            const date = new Date(msg.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`📨 ${msg.subject?.slice(0, 60) || '(sem assunto)'}`)
                .addFields(
                    { name: '👤 De',       value: from, inline: true },
                    { name: '📅 Data',     value: date, inline: true },
                    { name: '📝 Conteúdo', value: `\`\`\`\n${body}\n\`\`\`` }
                )
                .setFooter({ text: `ID: ${msg.id} • Birutas AI` })
                .setTimestamp();

            if (msg.attachments?.length > 0) {
                embed.addFields({
                    name: `📎 Anexos (${msg.attachments.length})`,
                    value: msg.attachments.map(a => a.filename).join('\n')
                });
            }
            return interaction.editReply({ embeds: [embed] });
        } catch (e) {
            console.error('[EMAIL ler]', e.message);
            return interaction.editReply('❌ Erro ao ler mensagem.');
        }
    }

    // ── /email apagar-msg ─────────────────────────────────────
    if (sub === 'apagar-msg') {
        const msgId = interaction.options.getString('id');
        try {
            const record = await TempEmail.findOne({ userId });
            if (!record) return interaction.editReply('❌ Você não tem e-mail temporário.');
            const token = await ensureToken(record);
            await deleteMessage(token, msgId);
            return interaction.editReply('🗑️ Mensagem apagada com sucesso.');
        } catch (e) {
            return interaction.editReply('❌ Erro ao apagar mensagem.');
        }
    }

    // ── /email nova ───────────────────────────────────────────
    if (sub === 'nova') {
        try {
            const record = await TempEmail.findOne({ userId });
            // Deleta a conta antiga se existir
            if (record?.token) {
                await deleteAccount(record.token, record.accountId).catch(() => {});
                await TempEmail.deleteOne({ userId });
            }
            // Cria nova conta
            const domains = await getDomains();
            if (!domains.length) throw new Error('Nenhum domínio disponível.');
            const domain   = domains[Math.floor(Math.random() * domains.length)].domain;
            const user     = `user_${Math.random().toString(36).slice(2, 9)}`;
            const address  = `${user}@${domain}`;
            const password = randomPassword();

            const account  = await createAccount(address, password);
            if (!account.id) throw new Error('Erro ao criar conta.');
            const tokenRes = await getToken(address, password);

            await TempEmail.create({
                userId,
                accountId: account.id,
                address,
                password,
                token: tokenRes.token,
            });

            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#00C853')
                    .setTitle('🔄 Novo E-mail Gerado!')
                    .addFields(
                        { name: '📬 Novo Endereço', value: `\`${address}\``,   inline: false },
                        { name: '🔑 Senha',         value: `||${password}||`,  inline: false }
                    )
                    .setFooter({ text: 'E-mail anterior deletado • Birutas AI' })
                ]
            });
        } catch (e) {
            console.error('[EMAIL nova]', e.message);
            return interaction.editReply('❌ Erro ao gerar novo e-mail.');
        }
    }

    // ── /email deletar ────────────────────────────────────────
    if (sub === 'deletar') {
        try {
            const record = await TempEmail.findOne({ userId });
            if (!record) return interaction.editReply('❌ Você não tem e-mail temporário para deletar.');
            const token = await ensureToken(record);
            if (token) await deleteAccount(token, record.accountId).catch(() => {});
            await TempEmail.deleteOne({ userId });
            return interaction.editReply('✅ Seu e-mail temporário foi completamente deletado.');
        } catch (e) {
            await TempEmail.deleteOne({ userId }).catch(() => {});
            return interaction.editReply('✅ Registro de e-mail removido.');
        }
    }
}

// ─── Definição do comando /email ──────────────────────────────
export const emailCommand = new SlashCommandBuilder()
    .setName('email')
    .setDescription('Gerencia seu e-mail temporário.')
    .addSubcommand(sub => sub
        .setName('criar')
        .setDescription('Cria um novo e-mail temporário.'))
    .addSubcommand(sub => sub
        .setName('caixa')
        .setDescription('Mostra as mensagens recebidas.'))
    .addSubcommand(sub => sub
        .setName('ler')
        .setDescription('Lê uma mensagem específica.')
        .addStringOption(o => o.setName('id').setDescription('ID da mensagem (veja em /email caixa)').setRequired(true)))
    .addSubcommand(sub => sub
        .setName('apagar-msg')
        .setDescription('Apaga uma mensagem específica.')
        .addStringOption(o => o.setName('id').setDescription('ID da mensagem').setRequired(true)))
    .addSubcommand(sub => sub
        .setName('nova')
        .setDescription('Gera um novo endereço de e-mail (apaga o anterior).'))
    .addSubcommand(sub => sub
        .setName('deletar')
        .setDescription('Deleta completamente seu e-mail temporário.'));
