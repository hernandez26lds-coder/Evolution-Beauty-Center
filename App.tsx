
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DataTable from './components/DataTable';
import { 
  AppState, 
  Service, 
  Product, 
  InventoryMovement, 
  Transaction, 
  Role,
  TransactionType,
  TransactionItem,
  Client
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
  generateMonthlyReport 
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
  Clock
} from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('evolution_salon_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Asegurar que las colecciones necesarias existan
        return {
          ...INITIAL_STATE,
          ...parsed,
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
  const [modalType, setModalType] = useState<'service' | 'product' | 'inventory' | 'finance' | 'client' | 'history' | null>(null);
  const [financeMode, setFinanceMode] = useState<'SERVICE' | 'PRODUCT' | 'GENERAL'>('GENERAL');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);

  const [financeForm, setFinanceForm] = useState({
    clientId: '',
    clientName: '',
    items: [] as TransactionItem[],
    category: FINANCE_CATEGORIES.INCOME[0],
    type: 'INCOME' as TransactionType,
    paymentMethod: 'Cash' as 'Cash' | 'Card' | 'Transfer',
    description: '',
    amount: 0
  });

  useEffect(() => {
    localStorage.setItem('evolution_salon_data', JSON.stringify(state));
  }, [state]);

  const handleResetData = () => {
    localStorage.removeItem('evolution_salon_data');
    setState(INITIAL_STATE);
    setActiveTab('dashboard');
  };

  const handleAddMovement = (movement: Omit<InventoryMovement, 'id' | 'date' | 'user'>) => {
    const newMovement: InventoryMovement = {
      ...movement,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      user: state.userRole
    };

    setState(prev => {
      const currentStock = prev.inventory[movement.productId]?.currentStock || 0;
      const newStock = movement.type === 'IN' ? currentStock + movement.quantity : currentStock - movement.quantity;
      
      if (newStock < 0) {
        alert("Error: No hay suficiente stock para esta operación.");
        return prev;
      }

      return {
        ...prev,
        movements: [newMovement, ...prev.movements],
        inventory: {
          ...prev.inventory,
          [movement.productId]: {
            ...prev.inventory[movement.productId],
            currentStock: newStock
          }
        }
      };
    });
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

  const handleSaveProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: editingItem?.id || crypto.randomUUID(),
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setState(prev => {
      const updatedInventory = { ...prev.inventory };
      if (!updatedInventory[newProduct.id]) {
        updatedInventory[newProduct.id] = { productId: newProduct.id, currentStock: 0, minStock: 5, location: 'General' };
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

  const openModal = (type: 'service' | 'product' | 'inventory' | 'finance' | 'client' | 'history', mode: any = 'GENERAL', item: any = null) => {
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
          amount: item.amount
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
          amount: 0
        });
      }
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
              <button onClick={() => exportToExcel(state.transactions, 'Finanzas')} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-all"><Download size={16} /> Excel</button>
              <button onClick={() => openModal('finance', 'SERVICE')} className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 flex items-center gap-2 shadow-sm text-sm font-bold transition-all"><Scissors size={16} /> Venta Servicio</button>
              <button onClick={() => openModal('finance', 'PRODUCT')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 flex items-center gap-2 shadow-sm text-sm font-bold transition-all"><ShoppingCart size={16} /> Venta Producto</button>
              <button onClick={() => openModal('finance', 'GENERAL')} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 flex items-center gap-2 shadow-sm text-sm font-bold transition-all"><Receipt size={16} /> Registrar Gasto</button>
            </div>
          </div>
          <DataTable<Transaction> 
            data={state.transactions} searchKey="description"
            columns={[
              { header: 'Fecha', accessor: (t) => new Date(t.date).toLocaleDateString() },
              { header: 'Cliente', accessor: (t) => t.clientName || '-' },
              { header: 'Detalle', accessor: (t) => <span className="max-w-xs block truncate">{t.description}</span> },
              { header: 'Monto', accessor: (t) => <span className={`font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>${t.amount.toLocaleString()}</span> },
              { header: 'Método', accessor: 'paymentMethod' }
            ]}
            onEdit={(t) => openModal('finance', t.items && t.items.length > 0 ? (t.items[0].type === 'product' ? 'PRODUCT' : 'SERVICE') : 'GENERAL', t)}
            onDelete={(t) => confirm('¿Eliminar registro?') && setState(prev => ({ ...prev, transactions: prev.transactions.filter(item => item.id !== t.id) }))}
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
                  className="flex items-center gap-1.5 text-xs font-bold text-gold-600 hover:text-gold-700 uppercase tracking-wider"
                >
                  <History size={14} /> Ver Servicios
                </button>
              )}
            ]} 
            onEdit={(c) => openModal('client', null, c)} 
            onDelete={(c) => confirm(`¿Borrar a ${c.name}?`) && setState(prev => ({ ...prev, clients: prev.clients.filter(i => i.id !== c.id) }))} 
          />
        </div>
      );
      case 'services': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div><h2 className="text-2xl font-bold">Servicios</h2><p className="text-gray-500">Catálogo</p></div>
            <button onClick={() => openModal('service')} className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 flex items-center gap-2 font-bold transition-all"><Plus size={16} /> Nuevo Servicio</button>
          </div>
          <DataTable<Service> data={state.services} searchKey="name" columns={[
            { header: 'Código', accessor: 'code' }, { header: 'Nombre', accessor: 'name' }, { header: 'Categoría', accessor: 'category' }, { header: 'Precio', accessor: (s) => `$${s.price.toLocaleString()}` }
          ]} onEdit={(s) => openModal('service', null, s)} onDelete={(s) => confirm('¿Borrar?') && setState(prev => ({ ...prev, services: prev.services.filter(i => i.id !== s.id) }))} />
        </div>
      );
      case 'products': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div><h2 className="text-2xl font-bold">Productos</h2><p className="text-gray-500">Insumos y Venta</p></div>
            <button onClick={() => openModal('product')} className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 font-bold flex items-center gap-2 transition-all"><Plus size={16} /> Nuevo Producto</button>
          </div>
          <DataTable<Product> data={state.products} searchKey="name" columns={[
            { header: 'SKU', accessor: 'sku' }, { header: 'Nombre', accessor: 'name' }, { header: 'Marca', accessor: 'brand' }, { header: 'Stock', accessor: (p) => <span className={state.inventory[p.id]?.currentStock <= state.inventory[p.id]?.minStock ? 'text-red-500 font-bold' : ''}>{state.inventory[p.id]?.currentStock || 0}</span> }
          ]} onEdit={(p) => openModal('product', null, p)} onDelete={(p) => confirm('¿Borrar?') && setState(prev => ({ ...prev, products: prev.products.filter(i => i.id !== p.id) }))} />
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
          <DataTable<InventoryMovement> data={state.movements} columns={[
            { header: 'Fecha', accessor: (m) => new Date(m.date).toLocaleString() },
            { header: 'Producto', accessor: (m) => state.products.find(p => p.id === m.productId)?.name || '?' },
            { header: 'Tipo', accessor: (m) => <span className={m.type === 'IN' ? 'text-green-600' : 'text-red-500'}>{m.type === 'IN' ? 'Entrada (+)' : 'Salida (-)'}</span> },
            { header: 'Cantidad', accessor: 'quantity' },
            { header: 'Motivo', accessor: 'reason' }
          ]} />
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
                {editingItem ? (modalType === 'history' ? 'Histórico de Cliente' : 'Editar') : 'Nuevo'} {
                  modalType === 'service' ? 'Servicio' : 
                  modalType === 'product' ? 'Producto' : 
                  modalType === 'inventory' ? 'Movimiento' : 
                  modalType === 'client' ? 'Cliente' :
                  modalType === 'history' ? `Histórico: ${selectedClientForHistory?.name}` :
                  (financeMode === 'SERVICE' ? 'Venta de Servicios' : (financeMode === 'PRODUCT' ? 'Venta de Productos' : 'Gasto/Otro'))
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

              {modalType === 'history' && selectedClientForHistory && (
                <div className="space-y-6">
                  <div className="flex items-center gap-6 p-6 bg-gold-50 rounded-[1.5rem] border border-gold-100">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl font-black text-gold-600 border border-gold-200 shadow-sm">
                      {selectedClientForHistory.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900">{selectedClientForHistory.name}</h4>
                      <div className="flex gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-sm text-gray-600"><Phone size={14} className="text-gold-500" /> {selectedClientForHistory.phone}</span>
                        {selectedClientForHistory.email && <span className="flex items-center gap-1.5 text-sm text-gray-600"><Receipt size={14} className="text-gold-500" /> {selectedClientForHistory.email}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Historial de Transacciones</h5>
                    <div className="grid gap-4">
                      {state.transactions
                        .filter(t => t.clientId === selectedClientForHistory.id || t.clientName === selectedClientForHistory.name)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(t => (
                          <div key={t.id} className="p-5 bg-white border border-gray-100 rounded-2xl hover:border-gold-200 transition-colors shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-gold-100 text-gold-700 text-[10px] font-bold rounded-full uppercase">{t.category}</span>
                                <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1"><Clock size={12} /> {new Date(t.date).toLocaleString()}</span>
                              </div>
                              <span className="text-lg font-black text-gray-900">${t.amount.toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-800 font-medium">{t.description}</p>
                            {t.items && t.items.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-2">
                                {t.items.map((item, i) => (
                                  <span key={i} className="text-[10px] px-2 py-1 bg-gray-50 text-gray-600 rounded-lg border border-gray-100">
                                    {item.quantity}x {item.name}
                                  </span>
                                ))}
                              </div>
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
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Total Final</label>
                      <div className="text-2xl font-black text-gray-900">${financeForm.amount.toLocaleString()}</div>
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
                      items: financeForm.items
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
