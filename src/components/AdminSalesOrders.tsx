import React, { useState } from 'react';
import { ShoppingBag, ChevronDown, ChevronUp, Calendar, User, DollarSign, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { CommissionSaleOrder } from '../types';

interface AdminSalesOrdersProps {
  sales: CommissionSaleOrder[];
  onOrderUpdated: () => void;
}

export default function AdminSalesOrders({ sales, onOrderUpdated }: AdminSalesOrdersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);

  // Toggle expand
  const toggleExpand = (id: number) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handleMarkAsPaid = async (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent expand toggle on click
    setPayingId(orderId);
    try {
      const res = await fetch(`/api/sales/${orderId}/pay`, { method: 'POST' });
      if (res.ok) {
        onOrderUpdated(); // Refresh list
      } else {
        alert('No se pudo marcar la comisión como pagada.');
      }
    } catch (e) {
      alert('Error de red al registrar el pago de comisiones.');
    } finally {
      setPayingId(null);
    }
  };

  // Get unique list of sellers for filter
  const sellersMap = new Map<number, string>();
  sales.forEach(s => {
    if (s.salesperson_id && s.salesperson_name) {
      sellersMap.set(s.salesperson_id, s.salesperson_name);
    }
  });
  const sellers = Array.from(sellersMap.entries()).map(([id, name]) => ({ id, name }));

  const [sellerFilter, setSellerFilter] = useState<string>('all');

  // Filter list
  const filteredSales = sales.filter(o => {
    const matchesSearch = o.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    
    const matchesSeller = sellerFilter === 'all' || o.salesperson_id === parseInt(sellerFilter);

    return matchesSearch && matchesStatus && matchesSeller;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="admin-sales-orders">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-800 font-display flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-indigo-600" />
          Órdenes de Venta y Liquidación
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Supervisa las órdenes confirmadas, el cálculo desglosado de comisiones y realiza el pago/liquidación a tus vendedores.
        </p>
      </div>

      {/* Filter controls */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
            Código de Orden (Odoo)
          </label>
          <input
            type="text"
            placeholder="Buscar por SO001..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10"
          />
        </div>

        {/* Seller Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
            Filtrar por Vendedor
          </label>
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none bg-white focus:border-indigo-500"
          >
            <option value="all">Todos los Vendedores</option>
            {sellers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
            Estado de Liquidación
          </label>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none bg-white focus:border-indigo-500"
          >
            <option value="all">Todas las Comisiones</option>
            <option value="pending">Pendientes de Pago</option>
            <option value="paid">Liquidadas / Pagadas</option>
          </select>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/30">
              <th className="p-4 pl-6 w-10"></th>
              <th className="p-4">Código / Fecha</th>
              <th className="p-4">Vendedor</th>
              <th className="p-4 text-right">Total Venta</th>
              <th className="p-4 text-right">Comisión Total</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-right pr-6">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400">
                  No se encontraron órdenes de venta registradas.
                </td>
              </tr>
            ) : (
              filteredSales.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                
                return (
                  <React.Fragment key={order.id}>
                    {/* Primary Row */}
                    <tr 
                      onClick={() => toggleExpand(order.id)}
                      className={`hover:bg-slate-50/70 transition-all cursor-pointer ${
                        isExpanded ? 'bg-indigo-50/10' : ''
                      }`}
                    >
                      {/* Accordion Icon */}
                      <td className="p-4 pl-6 text-slate-400">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </td>

                      {/* Order Code & Date */}
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{order.name}</div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.date_order).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>

                      {/* Salesperson */}
                      <td className="p-4 font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 text-[10px] flex items-center justify-center font-bold">
                            {order.salesperson_name.charAt(0)}
                          </div>
                          {order.salesperson_name}
                        </div>
                      </td>

                      {/* Sale Amount */}
                      <td className="p-4 text-right font-mono text-slate-700">
                        S/ {order.amount_total.toFixed(2)}
                      </td>

                      {/* Commission Total */}
                      <td className="p-4 text-right font-mono font-bold text-slate-900">
                        S/ {order.commission_total.toFixed(2)}
                      </td>

                      {/* Payout Status badge */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          order.status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {order.status === 'paid' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 fill-emerald-100 text-emerald-600" />
                              Liquidado
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                              Pendiente
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        {order.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsPaid(order.id, e)}
                            disabled={payingId === order.id || order.commission_total <= 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-40 shadow-xs cursor-pointer flex items-center gap-1 ml-auto transition-all"
                          >
                            {payingId === order.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <DollarSign className="h-3 w-3" />
                            )}
                            Liquidar Comisión
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Cerrado
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Line Items Details */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={7} className="p-6 pl-14 pr-6">
                          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                              Desglose de Líneas de Pedido y Comisiones
                            </h4>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 bg-slate-50/50">
                                    <th className="p-2">Producto</th>
                                    <th className="p-2 text-right">Cant.</th>
                                    <th className="p-2 text-right">Precio Unit.</th>
                                    <th className="p-2 text-right">Subtotal</th>
                                    <th className="p-2 text-right text-indigo-700">Comisión Calculada</th>
                                  </tr>
                                </thead>
                                <tbody className="text-slate-600 text-xs">
                                  {order.lines.map((line) => (
                                    <tr key={line.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                                      <td className="p-2 font-medium text-slate-800">
                                        {line.product_name}
                                      </td>
                                      <td className="p-2 text-right font-mono text-slate-500">
                                        {line.quantity}
                                      </td>
                                      <td className="p-2 text-right font-mono text-slate-500">
                                        S/ {line.price_unit.toFixed(2)}
                                      </td>
                                      <td className="p-2 text-right font-mono text-slate-500">
                                        S/ {line.price_subtotal.toFixed(2)}
                                      </td>
                                      <td className="p-2 text-right font-mono font-bold text-indigo-600 bg-indigo-50/10">
                                        S/ {line.commission_earned.toFixed(2)}
                                        {line.commission_earned === 0 && (
                                          <span className="text-[9px] text-slate-400 block font-normal">(Sin comisión)</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Aggregates inside expander */}
                            <div className="flex flex-col sm:flex-row justify-end items-end gap-2 sm:gap-6 mt-4 pt-3 border-t border-slate-100 font-mono text-xs">
                              <div className="text-slate-500">
                                Total Venta: <span className="font-bold text-slate-800">S/ {order.amount_total.toFixed(2)}</span>
                              </div>
                              <div className="text-indigo-600 text-sm bg-indigo-50/30 rounded-lg px-3 py-1 font-bold border border-indigo-100/30">
                                Comisión Total: <span>S/ {order.commission_total.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-400 text-right">
        Mostrando {filteredSales.length} de {sales.length} órdenes registradas
      </div>
    </div>
  );
}
