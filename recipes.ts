import type { RecipeResult } from './types';

export const recipes: { [key: string]: RecipeResult } = {
  // --- Fusão de Elementos ---
  'Hélio+Hélio': { text: 'Carbono', emoji: '🪨' },
  'Carbono+Hélio': { text: 'Oxigênio', emoji: '💨' },
  'Hidrogênio+Hidrogênio': { text: 'Hélio', emoji: '🎈' },
  'Carbono+Oxigênio': { text: 'Silício', emoji: '💎' },
  'Silício+Silício': { text: 'Ferro', emoji: '⚙️' },

  // --- Objetos Celestes Básicos ---
  'Gravidade+Hidrogênio': { text: 'Nuvem de Gás', emoji: '☁️' },
  'Nuvem de Gás+Tempo': { text: 'Protoestrela', emoji: '✨' },
  'Gravidade+Protoestrela': { text: 'Estrela', emoji: '⭐' },

  // --- Ciclo de Vida de Estrelas de Baixa Massa ---
  'Estrela+Tempo': { text: 'Gigante Vermelha', emoji: '🔴' },
  'Gigante Vermelha+Gravidade': { text: 'Anã Branca', emoji: '⚪' },
  'Anã Branca+Tempo': { text: 'Anã Negra', emoji: '⚫' },
  
  // --- Ciclo de Vida de Estrelas de Alta Massa ---
  'Estrela+Nuvem de Gás': { text: 'Estrela Massiva', emoji: '☀️' },
  'Estrela Massiva+Tempo': { text: 'Supergigante Azul', emoji: '🔵' },
  'Supergigante Azul+Tempo': { text: 'Supergigante Vermelha', emoji: '🏮' },
  'Estrela Massiva+Ferro': { text: 'Colapso do Núcleo', emoji: '💥' },
  'Colapso do Núcleo+Gravidade': { text: 'Supernova', emoji: '💥' },
  'Gravidade+Supergigante Vermelha': { text: 'Supernova', emoji: '💥' },

  // --- Remanescentes Estelares e Exóticos ---
  'Gravidade+Supernova': { text: 'Estrela de Nêutrons', emoji: '🌠' },
  'Estrela de Nêutrons+Gravidade': { text: 'Buraco Negro', emoji: '🕳️' },
  'Estrela de Nêutrons+Tempo': { text: 'Pulsar', emoji: '💫' },
  
  // --- Estruturas Galácticas ---
  'Estrela+Estrela': { text: 'Sistema Binário', emoji: '⭐⭐' },
  'Nuvem de Gás+Supernova': { text: 'Nebulosa', emoji: '🌌' },
  'Gravidade+Nebulosa': { text: 'Aglomerado Estelar', emoji: '✨' },
  'Buraco Negro+Buraco Negro': { text: 'Buraco Negro Supermassivo', emoji: '🌀' },
  'Aglomerado Estelar+Buraco Negro Supermassivo': { text: 'Galáxia', emoji: '🪐' },
  'Galáxia+Galáxia': { text: 'Colisão de Galáxias', emoji: '☄️' },
  'Buraco Negro+Estrela': { text: 'Disco de Acréscimo', emoji: '🛸' },
  'Disco de Acréscimo+Tempo': { text: 'Quasar', emoji: '🔆' },

  // --- Combinações Instáveis e Explosivas ---
  'Anã Branca+Estrela': { isExplosion: true }, // Supernova Tipo Ia
  'Estrela de Nêutrons+Estrela de Nêutrons': { isExplosion: true }, // Kilonova
  'Buraco Negro+Supergigante Vermelha': { isExplosion: true },
  'Buraco Negro+Galáxia': { isExplosion: true },
  'Supernova+Supernova': { isExplosion: true },
  'Galáxia+Quasar': { isExplosion: true },
  'Buraco Negro+Tempo': { isExplosion: true },
  'Buraco Negro+Pulsar': { isExplosion: true },
};
