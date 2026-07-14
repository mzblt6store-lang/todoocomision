import React, { useState, useEffect } from 'react';
import { User, DollarSign, Award, Clock, ShieldCheck, Sparkles, BookOpen, Search, Percent, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { CommissionSaleOrder, ProductCommission, SalespersonStats } from '../types';

interface VendorDashboardProps {
  sales: CommissionSaleOrder[];
  products: ProductCommission[];
}

export default function VendorDashboard({ sales, products }: VendorDashboardProps) {
  // Get all unique sellers to populate switcher
  const sellersMap = new Map<number, string>();
  sales.forEach(s => {
    if (s.salesperson_id && s.salesperson_name) {
      sellersMap.set(s.salesperson_id, s.salesperson_name);
    }
  });
  const sellers = Array.from(sellersMap.entries()).map(([id, name]) => ({ id, name }));

  // Set default active seller if list is not empty
  const [activeSellerId, setActiveSellerId] = useState<number | null>(null);
  const [activeSellerName, setActiveSellerName] = useState<string>('');

  useEffect(() => {
    if (sellers.length > 0) {
      if (!activeSellerId || !sellers.some(s => s.id === activeSellerId)) {
        setActiveSellerId(sellers[0].id);
        setActiveSellerName(sellers[0].name);
      }
    } else {
      setActiveSellerId(-1);
      setActiveSellerName('Sin Ventas');
    }
  }, [sales]);

  const handleSellerChange = (idStr: string) => {
    const id = parseInt(idStr);
    const s = sellers.find(x => x.id === id);
    if (s) {
      setActiveSellerId(id);
      setActiveSellerName(s.name);
    }
  };

  // Filter sales and stats for the active seller
  const sellerSales = sales.filter(o => o.salesperson_id === activeSellerId);
  const totalSalesVolume = sellerSales.reduce((sum, o) => sum + o.amount_total, 0);
  const totalCommission = sellerSales.reduce((sum, o) => sum + o.commission_total, 0);
  const pendingCommission = sellerSales.filter(o => o.status === 'pending').reduce((sum, o) => sum + o.commission_total, 0);
  const paidCommission = sellerSales.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.commission_total, 0);

  // Expanded order state for lines detail
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Search inside Commission catalog
  const [catalogSearch, setCatalogSearch] = useState('');
  
  // Filter products that have active commission for catalog view
  const commissionProducts = products
    .filter(p => p.commission_type !== 'none')
    .filter(p => p.name.toLowerCase().includes(catalogSearch.toLowerCase()));

  if (activeSellerId === null) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center" id="vendor-dashboard">
        <span className="text-slate-400 text-xs">Cargando catálogo e información de ventas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="vendor-dashboard">
      {/* Selector and Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Portal de Ventas</span>
          <h2 className="text-lg font-semibold text-slate-800 font-display flex items-center gap-2 mt-1">
            <User className="h-5 w-5 text-indigo-600" />
            Panel de Control del Vendedor
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Selecciona tu perfil de vendedor para auditar tus ventas, revisar comisiones aprobadas y consultar el catálogo motivacional de incentivos.
          </p>
        </div>

        {/* Profile Switcher Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-500 pl-2">Vendedor:</span>
          <select
            value={activeSellerId}
            onChange={(e) => handleSellerChange(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg p-1.5 px-3 outline-none focus:border-indigo-500"
          >
            {sellers.length === 0 && (
              <option value="-1">Sin Ventas Registradas</option>
            )}
            {sellers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Seller Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total sales volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Mis Ventas Totales
            </span>
            <span className="text-xl font-bold font-display text-slate-800 mt-1 block">
              S/ {totalSalesVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              De {sellerSales.length} órdenes registradas
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50/50 text-indigo-600">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </div>

        {/* Total commissions generated */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Mis Comisiones Ganadas
            </span>
            <span className="text-xl font-bold font-display text-indigo-600 mt-1 block">
              S/ {totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Acumulado total de comisiones
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50/50 text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
        </div>

        {/* Pending payment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Comisiones Por Cobrar
            </span>
            <span className="text-xl font-bold font-display text-amber-600 mt-1 block">
              S/ {pendingCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-amber-500 font-medium mt-1 block flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping"></span>
              En espera de aprobación administrativa
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/60 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Already Paid commissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Comisiones Liquidadas / Pagadas
            </span>
            <span className="text-xl font-bold font-display text-emerald-700 mt-1 block">
              S/ {paidCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block flex items-center gap-0.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Depositado en mi cuenta
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/60 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Orders list vs Commission Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Personal Orders log */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-7">
          <div className="p-6 border-b border-slate-50 bg-slate-50/20">
            <h3 className="text-sm font-semibold text-slate-800 font-display">
              Mi Historial de Ventas Comisionadas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Auditoría detallada de tus pedidos y liquidaciones individuales</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/30">
                  <th className="p-4 pl-6">Pedido</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4 text-right">Total Venta</th>
                  <th className="p-4 text-right">Mi Comisión</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Líneas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
                {sellerSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No tienes ventas registradas en el sistema todavía.
                    </td>
                  </tr>
                ) : (
                  sellerSales.map(order => {
                    const isExpanded = expandedOrderId === order.id;
                    return (
                      <React.Fragment key={order.id}>
                        <tr className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-4 pl-6 font-bold text-slate-800">{order.name}</td>
                          <td className="p-4 text-slate-500">
                            {new Date(order.date_order).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right font-mono">S/ {order.amount_total.toFixed(2)}</td>
                          <td className="p-4 text-right font-mono font-bold text-indigo-600 bg-indigo-50/5">
                            S/ {order.commission_total.toFixed(2)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              order.status === 'paid' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {order.status === 'paid' ? 'Pagado' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                              className="text-indigo-600 hover:text-indigo-800 p-1 rounded-lg hover:bg-slate-50 cursor-pointer inline-flex items-center justify-center"
                            >
                              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/30">
                            <td colSpan={6} className="p-4 pl-10 pr-6">
                              <div className="bg-white rounded-lg border border-slate-100 p-3 shadow-3xs space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Productos vendidos en {order.name}:</span>
                                <div className="divide-y divide-slate-50 text-[11px]">
                                  {order.lines.map(line => (
                                    <div key={line.id} className="py-2 flex justify-between items-center">
                                      <div>
                                        <span className="font-medium text-slate-800">{line.product_name}</span>
                                        <span className="text-slate-400 block text-[10px]">
                                          Cantidad: {line.quantity} u · Precio: S/ {line.price_unit.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="font-mono font-bold text-indigo-600 text-right">
                                        + S/ {line.commission_earned.toFixed(2)}
                                        {line.commission_earned === 0 && (
                                          <span className="text-[9px] text-slate-400 block font-normal">(S/ 0.00)</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
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
        </div>

        {/* Motivational Commission Catalog */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 font-display flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  Catálogo de Incentivos
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">¡Revisa qué productos te pagan mayores comisiones hoy!</p>
              </div>
            </div>

            {/* Catalog search */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/5">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar producto comisionable..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="pl-8.5 w-full text-xs border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Catalog Cards */}
            <div className="p-4 max-h-[380px] overflow-y-auto divide-y divide-slate-100 space-y-2">
              {commissionProducts.length === 0 ? (
                <div className="text-center text-slate-400 py-12 text-xs">
                  No hay productos con comisiones activas que coincidan con la búsqueda.
                </div>
              ) : (
                commissionProducts.map(p => {
                  return (
                    <div key={p.id} className="py-3 flex justify-between items-center gap-2">
                      <div className="flex-1">
                        <span className="font-semibold text-slate-800 text-xs block leading-tight">{p.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-medium">Precio: S/ {p.list_price.toFixed(2)}</span>
                          {p.default_code && (
                            <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-bold uppercase">{p.default_code}</span>
                          )}
                        </div>
                      </div>

                      {/* Earn indicator */}
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 inline-flex items-center gap-0.5">
                          {p.commission_type === 'fixed' ? (
                            <>+ S/ {p.commission_value.toFixed(2)} / u</>
                          ) : (
                            <>+{p.commission_value}% por venta</>
                          )}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-1 block">
                          Ganas S/ {p.commission_type === 'fixed' ? p.commission_value.toFixed(2) : (p.list_price * p.commission_value / 100).toFixed(2)} por cada unidad vendida
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Catalog Footer motivation */}
          <div className="p-4 bg-indigo-50/40 border-t border-slate-100 flex items-start gap-2.5 text-[10px] text-slate-500">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span>
              Tip: Enfoca tu estrategia de ventas en los productos del catálogo. Los porcentajes te darán un retorno exponencial con ventas corporativas o por volumen.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
