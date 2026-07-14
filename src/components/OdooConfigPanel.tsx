import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, RefreshCw, Zap, Cloud, Lock, AlertCircle, HelpCircle, Database, HardDriveDownload, HardDriveUpload } from 'lucide-react';
import { OdooConfig } from '../types';

interface OdooConfigPanelProps {
  onSyncComplete: () => void;
}

export default function OdooConfigPanel({ onSyncComplete }: OdooConfigPanelProps) {
  const [config, setConfig] = useState<OdooConfig>({
    url: '',
    db: '',
    username: '',
    password: '',
    isDemo: true,
    isConnected: false,
  });
  
  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [syncingSales, setSyncingSales] = useState(false);
  
  // Supabase states
  const [supabaseConnString, setSupabaseConnString] = useState('');
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [initializingSupabase, setInitializingSupabase] = useState(false);
  const [syncingDownSupabase, setSyncingDownSupabase] = useState(false);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setPasswordInput(data.password || '');
        if (data.supabase) {
          setSupabaseConnString(data.supabase.connectionString || '');
          setSupabaseEnabled(data.supabase.isEnabled || false);
        }
      }
    } catch (e) {
      console.error('Error fetching config:', e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          password: passwordInput,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: data.message || 'Configuración guardada correctamente.' });
        fetchConfig();
        onSyncComplete();
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: errorData.error || 'No se pudo guardar la configuración.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de red al intentar guardar.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: config.url,
          db: config.db,
          username: config.username,
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Conexión con Odoo exitosa.' });
        fetchConfig();
        onSyncComplete();
      } else {
        setMessage({ type: 'error', text: data.error || 'Fallo de autenticación.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'No se pudo contactar con el proxy RPC de Odoo.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncProducts = async () => {
    setSyncingProducts(true);
    setMessage(null);
    try {
      const res = await fetch('/api/config/sync-products', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchConfig();
        onSyncComplete();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al sincronizar productos.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de comunicación durante la sincronización.' });
    } finally {
      setSyncingProducts(false);
    }
  };

  const handleSyncSales = async () => {
    setSyncingSales(true);
    setMessage(null);
    try {
      const res = await fetch('/api/config/sync-sales', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchConfig();
        onSyncComplete();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al sincronizar ventas.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de comunicación durante la sincronización.' });
    } finally {
      setSyncingSales(false);
    }
  };

  // Supabase connection and sync handlers
  const handleSaveSupabase = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/config/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString: supabaseConnString,
          isEnabled: supabaseEnabled,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: 'Configuración de Supabase guardada correctamente.' });
        fetchConfig();
        onSyncComplete();
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: errorData.error || 'No se pudo guardar la configuración de Supabase.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de red al intentar guardar Supabase.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setMessage(null);
    try {
      const res = await fetch('/api/config/supabase/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: supabaseConnString }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Conexión con Supabase exitosa.' });
        fetchConfig();
      } else {
        setMessage({ type: 'error', text: data.error || 'Fallo de conexión con Supabase.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de red al conectar con Supabase.' });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleInitSupabase = async () => {
    setInitializingSupabase(true);
    setMessage(null);
    try {
      // First save to ensure isEnabled is set
      await fetch('/api/config/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: supabaseConnString, isEnabled: true }),
      });

      const res = await fetch('/api/config/supabase/init', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setSupabaseEnabled(true);
        fetchConfig();
        onSyncComplete();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al inicializar tablas.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de red durante la inicialización.' });
    } finally {
      setInitializingSupabase(false);
    }
  };

  const handleSyncDownSupabase = async () => {
    setSyncingDownSupabase(true);
    setMessage(null);
    try {
      const res = await fetch('/api/config/supabase/sync-down', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchConfig();
        onSyncComplete();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al descargar datos de Supabase.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de red al descargar de Supabase.' });
    } finally {
      setSyncingDownSupabase(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="odoo-config-panel">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 font-display flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-600" />
            Conexión con Odoo 14
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configura el acceso externo a Odoo Community por XML-RPC
          </p>
        </div>
        
        {/* Connection status badge */}
        <div className="flex items-center gap-2">
          {config.isDemo ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
              <Zap className="h-3 w-3 fill-current" />
              Modo Demo Activo
            </span>
          ) : config.isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle className="h-3 w-3 fill-current" />
              Conectado a Odoo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <XCircle className="h-3 w-3 text-slate-400" />
              Sin Conexión
            </span>
          )}
        </div>
      </div>

      {/* Main body */}
      <div className="p-6">
        {/* Explanatory banner */}
        <div className="mb-6 p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-indigo-950 mb-1">¿Cómo funciona la integración?</p>
            <p className="mb-2">
              Este sistema funciona como un <strong>puente RPC seguro</strong>. No requiere instalar módulos ni modificar el código de tu servidor Odoo 14. Al conectarte, sincronizaremos productos y órdenes confirmadas para calcular las comisiones de manera local en tiempo real.
            </p>
            <p className="font-medium text-slate-700">
              Recomendación: En lugar de conectarte directamente, puedes habilitar el <strong>Modo Demo</strong> para ver reportes interactivos generados de inmediato con datos de prueba realistas.
            </p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 text-xs flex items-start gap-2.5 border ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}>
            <AlertCircle className={`h-4.5 w-4.5 shrink-0 ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Modo de Operación</span>
              <span className="text-[11px] text-slate-500">Usa datos simulados o conecta tu servidor real</span>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, isDemo: !prev.isDemo }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.isDemo ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    config.isDemo ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {!config.isDemo && (
            <div className="space-y-4 pt-2">
              {/* URL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  URL del Servidor Odoo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Cloud className="h-4 w-4" />
                  </span>
                  <input
                    type="url"
                    required
                    placeholder="https://mi-empresa.odoo.com"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    className="pl-9 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Database */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Nombre de Base de Datos
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="odoo_db_name"
                    value={config.db}
                    onChange={(e) => setConfig({ ...config, db: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Usuario / Email de Odoo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="admin@miempresa.com"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Clave API o Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Contraseña o Token de acceso externo"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="pl-9 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Guardar Configuración
            </button>

            {!config.isDemo && (
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !config.url || !config.db || !config.username || !passwordInput}
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer border border-indigo-100"
              >
                {testing && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                Validar Conexión
              </button>
            )}
          </div>
        </form>

        {/* Sync Controls Section */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Sincronización de Datos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sync Products card */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/20 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Productos</span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Carga los productos listos para la venta.
                </span>
                {config.lastSyncedProducts && (
                  <span className="text-[10px] text-slate-500 mt-2 block font-mono">
                    Última Sinc: {new Date(config.lastSyncedProducts).toLocaleString()}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSyncProducts}
                disabled={syncingProducts}
                className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/50"
              >
                <RefreshCw className={`h-3 w-3 ${syncingProducts ? 'animate-spin' : ''}`} />
                Sincronizar Productos
              </button>
            </div>

            {/* Sync Sales card */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/20 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Órdenes de Venta (POS)</span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Carga las ventas del Punto de Venta (POS) pagadas.
                </span>
                {config.lastSyncedSales && (
                  <span className="text-[10px] text-slate-500 mt-2 block font-mono">
                    Última Sinc: {new Date(config.lastSyncedSales).toLocaleString()}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSyncSales}
                disabled={syncingSales}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RefreshCw className={`h-3 w-3 ${syncingSales ? 'animate-spin' : ''}`} />
                Sincronizar Ventas POS
              </button>
            </div>
          </div>
        </div>

        {/* Supabase Database Integration Section */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="h-4 w-4 text-emerald-600" />
                Base de Datos de Comisiones (Supabase)
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Almacena productos, comisiones y ventas del POS directamente en tu base de datos de Supabase.
              </p>
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                supabaseEnabled 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : 'bg-slate-50 text-slate-500 border border-slate-100'
              }`}>
                {supabaseEnabled ? 'Sincronización Activa' : 'Sincronización Inactiva'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
            {/* Connection string input */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Cadena de Conexión de Supabase (URI de PostgreSQL)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none font-mono text-[10px]">
                    URI:
                  </span>
                  <input
                    type="password"
                    placeholder="postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
                    value={supabaseConnString}
                    onChange={(e) => setSupabaseConnString(e.target.value)}
                    className="pl-12 w-full text-xs font-mono border border-slate-200 rounded-lg p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Utiliza la URI de conexión de tipo Transaction Pooler (puerto 6543) o Direct Connection (puerto 5432) provista por Supabase en tu panel de control.
                </p>
              </div>

              {/* Toggle to activate Supabase sync */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Sincronizar Comisiones en Supabase</span>
                  <span className="text-[10px] text-slate-400">Si se activa, la gestión de productos y cálculo de comisiones se escribirá en Supabase.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSupabaseEnabled(!supabaseEnabled)}
                  disabled={!supabaseConnString}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    supabaseEnabled ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      supabaseEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Save & Test */}
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={testingSupabase || !supabaseConnString}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1 cursor-pointer border border-slate-200"
                >
                  {testingSupabase && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Probar Conexión
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveSupabase()}
                  disabled={loading || !supabaseConnString}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  Guardar Configuración
                </button>

                {/* Database Actions */}
                <button
                  type="button"
                  onClick={handleInitSupabase}
                  disabled={initializingSupabase || !supabaseConnString}
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  title="Crea las tablas requeridas y sube tus comisiones locales"
                >
                  {initializingSupabase ? <RefreshCw className="h-3 w-3 animate-spin" /> : <HardDriveUpload className="h-3.5 w-3.5" />}
                  Crear Tablas e Inicializar Datos
                </button>

                {supabaseEnabled && (
                  <button
                    type="button"
                    onClick={handleSyncDownSupabase}
                    disabled={syncingDownSupabase}
                    className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    title="Descarga la información desde Supabase hacia la caché local"
                  >
                    {syncingDownSupabase ? <RefreshCw className="h-3 w-3 animate-spin" /> : <HardDriveDownload className="h-3.5 w-3.5" />}
                    Descargar de Supabase
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
