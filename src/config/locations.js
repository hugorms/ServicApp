// Configuración de ubicaciones para Venezuela

export const MUNICIPALITIES = [
  // Caracas - Distrito Capital
  'Libertador',

  // Miranda
  'Baruta', 'Brión', 'Buroz', 'Carrizal', 'Chacao', 'El Hatillo', 'Guaicaipuro',
  'Independencia', 'Lander', 'Los Salias', 'Páez', 'Paz Castillo', 'Pedro Gual',
  'Plaza', 'Simón Bolívar', 'Sucre', 'Urdaneta', 'Zamora',

  // Aragua
  'Bolívar', 'Camatagua', 'Francisco Linares Alcántara', 'Girardot', 'José Ángel Lamas',
  'José Félix Ribas', 'José Rafael Revenga', 'Libertador', 'Mario Briceño Iragorry',
  'Ocumare de la Costa de Oro', 'San Casimiro', 'San Sebastián', 'Santiago Mariño',
  'Santos Michelena', 'Sucre', 'Tovar', 'Urdaneta', 'Zamora',

  // Carabobo
  'Bejuma', 'Carlos Arvelo', 'Diego Ibarra', 'Guacara', 'Juan José Mora',
  'Libertador', 'Los Guayos', 'Miranda', 'Montalbán', 'Naguanagua',
  'Puerto Cabello', 'San Diego', 'San Joaquín', 'Valencia'
];

export const PARISHES = {
  // Caracas
  'Libertador': [
    '23 de Enero', 'Altagracia', 'Antímano', 'Candelaria', 'Caricuao',
    'Catedral', 'Coche', 'El Junquito', 'El Paraíso', 'El Recreo',
    'El Valle', 'La Pastora', 'La Vega', 'Macarao', 'San Agustín',
    'San Bernardino', 'San José', 'San Juan', 'San Pedro', 'Santa Rosalía',
    'Santa Teresa', 'Sucre'
  ],

  // Miranda - Chacao
  'Chacao': ['Chacao'],

  // Miranda - Baruta
  'Baruta': ['Baruta', 'El Cafetal', 'Las Minas de Baruta'],

  // Miranda - El Hatillo
  'El Hatillo': ['El Hatillo'],

  // Miranda - Sucre
  'Sucre': ['Leoncio Martínez', 'Petare', 'Caucagüita'],

  // Carabobo - Valencia
  'Valencia': [
    'Candelaria', 'Catedral', 'El Socorro', 'Miguel Peña', 'Rafael Urdaneta',
    'San Blas', 'San José', 'Santa Rosa'
  ],

  // Carabobo - Naguanagua
  'Naguanagua': ['Naguanagua'],

  // Carabobo - San Diego
  'San Diego': ['San Diego'],

  // Default para otros municipios
  'default': ['Centro', 'Norte', 'Sur', 'Este', 'Oeste']
};

export const SECTORS = [
  // Sectores comunes en Venezuela
  'Centro', 'Norte', 'Sur', 'Este', 'Oeste',
  'Altamira', 'Las Mercedes', 'La Castellana', 'Sabana Grande',
  'Los Palos Grandes', 'La Florida', 'Bello Monte', 'Las Acacias',
  'Macaracuay', 'La Urbina', 'Chuao', 'Los Chorros', 'Country Club',
  'Valle Arriba', 'Lomas de La Lagunita', 'La Trinidad', 'Los Naranjos',
  'El Rosal', 'Colinas de Bello Monte', 'Los Dos Caminos', 'Sebucán',
  'El Cafetal', 'Santa Mónica', 'Los Samanes', 'La Tahona'
];

export const PROPERTY_TYPES = [
  {
    value: 'conjunto_residencial',
    label: 'Conjunto Residencial',
    icon: '🏘️'
  },
  {
    value: 'edificio',
    label: 'Edificio',
    icon: '🏢'
  },
  {
    value: 'casa',
    label: 'Casa',
    icon: '🏠'
  },
  {
    value: 'local_comercial',
    label: 'Local Comercial',
    icon: '🏪'
  },
  {
    value: 'oficina',
    label: 'Oficina',
    icon: '🏢'
  }
];