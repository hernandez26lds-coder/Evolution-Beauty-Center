
export enum Role {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
  INVENTORY = 'INVENTORY'
}

export interface AuditFields {
  createdAt: string;
  updatedAt: string;
}

export interface Client extends AuditFields {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface Provider extends AuditFields {
  id: string;
  name: string;
  contact: string;
  phone: string;
  category: string;
  notes?: string;
}

export interface Service extends AuditFields {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  duration: number; // minutes
  status: 'Active' | 'Inactive';
  notes: string;
}

export interface Product extends AuditFields {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  cost: number;
  price: number;
  provider: string;
  unit: string; // ml, unit, etc.
  status: 'Active' | 'Inactive';
}

export interface InventoryItem {
  productId: string;
  currentStock: number;
  minStock: number;
  location: string;
}

export type MovementType = 'IN' | 'OUT';

export interface InventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  date: string;
  notes: string;
  user: string;
}

export interface TransactionItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction extends AuditFields {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'Cash' | 'Card' | 'Transfer';
  clientId?: string;
  clientName?: string;
  reference?: string;
  relatedId?: string; // Links to service/product/movement
  items?: TransactionItem[];
  provider?: string;
}

export interface AppState {
  services: Service[];
  products: Product[];
  clients: Client[];
  providers: Provider[];
  inventory: Record<string, InventoryItem>;
  movements: InventoryMovement[];
  transactions: Transaction[];
  userRole: Role;
}
