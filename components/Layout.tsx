
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Scissors, 
  Package, 
  Database, 
  Wallet, 
  LogOut, 
  Menu, 
  X,
  Moon,
  Sun,
  User,
  RefreshCcw,
  Users,
  FileUp,
  Truck
} from 'lucide-react';
import { Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: Role;
  onReset: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, userRole, onReset }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.CASHIER, Role.INVENTORY] },
    { id: 'finance', label: 'Finanzas', icon: Wallet, roles: [Role.ADMIN, Role.CASHIER] },
    { id: 'clients', label: 'Clientes', icon: Users, roles: [Role.ADMIN, Role.CASHIER] },
    { id: 'services', label: 'Servicios', icon: Scissors, roles: [Role.ADMIN, Role.INVENTORY] },
    { id: 'products', label: 'Productos', icon: Package, roles: [Role.ADMIN, Role.INVENTORY] },
    { id: 'providers', label: 'Suplidores', icon: Truck, roles: [Role.ADMIN, Role.INVENTORY] },
    { id: 'inventory', label: 'Inventario', icon: Database, roles: [Role.ADMIN, Role.INVENTORY, Role.CASHIER] },
    { id: 'imports', label: 'Importar Datos', icon: FileUp, roles: [Role.ADMIN] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole));

  const handleResetClick = () => {
    if (confirm('¿Estás seguro de que deseas restablecer todos los datos? Esta acción borrará permanentemente todo el inventario, servicios y registros financieros.')) {
      onReset();
    }
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-[#fafafa] text-gray-900'}`}>
      {/* Sidebar Mobile Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 bg-gold-500 text-white p-4 rounded-full shadow-lg"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static lg:block
        ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-none' : 'bg-white border-r border-gray-100 shadow-sm'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex flex-col items-center">
            <div className="w-32 h-32 mb-4 bg-white rounded-full p-2 flex items-center justify-center overflow-hidden border border-gray-100 shadow-md">
               <img src="https://api.dicebear.com/7.x/initials/svg?seed=Evolution&backgroundColor=ba9542" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <h1 className={`text-xl font-bold uppercase tracking-widest ${isDarkMode ? 'text-gold-400' : 'text-gray-900'}`}>Evolution</h1>
              <p className="text-[10px] font-semibold text-gold-500 uppercase tracking-[0.3em] mt-1">Beauty Center</p>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
            {filteredMenu.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${activeTab === item.id 
                      ? (isDarkMode ? 'bg-gold-500/10 text-gold-400 font-semibold' : 'bg-gold-50 text-gold-600 font-semibold shadow-sm border border-gold-100') 
                      : (isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gold-500')
                    }
                  `}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
            <div className="flex items-center space-x-3 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-widest">
              <User size={14} />
              <span>{userRole}</span>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-500 hover:text-gold-500 transition-colors"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
            <button 
              onClick={handleResetClick}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              <RefreshCcw size={16} />
              <span>Restablecer</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
