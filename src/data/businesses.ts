// Todos los comercios y sus datos son ficticios. No se consulta la ubicación del celular.
export const categories = ['Todas', 'Panaderías', 'Cafeterías', 'Farmacias'] as const;

export type Category = (typeof categories)[number];

export type Business = {
  id: string;
  name: string;
  category: Exclude<Category, 'Todas'>;
  initials: string;
  distance: string;
  rating: string;
  isOpen: boolean;
  promotion?: string;
};

export const businesses: Business[] = [
  {
    id: 'panaderia-la-esquina',
    name: 'Panadería La Esquina',
    category: 'Panaderías',
    initials: 'LE',
    distance: '250 m',
    rating: '4,8',
    isOpen: true,
    promotion: '15% de descuento en panificados',
  },
  {
    id: 'cafe-jacaranda',
    name: 'Café Jacarandá',
    category: 'Cafeterías',
    initials: 'CJ',
    distance: '400 m',
    rating: '4,9',
    isOpen: true,
    promotion: 'Café + medialuna a precio especial',
  },
  {
    id: 'farmacia-del-barrio',
    name: 'Farmacia del Barrio',
    category: 'Farmacias',
    initials: 'FB',
    distance: '650 m',
    rating: '4,6',
    isOpen: false,
  },
];

// Permite encontrar "Café" escribiendo "cafe", sin distinguir mayúsculas ni tildes.
function normalizeText(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function filterBusinesses(query: string, category: Category) {
  const search = normalizeText(query);

  return businesses.filter((business) => {
    const matchesCategory = category === 'Todas' || business.category === category;
    const matchesSearch = normalizeText(`${business.name} ${business.category}`).includes(search);

    return matchesCategory && matchesSearch;
  });
}
