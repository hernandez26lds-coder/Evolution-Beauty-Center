
import * as XLSXModule from 'xlsx';
import { AppState } from '../types';

// Helper para obtener el objeto XLSX correcto dependiendo de cómo lo cargue el navegador
const getXLSX = () => {
  const anyModule = XLSXModule as any;
  if (anyModule.utils) return anyModule;
  if (anyModule.default && anyModule.default.utils) return anyModule.default;
  return anyModule;
};

export const exportFullSystemBackup = (state: AppState) => {
  const XLSX = getXLSX();
  const wb = XLSX.utils.book_new();

  // 1. Hoja de Transacciones (Finanzas)
  const transactionsData = state.transactions.map(t => ({
    ID: t.id,
    Fecha: new Date(t.date).toLocaleString(),
    Tipo: t.type === 'INCOME' ? 'Ingreso' : 'Egreso',
    Categoria: t.category,
    Descripcion: t.description,
    Cliente: t.clientName || 'N/A',
    Monto: t.amount,
    Metodo_Pago: t.paymentMethod,
    Items_Detalle: t.items?.map(i => `${i.quantity}x ${i.name}`).join('; ') || 'N/A'
  }));
  const wsFinance = XLSX.utils.json_to_sheet(transactionsData);
  XLSX.utils.book_append_sheet(wb, wsFinance, 'Historial_Financiero');

  // 2. Hoja de Movimientos de Inventario (Kardex)
  const movementsData = state.movements.map(m => {
    const product = state.products.find(p => p.id === m.productId);
    return {
      Fecha: new Date(m.date).toLocaleString(),
      Producto: product?.name || 'Desconocido',
      SKU: product?.sku || 'N/A',
      Tipo: m.type === 'IN' ? 'Entrada (+)' : 'Salida (-)',
      Cantidad: m.quantity,
      Motivo: m.reason,
      Usuario: m.user,
      Notas: m.notes
    };
  });
  const wsMovements = XLSX.utils.json_to_sheet(movementsData);
  XLSX.utils.book_append_sheet(wb, wsMovements, 'Kardex_Inventario');

  // 3. Hoja de Clientes
  const clientsData = state.clients.map(c => ({
    ID: c.id,
    Nombre: c.name,
    Telefono: c.phone,
    Email: c.email || 'N/A',
    Notas: c.notes || 'N/A',
    Fecha_Registro: new Date(c.createdAt).toLocaleDateString()
  }));
  const wsClients = XLSX.utils.json_to_sheet(clientsData);
  XLSX.utils.book_append_sheet(wb, wsClients, 'Base_Clientes');

  // 4. Hoja de Productos y Stock
  const productsData = state.products.map(p => ({
    SKU: p.sku,
    Nombre: p.name,
    Marca: p.brand,
    Categoria: p.category,
    Costo: p.cost,
    Precio_Venta: p.price,
    Stock_Actual: state.inventory[p.id]?.currentStock || 0,
    Stock_Minimo: state.inventory[p.id]?.minStock || 0,
    Proveedor: p.provider
  }));
  const wsProducts = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Inventario_y_Precios');

  // 5. Hoja de Servicios
  const servicesData = state.services.map(s => ({
    Codigo: s.code,
    Nombre: s.name,
    Categoria: s.category,
    Precio: s.price,
    Duracion_Min: s.duration,
    Estado: s.status
  }));
  const wsServices = XLSX.utils.json_to_sheet(servicesData);
  XLSX.utils.book_append_sheet(wb, wsServices, 'Catalogo_Servicios');

  // Generar archivo
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Evolution_Beauty_Backup_${dateStr}.xlsx`);
};

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Data') => {
  if (!data.length) return;
  const XLSX = getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const generateMonthlyReport = (state: any) => {
  const XLSX = getXLSX();
  const wb = XLSX.utils.book_new();
  
  // Finance Sheet
  const financeData = state.transactions.map((t: any) => ({
    Fecha: new Date(t.date).toLocaleDateString(),
    Cliente: t.clientName || '-',
    Tipo: t.type,
    Categoria: t.category,
    Descripcion: t.description,
    Monto: t.amount,
    Metodo: t.paymentMethod
  }));
  if (financeData.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(financeData), 'Finanzas');
  }

  // Inventory Sheet
  const inventoryData = state.products.map((p: any) => ({
    SKU: p.sku,
    Nombre: p.name,
    StockActual: state.inventory[p.id]?.currentStock || 0,
    StockMin: state.inventory[p.id]?.minStock || 0,
    Costo: p.cost
  }));
  if (inventoryData.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inventoryData), 'Inventario Actual');
  }

  // Movements Sheet
  const movementsData = state.movements.map((m: any) => {
    const p = state.products.find((prod: any) => prod.id === m.productId);
    return {
      Fecha: new Date(m.date).toLocaleString(),
      Producto: p?.name || 'Desconocido',
      Tipo: m.type,
      Cantidad: m.quantity,
      Motivo: m.reason,
      Usuario: m.user
    };
  });
  if (movementsData.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(movementsData), 'Movimientos');
  }

  XLSX.writeFile(wb, `Reporte_Mensual_${new Date().getMonth() + 1}_${new Date().getFullYear()}.xlsx`);
};
