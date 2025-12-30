
import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  searchPlaceholder?: string;
  searchKey?: keyof T;
}

const DataTable = <T,>({ columns, data, onEdit, onDelete, searchPlaceholder, searchKey }: DataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (!searchTerm) return true;
      if (!searchKey) return true;
      const val = item[searchKey];
      return String(val).toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, searchKey]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {searchKey && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder || 'Buscar...'}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4">
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {col.sortable && <ArrowUpDown size={14} className="cursor-pointer" />}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && <th className="px-6 py-4 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginatedData.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="px-6 py-4">
                    {typeof col.accessor === 'function' 
                      ? col.accessor(item) 
                      : (item[col.accessor] as React.ReactNode)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(item)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Editar
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(item)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedData.length === 0 && (
          <div className="py-12 text-center text-gray-500 bg-white">
            No se encontraron registros.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-gray-500">
            Mostrando {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredData.length, currentPage * itemsPerPage)} de {filteredData.length}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium px-4">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
