
import * as XLSXModule from 'xlsx';

// Helper para obtener el objeto XLSX correcto dependiendo de cómo lo cargue el navegador
const getXLSX = () => {
  const anyModule = XLSXModule as any;
  if (anyModule.utils) return anyModule;
  if (anyModule.default && anyModule.default.utils) return anyModule.default;
  return anyModule;
};

export const exportToCSV = (data: any[], fileName: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',')
  ).join('\n');
  
  const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
