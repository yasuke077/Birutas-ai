// ═══════════════════════════════════════════════════════════════
// BIRUTAS AI - BOT DISCORD COMPLETO
// Sistema de Economia + IA + Comandos Slash
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════

const DB_PATH = path.join(__dirname, 'database.json');

// IAs Padrão
const DEFAULT_IAS = {
  'deepseek': {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek',
    color: '#1E90FF',
    prompt: 'Você é DeepSeek, uma IA avançada e prestativa.'
  },
  'venice': {
    id: 'openai/gpt-4-turbo',
    name: 'Venice',
    color: '#FF6347',
    prompt: 'Você é Venice, uma IA criativa e amigável.'
  }
};

// ═══════════════════════════════════════════════════════════════
// SISTEMA DE DATABASE (JSON)
// ═══════════════════════════════════════════════════════════════

let database = { guilds: {}, users: {}, memory: {} };

async function loadDatabase() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    database = JSON.parse(data);
    console.log('✅ Database carregado');
  } catch (error) {
    console.log('⚠️ Database não encontrado, criando novo...');
    await saveDatabase();
  }
}

async function saveDatabase() {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(database, null, 2));
  } catch (error) {
    console.error('❌ Erro ao salvar database:', error);
  }
}

// Auto-save a cada 5 minutos
setInterval(saveDatabase, 5 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════

function getGuildData(guildId) {
  if (!database.guilds[guildId]) {
    database.guilds[guildId] = {
      allowedChannels: [],
      bannedChannels: [],
      adminRole: null,
      logChannel: null,
      aiSettings: {},
      customIAs: {},
      slowMode: {}
    };
  }
  return database.guilds[guildId];
}

function getUserData(guildId, userId) {
  const key = `${guildId}_${userId}`;
  if (!database.users[key]) {
    database.users[key] = {
      xp: 0,
      level: 1,
      coins: 100,
      messages: 0,
      voiceTime: 0,
      inventory: [],
      badges: [],
      daily: { last: null, streak: 0 },
      work: { last: null },
      crime: { last: null },
      lastXP: Date.now(),
      vip: { active: false, until: null }
    };
  }
  return database.users[key];
}

function getMemory(channelId) {
  if (!database.memory[channelId]) {
    database.memory[channelId] = { messages: [] };
  }
  return database.memory[channelId];
}

function isAdmin(member, guildData) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (guildData.adminRole && member.roles.cache.has(guildData.adminRole)) return true;
  return false;
}

// ═══════════════════════════════════════════════════════════════
// CLIENTE DISCORD
// ═══════════════════════════════════════════════════════════════

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// ═══════════════════════════════════════════════════════════════
// COMANDOS SLASH
// ═══════════════════════════════════════════════════════════════

const commands = [
  // ECONOMIA
  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Recolha sua recompensa diária de coins'),
  
  new SlashCommandBuilder()
    .setName('coins')
    .setDescription('Veja suas moedas ou de outro usuário')
    .addUserOption(option => 
      option.setName('usuario')
        .setDescription('Usuário para verificar')
        .setRequired(false)),
  
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Veja o ranking de XP do servidor'),
  
  new SlashCommandBuilder()
    .setName('work')
    .setDescription('Trabalhe para ganhar coins'),
  
  new SlashCommandBuilder()
    .setName('crime')
    .setDescription('Cometa um crime para ganhar coins (com risco!)'),

  // IA
  new SlashCommandBuilder()
    .setName('add-prompt')
    .setDescription('Adicione uma nova IA customizada')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('ID único da IA (ex: gpt4)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('nome')
        .setDescription('Nome da IA')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('modelo')
        .setDescription('ID do modelo OpenRouter (ex: openai/gpt-4)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('Prompt de sistema da IA')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('cor')
        .setDescription('Cor em HEX (ex: #FF0000)')
        .setRequired(false)),
  
  new SlashCommandBuilder()
    .setName('setmode')
    .setDescription('Defina a IA ativa neste canal'),
  
  new SlashCommandBuilder()
    .setName('hub')
    .setDescription('Painel de controle do bot'),

  // ADMIN
  new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure o bot')
    .addSubcommand(subcommand =>
      subcommand
        .setName('canal-permitido')
        .setDescription('Adicione um canal permitido para IA')
        .addChannelOption(option =>
          option.setName('canal')
            .setDescription('Canal a permitir')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('canal-banido')
        .setDescription('Bana um canal da IA')
        .addChannelOption(option =>
          option.setName('canal')
            .setDescription('Canal a banir')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('cargo-admin')
        .setDescription('Define o cargo de administrador')
        .addRoleOption(option =>
          option.setName('cargo')
            .setDescription('Cargo de admin')
            .setRequired(true))),

  new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Reseta dados de um usuário')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário para resetar')
        .setRequired(true))
].map(command => command.toJSON());

// ═══════════════════════════════════════════════════════════════
// EVENTO: READY
// ═══════════════════════════════════════════════════════════════

client.once('ready', async () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);
  
  // Registrar comandos
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('📝 Registrando comandos slash...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Comandos registrados!');
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }

  client.user.setActivity('Use /hub para começar');
  await loadDatabase();
});

