import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Award, Clock, ShieldCheck, Download, Users, FileText } from 'lucide-react';
import { DashboardStats, SalespersonStats } from '../types';

interface SellersReportProps {
  lastUpdated: number;
}

export default function SellersReport({ lastUpdated }: SellersReportProps) {
  const [stats, setStats] = useState<{ summary: DashboardStats; bySeller: SalespersonStats[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [lastUpdated]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reporting/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching reporting stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!stats || stats.bySeller.length === 0) return;
    
    // Build CSV Content
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Vendedor,Ordenes,Total Ventas,Total Comisiones,Pendiente,Pagado\n';
    
    stats.bySeller.forEach(s => {
      csvContent += `"${s.name}",${s.order_count},${s.total_sales},${s.total_commission},${s.pending_commission},${s.paid_commission}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Comisiones_Ventas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !stats) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center" id="sellers-report">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
          <span className="text-slate-500 text-xs font-semibold">Cargando reporte consolidado...</span>
        </div>
      </div>
    );
  }

  const { summary, bySeller } = stats;

  return (
    <div className="space-y-6" id="sellers-report">
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Volumen de Ventas
            </span>
            <span className="text-xl font-bold font-display text-slate-800 mt-1 block">
              S/ {summary.total_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              De {summary.total_orders_count} órdenes procesadas
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Total Commissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Comisiones Totales
            </span>
            <span className="text-xl font-bold font-display text-indigo-700 mt-1 block">
              S/ {summary.total_commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {summary.commissioned_products_count} productos con comisión
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
        </div>

        {/* Pending Payout */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pendientes de Liquidar
            </span>
            <span className="text-xl font-bold font-display text-amber-600 mt-1 block">
              S/ {summary.pending_commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-amber-500 font-medium mt-1 block flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Requiere acción de pago
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Paid Payout */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Comisiones Liquidadas
            </span>
            <span className="text-xl font-bold font-display text-emerald-700 mt-1 block">
              S/ {summary.paid_commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block flex items-center gap-0.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% Auditadas
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 font-display">
                Ventas y Comisiones Generadas por Vendedor
              </h3>
              <p className="text-[11px] text-slate-400">Comparativa del rendimiento comercial y su costo comisionable</p>
            </div>
          </div>

          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bySeller}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="total_sales" name="Ventas Totales (S/)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_commission" name="Comisión Generada (S/)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Owed commissions per seller (Liquidity details) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 font-display">
              Desglose de Liquidación por Vendedor
            </h3>
            <p className="text-[11px] text-slate-400 mb-6">Comisiones pagadas vs. pendientes acumuladas</p>
            
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bySeller}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="paid_commission" name="Pagado (S/)" stackId="a" fill="#059669" />
                  <Bar dataKey="pending_commission" name="Pendiente (S/)" stackId="a" fill="#d97706" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Leaders and Detail Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 font-display flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-indigo-600" />
              Tabla de Rendimiento Comercial
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Ranking e histórico consolidado de comisiones liquidadas por vendedor</p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/10">
                <th className="p-4 pl-6">Vendedor</th>
                <th className="p-4 text-center">Órdenes</th>
                <th className="p-4 text-right">Volumen Ventas</th>
                <th className="p-4 text-right">Comisión Ganada</th>
                <th className="p-4 text-right text-amber-700">Pendiente de Pago</th>
                <th className="p-4 text-right text-emerald-700">Pagado / Liquidado</th>
                <th className="p-4 text-center">Tasa de Comisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
              {bySeller.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No hay suficientes datos de venta para generar el ranking. Sincroniza órdenes desde la pestaña Configuración.
                  </td>
                </tr>
              ) : (
                [...bySeller]
                  .sort((a, b) => b.total_sales - a.total_sales)
                  .map((seller, idx) => {
                    // Calculate commission rate relative to total sales
                    const commRate = seller.total_sales > 0 
                      ? (seller.total_commission / seller.total_sales) * 100 
                      : 0;

                    return (
                      <tr key={seller.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Name and Trophy icon for top seller */}
                        <td className="p-4 pl-6 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 w-4 text-center text-[11px] font-bold">
                              {idx + 1}
                            </span>
                            <div className="h-6 w-6 rounded-full bg-indigo-50 text-indigo-600 text-[11px] flex items-center justify-center font-bold">
                              {seller.name.charAt(0)}
                            </div>
                            <span>{seller.name}</span>
                            {idx === 0 && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase flex items-center gap-0.5 shadow-3xs">
                                👑 Top
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Order Count */}
                        <td className="p-4 text-center font-mono text-slate-500">
                          {seller.order_count}
                        </td>

                        {/* Total Sales volume */}
                        <td className="p-4 text-right font-mono font-medium text-slate-800">
                          S/ {seller.total_sales.toFixed(2)}
                        </td>

                        {/* Total Commission earned */}
                        <td className="p-4 text-right font-mono font-semibold text-indigo-600">
                          S/ {seller.total_commission.toFixed(2)}
                        </td>

                        {/* Pending */}
                        <td className="p-4 text-right font-mono font-bold text-amber-600 bg-amber-50/10">
                          S/ {seller.pending_commission.toFixed(2)}
                        </td>

                        {/* Paid */}
                        <td className="p-4 text-right font-mono text-emerald-700 bg-emerald-50/10">
                          S/ {seller.paid_commission.toFixed(2)}
                        </td>

                        {/* Commission Rate */}
                        <td className="p-4 text-center font-mono">
                          <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {commRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
