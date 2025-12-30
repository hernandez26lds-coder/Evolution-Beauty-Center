
import { Role, AppState, Service } from './types';

export const SERVICE_CATEGORIES = ['Cabello', 'Manos y Pies', 'Rostro', 'Cuidado Personal', 'Otros'];
export const PRODUCT_CATEGORIES = ['Shampoo', 'Tinte', 'Tratamiento', 'Cuidado de Uñas', 'Electrónicos', 'Consumibles'];
export const FINANCE_CATEGORIES = {
  INCOME: ['Venta de Servicio', 'Venta de Producto', 'Otro'],
  EXPENSE: ['Alquiler', 'Sueldos', 'Servicios Públicos', 'Suministros', 'Impuestos', 'Marketing', 'Otro']
};

export const FIXED_EXPENSES = [
  "Compra de Producto",
  "Pago de Renta",
  "Pago de Salario",
  "Pago Energia Electrica",
  "Pago Prestamo",
  "Compra de Material Gastable"
];

export interface ServicePreset {
  name: string;
  category: string;
  price: number;
}

export const SERVICE_PRESETS: ServicePreset[] = [
  { name: "Lavado y secado Normal Corto", category: "Cabello", price: 650 },
  { name: "Lavado y secado Normal Medio", category: "Cabello", price: 750 },
  { name: "Lavado y secado Normal Largo", category: "Cabello", price: 850 },
  { name: "Lavado y secado primiun Corto", category: "Cabello", price: 750 },
  { name: "Lavado y secado primiun Medio", category: "Cabello", price: 900 },
  { name: "Lavado y secado primiun Largo", category: "Cabello", price: 1200 },
  { name: "Corte de puntas", category: "Cabello", price: 500 },
  { name: "Corte y estilo completo", category: "Cabello", price: 800 },
  { name: "Plancha o rizos", category: "Cabello", price: 350 },
  { name: "Hidratación capilar", category: "Cabello", price: 1750 },
  { name: "Tratamiento de keratina | Onza", category: "Cabello", price: 2800 },
  { name: "Retoque de Color (raíz)", category: "Cabello", price: 2900 },
  { name: "Tinte completo Corto", category: "Cabello", price: 3800 },
  { name: "Tinte completo Medio", category: "Cabello", price: 4000 },
  { name: "Tinte completo Largo", category: "Cabello", price: 4500 },
  { name: "Mechas / Highlights | Desde", category: "Cabello", price: 5800 },
  { name: "Botox capilar | Onza", category: "Cabello", price: 2900 },
  { name: "Anti-Crespo | Onza", category: "Cabello", price: 2900 },
  { name: "Cirugia Capilar | Onza", category: "Cabello", price: 2900 },
  { name: "Manicura tradicional", category: "Manos y Pies", price: 500 },
  { name: "Manicura con Gel", category: "Manos y Pies", price: 850 },
  { name: "Pedicura tradicional", category: "Manos y Pies", price: 650 },
  { name: "Pedicura con Gel", category: "Manos y Pies", price: 1200 },
  { name: "Pintura de Mano Normal", category: "Manos y Pies", price: 300 },
  { name: "Pintada en Gel", category: "Manos y Pies", price: 500 },
  { name: "Pintura de Pies Normal", category: "Manos y Pies", price: 300 },
  { name: "Pintura de Pies con Gel", category: "Manos y Pies", price: 500 },
  { name: "Diseño de cejas", category: "Rostro", price: 300 },
  { name: "Micro-Picmentacion", category: "Rostro", price: 6000 },
  { name: "Cejas con henna", category: "Rostro", price: 600 },
  { name: "Limpieza de cejas", category: "Rostro", price: 150 },
  { name: "Extensiones de pestañas (clásicas)", category: "Rostro", price: 800 },
  { name: "Depilacion Boso", category: "Cuidado Personal", price: 300 },
  { name: "Depilacion Axilas", category: "Cuidado Personal", price: 400 },
  { name: "Depilacion Piernas", category: "Cuidado Personal", price: 800 }
];

export const INITIAL_STATE: AppState = {
  services: SERVICE_PRESETS.map((preset, index) => ({
    id: `s-${index}`,
    code: `S${String(index + 1).padStart(3, '0')}`,
    name: preset.name,
    category: preset.category,
    price: preset.price,
    duration: 30,
    status: 'Active',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  products: [
    { id: 'p1', sku: 'P001', name: 'Shampoo Reparador 500ml', brand: 'L\'Oréal', category: 'Shampoo', cost: 12.0, price: 22.0, provider: 'Distribuidora Pro', unit: 'ml', status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'p2', sku: 'P002', name: 'Tinte 7.1 Rubio Ceniza', brand: 'Wella', category: 'Tinte', cost: 8.5, price: 0, provider: 'Beauty Supply', unit: 'unidad', status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ],
  clients: [],
  inventory: {
    'p1': { productId: 'p1', currentStock: 10, minStock: 5, location: 'Estante A' },
    'p2': { productId: 'p2', currentStock: 3, minStock: 10, location: 'Estante B' }
  },
  movements: [],
  transactions: [
    { id: 't1', date: new Date().toISOString(), type: 'INCOME', category: 'Venta de Servicio', description: 'Lavado y secado Normal Corto', amount: 650.0, paymentMethod: 'Cash', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ],
  userRole: Role.ADMIN
};
