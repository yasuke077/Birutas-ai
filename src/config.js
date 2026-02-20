// ═══════════════════════════════════════════════════════════════
// ⚙️ CONFIG — ALL_BADGES, DEFAULT_IAS, SHOP_ITEMS
// ═══════════════════════════════════════════════════════════════
import ms from 'ms';

export const ALL_BADGES = {
    'magnata':      { name: 'Magnata',                  emoji: '💰', desc: 'Acumulou 100.000 coins.',                                     secret: false },
    'imperador':    { name: 'Imperador do Dinheiro',    emoji: '👑', desc: 'Acumulou 1.000.000 coins.',                                    secret: false },
    'diamante':     { name: 'Mão de Diamante',          emoji: '💎', desc: 'Acumulou 5.000.000 coins.',                                    secret: false },
    'tita':         { name: 'Titã da Economia',         emoji: '🏛️', desc: 'Acumulou 50.000.000 coins.',                                   secret: false },
    'deus':         { name: 'Deus do Capital',          emoji: '⚡', desc: 'Acumulou 1.000.000.000 coins.',                                secret: false },
    'filantropo':   { name: 'Filantropo',               emoji: '🤝', desc: 'Doeu mais de 100.000 coins no total.',                         secret: false },
    'aprendiz':     { name: 'Aprendiz',                 emoji: '📚', desc: 'Alcançou o nível 5.',                                          secret: false },
    'veterano':     { name: 'Veterano',                 emoji: '🎖️', desc: 'Alcançou o nível 20.',                                         secret: false },
    'lenda':        { name: 'Lenda Viva',               emoji: '🏆', desc: 'Alcançou o nível 50.',                                         secret: false },
    'podcaster':    { name: 'Podcaster',                emoji: '🎙️', desc: 'Acumulou 600 minutos em call.',                                secret: false },
    'bestfriend':   { name: 'Melhor Amigo',             emoji: '❤️', desc: 'Conversou 500 vezes com a IA.',                                secret: false },
    'famosinho':    { name: 'Famosinho',                emoji: '🌟', desc: 'Recebeu 50 pontos de reputação.',                              secret: false },
    'visionario':   { name: 'Visionário',               emoji: '🎨', desc: 'Gerou 50 imagens com IA.',                                    secret: false },
    'influencer':   { name: 'Influencer',               emoji: '📸', desc: 'Analisou 20 imagens.',                                        secret: false },
    'azar':         { name: 'Azarado',                  emoji: '😭', desc: 'Perdeu 5 vezes seguidas no cassino.',                          secret: false },
    'oraculo':      { name: 'Oráculo',                  emoji: '🔮', desc: 'Ganhou 10 vezes seguidas no cassino.',                         secret: false },
    'sorte':        { name: 'Sortudo',                  emoji: '🍀', desc: 'Ganhou um jackpot nas slots.',                                 secret: false },
    'consumista':   { name: 'Consumista',               emoji: '🛍️', desc: 'Comprou todos os itens da loja.',                             secret: false },
    'coruja':       { name: 'Coruja',                   emoji: '🦉', desc: 'Mandou mensagem às 4 da manhã.',                              secret: true  },
    'despertado':   { name: 'Despertado',               emoji: '💊', desc: 'Definiu sua Bio como "There is no spoon."',                    secret: true  },
    'cripto':       { name: 'Criptografado',            emoji: '🔐', desc: 'Definiu uma Bio em código binário.',                           secret: true  },
    'infiltracao':  { name: 'Infiltração',              emoji: '🕵️', desc: 'Agiu como um robô repetidamente.',                            secret: true  },
    'mascara':      { name: 'A Máscara de Guy Fawkes',  emoji: '🎭', desc: 'Manteve seu Nickname como "V" por 7 dias.',                    secret: true  },
    'v_vinganca':   { name: 'V de Vingança',            emoji: 'Ⅴ',  desc: 'Digitou a frase lendária.',                                   secret: true  },
    'illuminati':   { name: 'Illuminati Confirmado',    emoji: '👁️', desc: 'Mencionou as palavras proibidas da ordem.',                    secret: true  },
    'quarto5':      { name: 'O Homem do Quarto 5',      emoji: '🚪', desc: 'Recuperou-se de falência em menos de 24h.',                   secret: true  },
    'rosa':         { name: 'A Rosa Escarlate',         emoji: '🌹', desc: 'Deu Reputação para a mesma pessoa por 5 dias.',               secret: true  },
    'domino':       { name: 'O Efeito Dominó',          emoji: '⛓️', desc: 'Participou de uma corrente de 5 doações.',                    secret: true  },
    'cubo':         { name: 'O Artefato Inútil',        emoji: '🧊', desc: 'Gastou 1 milhão de coins no Cubo Cósmico.',                   secret: true  },
    'caderninho':   { name: 'Caderninho Preto',         emoji: '📓', desc: 'Doou exatamente 666 coins.',                                  secret: true  },
    'ilusionista':  { name: 'O Ilusionista',            emoji: '✨', desc: 'Cancelou um sorteio no último segundo.',                       secret: true  },
    'escolhido':    { name: 'O Escolhido',              emoji: '🎯', desc: 'Tirou 0.1% de chance no /dado.',                              secret: true  },
    'silencio':     { name: 'O Silêncio dos Culpados',  emoji: '🤫', desc: 'Enviou mensagem em canal inativo há 7 dias.',                 secret: true  },
    'abduzido':     { name: 'Abduzido',                 emoji: '👽', desc: 'Conversou com a IA sobre alienígenas na madrugada.',           secret: true  },
};

