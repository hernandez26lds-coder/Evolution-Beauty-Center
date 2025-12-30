
import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  PackageCheck,
  BarChart as BarChartIcon,
  Activity,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Tooltip
} from 'recharts';
import { AppState, InventoryItem } from '../types';
import { exportFullSystemBackup } from '../utils/export';

interface DashboardProps {
  state: AppState;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const { transactions, products, inventory, movements } = state;

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const todayTransactions = transactions.filter(t => new Date(t.date).toDateString() === todayStr);
    const monthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = monthTransactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
    
    const lowStockCount = (Object.values(inventory) as InventoryItem[]).filter(item => item.currentStock <= item.minStock).length;

    return {
      income,
      expense,
      balance: income - expense,
      lowStockCount,
      todayIncome: todayTransactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0)
    };
  }, [transactions, inventory]);

  const movementStats = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentMovements = movements.filter(m => new Date(m.date) >= sevenDaysAgo);
    const ins = recentMovements.filter(m => m.type === 'IN').reduce((acc, curr) => acc + curr.quantity, 0);
    const outs = recentMovements.filter(m => m.type === 'OUT').reduce((acc, curr) => acc + curr.quantity, 0);
    
    return { ins, outs };
  }, [movements]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'INCOME')
      .forEach(t => {
        const cat = t.category || 'Otros';
        categories[cat] = (categories[cat] || 0) + t.amount;
      });
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  const COLORS = ['#ba9542', '#d4af37', '#e5c066', '#f2d48c', '#a37c36'];

  const lowStockItems = useMemo(() => {
    return products
      .filter(p => (inventory[p.id]?.currentStock || 0) <= (inventory[p.id]?.minStock || 0))
      .slice(0, 5);
  }, [products, inventory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Resumen Ejecutivo</h2>
          <p className="text-gray-500 mt-1">Evolución de Evolution Beauty Center</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => exportFullSystemBackup(state)}
            className="flex-1 md:flex-none px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
          >
            <Database size={16} /> Respaldo Maestro
          </button>
        </div>
      </header>

      {/* Tarjetas de Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Ingresos Mes</span>
            <div className="p-2 bg-gold-50 text-gold-600 rounded-2xl"><TrendingUp size={18} /></div>
          </div>
          <p className="text-3xl font-black text-gray-900 relative z-10">${stats.income.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 relative z-10">
            <ArrowUpRight size={14} className="text-green-500" />
            <span className="text-[10px] font-bold text-green-600">Hoy: +${stats.todayIncome.toLocaleString()}</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gold-500/5 rounded-full group-hover:scale-150 transition-transform"></div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Gastos Mes</span>
            <div className="p-2 bg-red-50 text-red-500 rounded-2xl"><TrendingDown size={18} /></div>
          </div>
          <p className="text-3xl font-black text-gray-900">${stats.expense.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Flujo Saliente</p>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/5 rounded-full group-hover:scale-150 transition-transform"></div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Utilidad Neta</span>
            <div className="p-2 bg-gray-900 text-white rounded-2xl"><DollarSign size={18} /></div>
          </div>
          <p className={`text-3xl font-black ${stats.balance >= 0 ? 'text-gold-600' : 'text-red-600'}`}>
            ${stats.balance.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">Rentabilidad Real</p>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gray-900/5 rounded-full group-hover:scale-150 transition-transform"></div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Alertas Stock</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl"><AlertTriangle size={18} /></div>
          </div>
          <p className="text-3xl font-black text-gray-900">{stats.lowStockCount}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${stats.lowStockCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
            <span className="text-[10px] text-gray-500 font-bold uppercase">{stats.lowStockCount > 0 ? 'Reposición requerida' : 'Stock saludable'}</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE MÉTRICAS SECUNDARIAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MOVIMIENTOS RECIENTES */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gold-50 rounded-2xl text-gold-600">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Actividad 7 Días</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Balance de movimientos de inventario</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-green-50 rounded-3xl border border-green-100 flex flex-col items-center text-center">
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-2">Entradas</span>
              <span className="text-4xl font-black text-green-700">{movementStats.ins}</span>
              <span className="text-[9px] text-green-600/60 font-bold mt-1 uppercase">Unidades</span>
            </div>
            <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex flex-col items-center text-center">
              <span className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2">Salidas</span>
              <span className="text-4xl font-black text-red-700">{movementStats.outs}</span>
              <span className="text-[9px] text-red-600/60 font-bold mt-1 uppercase">Unidades</span>
            </div>
          </div>
        </div>

        {/* TOP CATEGORÍAS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gray-900 rounded-2xl text-white">
              <BarChartIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Top Ingresos</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Categorías con mayor rendimiento</p>
            </div>
          </div>
          <div className="h-[200px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: -20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10, fontWeight: 800}} width={100} />
                <Tooltip cursor={{fill: '#f9fafb', radius: 10}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                  {categoryData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ALERTAS DE INVENTARIO CRÍTICO */}
      <div className="bg-gray-900 p-8 rounded-[3rem] shadow-2xl text-white overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl">
                <PackageCheck className="text-gold-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Insumos Críticos</h3>
                <p className="text-xs text-gray-400 font-medium">Reposición de stock sugerida</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lowStockItems.length > 0 ? lowStockItems.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div>
                  <span className="text-sm font-bold text-gray-100 block">{p.name}</span>
                  <span className="text-[9px] text-gold-500 font-black uppercase tracking-widest">{p.brand}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-red-400">{inventory[p.id]?.currentStock}</span>
                  <span className="text-[9px] text-gray-500 block uppercase font-bold">Unid.</span>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-4 text-center">
                <p className="text-gray-500 italic text-sm">Todo el stock está en niveles saludables.</p>
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
      </div>
    </div>
  );
};

export default Dashboard;
