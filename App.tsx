
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DataTable from './components/DataTable';
import * as XLSX from 'xlsx';
import { 
  AppState, 
  Service, 
  Product, 
  InventoryMovement, 
  Transaction, 
  Role,
  TransactionType,
  TransactionItem,
  Client,
  Provider
} from './types';
import { 
  INITIAL_STATE, 
  SERVICE_CATEGORIES, 
  PRODUCT_CATEGORIES, 
  FINANCE_CATEGORIES,
  SERVICE_PRESETS,
  FIXED_EXPENSES
} from './constants';
import { 
  exportToExcel, 
  generateMonthlyReport,
  exportFullSystemBackup 
} from './utils/export';
import { 
  Plus, 
  Download, 
  Save, 
  FileText,
  X as XIcon,
  ShoppingCart,
  Scissors,
  Trash2,
  Receipt,
  Users,
  History,
  Phone,
  Clock,
  Database,
  Truck,
  Tag,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  FileUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  DollarSign
} from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('evolution_salon_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_STATE,
          ...parsed,
          providers: parsed.providers || INITIAL_STATE.providers,
          clients: parsed.clients || [],
          transactions: parsed.transactions || [],
          services: parsed.services || INITIAL_STATE.services,
          products: parsed.products || INITIAL_STATE.products,
          inventory: parsed.inventory || INITIAL_STATE.inventory,
          movements: parsed.movements || []
        };
      }
    } catch (e) {
      console.error("Error loading state", e);
    }
    return INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'service' | 'product' | 'inventory' | 'finance' | 'client' | 'history' | 'provider' | null>(null);
  const [financeMode, setFinanceMode] = useState<'SERVICE' | 'PRODUCT' | 'GENERAL'>('GENERAL');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
  const [importStatus, setImportStatus] = useState<{type: string, count: number} | null>(null);

  const [financeForm, setFinanceForm] = useState({
    clientId: '',
    clientName: '',
    items: [] as TransactionItem[],
    category: FINANCE_CATEGORIES.INCOME[0],
    type: 'INCOME' as TransactionType,
    paymentMethod: 'Cash' as 'Cash' | 'Card' | 'Transfer',
    description: '',
    amount: 0,
    provider: ''
  });

  const [inventoryForm, setInventoryForm] = useState({
    productId: '',
    name: '',
    brand: '',
    unit: '',
    cost: 0,
    price: 0,
    quantity: 0,
    type: 'IN' as 'IN' | 'OUT',
    reason: 'Compra de Insumo'
  });

  useEffect(() => {
    localStorage.setItem('evolution_salon_data', JSON.stringify(state));
  }, [state]);

  const handleResetData = () => {
    localStorage.removeItem('evolution_salon_data');
    setState(INITIAL_STATE);
    setActiveTab('dashboard');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>, type: 'products' | 'services' | 'clients' | 'providers') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      setState(prev => {
        let newState = { ...prev };
        let updatedCount = 0;

        data.forEach(row => {
          if (type === 'products') {
            const existingIdx = prev.products.findIndex(p => p.sku === String(row.SKU || row.sku) || p.name === row.Nombre);
            const product: Product = {
              id: existingIdx >= 0 ? prev.products[existingIdx].id : crypto.randomUUID(),
              sku: String(row.SKU || row.sku || `P-${Date.now()}`),
              name: row.Nombre || row.name,
              brand: row.Marca || row.brand || 'Genérico',
              category: row.Categoria || row.category || 'Otros',
              cost: Number(row.Costo || row.cost || 0),
              price: Number(row.Precio || row.price || 0),
              provider: row.Suplidor || row.provider || 'General',
              unit: row.Unidad || row.unit || 'unid',
              status: 'Active',
              createdAt: existingIdx >= 0 ? prev.products[existingIdx].createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            if (existingIdx >= 0) {
              newState.products[existingIdx] = product;
            } else {
              newState.products.push(product);
              if (!newState.inventory[product.id]) {
                newState.inventory[product.id] = { productId: product.id, currentStock: Number(row.Stock || 0), minStock: 5, location: 'General' };
              }
            }
          } 
          else if (type === 'services') {
            const existingIdx = prev.services.findIndex(s => s.code === String(row.Codigo || row.code) || s.name === row.Nombre);
            const service: Service = {
              id: existingIdx >= 0 ? prev.services[existingIdx].id : crypto.randomUUID(),
              code: String(row.Codigo || row.code || `S-${Date.now()}`),
              name: row.Nombre || row.name,
              category: row.Categoria || row.category || 'Otros',
              price: Number(row.Precio || row.price || 0),
              duration: Number(row.Duracion || row.duration || 30),
              status: 'Active',
              notes: row.Notas || row.notes || '',
              createdAt: existingIdx >= 0 ? prev.services[existingIdx].createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            if (existingIdx >= 0) newState.services[existingIdx] = service;
            else newState.services.push(service);
          }
          else if (type === 'clients') {
            const existingIdx = prev.clients.findIndex(c => c.phone === String(row.Telefono || row.phone));
            const client: Client = {
              id: existingIdx >= 0 ? prev.clients[existingIdx].id : crypto.randomUUID(),
              name: row.Nombre || row.name,
              phone: String(row.Telefono || row.phone),
              email: row.Email || row.email || '',
              notes: row.Notas || row.notes || '',
              createdAt: existingIdx >= 0 ? prev.clients[existingIdx].createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            if (existingIdx >= 0) newState.clients[existingIdx] = client;
            else newState.clients.push(client);
          }
          else if (type === 'providers') {
            const existingIdx = prev.providers.findIndex(p => p.name === row.Nombre);
            const provider: Provider = {
              id: existingIdx >= 0 ? prev.providers[existingIdx].id : crypto.randomUUID(),
              name: row.Nombre || row.name,
              contact: row.Contacto || row.contact || '',
              phone: String(row.Telefono || row.phone || ''),
              category: row.Categoria || row.category || 'Insumos',
              notes: row.Notas || row.notes || '',
              createdAt: existingIdx >= 0 ? prev.providers[existingIdx].createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            if (existingIdx >= 0) newState.providers[existingIdx] = provider;
            else newState.providers.push(provider);
          }
          updatedCount++;
        });

        setImportStatus({ type, count: updatedCount });
        setTimeout(() => setImportStatus(null), 5000);
        return newState;
      });
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  const handleSaveInventoryMovement = () => {
    const { productId, name, brand, unit, cost, price, quantity, type, reason } = inventoryForm;
    
    if (!name || quantity <= 0) {
      alert("Por favor complete el nombre y la cantidad.");
      return;
    }

    setState(prev => {
      let targetProductId = productId;
      let updatedProducts = [...prev.products];
      
      if (!targetProductId) {
        const existing = prev.products.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          targetProductId = existing.id;
        } else {
          const newProduct: Product = {
            id: crypto.randomUUID(),
            sku: `P-${Date.now()}`,
            name,
            brand,
            unit,
            cost,
            price,
            category: 'Insumos',
            provider: 'General',
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          updatedProducts.push(newProduct);
          targetProductId = newProduct.id;
        }
      }

      updatedProducts = updatedProducts.map(p => {
        if (p.id === targetProductId) {
          return {
            ...p,
            brand: brand || p.brand,
            unit: unit || p.unit,
            cost: type === 'IN' ? (cost || p.cost) : p.cost,
            price: type === 'IN' ? (price || p.price) : p.price,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });

      const currentStock = prev.inventory[targetProductId]?.currentStock || 0;
      const newStock = type === 'IN' ? currentStock + quantity : currentStock - quantity;

      if (newStock < 0) {
        alert("Error: Stock insuficiente.");
        return prev;
      }

      const newMovement: InventoryMovement = {
        id: crypto.randomUUID(),
        productId: targetProductId,
        type,
        quantity,
        reason,
        date: new Date().toISOString(),
        notes: `Registro manual - ${reason}`,
        user: prev.userRole
      };

      return {
        ...prev,
        products: updatedProducts,
        movements: [newMovement, ...prev.movements],
        inventory: {
          ...prev.inventory,
          [targetProductId]: {
            productId: targetProductId,
            currentStock: newStock,
            minStock: prev.inventory[targetProductId]?.minStock || 5,
            location: prev.inventory[targetProductId]?.location || 'General'
          }
        }
      };
    });

    setIsModalOpen(false);
  };

  const handleSaveTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: editingItem?.id || crypto.randomUUID(),
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setState(prev => {
      const updatedInventory = { ...prev.inventory };
      const newMovements = [...prev.movements];

      if (transaction.items) {
        transaction.items.forEach(item => {
          if (item.type === 'product') {
            const product = prev.products.find(p => p.id === item.id || p.sku === item.id);
            if (product) {
              const currentStock = updatedInventory[product.id]?.currentStock || 0;
              updatedInventory[product.id] = {
                ...updatedInventory[product.id],
                currentStock: currentStock - item.quantity
              };
              newMovements.unshift({
                id: crypto.randomUUID(),
                productId: product.id,
                type: 'OUT',
                quantity: item.quantity,
                reason: 'Venta',
                date: new Date().toISOString(),
                notes: `Venta a ${transaction.clientName || 'Cliente'}`,
                user: prev.userRole
              });
            }
          }
        });
      }

      if (editingItem) {
        return {
          ...prev,
          transactions: prev.transactions.map(t => t.id === editingItem.id ? newTransaction : t),
          inventory: updatedInventory,
          movements: newMovements
        };
      }
      return {
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
        inventory: updatedInventory,
        movements: newMovements
      };
    });
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveService = (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newService: Service = {
      ...service,
      id: editingItem?.id || crypto.randomUUID(),
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      services: editingItem ? prev.services.map(s => s.id === editingItem.id ? newService : s) : [newService, ...prev.services]
    }));
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, initialStock: number) => {
    const newProduct: Product = {
      ...productData,
      id: editingItem?.id || crypto.randomUUID(),
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setState(prev => {
      const updatedInventory = { ...prev.inventory };
      if (!updatedInventory[newProduct.id]) {
        updatedInventory[newProduct.id] = { 
          productId: newProduct.id, 
          currentStock: initialStock, 
          minStock: 5, 
          location: 'General' 
        };
      } else if (editingItem) {
        updatedInventory[newProduct.id] = {
          ...updatedInventory[newProduct.id],
          currentStock: initialStock
        };
      }
      
      return {
        ...prev,
        products: editingItem ? prev.products.map(p => p.id === editingItem.id ? newProduct : p) : [newProduct, ...prev.products],
        inventory: updatedInventory
      };
    });
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveProvider = (provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProvider: Provider = {
      ...provider,
      id: editingItem?.id || crypto.randomUUID(),
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      providers: editingItem ? prev.providers.map(p => p.id === editingItem.id ? newProvider : p) : [newProvider, ...prev.providers]
    }));
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveClient = (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newClient: Client = {
      ...client,
      id: editingItem?.id || crypto.randomUUID(),
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      clients: editingItem ? prev.clients.map(c => c.id === editingItem.id ? newClient : c) : [newClient, ...prev.clients]
    }));
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const openModal = (type: 'service' | 'product' | 'inventory' | 'finance' | 'client' | 'history' | 'provider', mode: any = 'GENERAL', item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    if (type === 'finance') {
      setFinanceMode(mode);
      if (item) {
        setFinanceForm({
          clientId: item.clientId || '',
          clientName: item.clientName || '',
          items: item.items || [],
          category: item.category,
          type: item.type,
          paymentMethod: item.paymentMethod,
          description: item.description,
          amount: item.amount,
          provider: item.provider || ''
        });
      } else {
        setFinanceForm({
          clientId: '',
          clientName: '',
          items: [],
          category: mode === 'SERVICE' ? 'Venta de Servicio' : (mode === 'PRODUCT' ? 'Venta de Producto' : (mode === 'GENERAL' ? FINANCE_CATEGORIES.EXPENSE[0] : FINANCE_CATEGORIES.INCOME[0])),
          type: mode === 'GENERAL' ? 'EXPENSE' : 'INCOME',
          paymentMethod: 'Cash',
          description: '',
          amount: 0,
          provider: ''
        });
      }
    } else if (type === 'inventory') {
      setInventoryForm({
        productId: '',
        name: '',
        brand: '',
        unit: '',
        cost: 0,
        price: 0,
        quantity: 0,
        type: 'IN',
        reason: 'Compra de Insumo'
      });
    } else if (type === 'history') {
      setSelectedClientForHistory(item);
    }
    setIsModalOpen(true);
  };

  const addItemToFinance = (item: { id: string, name: string, price: number, type: 'service' | 'product' }) => {
    setFinanceForm(prev => {
      const existing = prev.items.find(i => i.id === item.id);
      let newItems;
      if (existing) {
        newItems = prev.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        newItems = [...prev.items, { ...item, quantity: 1 }];
      }
      const total = newItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      const desc = newItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
      return { ...prev, items: newItems, amount: total, description: desc };
    });
  };

  const removeItemFromFinance = (id: string) => {
    setFinanceForm(prev => {
      const newItems = prev.items.filter(i => i.id !== id);
      const total = newItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      const desc = newItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
      return { ...prev, items: newItems, amount: total, description: desc };
    });
  };

  const clientHistorySummary = useMemo(() => {
    if (!selectedClientForHistory) return null;
    const history = state.transactions
      .filter(t => t.clientId === selectedClientForHistory.id || t.clientName === selectedClientForHistory.name)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const totalSpent = history.reduce((acc, curr) => acc + curr.amount, 0);
    const lastVisit = history[0]?.date || null;
    const totalVisits = history.length;

    return { totalSpent, lastVisit, totalVisits, history };
  }, [selectedClientForHistory, state.transactions]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard state={state} />;
      case 'finance': return (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Caja y Finanzas</h2>
              <p className="text-gray-500">Gestión de ingresos y egresos</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => exportFullSystemBackup(state)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-all shadow-sm"><Database size={16} /> Respaldo DB</button>
              <button onClick={() => openModal('finance', 'SERVICE')} className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 flex items-center gap-2 shadow-sm text-sm font-bold transition-all"><Scissors size={16} /> Venta Servicio</button>
              <button onClick={() => openModal('finance', 'PRODUCT')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 flex items-center gap-2 shadow-sm text-sm font-bold transition-all"><ShoppingCart size={16} /> Venta Producto</button>
              <button onClick={() => openModal('finance', 'GENERAL')} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 flex items-center gap-2 shadow-sm text-sm font-bold transition-all"><Receipt size={16} /> Registrar Gasto</button>
            </div>
          </div>
          <DataTable<Transaction> 
            data={state.transactions} searchKey="description"
            columns={[
              { header: 'Fecha', accessor: (t) => new Date(t.date).toLocaleDateString() },
              { header: 'Cliente/Suplidor', accessor: (t) => t.clientName || t.provider || '-' },
              { header: 'Detalle', accessor: (t) => <span className="max-w-xs block truncate">{t.description}</span> },
              { header: 'Monto', accessor: (t) => <span className={`font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>${t.amount.toLocaleString()}</span> },
              { header: 'Método', accessor: 'paymentMethod' }
            ]}
            onEdit={(t) => openModal('finance', t.items && t.items.length > 0 ? (t.items[0].type === 'product' ? 'PRODUCT' : 'SERVICE') : 'GENERAL', t)}
            onDelete={(t) => confirm('¿Eliminar esta transacción permanentemente? Esta acción no se puede deshacer.') && setState(prev => ({ ...prev, transactions: prev.transactions.filter(item => item.id !== t.id) }))}
          />
        </div>
      );
      case 'clients': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div><h2 className="text-2xl font-bold">Clientes</h2><p className="text-gray-500">Base de datos de clientes registrados</p></div>
            <button onClick={() => openModal('client')} className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 flex items-center gap-2 font-bold transition-all"><Plus size={16} /> Nuevo Cliente</button>
          </div>
          <DataTable<Client> 
            data={state.clients} searchKey="name" 
            columns={[
              { header: 'Nombre', accessor: (c) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 font-bold text-xs">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{c.name}</span>
                </div>
              )},
              { header: 'Teléfono', accessor: (c) => <span className="text-gray-600">{c.phone}</span> },
              { header: 'Email', accessor: (c) => c.email || '-' },
              { header: 'Histórico', accessor: (c) => (
                <button 
                  onClick={() => openModal('history', null, c)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gold-600 hover:text-gold-700 uppercase tracking-wider px-3 py-1.5 bg-gold-50 rounded-lg border border-gold-100 transition-all hover:bg-gold-100 shadow-sm"
                >
                  <History size={14} /> Ver Visitas
                </button>
              )}
            ]} 
            onEdit={(c) => openModal('client', null, c)} 
            onDelete={(c) => confirm(`¿Seguro que deseas eliminar a ${c.name}? Las transacciones pasadas asociadas no se borrarán pero el cliente dejará de figurar en el catálogo.`) && setState(prev => ({ ...prev, clients: prev.clients.filter(i => i.id !== c.id) }))} 
          />
        </div>
      );
      case 'providers': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div><h2 className="text-2xl font-bold">Suplidores</h2><p className="text-gray-500">Gestión de proveedores del salón</p></div>
            <button onClick={() => openModal('provider')} className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 flex items-center gap-2 font-bold transition-all"><Plus size={16} /> Nuevo Suplidor</button>
          </div>
          <DataTable<Provider> 
            data={state.providers} searchKey="name" 
            columns={[
              { header: 'Suplidor', accessor: (p) => (
                <div className="font-bold text-gray-900">{p.name}</div>
              )},
              { header: 'Contacto', accessor: 'contact' },
              { header: 'Teléfono', accessor: 'phone' },
              { header: 'Categoría', accessor: 'category' }
            ]} 
            onEdit={(p) => openModal('provider', null, p)} 
            onDelete={(p) => confirm(`¿Seguro que deseas eliminar al suplidor ${p.name}?`) && setState(prev => ({ ...prev, providers: prev.providers.filter(i => i.id !== p.id) }))} 
          />
        </div>
      );
      case 'services': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div><h2 className="text-2xl font-bold">Servicios</h2><p className="text-gray-500">Catálogo de servicios del salón</p></div>
            <button onClick={() => openModal('service')} className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 flex items-center gap-2 font-bold transition-all"><Plus size={16} /> Nuevo Servicio</button>
          </div>
          <DataTable<Service> data={state.services} searchKey="name" columns={[
            { header: 'Código', accessor: 'code' }, { header: 'Nombre', accessor: 'name' }, { header: 'Categoría', accessor: 'category' }, { header: 'Precio', accessor: (s) => `$${s.price.toLocaleString()}` }
          ]} onEdit={(s) => openModal('service', null, s)} onDelete={(s) => confirm('¿Borrar este servicio del catálogo?') && setState(prev => ({ ...prev, services: prev.services.filter(i => i.id !== s.id) }))} />
        </div>
      );
      case 'products': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div><h2 className="text-2xl font-bold">Productos</h2><p className="text-gray-500">Insumos y Venta</p></div>
            <button onClick={() => openModal('product')} className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 font-bold flex items-center gap-2 transition-all"><Plus size={16} /> Nuevo Producto</button>
          </div>
          <DataTable<Product> data={state.products} searchKey="name" columns={[
            { header: 'SKU', accessor: 'sku' }, 
            { header: 'Nombre', accessor: 'name' }, 
            { header: 'Marca', accessor: 'brand' }, 
            { header: 'Tamaño', accessor: 'unit' },
            { header: 'Precio', accessor: (p) => `$${p.price.toLocaleString()}` },
            { header: 'Stock', accessor: (p) => <span className={(state.inventory[p.id]?.currentStock || 0) <= (state.inventory[p.id]?.minStock || 0) ? 'text-red-500 font-bold' : ''}>{state.inventory[p.id]?.currentStock || 0}</span> }
          ]} onEdit={(p) => openModal('product', null, p)} onDelete={(p) => confirm(`¿Seguro que deseas eliminar el producto ${p.name}? Se perderá la información de stock actual asociada.`) && setState(prev => ({ ...prev, products: prev.products.filter(i => i.id !== p.id) }))} />
        </div>
      );
      case 'inventory': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div><h2 className="text-2xl font-bold">Inventario</h2><p className="text-gray-500">Kardex de movimientos</p></div>
            <div className="flex gap-2">
              <button onClick={() => generateMonthlyReport(state)} className="px-4 py-2 border rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-all"><FileText size={16} /> Reporte Mensual</button>
              <button onClick={() => openModal('inventory')} className="px-4 py-2 bg-black text-white rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all"><Plus size={16} /> Entrada/Salida</button>
            </div>
          </div>
          <DataTable<InventoryMovement> 
            data={state.movements} 
            columns={[
              { header: 'Fecha', accessor: (m) => new Date(m.date).toLocaleString() },
              { header: 'Producto', accessor: (m) => state.products.find(p => p.id === m.productId)?.name || '?' },
              { header: 'Tipo', accessor: (m) => <span className={m.type === 'IN' ? 'text-green-600' : 'text-red-500'}>{m.type === 'IN' ? 'Entrada (+)' : 'Salida (-)'}</span> },
              { header: 'Cantidad', accessor: 'quantity' },
              { header: 'Motivo', accessor: 'reason' }
            ]} 
            onDelete={(m) => confirm('¿Eliminar este registro del historial? Nota: Esto no revertirá el cambio en el stock actual, solo borra el registro histórico.') && setState(prev => ({ ...prev, movements: prev.movements.filter(item => item.id !== m.id) }))}
          />
        </div>
      );
      case 'imports': return (
        <div className="space-y-8 pb-10">
          <header>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Catálogos e Importación</h2>
            <p className="text-gray-500 mt-1">Actualiza masivamente tus datos mediante archivos de Excel (.xlsx)</p>
          </header>

          {importStatus && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 size={24} />
              <div className="font-bold">¡Importación Exitosa! Se procesaron {importStatus.count} registros de {importStatus.type}.</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gold-50 text-gold-600 rounded-3xl"><Package size={28} /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Catálogo de Productos</h3>
                  <p className="text-sm text-gray-500 font-medium">Actualiza precios, costos y stock inicial</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Columnas requeridas: SKU, Nombre, Marca, Precio, Costo, Stock</p>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-100 border-dashed rounded-[2rem] cursor-pointer bg-gray-50 hover:bg-gold-50/30 hover:border-gold-300 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileSpreadsheet size={32} className="text-gray-300 group-hover:text-gold-500 mb-2" />
                    <p className="text-sm text-gray-500 group-hover:text-gold-600 font-bold uppercase tracking-widest">Subir Excel de Productos</p>
                  </div>
                  <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => handleImportExcel(e, 'products')} />
                </label>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl"><Scissors size={28} /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Catálogo de Servicios</h3>
                  <p className="text-sm text-gray-500 font-medium">Actualiza precios y categorías de servicios</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Columnas requeridas: Codigo, Nombre, Categoria, Precio, Duracion</p>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-100 border-dashed rounded-[2rem] cursor-pointer bg-gray-50 hover:bg-emerald-50/30 hover:border-emerald-300 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileSpreadsheet size={32} className="text-gray-300 group-hover:text-emerald-500 mb-2" />
                    <p className="text-sm text-gray-500 group-hover:text-emerald-600 font-bold uppercase tracking-widest">Subir Excel de Servicios</p>
                  </div>
                  <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => handleImportExcel(e, 'services')} />
                </label>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl"><Users size={28} /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Base de Clientes</h3>
                  <p className="text-sm text-gray-500 font-medium">Importa tu cartera de clientes externa</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Columnas requeridas: Nombre, Telefono, Email, Notas</p>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-100 border-dashed rounded-[2rem] cursor-pointer bg-gray-50 hover:bg-blue-50/30 hover:border-blue-300 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileSpreadsheet size={32} className="text-gray-300 group-hover:text-blue-500 mb-2" />
                    <p className="text-sm text-gray-500 group-hover:text-blue-600 font-bold uppercase tracking-widest">Subir Excel de Clientes</p>
                  </div>
                  <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => handleImportExcel(e, 'clients')} />
                </label>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-purple-50 text-purple-600 rounded-3xl"><Truck size={28} /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Directorio de Suplidores</h3>
                  <p className="text-sm text-gray-500 font-medium">Gestiona tus proveedores externos</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Columnas requeridas: Nombre, Contacto, Telefono, Categoria</p>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-100 border-dashed rounded-[2rem] cursor-pointer bg-gray-50 hover:bg-purple-50/30 hover:border-purple-300 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileSpreadsheet size={32} className="text-gray-300 group-hover:text-purple-500 mb-2" />
                    <p className="text-sm text-gray-500 group-hover:text-purple-600 font-bold uppercase tracking-widest">Subir Excel de Suplidores</p>
                  </div>
                  <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => handleImportExcel(e, 'providers')} />
                </label>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 p-8 rounded-[3rem] text-white overflow-hidden relative shadow-2xl">
            <div className="relative z-10 flex items-center gap-6">
              <div className="p-4 bg-amber-500/20 text-amber-500 rounded-3xl"><AlertCircle size={32} /></div>
              <div>
                <h4 className="text-xl font-bold">Consejo para Importaciones</h4>
                <p className="text-gray-400 mt-1 max-w-2xl font-medium">Si ya tienes registros con el mismo nombre o código, el sistema detectará el conflicto y actualizará la información con los nuevos datos del Excel. No se crearán duplicados.</p>
              </div>
            </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userRole={state.userRole} onReset={handleResetData}>
      {renderContent()}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`bg-white rounded-[2rem] w-full ${modalType === 'history' ? 'max-w-4xl' : 'max-w-2xl'} overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col`}>
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-[#fafafa]">
              <h3 className="text-lg font-bold uppercase tracking-widest text-gray-800">
                {editingItem ? (modalType === 'history' ? 'Historial de Visitas' : 'Editar') : 'Nuevo'} {
                  modalType === 'service' ? 'Servicio' : 
                  modalType === 'product' ? 'Producto' : 
                  modalType === 'inventory' ? 'Movimiento de Inventario' : 
                  modalType === 'client' ? 'Cliente' :
                  modalType === 'provider' ? 'Suplidor' :
                  modalType === 'history' ? `${selectedClientForHistory?.name}` :
                  (financeMode === 'SERVICE' ? 'Venta de Servicios' : (financeMode === 'PRODUCT' ? 'Venta de Productos' : 'Registro de Gasto'))
                }
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gold-500 p-2 transition-colors"><XIcon size={24} /></button>
            </div>
            
            <div className="p-8 overflow-y-auto">
              {modalType === 'service' && (
                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSaveService({
                    code: formData.get('code') as string,
                    name: formData.get('name') as string,
                    category: formData.get('category') as string,
                    price: Number(formData.get('price')),
                    duration: Number(formData.get('duration')),
                    status: 'Active',
                    notes: '',
                  });
                }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Código</label><input name="code" defaultValue={editingItem?.code} className="w-full p-3 bg-gray-50 rounded-xl" required /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Categoría</label><select name="category" defaultValue={editingItem?.category} className="w-full p-3 bg-gray-50 rounded-xl">{SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Nombre</label><input name="name" defaultValue={editingItem?.name} className="w-full p-3 bg-gray-50 rounded-xl" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Precio ($)</label><input name="price" type="number" defaultValue={editingItem?.price} className="w-full p-3 bg-gray-50 rounded-xl" required /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Duración (min)</label><input name="duration" type="number" defaultValue={editingItem?.duration} className="w-full p-3 bg-gray-50 rounded-xl" required /></div>
                  </div>
                  <button type="submit" className="w-full py-4 bg-gold-500 text-white rounded-2xl font-bold uppercase tracking-widest transition-all"><Save size={18} className="inline mr-2" /> Guardar</button>
                </form>
              )}

              {modalType === 'inventory' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Producto</label>
                      <select 
                        value={inventoryForm.productId}
                        onChange={(e) => {
                          const p = state.products.find(prod => prod.id === e.target.value);
                          if (p) setInventoryForm({...inventoryForm, productId: p.id, name: p.name, brand: p.brand, unit: p.unit, cost: p.cost, price: p.price});
                          else setInventoryForm({...inventoryForm, productId: '', name: ''});
                        }}
                        className="w-full p-3 bg-gray-50 rounded-xl font-medium"
                      >
                        <option value="">-- Nuevo Producto / Otros --</option>
                        {state.products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Nombre</label>
                      <input 
                        type="text" 
                        value={inventoryForm.name} 
                        onChange={(e) => setInventoryForm({...inventoryForm, name: e.target.value})} 
                        className="w-full p-3 bg-gray-50 rounded-xl" 
                        placeholder="Nombre completo..."
                        disabled={!!inventoryForm.productId}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Marca</label>
                      <input 
                        type="text" 
                        value={inventoryForm.brand} 
                        onChange={(e) => setInventoryForm({...inventoryForm, brand: e.target.value})} 
                        className="w-full p-3 bg-gray-50 rounded-xl" 
                        placeholder="Ej. L'Oréal"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Tamaño / Unidad</label>
                      <input 
                        type="text" 
                        value={inventoryForm.unit} 
                        onChange={(e) => setInventoryForm({...inventoryForm, unit: e.target.value})} 
                        className="w-full p-3 bg-gray-50 rounded-xl" 
                        placeholder="Ej. 500ml / 1 Unid"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Precio Compra ($)</label>
                      <input 
                        type="number" 
                        value={inventoryForm.cost} 
                        onChange={(e) => setInventoryForm({...inventoryForm, cost: Number(e.target.value)})} 
                        className="w-full p-3 bg-gray-50 rounded-xl" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Precio Venta ($)</label>
                      <input 
                        type="number" 
                        value={inventoryForm.price} 
                        onChange={(e) => setInventoryForm({...inventoryForm, price: Number(e.target.value)})} 
                        className="w-full p-3 bg-gray-50 rounded-xl" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Tipo Movimiento</label>
                      <div className="flex gap-2 mt-1">
                        <button 
                          onClick={() => setInventoryForm({...inventoryForm, type: 'IN'})}
                          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${inventoryForm.type === 'IN' ? 'bg-green-600 text-white' : 'bg-white text-gray-400'}`}
                        >
                          <ArrowDownCircle size={14} /> Entrada
                        </button>
                        <button 
                          onClick={() => setInventoryForm({...inventoryForm, type: 'OUT'})}
                          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${inventoryForm.type === 'OUT' ? 'bg-red-600 text-white' : 'bg-white text-gray-400'}`}
                        >
                          <ArrowUpCircle size={14} /> Salida
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Cantidad</label>
                      <input 
                        type="number" 
                        value={inventoryForm.quantity} 
                        onChange={(e) => setInventoryForm({...inventoryForm, quantity: Number(e.target.value)})} 
                        className="w-full p-2 bg-white rounded-lg border border-gray-100 font-bold text-center text-lg" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Motivo / Notas</label>
                    <input 
                      type="text" 
                      value={inventoryForm.reason} 
                      onChange={(e) => setInventoryForm({...inventoryForm, reason: e.target.value})} 
                      className="w-full p-3 bg-gray-50 rounded-xl" 
                      placeholder="Ej. Reposición mensual"
                    />
                  </div>

                  <button 
                    onClick={handleSaveInventoryMovement}
                    className={`w-full py-4 ${inventoryForm.type === 'IN' ? 'bg-green-600' : 'bg-red-600'} text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3`}
                  >
                    <Save size={18} /> Procesar {inventoryForm.type === 'IN' ? 'Entrada' : 'Salida'}
                  </button>
                </div>
              )}

              {modalType === 'product' && (
                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSaveProduct({
                    sku: formData.get('sku') as string || `P-${Date.now()}`,
                    name: formData.get('name') as string,
                    brand: formData.get('brand') as string,
                    category: formData.get('category') as string,
                    cost: Number(formData.get('cost') || 0),
                    price: Number(formData.get('price')),
                    provider: formData.get('provider') as string || 'General',
                    unit: formData.get('unit') as string,
                    status: 'Active',
                  }, Number(formData.get('stock') || 0));
                }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Nombre del Producto</label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input name="name" defaultValue={editingItem?.name} className="w-full pl-10 p-3 bg-gray-50 rounded-xl" placeholder="Ej. Shampoo Keratina" required />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Marca</label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input name="brand" defaultValue={editingItem?.brand} className="w-full pl-10 p-3 bg-gray-50 rounded-xl" placeholder="Ej. L'Oréal" required />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Tamaño / Unidad</label>
                      <input name="unit" defaultValue={editingItem?.unit} className="w-full p-3 bg-gray-50 rounded-xl" placeholder="Ej. 500ml / Unidad" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Precio Venta ($)</label>
                      <input name="price" type="number" step="0.01" defaultValue={editingItem?.price} className="w-full p-3 bg-gray-50 rounded-xl" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Stock Inicial</label>
                      <input name="stock" type="number" defaultValue={state.inventory[editingItem?.id]?.currentStock || 0} className="w-full p-3 bg-gray-50 rounded-xl" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Categoría</label>
                      <select name="category" defaultValue={editingItem?.category} className="w-full p-3 bg-gray-50 rounded-xl">
                        {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">SKU / Código</label>
                      <input name="sku" defaultValue={editingItem?.sku} className="w-full p-3 bg-gray-50 rounded-xl" placeholder="Autogenerado si vacío" />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-4 bg-gold-500 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-lg hover:bg-gold-600">
                    <Save size={18} className="inline mr-2" /> Guardar Producto
                  </button>
                </form>
              )}

              {modalType === 'provider' && (
                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSaveProvider({
                    name: formData.get('name') as string,
                    contact: formData.get('contact') as string,
                    phone: formData.get('phone') as string,
                    category: formData.get('category') as string,
                    notes: formData.get('notes') as string,
                  });
                }}>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Nombre Suplidor</label><input name="name" defaultValue={editingItem?.name} className="w-full p-3 bg-gray-50 rounded-xl" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Vendedor/Contacto</label><input name="contact" defaultValue={editingItem?.contact} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Teléfono</label><input name="phone" defaultValue={editingItem?.phone} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Categoría Suplidor</label><input name="category" defaultValue={editingItem?.category} className="w-full p-3 bg-gray-50 rounded-xl" placeholder="Ej. Muebles / Químicos" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Notas</label><textarea name="notes" defaultValue={editingItem?.notes} className="w-full p-3 bg-gray-50 rounded-xl h-24" /></div>
                  <button type="submit" className="w-full py-4 bg-gold-500 text-white rounded-2xl font-bold uppercase tracking-widest transition-all"><Save size={18} className="inline mr-2" /> Guardar Suplidor</button>
                </form>
              )}

              {modalType === 'client' && (
                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSaveClient({
                    name: formData.get('name') as string,
                    phone: formData.get('phone') as string,
                    email: formData.get('email') as string,
                    notes: formData.get('notes') as string,
                  });
                }}>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Nombre Completo</label><input name="name" defaultValue={editingItem?.name} className="w-full p-3 bg-gray-50 rounded-xl" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Teléfono</label><input name="phone" defaultValue={editingItem?.phone} className="w-full p-3 bg-gray-50 rounded-xl" required /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Email</label><input name="email" type="email" defaultValue={editingItem?.email} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-700 uppercase">Notas</label><textarea name="notes" defaultValue={editingItem?.notes} className="w-full p-3 bg-gray-50 rounded-xl h-24" /></div>
                  <button type="submit" className="w-full py-4 bg-gold-500 text-white rounded-2xl font-bold uppercase tracking-widest transition-all"><Save size={18} className="inline mr-2" /> Guardar Cliente</button>
                </form>
              )}

              {modalType === 'history' && clientHistorySummary && selectedClientForHistory && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  {/* Resumen Superior */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-gold-50 rounded-3xl border border-gold-100 flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm text-gold-600"><DollarSign size={20} /></div>
                      <div>
                        <span className="text-[10px] font-black text-gold-700 uppercase tracking-widest block">Gasto Total</span>
                        <span className="text-xl font-black text-gray-900">${clientHistorySummary.totalSpent.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600"><Calendar size={20} /></div>
                      <div>
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">Última Visita</span>
                        <span className="text-xl font-black text-gray-900">
                          {clientHistorySummary.lastVisit ? new Date(clientHistorySummary.lastVisit).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100 flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm text-purple-600"><Sparkles size={20} /></div>
                      <div>
                        <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest block">Total Visitas</span>
                        <span className="text-xl font-black text-gray-900">{clientHistorySummary.totalVisits}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <History size={14} /> Historial Detallado de Servicios y Compras
                    </h5>
                    <div className="grid gap-4">
                      {clientHistorySummary.history.map(t => (
                        <div key={t.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-gold-300 transition-all shadow-sm hover:shadow-md group">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-gold-50 group-hover:text-gold-500 transition-colors">
                                <Receipt size={20} />
                              </div>
                              <div>
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Transacción</span>
                                <span className="font-bold text-gray-900">{new Date(t.date).toLocaleDateString()} - {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Importe</span>
                                <span className="text-xl font-black text-gold-600">${t.amount.toLocaleString()}</span>
                              </div>
                              <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${t.paymentMethod === 'Cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {t.paymentMethod}
                              </span>
                            </div>
                          </div>

                          {t.items && t.items.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-px bg-gray-100 flex-1"></div>
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Detalle de la visita</span>
                                <div className="h-px bg-gray-100 flex-1"></div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {t.items.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-50 hover:bg-white hover:border-gold-100 transition-all">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${item.type === 'service' ? 'bg-emerald-50 text-emerald-600' : 'bg-gold-50 text-gold-600'}`}>
                                        {item.type === 'service' ? <Scissors size={14} /> : <ShoppingCart size={14} />}
                                      </div>
                                      <div>
                                        <span className="text-sm font-bold text-gray-800 block">{item.name}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{item.type === 'service' ? 'Servicio Realizado' : 'Producto Comprado'}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-sm font-black text-gray-900 block">${(item.price * item.quantity).toLocaleString()}</span>
                                      <span className="text-[9px] text-gray-400 font-bold uppercase">{item.quantity} x ${item.price.toLocaleString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic px-4 py-2 bg-gray-50 rounded-xl border border-dashed border-gray-200">{t.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'finance' && (
                <div className="space-y-6">
                  {financeForm.type === 'INCOME' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Cliente</label>
                      <div className="relative group">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gold-500 transition-colors" size={18} />
                        <select 
                          value={financeForm.clientId} 
                          onChange={(e) => {
                            const client = state.clients.find(c => c.id === e.target.value);
                            setFinanceForm({...financeForm, clientId: e.target.value, clientName: client?.name || ''});
                          }}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 font-medium appearance-none outline-none focus:ring-1 focus:ring-gold-300"
                        >
                          <option value="">Seleccione un cliente (opcional)</option>
                          {state.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      {!financeForm.clientId && (
                        <input 
                          type="text" 
                          value={financeForm.clientName} 
                          onChange={(e) => setFinanceForm({...financeForm, clientName: e.target.value})} 
                          placeholder="O escriba nombre si no está registrado..." 
                          className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm mt-2 outline-none focus:ring-1 focus:ring-gold-300" 
                        />
                      )}
                    </div>
                  )}

                  {financeMode !== 'GENERAL' && (
                    <div className="p-4 bg-gold-50/50 rounded-2xl border border-gold-100">
                      <h4 className="text-xs font-bold text-gold-700 uppercase mb-3 flex items-center gap-2">
                        {financeMode === 'SERVICE' ? <Scissors size={14} /> : <ShoppingCart size={14} />} 
                        Añadir {financeMode === 'SERVICE' ? 'Servicios' : 'Productos'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                        {(financeMode === 'SERVICE' ? state.services : state.products).map(item => (
                          <button 
                            key={item.id} 
                            onClick={() => addItemToFinance({ id: item.id, name: item.name, price: item.price, type: financeMode === 'SERVICE' ? 'service' : 'product' })}
                            className="text-left p-3 bg-white rounded-xl border border-gray-100 hover:border-gold-300 hover:shadow-sm transition-all text-sm group"
                          >
                            <div className="font-bold text-gray-900 group-hover:text-gold-600 transition-colors">{item.name}</div>
                            <div className="text-xs text-gray-500">${item.price.toLocaleString()}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {financeMode === 'GENERAL' && (
                    <div className="space-y-6">
                      {financeForm.type === 'EXPENSE' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Suplidor / Proveedor</label>
                          <div className="relative group">
                            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gold-500 transition-colors" size={18} />
                            <select 
                              value={financeForm.provider} 
                              onChange={(e) => setFinanceForm({...financeForm, provider: e.target.value})} 
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 font-medium outline-none focus:ring-1 focus:ring-gold-300 appearance-none"
                            >
                              <option value="">Seleccione Suplidor...</option>
                              {state.providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                              <option value="General">General / Varios</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-700 uppercase">Tipo de Registro</label>
                          <select 
                            value={financeForm.type} 
                            onChange={(e) => setFinanceForm({...financeForm, type: e.target.value as TransactionType})} 
                            className="w-full p-3 bg-gray-50 rounded-xl font-bold"
                          >
                            <option value="EXPENSE">Gasto / Egreso (-)</option>
                            <option value="INCOME">Otro Ingreso (+)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-700 uppercase">Monto ($)</label>
                          <input type="number" value={financeForm.amount} onChange={(e) => setFinanceForm({...financeForm, amount: Number(e.target.value)})} className="w-full p-3 bg-gray-50 rounded-xl font-bold text-lg" required />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-700 uppercase">Descripción / Concepto</label>
                        <input 
                          list="fixed-expenses-list"
                          value={financeForm.description} 
                          onChange={(e) => setFinanceForm({...financeForm, description: e.target.value})} 
                          placeholder="Seleccione o escriba un concepto..."
                          className="w-full p-3 bg-gray-50 rounded-xl" 
                          required
                        />
                        <datalist id="fixed-expenses-list">
                          {FIXED_EXPENSES.map(exp => <option key={exp} value={exp} />)}
                        </datalist>
                      </div>
                    </div>
                  )}

                  {financeMode !== 'GENERAL' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Descripción Personalizada</label>
                      <textarea 
                        value={financeForm.description} 
                        onChange={(e) => setFinanceForm({...financeForm, description: e.target.value})} 
                        className="w-full p-3 bg-gray-50 rounded-xl text-sm h-20 outline-none focus:ring-1 focus:ring-gold-300"
                        placeholder="Describa el servicio/venta..."
                      />
                    </div>
                  )}

                  {financeForm.items.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Resumen de Venta</label>
                      <div className="divide-y divide-gray-50 border rounded-2xl overflow-hidden">
                        {financeForm.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-4 bg-white hover:bg-gray-50">
                            <div>
                              <div className="font-bold text-sm text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.quantity} x ${item.price.toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-gold-600">${(item.price * item.quantity).toLocaleString()}</span>
                              <button onClick={() => removeItemFromFinance(item.id)} className="text-red-400 hover:text-red-600 p-1 transition-colors"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Monto Total Ajustable</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-gray-400">$</span>
                        <input 
                          type="number" 
                          value={financeForm.amount} 
                          onChange={(e) => setFinanceForm({...financeForm, amount: Number(e.target.value)})}
                          className="text-2xl font-black text-gray-900 bg-transparent border-none outline-none focus:ring-0 w-full"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Método Pago</label>
                      <select value={financeForm.paymentMethod} onChange={(e) => setFinanceForm({...financeForm, paymentMethod: e.target.value as any})} className="w-full p-3 bg-gray-50 rounded-xl font-bold">
                        <option value="Cash">Efectivo</option>
                        <option value="Card">Tarjeta</option>
                        <option value="Transfer">Transferencia</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    disabled={financeForm.amount <= 0 && financeForm.items.length === 0}
                    onClick={() => handleSaveTransaction({
                      date: new Date().toISOString(),
                      type: financeForm.type,
                      category: financeForm.category,
                      description: financeForm.description || (financeForm.items.length > 0 ? financeForm.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : 'Venta'),
                      clientId: financeForm.clientId,
                      clientName: financeForm.clientName,
                      amount: financeForm.amount,
                      paymentMethod: financeForm.paymentMethod,
                      items: financeForm.items,
                      provider: financeForm.provider
                    })}
                    className={`w-full py-4 ${financeForm.type === 'EXPENSE' ? 'bg-red-500 hover:bg-red-600' : 'bg-gold-500 hover:bg-gold-600'} text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 transition-all`}
                  >
                    <Save size={18} /> Finalizar {financeForm.type === 'EXPENSE' ? 'Gasto' : 'Registro'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
