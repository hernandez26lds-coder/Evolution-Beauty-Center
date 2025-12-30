
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
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';
import { AppState, InventoryItem } from '../types';
import { exportFullSystemBackup } from '../utils/export';

interface DashboardProps {
  state: AppState;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const { transactions, products, inventory } = state;

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

  const weeklyData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    // Generar datos de los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toDateString();
      const label = d.toLocaleDateString('es-ES', { weekday: 'short' });
      
      const dayTrans = transactions.filter(t => new Date(t.date).toDateString() === dateKey);
      
      data.push({
        name: label.charAt(0).toUpperCase() + label.slice(1),
        Ingresos: dayTrans.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0),
        Egresos: dayTrans.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0)
      });
    }
    return data;
  }, [transactions]);

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
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Panel de Gestión</h2>
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
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Ingresos Mes</span>
            <div className="p-2 bg-gold-50 text-gold-600 rounded-2xl"><TrendingUp size={18} /></div>
          </div>
          <p className="text-3xl font-black text-gray-900">${stats.income.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-[10px] font-bold text-green-600">Hoy:</span>
            <span className="text-[10px] font-black text-gray-700">+${stats.todayIncome.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Gastos Mes</span>
            <div className="p-2 bg-red-50 text-red-500 rounded-2xl"><TrendingDown size={18} /></div>
          </div>
          <p className="text-3xl font-black text-gray-900">${stats.expense.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Operaciones</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Balance</span>
            <div className="p-2 bg-gray-900 text-white rounded-2xl"><DollarSign size={18} /></div>
          </div>
          <p className={`text-3xl font-black ${stats.balance >= 0 ? 'text-gold-600' : 'text-red-600'}`}>
            ${stats.balance.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">Rentabilidad</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Insumos</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl"><AlertTriangle size={18} /></div>
          </div>
          <p className="text-3xl font-black text-gray-900">{stats.lowStockCount}</p>
          <p className="text-[10px] text-amber-600 font-bold mt-2 uppercase tracking-tighter">Alertas de Stock</p>
        </div>
      </div>

      {/* GRÁFICO DE DESEMPEÑO SEMANAL (LÍNEA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="text-gold-500" size={18} />
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.15em]">Desempeño Semanal</h3>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Comparativa de flujo de caja de los últimos 7 días</p>
            </div>
            <div className="flex items-center gap-6 bg-gray-50 px-4 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-gold-500 rounded-full"></div>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-gray-300 rounded-full"></div>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">Egresos</span>
              </div>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}}
                />
                <Tooltip 
                  cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }}
                  contentStyle={{
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', 
                    padding: '16px',
                    fontSize: '11px',
                    fontWeight: '800',
                    backgroundColor: '#fff'
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
                <Line 
                  name="Ingresos"
                  type="monotone" 
                  dataKey="Ingresos" 
                  stroke="#ba9542" 
                  strokeWidth={4} 
                  dot={{ r: 5, fill: '#ba9542', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#ba9542' }} 
                  animationDuration={1500}
                />
                <Line 
                  name="Egresos"
                  type="monotone" 
                  dataKey="Egresos" 
                  stroke="#d1d5db" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#d1d5db', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#d1d5db' }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DISTRIBUCIÓN POR CATEGORÍA */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChartIcon className="text-gold-500" size={18} />
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.15em]">Top Ingresos</h3>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Distribución por categoría</p>
            </div>
            <Activity size={18} className="text-gold-300" />
          </div>
          
          <div className="h-[250px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: -20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#4b5563', fontSize: 10, fontWeight: 800}}
                  width={100}
                />
                <Tooltip 
                   cursor={{fill: '#f9fafb', radius: 10}}
                   contentStyle={{
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                  }}
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={16}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-50">
            <div className="flex justify-between items-center bg-gold-50 p-4 rounded-2xl">
              <div>
                <p className="text-[10px] font-black text-gold-600 uppercase tracking-widest">Margen Bruto</p>
                <p className="text-2xl font-black text-gray-900">{Math.max(0, Math.round((stats.balance / (stats.income || 1)) * 100))}%</p>
              </div>
              <TrendingUp className="text-gold-500" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* ALERTAS DE INVENTARIO */}
      <div className="bg-gray-900 p-8 rounded-[3rem] shadow-2xl text-white overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl">
                <PackageCheck className="text-gold-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Control de Insumos Críticos</h3>
                <p className="text-xs text-gray-400 font-medium">Productos que requieren reposición inmediata</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-gold-500 text-white text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-gold-400 transition-colors">
              Gestionar Compras
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.length > 0 ? lowStockItems.map(p => (
              <div key={p.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[1.5rem] backdrop-blur-sm hover:bg-white/10 transition-all group">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-100 group-hover:text-gold-300 transition-colors">{p.name}</span>
                  <span className="text-[10px] text-gold-500 font-black uppercase tracking-widest mt-1">{p.brand}</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-xl font-black text-red-400">{inventory[p.id]?.currentStock}</span>
                  <span className="text-[9px] text-gray-500 block uppercase font-black tracking-tighter">Disponible</span>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PackageCheck size={32} className="text-gold-500/50" />
                </div>
                <p className="text-gray-400 font-medium italic">Todo el inventario está en niveles óptimos.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Elemento Decorativo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
      </div>
    </div>
  );
};

export default Dashboard;
