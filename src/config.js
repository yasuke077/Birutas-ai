// ═══════════════════════════════════════════════════════════════
// ⚙️ CONFIG — ALL_BADGES (47), DEFAULT_IAS, SHOP_ITEMS
// ═══════════════════════════════════════════════════════════════
import ms from 'ms';

export const ALL_BADGES = {
    // ECONOMIA
    'magnata':      { name: 'Magnata',                emoji: '🎩', desc: 'Acumulou 100.000 coins.',                              secret: false },
    'imperador':    { name: 'Imperador',              emoji: '🏦', desc: 'Acumulou 1.000.000 coins.',                             secret: false },
    'diamante':     { name: 'Diamante',               emoji: '💎', desc: 'Acumulou 5.000.000 coins.',                             secret: false },
    'tita':         { name: 'Titã Financeiro',        emoji: '🪐', desc: 'Acumulou 50.000.000 coins.',                            secret: false },
    'deus':         { name: 'Deus da Economia',       emoji: '🌌', desc: 'Primeiro Bilionário (1.000.000.000 coins).',            secret: false },
    'filantropo':   { name: 'Filantropo',             emoji: '🤝', desc: 'Doou mais de 100.000 coins no total.',                  secret: false },
    'consumista':   { name: 'Consumista',             emoji: '🛍️', desc: 'Comprou todos os itens disponíveis na loja.',           secret: false },
    // NÍVEL E ATIVIDADE
    'aprendiz':     { name: 'Aprendiz',               emoji: '🎓', desc: 'Alcançou o Nível 5.',                                   secret: false },
    'veterano':     { name: 'Veterano',               emoji: '⚔️', desc: 'Alcançou o Nível 20.',                                  secret: false },
    'lenda':        { name: 'Lenda Viva',             emoji: '👑', desc: 'Alcançou o Nível 50.',                                  secret: false },
    'podcaster':    { name: 'Podcaster',              emoji: '🎙️', desc: 'Acumulou 600 minutos em canais de voz (10h).',          secret: false },
    'bestfriend':   { name: 'Best Friend',            emoji: '🤖', desc: 'Trocou 500+ mensagens com a IA.',                       secret: false },
    'famosinho':    { name: 'Famosinho',              emoji: '⭐', desc: 'Alcançou 50 pontos de Reputação.',                      secret: false },
    'visionario':   { name: 'Visionário',             emoji: '🎨', desc: 'Gerou 50 imagens com IA.',                              secret: false },
    'influencer':   { name: 'Influencer',             emoji: '📸', desc: 'Analisou 20 imagens com IA Vision.',                    secret: false },
    // HABILIDADES
    'oraculo':      { name: 'Oráculo',                emoji: '🔮', desc: 'Acertou 10 apostas consecutivas no cassino.',            secret: false },
    'agente007':    { name: '007',                    emoji: '🕵️', desc: 'Realizou 50 roubos com sucesso.',                       secret: false },
    // SOCIAL
    'alianca':      { name: 'Aliança Eterna',         emoji: '💍', desc: 'Permaneceu casado por 7 dias seguidos.',                 secret: false },
    // ESPECIAIS (concedidas manualmente)
    'founder':      { name: 'Founder',                emoji: '🌟', desc: 'Membro Fundador do Projeto Birutas AI.',                 secret: false },
    'dev':          { name: 'Desenvolvedor',          emoji: '🛠️', desc: 'Criador e Mantenedor do Bot.',                          secret: false },
    'xerife':       { name: 'Xerife',                 emoji: '👮', desc: 'Administrador oficial do Bot no servidor.',              secret: false },
    'guardiao':     { name: 'Guardião',               emoji: '🛡️', desc: 'Concedida por Reports úteis e ajuda à comunidade.',     secret: false },
    // SECRETAS
    'azar':         { name: 'Rei do Azar',            emoji: '🎰', desc: 'Perdeu 5 apostas consecutivas.',                        secret: true  },
    'sorte':        { name: 'Sorte Grande',           emoji: '🍀', desc: 'Ganhou o Jackpot máximo no Slots.',                     secret: true  },
    'escolhido':    { name: 'O Escolhido',            emoji: '🎲', desc: 'Sorteado pela Matrix com 0.1% de chance.',              secret: true  },
    'coruja':       { name: 'Coruja',                 emoji: '🕛', desc: 'Ativo exatamente às 04:00 da manhã.',                   secret: true  },
    'manipulador':  { name: 'Manipulador de Massas',  emoji: '🃏', desc: 'Criou um sorteio com 20+ participantes.',               secret: true  },
    'cripto':       { name: 'Criptografado',          emoji: '🔑', desc: 'Definiu a Bio inteiramente em código binário.',          secret: true  },
    'fuga':         { name: 'A Grande Fuga',          emoji: '🏃', desc: 'Saiu rico do servidor e retornou em 24h.',               secret: true  },
    'abduzido':     { name: 'Abduzido',               emoji: '👽', desc: 'Conversou com a IA sobre alienígenas na madrugada.',     secret: true  },
    'illuminati':   { name: 'Illuminati Confirmado',  emoji: '👁️', desc: 'Mencionou as palavras proibidas da ordem.',             secret: true  },
    'cubo':         { name: 'O Artefato Inútil',      emoji: '🧊', desc: 'Gastou 1 milhão de coins no Cubo Cósmico.',             secret: true  },
    'infiltracao':  { name: 'Infiltração',            emoji: '🕵️', desc: 'Agiu como robô (CAPS LOCK) repetidamente.',            secret: true  },
    'ilusionista':  { name: 'O Ilusionista',          emoji: '✨', desc: 'Cancelou um sorteio ativo no último segundo.',           secret: true  },
    'despertado':   { name: 'Despertado',             emoji: '💊', desc: 'Definiu Bio como "There is no spoon."',                  secret: true  },
    'paradoxo':     { name: 'Paradoxo',               emoji: '♾️', desc: 'Um admin tentou banir a si mesmo.',                     secret: true  },
    'silencio':     { name: 'O Silêncio dos Culpados',emoji: '🤫', desc: 'Enviou mensagem em canal inativo há 7 dias.',            secret: true  },
    'v_vinganca':   { name: 'V de Vingança',          emoji: 'V',  desc: 'Digitou "Vi Veri Veniversum Vivus Vici".',               secret: true  },
    'domino':       { name: 'O Efeito Dominó',        emoji: '⛓️', desc: 'Corrente ininterrupta de 5 doações.',                   secret: true  },
    'ideia':        { name: 'Ideias à Prova de Balas',emoji: '💡', desc: 'Criou uma Tag usada 50 vezes.',                          secret: true  },
    'rosa':         { name: 'A Rosa Escarlate',       emoji: '🌹', desc: 'Deu Reputação para a mesma pessoa por 5 dias seguidos.', secret: true  },
    'mascara':      { name: 'A Máscara de Guy Fawkes',emoji: '🎭', desc: 'Manteve Nickname "V" por 7 dias.',                       secret: true  },
    'quarto5':      { name: 'O Homem do Quarto 5',    emoji: '🚪', desc: 'Recuperou-se de falência total em menos de 24h.',        secret: true  },
    'caderno':      { name: 'O Caderninho Preto',     emoji: '📝', desc: 'Realizou doações exatas de 666 coins.',                  secret: true  },
    'hacker':       { name: 'Hacker',                 emoji: '💻', desc: 'Tentou injetar comandos proibidos no bot.',              secret: true  },
    'hacker1337':   { name: 'Elite Hacker',           emoji: '🔌', desc: 'Transferência leet de exatamente 1337 coins.',           secret: true  },
    'ilha':         { name: 'A Ilha Particular',      emoji: '🏝️', desc: 'Mais rico do servidor por 7 dias seguidos.',             secret: true  },
};

