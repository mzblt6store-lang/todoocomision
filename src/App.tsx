import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Percent, 
  ShoppingBag, 
  User, 
  Settings, 
  RefreshCw, 
  Zap, 
  CheckCircle, 
  XCircle, 
  CloudAlert, 
  Award,
  Sparkles,
  Users,
  LogOut
} from 'lucide-react';

import OdooConfigPanel from './components/OdooConfigPanel';
import AdminCommissionManager from './components/AdminCommissionManager';
import AdminSalesOrders from './components/AdminSalesOrders';
import SellersReport from './components/SellersReport';
import VendorDashboard from './components/VendorDashboard';
import ProfilesManager from './components/ProfilesManager';
import GatewayPortal from './components/GatewayPortal';
import { ProductCommission, CommissionSaleOrder, OdooConfig, UserProfile, OdooCompany } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'reporting' | 'products' | 'sales' | 'vendor' | 'profiles' | 'config'>('reporting');
  const [products, setProducts] = useState<ProductCommission[]>([]);
  const [sales, setSales] = useState<CommissionSaleOrder[]>([]);
  const [config, setConfig] = useState<OdooConfig | null>(null);
  
  // Profiles and companies state
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<OdooCompany[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('admin-global');
  const [isEntered, setIsEntered] = useState<boolean>(() => localStorage.getItem('todoocomision_entered') === 'true');

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  // Load everything on mount & when lastUpdated changes
  useEffect(() => {
    fetchGlobalData();
  }, [lastUpdated]);

  const fetchGlobalData = async () => {
    setRefreshing(true);
    try {
      // Parallel fetches
      const [resConfig, resProducts, resSales, resProfiles] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/products'),
        fetch('/api/sales'),
        fetch('/api/profiles')
      ]);

      if (resConfig.ok) {
        const configData = await resConfig.json();
        setConfig(configData);
      }
      if (resProducts.ok) {
        const productsData = await resProducts.json();
        setProducts(productsData);
      }
      if (resSales.ok) {
        const salesData = await resSales.json();
        setSales(salesData);
      }
      if (resProfiles.ok) {
        const profilesData = await resProfiles.json();
        setUserProfiles(profilesData.userProfiles || []);
        setCompanies(profilesData.companies || []);
        setActiveProfileId(profilesData.activeProfileId || 'admin-global');
        
        // Force tab to vendor for cashiers if active profile is cashier
        const currentActive = (profilesData.userProfiles || []).find((p: any) => p.id === (profilesData.activeProfileId || 'admin-global'));
        if (currentActive?.role === 'cashier') {
          setActiveTab('vendor');
        }
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const triggerUpdate = () => {
    setLastUpdated(Date.now());
  };

  const handleSyncAll = async () => {
    setRefreshing(true);
    try {
      // Sync products first
      await fetch('/api/config/sync-products', { method: 'POST' });
      // Sync sales next
      await fetch('/api/config/sync-sales', { method: 'POST' });
      triggerUpdate();
    } catch (e) {
      console.error('Error in manual full sync:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const activeProfile = userProfiles.find(p => p.id === activeProfileId) || {
    id: 'admin-global',
    name: 'Soporte Técnico (Admin)',
    email: 'soporte@facturaclic.pe',
    role: 'admin' as const
  };

  const filteredProducts = products.filter(p => {
    if (activeProfile.role === 'admin') return true;
    return p.company_id === activeProfile.companyId;
  });

  const filteredSales = sales.filter(s => {
    if (activeProfile.role === 'admin') return true;
    return s.company_id === activeProfile.companyId;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-600 font-sans">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 border-4 border-odoo-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center">
            <h1 className="text-sm font-bold text-slate-800">Cargando todooComisión...</h1>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Iniciando base de datos interna y proxy RPC de Odoo</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isEntered && userProfiles.length > 0) {
    return (
      <GatewayPortal
        userProfiles={userProfiles}
        companies={companies}
        activeProfileId={activeProfileId}
        onSelectProfile={async (id) => {
          setActiveProfileId(id);
          await fetch('/api/profiles/active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activeProfileId: id })
          });
          const selected = userProfiles.find(p => p.id === id);
          if (selected?.role === 'cashier') {
            setActiveTab('vendor');
          } else {
            setActiveTab('reporting');
          }
          triggerUpdate();
        }}
        onEnter={() => {
          setIsEntered(true);
          localStorage.setItem('todoocomision_entered', 'true');
        }}
        isDemo={!!config?.isDemo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-700 font-sans flex flex-col antialiased">
      {/* 1. Header Navigation Bar */}
      <header className="bg-white border-b border-slate-150/80 sticky top-0 z-40 shadow-3xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          
          {/* Brand Logo and Title */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-odoo-primary text-white flex items-center justify-center shadow-sm shadow-odoo-primary/20">
              <Percent className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-none tracking-tight font-display flex items-center gap-0.5">
                todoo<span className="text-odoo-secondary font-bold">Comision</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold font-mono tracking-wider uppercase mt-0.5">
                Odoo 14 Community • RPC Proxy Integration
              </p>
            </div>
          </div>

          {/* Quick status controls and Sync summary */}
          <div className="flex items-center flex-wrap gap-2.5 justify-end">
            {/* Active Profile Switcher Dropdown */}
            {userProfiles.length > 0 && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-odoo-primary/5 text-odoo-primary border border-odoo-primary/10">
                <span className="text-[10px] font-extrabold text-odoo-primary/60 font-mono uppercase mr-1">PERFIL:</span>
                <select
                  value={activeProfileId}
                  onChange={async (e) => {
                    const targetId = e.target.value;
                    setActiveProfileId(targetId);
                    
                    // Persist on backend
                    await fetch('/api/profiles/active', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ activeProfileId: targetId })
                    });
                    
                    // Redirection based on role
                    const selected = userProfiles.find(p => p.id === targetId);
                    if (selected?.role === 'cashier') {
                      setActiveTab('vendor');
                    } else {
                      setActiveTab('reporting');
                    }
                    triggerUpdate();
                  }}
                  className="bg-transparent text-[11px] font-bold text-odoo-primary outline-hidden cursor-pointer"
                >
                  {userProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role === 'admin' ? 'Global' : p.companyName || 'Compañía'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Exit Portal / Logout button */}
            <button
              onClick={() => {
                setIsEntered(false);
                localStorage.removeItem('todoocomision_entered');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200/40 cursor-pointer transition-all shrink-0"
              title="Cerrar sesión y volver al portal de acceso"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>

            {/* Odoo Status Badge */}
            {config?.isDemo ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                <Zap className="h-3 w-3 fill-current" />
                Modo Demo
              </span>
            ) : config?.isConnected ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CheckCircle className="h-3 w-3 fill-current" />
                Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                <XCircle className="h-3 w-3" />
                Desconectado
              </span>
            )}

            {/* Quick full-sync button */}
            {activeProfile.role !== 'cashier' && (
              <button
                type="button"
                onClick={handleSyncAll}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200/50 cursor-pointer disabled:opacity-50 transition-all shadow-3xs"
                title="Sincronizar todo desde Odoo"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                Sincronizar Odoo
              </button>
            )}
          </div>
        </div>

        {/* 2. Primary Tabs Menu (Role Aware) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
          <div className="flex space-x-1 overflow-x-auto py-1.5 scrollbar-none">
            
            {activeProfile.role !== 'cashier' ? (
              <>
                {/* Tab: Consolidado */}
                <button
                  onClick={() => setActiveTab('reporting')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                    activeTab === 'reporting'
                      ? 'bg-odoo-primary/10 text-odoo-primary border border-odoo-primary/20'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <TrendingUp className="h-4 w-4 shrink-0" />
                  Consolidado & Reportes
                </button>

                {/* Tab: Configurar Comisiones */}
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                    activeTab === 'products'
                      ? 'bg-odoo-primary/10 text-odoo-primary border border-odoo-primary/20'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Percent className="h-4 w-4 shrink-0" />
                  Reglas de Comisión
                </button>

                {/* Tab: Ventas y liquidación */}
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                    activeTab === 'sales'
                      ? 'bg-odoo-primary/10 text-odoo-primary border border-odoo-primary/20'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  Ventas & Liquidación
                </button>

                {/* Tab: Portal Vendedor */}
                <button
                  onClick={() => setActiveTab('vendor')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                    activeTab === 'vendor'
                      ? 'bg-odoo-primary/10 text-odoo-primary border border-odoo-primary/20'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <User className="h-4 w-4 shrink-0" />
                  Portal del Vendedor
                </button>

                {/* Tab: Perfiles y Roles (Admin only) */}
                {activeProfile.role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('profiles')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                      activeTab === 'profiles'
                        ? 'bg-odoo-primary/10 text-odoo-primary border border-odoo-primary/20'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    Perfiles & Roles
                  </button>
                )}

                {/* Divider */}
                <div className="h-6 w-px bg-slate-200 self-center mx-2 shrink-0"></div>

                {/* Tab: Odoo Ajustes */}
                <button
                  onClick={() => setActiveTab('config')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                    activeTab === 'config'
                      ? 'bg-odoo-secondary text-white shadow-sm hover:bg-odoo-secondary/95'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  Conexión Odoo
                </button>
              </>
            ) : (
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-odoo-mint/10 text-odoo-mint border border-odoo-mint/20">
                <User className="h-4 w-4 shrink-0 text-odoo-mint" />
                Portal del Vendedor ({activeProfile.name})
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 3. Main Dashboard Body Container */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Banner if connection fails & not in demo mode */}
        {config && !config.isDemo && !config.isConnected && activeTab !== 'config' && activeProfile.role !== 'cashier' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-amber-800">
            <div className="flex items-start gap-2.5">
              <CloudAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Integración con Odoo Inactiva</span>
                <span>
                  No hemos podido conectarnos a tu servidor Odoo 14 Community. Por favor, revisa tus credenciales XML-RPC o activa el <strong>Modo Demo</strong> para explorar la aplicación de inmediato con datos realistas.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg cursor-pointer transition-all shrink-0 whitespace-nowrap"
            >
              Configurar Conexión
            </button>
          </div>
        )}

        {/* Dynamic Tab Panel Container with motion layouts */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'reporting' && activeProfile.role !== 'cashier' && (
                <SellersReport lastUpdated={lastUpdated} />
              )}

              {activeTab === 'products' && activeProfile.role !== 'cashier' && (
                <AdminCommissionManager 
                  products={filteredProducts} 
                  onProductUpdated={triggerUpdate} 
                />
              )}

              {activeTab === 'sales' && activeProfile.role !== 'cashier' && (
                <AdminSalesOrders 
                  sales={filteredSales} 
                  onOrderUpdated={triggerUpdate} 
                />
              )}

              {activeTab === 'vendor' && (
                <VendorDashboard 
                  sales={filteredSales} 
                  products={filteredProducts} 
                />
              )}

              {activeTab === 'profiles' && activeProfile.role === 'admin' && (
                <ProfilesManager
                  userProfiles={userProfiles}
                  companies={companies}
                  activeProfileId={activeProfileId}
                  onProfileChange={async (targetId) => {
                    setActiveProfileId(targetId);
                    await fetch('/api/profiles/active', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ activeProfileId: targetId })
                    });
                    const selected = userProfiles.find(p => p.id === targetId);
                    if (selected?.role === 'cashier') {
                      setActiveTab('vendor');
                    } else {
                      setActiveTab('reporting');
                    }
                    triggerUpdate();
                  }}
                  onProfilesUpdated={triggerUpdate}
                />
              )}

              {activeTab === 'config' && activeProfile.role !== 'cashier' && (
                <OdooConfigPanel 
                  onSyncComplete={triggerUpdate} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 4. Dashboard Footer */}
      <footer className="bg-white border-t border-slate-150 py-5 mt-12 text-center text-slate-400 text-[11px] font-medium font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>Odoo Commission Engine • Todos los derechos reservados &copy; 2026</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Sincronización en tiempo real por XML-RPC Proxy
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
