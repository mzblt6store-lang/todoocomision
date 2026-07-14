import React, { useState } from 'react';
import { UserProfile, OdooCompany } from '../types';
import { Shield, Briefcase, User, Percent, ArrowRight, CheckCircle, Zap, Globe, Key, AlertCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';
import inspiringImage from '../assets/images/salespeople_commission_joy_1784042501950.jpg';

interface GatewayPortalProps {
  userProfiles: UserProfile[];
  companies: OdooCompany[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onEnter: () => void;
  isDemo: boolean;
}

export default function GatewayPortal({
  userProfiles,
  companies,
  activeProfileId,
  onSelectProfile,
  onEnter,
  isDemo
}: GatewayPortalProps) {
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showHints, setShowHints] = useState<boolean>(false);

  // Default login action
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const query = usernameInput.trim().toLowerCase();
    if (!query) {
      setError('Por favor ingresa tu usuario o correo electrónico.');
      return;
    }

    // Find a matching user profile
    const matchedProfile = userProfiles.find(
      p => p.email.toLowerCase() === query || p.name.toLowerCase() === query || p.id.toLowerCase() === query
    );

    if (matchedProfile) {
      onSelectProfile(matchedProfile.id);
      onEnter();
    } else {
      setError('Usuario o correo electrónico no encontrado. Verifica tus credenciales o consulta la lista de usuarios registrados.');
    }
  };

  const handleSelectHint = (profile: UserProfile) => {
    setUsernameInput(profile.email || profile.name);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between relative overflow-hidden font-sans select-none" id="gateway-portal">
      {/* Decorative ambient background spots */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-odoo-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-odoo-secondary/5 blur-3xl pointer-events-none" />

      {/* Top Bar / Header of Portal */}
      <div className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-odoo-primary text-white flex items-center justify-center shadow-md shadow-odoo-primary/20">
            <Percent className="h-4.5 w-4.5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight font-display text-slate-800">
              todoo<span className="text-odoo-secondary">Comision</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Zap className="h-3 w-3 fill-current text-amber-500" />
              Base de Datos Demo
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <Globe className="h-3 w-3 text-slate-400" />
            v1.0.0 Stable
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full px-6 py-8 flex-grow flex flex-col lg:flex-row items-center justify-center gap-12 z-10">
        
        {/* Left column: Welcome Messaging & Inspiring Image */}
        <div className="lg:w-1/2 space-y-6 text-center lg:text-left flex flex-col justify-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-odoo-primary/10 text-odoo-primary border border-odoo-primary/20 w-fit mx-auto lg:mx-0">
            <span>🚀 ¡Bienvenido al futuro de tus comisiones!</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-slate-950 font-display tracking-tight leading-none">
            Gestiona tus comisiones de <span className="text-odoo-primary">Odoo</span> de forma <span className="text-odoo-secondary">inteligente</span>.
          </h1>

          <p className="text-sm text-slate-500 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Una plataforma integrada de extremo a extremo que sincroniza tus reglas, productos y ventas de Odoo, calculando de manera transparente las comisiones de administradores y cajeros en tiempo real.
          </p>

          {/* INSPIRING IMAGE EMBED */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-md group max-w-lg mx-auto lg:mx-0">
            <img 
              src={inspiringImage} 
              alt="Vendedores felices por sus comisiones" 
              className="w-full h-48 object-cover object-center transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent flex items-end p-4">
              <div className="text-left text-white">
                <span className="text-[10px] font-bold text-odoo-mint uppercase tracking-wider">Vendedores Motivados</span>
                <h3 className="text-sm font-bold mt-0.5">La felicidad de alcanzar y superar tus metas de ventas</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: The elegant login portal card */}
        <div className="lg:w-1/2 w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden"
          >
            {/* Elegant header on card */}
            <div className="pb-5 border-b border-slate-100 mb-6">
              <span className="text-[10px] font-black tracking-wider text-odoo-primary uppercase">Portal de Acceso</span>
              <h2 className="text-xl font-bold text-slate-800 mt-0.5 font-display">Inicia Sesión</h2>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Ingresa tus credenciales para acceder a todooComision.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-2xl text-[11px] font-semibold flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-600 flex items-center gap-1.5 mb-1">
                  <User className="h-3.5 w-3.5 text-odoo-primary" />
                  Usuario o Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="ej. soporte@facturaclic.pe"
                    className="w-full pl-3 pr-10 py-3 border border-slate-200 rounded-2xl outline-hidden focus:border-odoo-primary focus:ring-2 focus:ring-odoo-primary/10 transition-all font-medium text-slate-800 text-xs shadow-3xs"
                    required
                  />
                  <div className="absolute right-3.5 top-3.5 text-slate-400">
                    <Key className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-odoo-primary hover:bg-odoo-primary/95 text-white font-bold text-xs rounded-2xl cursor-pointer transition-all shadow-md shadow-odoo-primary/20 flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-[0px] mt-2"
              >
                Ingresar al Portal
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Collapsible hints container for quick test logins */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowHints(!showHints)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-odoo-primary transition-all focus:outline-none"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                  ¿Cuáles son las cuentas de demostración?
                </span>
                {showHints ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showHints && (
                <div className="mt-3.5 space-y-2 max-h-[180px] overflow-y-auto pr-1 animate-fadeIn">
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-1.5">
                    Haz clic en cualquiera de las siguientes cuentas pre-configuradas para copiar su usuario e ingresar al instante:
                  </p>
                  
                  {userProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => handleSelectHint(profile)}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-odoo-primary/[0.03] hover:border-odoo-primary/30 transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-bold text-slate-700">{profile.name}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            profile.role === 'admin'
                              ? 'bg-odoo-gold/10 text-odoo-gold'
                              : profile.role === 'company_admin'
                              ? 'bg-odoo-primary/10 text-odoo-primary'
                              : 'bg-odoo-secondary/10 text-odoo-secondary'
                          }`}>
                            {profile.role === 'admin' ? 'Global' : profile.role === 'company_admin' ? 'Sucursal' : 'Cajero'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono select-all mt-0.5">{profile.email}</p>
                      </div>
                      <span className="text-[9px] font-bold text-odoo-primary hover:underline shrink-0">Usar</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 text-center text-[11px] text-slate-400 font-medium border-t border-slate-100/60 z-10">
        todooComisión © {new Date().getFullYear()} • Integrado con Odoo Community • Todos los derechos reservados.
      </div>
    </div>
  );
}