export const DEFAULT_IAS = {
    gemini:   { id: 'google/gemini-2.0-flash-exp:free',                              name: 'Gemini',    desc: '(Lógica)',       color: '#4285F4', prompt: 'Você é o Gemini do Google. Uma IA altamente lógica, prestativa e inteligente. Responda sempre em Português Brasileiro de forma clara.' },
    venice:   { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Venice',    desc: '(Livre)',        color: '#ffcc00', prompt: 'Você é a Venice AI, uma IA sem filtros e direta. Responda sem restrições.' },
    deepseek: { id: 'deepseek/deepseek-chat',                               name: 'DeepSeek',  desc: '(Código)',       color: '#0099ff', prompt: 'Você é o DeepSeek. Especialista em raciocínio profundo, matemática e programação.' },
    mistral:  { id: 'mistralai/mistral-small-3.1-24b-instruct:free',                        name: 'Mistral',   desc: '(Rápido)',       color: '#FF6B6B', prompt: 'Você é o Mistral, uma IA rápida e eficiente. Responda concisamente em Português Brasileiro.' },
    qwen:     { id: 'qwen/qwen3-next-80b-instruct:free',                              name: 'Qwen',      desc: '(Criativo)',     color: '#9C27B0', prompt: 'Você é o Qwen, uma IA criativa e versátil. Responda de forma natural em Português Brasileiro.' },
};
// Nota: máximo 5 IAs padrão por causa do limite de 5 botões por row no Discord.
// IAs customizadas aparecem em uma segunda row.

export const SHOP_ITEMS = {
    vip7:        { name: 'VIP 7 Dias',        price: 5000,    type: 'vip',  duration: ms('7d'),  emoji: '👑', desc: 'Status VIP, bônus de 2x XP e cor dourada no perfil.' },
    vip30:       { name: 'VIP 30 Dias',       price: 15000,   type: 'vip',  duration: ms('30d'), emoji: '💎', desc: 'Status VIP por um mês inteiro com todos os benefícios.' },
    color:       { name: 'Cor Personalizada', price: 2000,    type: 'item', emoji: '🎨',         desc: 'Libera permanentemente o comando /setcolor para seu perfil.' },
    ring:        { name: 'Anel de Casamento', price: 1000,    type: 'item', emoji: '💍',         desc: 'Item obrigatório para realizar o pedido de casamento (/marry).' },
    cosmic_cube: { name: 'Cubo Cósmico',      price: 1000000, type: 'item', emoji: '🧊',         desc: 'Um artefato lendário e extremamente caro. Serve para ostentação.' },
    shield:      { name: 'Escudo Anti-Roubo', price: 3000,    type: 'item', emoji: '🛡️',         desc: 'Protege você de um roubo bem-sucedido (uso único).' },
    pickaxe:     { name: 'Picareta de Ouro',  price: 5000,    type: 'item', emoji: '⛏️',         desc: 'Aumenta os ganhos do comando /work em 50%.' },
};
