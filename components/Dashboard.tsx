
import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  PackageCheck
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { AppState, InventoryItem } from '../types';

interface DashboardProps {
  state: AppState;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const { transactions, products, inventory } = state;

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const currentMonth = new Date().getMonth();

    const todayTransactions = transactions.filter(t => new Date(t.date).toDateString() === today);
    const monthTransactions = transactions.filter(t => new Date(t.date).getMonth() === currentMonth);

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

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('es-ES', { weekday: 'short' });
      
      const dayTrans = transactions.filter(t => new Date(t.date).toDateString() === d.toDateString());
      data.push({
        name: dateStr,
        Ingresos: dayTrans.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0),
        Egresos: dayTrans.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0)
      });
    }
    return data;
  }, [transactions]);

  const lowStockItems = useMemo(() => {
    return products
      .filter(p => (inventory[p.id]?.currentStock || 0) <= (inventory[p.id]?.minStock || 0))
      .slice(0, 5);
  }, [products, inventory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Panel de Control</h2>
        <p className="text-gray-500 mt-1">Estadísticas actuales de Evolution Beauty Center</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 text-xs font-bold uppercase tracking-wider">Ingresos Mes</span>
            <div className="p-2 bg-gold-50 text-gold-600 rounded-xl"><TrendingUp size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900">${stats.income.toLocaleString()}</p>
          <p className="text-xs text-green-600 font-semibold mt-2">Hoy: +${stats.todayIncome.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 text-xs font-bold uppercase tracking-wider">Egresos Mes</span>
            <div className="p-2 bg-red-50 text-red-500 rounded-xl"><TrendingDown size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900">${stats.expense.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">Gastos operativos</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 text-xs font-bold uppercase tracking-wider">Balance Neto</span>
            <div className="p-2 bg-black text-white rounded-xl"><DollarSign size={20} /></div>
          </div>
          <p className={`text-3xl font-bold ${stats.balance >= 0 ? 'text-gold-600' : 'text-red-600'}`}>
            ${stats.balance.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">Diferencia actual</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 text-xs font-bold uppercase tracking-wider">Alertas Stock</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.lowStockCount}</p>
          <p className="text-xs text-amber-600 font-semibold mt-2">Niveles críticos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold mb-8 text-gray-800 uppercase tracking-wide">Desempeño Semanal</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 11, fontWeight: 500}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 11, fontWeight: 500}} />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
              />
              <Line type="monotone" dataKey="Ingresos" stroke="#ba9542" strokeWidth={3} dot={{r: 6, fill: '#ba9542', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
              <Line type="monotone" dataKey="Egresos" stroke="#374151" strokeWidth={3} dot={{r: 6, fill: '#374151', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Side Panel: Low Stock */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Próximas Compras</h3>
            <PackageCheck size={20} className="text-gold-500" />
          </div>
          <div className="space-y-4">
            {lowStockItems.length > 0 ? lowStockItems.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-[#fafafa] rounded-xl border border-gray-50">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">{p.name}</span>
                  <span className="text-xs text-gray-500">{p.brand}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-red-600">{inventory[p.id]?.currentStock}</span>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-tighter">Stock</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">Inventario completo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