// IDs verificados — todos gratuitos no OpenRouter
// Máximo 5 para caber nos botões de uma row
export const DEFAULT_IAS = {
    gemini: {
        id: 'google/gemini-flash-1.5:free',
        name: 'Gemini',
        desc: '(Google)',
        color: '#4285F4',
        prompt: 'Você é o Gemini do Google. Uma IA lógica, prestativa e inteligente. Responda sempre em Português Brasileiro de forma clara e detalhada.'
    },
    deepseek: {
        id: 'deepseek/deepseek-chat:free',
        name: 'DeepSeek',
        desc: '(Código)',
        color: '#0099ff',
        prompt: 'Você é o DeepSeek. Especialista em raciocínio profundo, matemática e programação. Responda em Português Brasileiro.'
    },
    phi: {
        id: 'microsoft/phi-3-mini-128k-instruct:free',
        name: 'GPT-4 Mini',
        desc: '(Rápido)',
        color: '#107C10',
        prompt: 'Você é um modelo rápido e preciso da Microsoft. Seja conciso e direto. Responda em Português Brasileiro.'
    },
    llama: {
        id: 'meta-llama/llama-3-8b-instruct:free',
        name: 'Llama 3',
        desc: '(Meta)',
        color: '#0668E1',
        prompt: 'Você é o Llama 3 da Meta. Uma IA versátil e amigável. Responda de forma natural em Português Brasileiro.'
    },
    mistral: {
        id: 'mistralai/mistral-7b-instruct:free',
        name: 'Mistral',
        desc: '(EU)',
        color: '#FF6B6B',
        prompt: 'Você é o Mistral, IA eficiente europeia. Responda de forma direta em Português Brasileiro.'
    }
};

export const SHOP_ITEMS = {
    vip7:        { name: 'VIP 7 Dias',         price: 5000,    type: 'vip',  duration: ms('7d'),  emoji: '👑', desc: 'Status VIP, bônus de 2x XP e cor dourada no perfil.' },
    vip30:       { name: 'VIP 30 Dias',        price: 15000,   type: 'vip',  duration: ms('30d'), emoji: '💎', desc: 'Status VIP por um mês com todos os benefícios.' },
    color:       { name: 'Cor Personalizada',  price: 2000,    type: 'item', emoji: '🎨',          desc: 'Libera o /setcolor para customizar a cor do seu perfil.' },
    banner:      { name: 'Banner Customizado', price: 10000,   type: 'item', emoji: '🖼️',          desc: 'Libera o /setbanner para colocar imagem de fundo no perfil.' },
    ring:        { name: 'Anel de Casamento',  price: 1000,    type: 'item', emoji: '💍',          desc: 'Necessário para usar o /marry.' },
    cosmic_cube: { name: 'Cubo Cósmico',       price: 1000000, type: 'item', emoji: '🧊',          desc: 'Artefato lendário para ostentação pura.' },
    shield:      { name: 'Escudo Anti-Roubo',  price: 3000,    type: 'item', emoji: '🛡️',          desc: 'Protege você de um roubo (uso único automático).' },
    pickaxe:     { name: 'Picareta de Ouro',   price: 5000,    type: 'item', emoji: '⛏️',          desc: 'Aumenta os ganhos do /work em 50%.' },
};