// ═══════════════════════════════════════════════════════════════
// EVENTO: INTERACTION (COMANDOS SLASH)
// ═══════════════════════════════════════════════════════════════

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    await handleCommand(interaction);
  } else if (interaction.isButton()) {
    await handleButton(interaction);
  }
});

async function handleCommand(interaction) {
  const { commandName, guildId, user, member } = interaction;
  const guildData = getGuildData(guildId);
  const userData = getUserData(guildId, user.id);

  try {
    switch (commandName) {
      case 'hub':
        await handleHub(interaction, guildData);
        break;
      
      case 'daily':
        await handleDaily(interaction, userData);
        break;
      
      case 'coins':
        await handleCoins(interaction, userData);
        break;
      
      case 'rank':
        await handleRank(interaction, guildId);
        break;
      
      case 'work':
        await handleWork(interaction, userData);
        break;
      
      case 'crime':
        await handleCrime(interaction, userData);
        break;
      
      case 'add-prompt':
        await handleAddPrompt(interaction, guildData);
        break;
      
      case 'setmode':
        await handleSetmode(interaction, guildData);
        break;
      
      case 'config':
        if (!isAdmin(member, guildData)) {
          return interaction.reply({ content: '❌ Você não tem permissão!', ephemeral: true });
        }
        await handleConfig(interaction, guildData);
        break;
      
      case 'reset':
        if (!isAdmin(member, guildData)) {
          return interaction.reply({ content: '❌ Você não tem permissão!', ephemeral: true });
        }
        await handleReset(interaction);
        break;
    }
    
    await saveDatabase();
  } catch (error) {
    console.error('Erro no comando:', error);
    await interaction.reply({ content: '❌ Erro ao executar comando!', ephemeral: true }).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════════
// COMANDO: HUB
// ═══════════════════════════════════════════════════════════════

async function handleHub(interaction, guildData) {
  const embed = new EmbedBuilder()
    .setTitle('🎮 BIRUTAS AI - HUB')
    .setColor('#00FF00')
    .setDescription('Painel de controle completo do bot')
    .addFields(
      { name: '💰 Economia', value: '`/daily` `/coins` `/work` `/crime` `/rank`', inline: true },
      { name: '🤖 IA', value: '`/setmode` `/add-prompt`', inline: true },
      { name: '⚙️ Admin', value: '`/config` `/reset`', inline: true },
      { name: '📊 Status', value: `Servidores: ${client.guilds.cache.size}\nUsuários: ${Object.keys(database.users).length}`, inline: false }
    )
    .setFooter({ text: 'Birutas AI • Sistema de Economia + IA' })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('hub_economia')
        .setLabel('💰 Economia')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('hub_ia')
        .setLabel('🤖 IA')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('hub_ajuda')
        .setLabel('❓ Ajuda')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.reply({ embeds: [embed], components: [row] });
}

// ═══════════════════════════════════════════════════════════════
// COMANDO: DAILY
// ═══════════════════════════════════════════════════════════════

async function handleDaily(interaction, userData) {
  const now = Date.now();
  const lastDaily = userData.daily.last;
  const cooldown = 24 * 60 * 60 * 1000; // 24 horas

  if (lastDaily && (now - lastDaily) < cooldown) {
    const remaining = cooldown - (now - lastDaily);
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return interaction.reply({
      content: `⏰ Você já coletou seu daily! Volte em **${hours}h ${minutes}m**`,
      ephemeral: true
    });
  }

  // Calcular streak
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (lastDaily && (now - lastDaily) < (oneDayMs + 60 * 60 * 1000)) {
    userData.daily.streak++;
  } else {
    userData.daily.streak = 1;
  }

  const baseReward = 100;
  const streakBonus = Math.min(userData.daily.streak * 10, 200);
  const totalReward = baseReward + streakBonus;

  userData.coins += totalReward;
  userData.daily.last = now;

  const embed = new EmbedBuilder()
    .setTitle('💰 Daily Coletado!')
    .setColor('#FFD700')
    .setDescription(`Você recebeu **${totalReward} Birutas Coins**!`)
    .addFields(
      { name: '🔥 Streak', value: `${userData.daily.streak} dias`, inline: true },
      { name: '💵 Bônus', value: `+${streakBonus} coins`, inline: true },
      { name: '💰 Total', value: `${userData.coins} coins`, inline: true }
    )
    .setFooter({ text: 'Volte amanhã para manter seu streak!' });

  await interaction.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════════════════════
// COMANDO: COINS
// ═══════════════════════════════════════════════════════════════

async function handleCoins(interaction, userData) {
  const targetUser = interaction.options.getUser('usuario') || interaction.user;
  const targetData = getUserData(interaction.guildId, targetUser.id);

  const embed = new EmbedBuilder()
    .setTitle(`💰 Coins de ${targetUser.username}`)
    .setColor('#FFD700')
    .setDescription(`**${targetData.coins}** Birutas Coins`)
    .addFields(
      { name: '📊 Level', value: `${targetData.level}`, inline: true },
      { name: '⭐ XP', value: `${targetData.xp}`, inline: true },
      { name: '💬 Mensagens', value: `${targetData.messages}`, inline: true }
    )
    .setThumbnail(targetUser.displayAvatarURL());

  await interaction.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════════════════════
// COMANDO: RANK
// ═══════════════════════════════════════════════════════════════

async function handleRank(interaction, guildId) {
  const users = Object.entries(database.users)
    .filter(([key]) => key.startsWith(guildId))
    .map(([key, data]) => ({
      userId: key.split('_')[1],
      xp: data.xp,
      level: data.level,
      coins: data.coins
    }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10);

  if (users.length === 0) {
    return interaction.reply({ content: '❌ Nenhum usuário no ranking ainda!', ephemeral: true });
  }

  const description = users.map((u, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    return `${medal} <@${u.userId}> - Level ${u.level} (${u.xp} XP)`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setTitle('🏆 Ranking de XP')
    .setColor('#FFD700')
    .setDescription(description)
    .setFooter({ text: 'Continue ativo para subir no ranking!' });

  await interaction.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════════════════════
// COMANDO: WORK
// ═══════════════════════════════════════════════════════════════

async function handleWork(interaction, userData) {
  const now = Date.now();
  const cooldown = 60 * 60 * 1000; // 1 hora

  if (userData.work.last && (now - userData.work.last) < cooldown) {
    const remaining = cooldown - (now - userData.work.last);
    const minutes = Math.floor(remaining / (60 * 1000));
    return interaction.reply({
      content: `⏰ Você está cansado! Descanse por mais **${minutes} minutos**`,
      ephemeral: true
    });
  }

  const reward = Math.floor(Math.random() * 100) + 50;
  userData.coins += reward;
  userData.work.last = now;

  const jobs = ['programador', 'designer', 'streamer', 'youtuber', 'músico'];
  const job = jobs[Math.floor(Math.random() * jobs.length)];

  const embed = new EmbedBuilder()
    .setTitle('💼 Trabalho Completo!')
    .setColor('#00FF00')
    .setDescription(`Você trabalhou como **${job}** e ganhou **${reward} coins**!`)
    .addFields({ name: '💰 Saldo', value: `${userData.coins} coins` });

  await interaction.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════════════════════
// COMANDO: CRIME
// ═══════════════════════════════════════════════════════════════

async function handleCrime(interaction, userData) {
  const now = Date.now();
  const cooldown = 2 * 60 * 60 * 1000; // 2 horas

  if (userData.crime.last && (now - userData.crime.last) < cooldown) {
    const remaining = cooldown - (now - userData.crime.last);
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return interaction.reply({
      content: `🚨 Você ainda está procurado! Espere **${hours}h ${minutes}m**`,
      ephemeral: true
    });
  }

  const success = Math.random() > 0.5;
  userData.crime.last = now;

  if (success) {
    const reward = Math.floor(Math.random() * 200) + 100;
    userData.coins += reward;
    
    const embed = new EmbedBuilder()
      .setTitle('💰 Crime Bem-Sucedido!')
      .setColor('#00FF00')
      .setDescription(`Você conseguiu roubar **${reward} coins**!`)
      .addFields({ name: '💵 Saldo', value: `${userData.coins} coins` });
    
    await interaction.reply({ embeds: [embed] });
  } else {
    const loss = Math.floor(Math.random() * 100) + 50;
    userData.coins = Math.max(0, userData.coins - loss);
    
    const embed = new EmbedBuilder()
      .setTitle('🚨 Você Foi Pego!')
      .setColor('#FF0000')
      .setDescription(`A polícia te pegou e você perdeu **${loss} coins**!`)
      .addFields({ name: '💸 Saldo', value: `${userData.coins} coins` });
    
    await interaction.reply({ embeds: [embed] });
  }
}

// ═══════════════════════════════════════════════════════════════
// COMANDO: ADD-PROMPT
// ═══════════════════════════════════════════════════════════════

async function handleAddPrompt(interaction, guildData) {
  const id = interaction.options.getString('id');
  const nome = interaction.options.getString('nome');
  const modelo = interaction.options.getString('modelo');
  const prompt = interaction.options.getString('prompt');
  const cor = interaction.options.getString('cor') || '#7289DA';

  if (!guildData.customIAs) {
    guildData.customIAs = {};
  }

  guildData.customIAs[id] = {
    id: modelo,
    name: nome,
    color: cor,
    prompt: prompt
  };

  const embed = new EmbedBuilder()
    .setTitle('✅ IA Adicionada!')
    .setColor(cor)
    .setDescription(`A IA **${nome}** foi adicionada com sucesso!`)
    .addFields(
      { name: '🆔 ID', value: id, inline: true },
      { name: '🤖 Modelo', value: modelo, inline: true },
      { name: '📝 Prompt', value: prompt.substring(0, 100) + '...' }
    );

  await interaction.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════════════════════
// COMANDO: SETMODE
// ═══════════════════════════════════════════════════════════════

async function handleSetmode(interaction, guildData) {
  const allIAs = { ...DEFAULT_IAS, ...(guildData.customIAs || {}) };
  
  if (Object.keys(allIAs).length === 0) {
    return interaction.reply({ content: '❌ Nenhuma IA disponível!', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('🤖 Selecione a IA')
    .setColor('#7289DA')
    .setDescription('Clique em um botão para ativar a IA neste canal:');

  const buttons = [];
  let row = new ActionRowBuilder();
  let count = 0;

  for (const [key, ia] of Object.entries(allIAs)) {
    if (count > 0 && count % 5 === 0) {
      buttons.push(row);
      row = new ActionRowBuilder();
    }
    
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`setai_${key}`)
        .setLabel(ia.name)
        .setStyle(ButtonStyle.Primary)
    );
    count++;
  }
  
  if (row.components.length > 0) buttons.push(row);

  await interaction.reply({ embeds: [embed], components: buttons });
}

// ═══════════════════════════════════════════════════════════════
// COMANDO: CONFIG
// ═══════════════════════════════════════════════════════════════

async function handleConfig(interaction, guildData) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'canal-permitido') {
    const canal = interaction.options.getChannel('canal');
    if (!guildData.allowedChannels.includes(canal.id)) {
      guildData.allowedChannels.push(canal.id);
    }
    await interaction.reply({ content: `✅ Canal ${canal} permitido para IA!`, ephemeral: true });
  }
  else if (subcommand === 'canal-banido') {
    const canal = interaction.options.getChannel('canal');
    if (!guildData.bannedChannels.includes(canal.id)) {
      guildData.bannedChannels.push(canal.id);
    }
    await interaction.reply({ content: `✅ Canal ${canal} banido da IA!`, ephemeral: true });
  }
  else if (subcommand === 'cargo-admin') {
    const cargo = interaction.options.getRole('cargo');
    guildData.adminRole = cargo.id;
    await interaction.reply({ content: `✅ Cargo ${cargo} definido como admin!`, ephemeral: true });
  }
}

// ═══════════════════════════════════════════════════════════════
// COMANDO: RESET
// ═══════════════════════════════════════════════════════════════

async function handleReset(interaction) {
  const targetUser = interaction.options.getUser('usuario');
  const key = `${interaction.guildId}_${targetUser.id}`;
  
  if (database.users[key]) {
    delete database.users[key];
    await interaction.reply({ content: `✅ Dados de ${targetUser} resetados!`, ephemeral: true });
  } else {
    await interaction.reply({ content: `❌ Usuário não encontrado no database!`, ephemeral: true });
  }
}

// ═══════════════════════════════════════════════════════════════
// HANDLER: BOTÕES
// ═══════════════════════════════════════════════════════════════

async function handleButton(interaction) {
  const { customId, guildId, channelId, user, guild } = interaction;

  if (customId.startsWith('setai_')) {
    const iaKey = customId.replace('setai_', '');
    const guildData = getGuildData(guildId);
    const allIAs = { ...DEFAULT_IAS, ...(guildData.customIAs || {}) };
    const ia = allIAs[iaKey];

    if (!ia) {
      return interaction.reply({ content: '❌ IA não encontrada!', ephemeral: true });
    }

    if (!guildData.aiSettings) guildData.aiSettings = {};
    guildData.aiSettings[channelId] = iaKey;

    // MUDAR NOME E CARGO DO BOT
    try {
      const me = guild.members.me;
      await me.setNickname(ia.name);
      
      // Tentar criar ou encontrar cargo
      let role = guild.roles.cache.find(r => r.name === ia.name);
      if (!role) {
        role = await guild.roles.create({
          name: ia.name,
          color: ia.color,
          reason: 'Cargo automático da IA'
        });
      }
      await me.roles.add(role);
    } catch (error) {
      console.log('Aviso: Não foi possível mudar nome/cargo:', error.message);
    }

    await saveDatabase();

    const embed = new EmbedBuilder()
      .setTitle('✅ IA Ativada!')
      .setColor(ia.color)
      .setDescription(`A IA **${ia.name}** está ativa neste canal!`)
      .setFooter({ text: 'Envie mensagens para interagir' });

    await interaction.reply({ embeds: [embed] });
  }
  else if (customId === 'hub_economia') {
    const embed = new EmbedBuilder()
      .setTitle('💰 Sistema de Economia')
      .setColor('#FFD700')
      .setDescription('Comandos de economia disponíveis:')
      .addFields(
        { name: '/daily', value: 'Recompensa diária (24h cooldown)' },
        { name: '/work', value: 'Trabalhe para ganhar coins (1h cooldown)' },
        { name: '/crime', value: 'Crime com risco (2h cooldown)' },
        { name: '/coins', value: 'Veja seus coins' },
        { name: '/rank', value: 'Ranking de XP' }
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
  else if (customId === 'hub_ia') {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Sistema de IA')
      .setColor('#7289DA')
      .setDescription('Configure e use IAs:')
      .addFields(
        { name: '/setmode', value: 'Escolha a IA ativa no canal' },
        { name: '/add-prompt', value: 'Adicione uma IA customizada' }
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
  else if (customId === 'hub_ajuda') {
    const embed = new EmbedBuilder()
      .setTitle('❓ Ajuda - Birutas AI')
      .setColor('#00FF00')
      .setDescription('Bot completo com IA e economia!')
      .addFields(
        { name: '📚 Guia Rápido', value: '1. Use `/setmode` para escolher IA\n2. Envie mensagens no canal\n3. Use `/daily` todo dia' },
        { name: '🔗 Suporte', value: 'Entre em contato com o desenvolvedor' }
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
  else if (customId === 'stop_generation') {
    await interaction.reply({ content: '⏹️ Geração interrompida!', ephemeral: true });
  }
  else if (customId === 'snapshot') {
    const memory = getMemory(channelId);
    const lastMessages = memory.messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
    await interaction.reply({ content: `📸 Snapshot:\n\`\`\`${lastMessages || 'Nenhuma mensagem'}\`\`\``, ephemeral: true });
  }
}

// ═══════════════════════════════════════════════════════════════
// EVENTO: MENSAGENS (IA)
// ═══════════════════════════════════════════════════════════════

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  const guildData = getGuildData(message.guildId);
  const userData = getUserData(message.guildId, message.author.id);

  // XP por mensagem (fora dos canais de IA)
  const now = Date.now();
  if (now - userData.lastXP > 60000) {
    const xpGain = Math.floor(Math.random() * 15) + 10;
    userData.xp += xpGain;
    userData.messages++;
    userData.lastXP = now;

    // Level up
    const xpNeeded = userData.level * 100;
    if (userData.xp >= xpNeeded) {
      userData.level++;
      userData.coins += 50;
      message.reply(`🎉 ${message.author}, você subiu para o **Level ${userData.level}**! (+50 coins)`);
    }
  }

  // IA
  const activeIA = guildData.aiSettings?.[message.channelId];
  if (!activeIA) return;

  const allIAs = { ...DEFAULT_IAS, ...(guildData.customIAs || {}) };
  const ia = allIAs[activeIA];
  if (!ia) return;

  // Verificar canais
  if (guildData.bannedChannels.includes(message.channelId)) return;
  if (guildData.allowedChannels.length > 0 && !guildData.allowedChannels.includes(message.channelId)) return;

  try {
    await message.channel.sendTyping();

    const memory = getMemory(message.channelId);
    memory.messages.push({
      role: 'user',
      content: message.content || 'mensagem sem texto'
    });

    // Manter apenas últimas 10 mensagens
    if (memory.messages.length > 10) {
      memory.messages = memory.messages.slice(-10);
    }

    // Chamar OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: ia.id,
        messages: [
          { role: 'system', content: ia.prompt },
          ...memory.messages
        ]
      })
    });

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content || 'Erro na resposta da IA';

    memory.messages.push({
      role: 'assistant',
      content: aiReply
    });

    // Botões de controle
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('stop_generation')
          .setLabel('⏹️ Parar')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('snapshot')
          .setLabel('📸 Snapshot')
          .setStyle(ButtonStyle.Secondary)
      );

    // Botões de troca de IA
    const iaRow = new ActionRowBuilder();
    const otherIAs = Object.entries(allIAs).filter(([key]) => key !== activeIA).slice(0, 4);
    
    for (const [key, otherIA] of otherIAs) {
      iaRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`setai_${key}`)
          .setLabel(otherIA.name)
          .setStyle(ButtonStyle.Primary)
      );
    }

    const components = [row];
    if (iaRow.components.length > 0) components.push(iaRow);

    await message.reply({
      content: aiReply.substring(0, 2000),
      components
    });

    // XP por usar IA
    userData.xp += 5;
    userData.coins += 1;

    await saveDatabase();

  } catch (error) {
    console.error('Erro na IA:', error);
    await message.reply('❌ Erro ao processar sua mensagem!');
  }
});

// ═══════════════════════════════════════════════════════════════
// GANHO AUTOMÁTICO DE COINS (1 MINUTO)
// ═══════════════════════════════════════════════════════════════

setInterval(() => {
  for (const key in database.users) {
    database.users[key].coins += 1;
  }
  console.log('💰 Coins automáticos distribuídos para todos os usuários');
}, 60 * 1000); // 1 minuto

// ═══════════════════════════════════════════════════════════════
// EVENTO: VOICE STATE (Recompensa por tempo em call)
// ═══════════════════════════════════════════════════════════════

const voiceTimers = new Map();

client.on('voiceStateUpdate', (oldState, newState) => {
  const userId = newState.id;
  const guildId = newState.guild.id;

  // Entrou em call
  if (!oldState.channelId && newState.channelId) {
    voiceTimers.set(userId, Date.now());
  }
  // Saiu da call
  else if (oldState.channelId && !newState.channelId) {
    const startTime = voiceTimers.get(userId);
    if (startTime) {
      const timeInCall = Date.now() - startTime;
      const minutes = Math.floor(timeInCall / 60000);
      
      if (minutes > 0) {
        const userData = getUserData(guildId, userId);
        const coinsEarned = minutes * 2;
        userData.coins += coinsEarned;
        userData.voiceTime += minutes;
        
        console.log(`🎤 ${userId} ganhou ${coinsEarned} coins por ${minutes} minutos em call`);
      }
      
      voiceTimers.delete(userId);
    }
  }
});

// ═══════════════════════════════════════════════════════════════
// INICIAR BOT
// ═══════════════════════════════════════════════════════════════

client.login(process.env.DISCORD_TOKEN);
