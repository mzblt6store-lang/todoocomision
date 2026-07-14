import React, { useState } from 'react';
import { Search, Percent, DollarSign, Ban, Save, RefreshCw, Sparkles, Filter, Check } from 'lucide-react';
import { ProductCommission, CommissionType } from '../types';

interface AdminCommissionManagerProps {
  products: ProductCommission[];
  onProductUpdated: () => void;
}

export default function AdminCommissionManager({ products, onProductUpdated }: AdminCommissionManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'none' | 'fixed' | 'percentage'>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editType, setEditType] = useState<CommissionType>('none');
  const [editValue, setEditValue] = useState<number>(0);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.default_code && p.default_code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && p.commission_type === filterType;
  });

  const handleStartEdit = (product: ProductCommission) => {
    setEditingId(product.id);
    setEditType(product.commission_type);
    setEditValue(product.commission_value);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveCommission = async (productId: number) => {
    setSavingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}/commission`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commission_type: editType,
          commission_value: editValue,
        }),
      });

      if (res.ok) {
        setToastMessage('Comisión guardada y órdenes pendientes recalculadas.');
        setTimeout(() => setToastMessage(null), 4000);
        setEditingId(null);
        onProductUpdated(); // Refresh list
      } else {
        const err = await res.json();
        alert(err.error || 'Error al guardar la comisión');
      }
    } catch (e) {
      alert('Error de red al guardar la comisión');
    } finally {
      setSavingId(null);
    }
  };

  // Quick preset application
  const handleApplyPreset = (type: CommissionType, value: number) => {
    setEditType(type);
    setEditValue(value);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="admin-commission-manager">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 font-display flex items-center gap-2">
            <Percent className="h-5 w-5 text-indigo-600" />
            Configurar Comisiones por Producto
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Asigna montos fijos (Soles/Dólares) o porcentajes a cada producto. Se aplicará a todas las ventas futuras.
          </p>
        </div>

        {toastMessage && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 animate-pulse">
            <Check className="h-3.5 w-3.5" />
            {toastMessage}
          </div>
        )}
      </div>

      {/* Filters bar */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-slate-50/10">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o SKU/Referencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10"
          />
        </div>

        {/* Filter Type */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="text-slate-400 shrink-0">
            <Filter className="h-4 w-4" />
          </span>
          <select
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none bg-white focus:border-indigo-500"
          >
            <option value="all">Ver Todos los Productos</option>
            <option value="fixed">Solo Comisión Fija</option>
            <option value="percentage">Solo Comisión Porcentual</option>
            <option value="none">Sin Comisión Configurada</option>
          </select>
        </div>
      </div>

      {/* Table list */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/30">
              <th className="p-4 pl-6">ID / Código</th>
              <th className="p-4">Producto</th>
              <th className="p-4 text-right">Precio Unitario</th>
              <th className="p-4">Regla de Comisión</th>
              <th className="p-4 text-right pr-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400">
                  No se encontraron productos con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const isEditing = editingId === p.id;
                
                return (
                  <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${isEditing ? 'bg-indigo-50/15' : ''}`}>
                    {/* ID / Code */}
                    <td className="p-4 pl-6 font-mono text-[11px] text-slate-400">
                      <div>ID: {p.id}</div>
                      {p.default_code && (
                        <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                          {p.default_code}
                        </span>
                      )}
                    </td>

                    {/* Product Name */}
                    <td className="p-4 font-medium text-slate-800">
                      {p.name}
                    </td>

                    {/* Unit Price */}
                    <td className="p-4 text-right font-mono font-medium text-slate-700">
                      S/ {p.list_price.toFixed(2)}
                    </td>

                    {/* Commission Rule Info / Edit Form */}
                    <td className="p-4 min-w-[280px]">
                      {isEditing ? (
                        <div className="flex flex-col gap-2 p-2 bg-white rounded-xl border border-indigo-100 shadow-sm">
                          {/* Selector */}
                          <div className="grid grid-cols-3 gap-1 bg-slate-100/50 p-1 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setEditType('none')}
                              className={`flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                editType === 'none' ? 'bg-white text-slate-700 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <Ban className="h-3 w-3" /> Sin Comisión
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditType('fixed')}
                              className={`flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                editType === 'fixed' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <DollarSign className="h-3 w-3" /> Fija (S/)
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditType('percentage')}
                              className={`flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                editType === 'percentage' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <Percent className="h-3 w-3" /> Porcentual (%)
                            </button>
                          </div>

                          {/* Value Input and Presets */}
                          {editType !== 'none' && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Valor:</span>
                                <input
                                  type="number"
                                  min="0"
                                  step={editType === 'fixed' ? '0.1' : '1'}
                                  value={editValue}
                                  onChange={(e) => setEditValue(Math.max(0, parseFloat(e.target.value) || 0))}
                                  className="w-full text-xs font-mono font-bold border border-slate-200 rounded p-1"
                                />
                                <span className="text-[11px] text-slate-500 font-bold">
                                  {editType === 'fixed' ? 'Sol(es)' : '%'}
                                </span>
                              </div>

                              {/* Commission Presets */}
                              <div className="flex flex-wrap items-center gap-1 text-[10px]">
                                <span className="text-slate-400">Presets:</span>
                                {editType === 'fixed' ? (
                                  <>
                                    <button type="button" onClick={() => handleApplyPreset('fixed', 1)} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer">S/ 1</button>
                                    <button type="button" onClick={() => handleApplyPreset('fixed', 5)} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer">S/ 5</button>
                                    <button type="button" onClick={() => handleApplyPreset('fixed', 10)} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer">S/ 10</button>
                                    <button type="button" onClick={() => handleApplyPreset('fixed', 20)} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer">S/ 20</button>
                                  </>
                                ) : (
                                  <>
                                    <button type="button" onClick={() => handleApplyPreset('percentage', 3)} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer">3%</button>
                                    <button type="button" onClick={() => handleApplyPreset('percentage', 5)} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer">5%</button>
                                    <button type="button" onClick={() => handleApplyPreset('percentage', 8)} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer">8%</button>
                                    <button type="button" onClick={() => handleApplyPreset('percentage', 10)} className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer">10%</button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {p.commission_type === 'none' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200/50">
                              <Ban className="h-2.5 w-2.5" /> Sin Comisión
                            </span>
                          )}
                          {p.commission_type === 'fixed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <DollarSign className="h-2.5 w-2.5 text-emerald-500" />
                              S/ {p.commission_value.toFixed(2)} por unidad
                            </span>
                          )}
                          {p.commission_type === 'percentage' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              <Percent className="h-2.5 w-2.5 text-indigo-500" />
                              {p.commission_value}% del precio (S/ {(p.list_price * p.commission_value / 100).toFixed(2)} / u)
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions Row */}
                    <td className="p-4 text-right pr-6">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-all"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveCommission(p.id)}
                            disabled={savingId === p.id}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1 shadow-sm cursor-pointer transition-all"
                          >
                            <Save className="h-3 w-3" />
                            {savingId === p.id ? 'Guardando...' : 'Guardar'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          className="px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 bg-white border border-slate-100 hover:border-indigo-100 rounded-lg cursor-pointer transition-all font-medium text-[11px]"
                        >
                          Configurar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer statistics reminder */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Mostrando {filteredProducts.length} de {products.length} productos</span>
        <span className="flex items-center gap-1 text-slate-500">
          <Sparkles className="h-3 w-3 text-amber-500" />
          Al cambiar una regla, todas las comisiones pendientes se recalculan automáticamente
        </span>
      </div>
    </div>
  );
}
