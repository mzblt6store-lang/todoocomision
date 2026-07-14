import React, { useState } from 'react';
import { UserProfile, OdooCompany } from '../types';
import { User, Shield, Briefcase, Plus, Trash2, Edit2, Users, Check, AlertCircle } from 'lucide-react';

interface ProfilesManagerProps {
  userProfiles: UserProfile[];
  companies: OdooCompany[];
  activeProfileId: string;
  onProfileChange: (profileId: string) => void;
  onProfilesUpdated: () => void;
}

export default function ProfilesManager({
  userProfiles,
  companies,
  activeProfileId,
  onProfileChange,
  onProfilesUpdated
}: ProfilesManagerProps) {
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'company_admin' | 'cashier'>('cashier');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const startCreate = () => {
    setEditingProfile({
      id: 'profile-' + Date.now(),
      name: '',
      email: '',
      role: 'cashier',
    });
    setName('');
    setEmail('');
    setRole('cashier');
    setSelectedCompanyId(companies[0]?.id || '');
    setError('');
    setSuccess('');
  };

  const startEdit = (profile: UserProfile) => {
    setEditingProfile(profile);
    setName(profile.name);
    setEmail(profile.email);
    setRole(profile.role);
    setSelectedCompanyId(profile.companyId || '');
    setError('');
    setSuccess('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre es requerido.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const matchedCompany = companies.find(c => c.id === Number(selectedCompanyId));
      const payload: UserProfile = {
        id: editingProfile!.id,
        name: name.trim(),
        email: email.trim(),
        role,
        companyId: role !== 'admin' && selectedCompanyId !== '' ? Number(selectedCompanyId) : undefined,
        companyName: role !== 'admin' && matchedCompany ? matchedCompany.name : undefined
      };

      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al guardar el perfil');
      
      setSuccess('Perfil guardado exitosamente.');
      setEditingProfile(null);
      onProfilesUpdated();
    } catch (err: any) {
      setError(err.message || 'Error de red.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === 'admin-global') {
      alert('No se puede eliminar el perfil Administrador Global principal.');
      return;
    }
    if (!confirm('¿Estás seguro de que deseas eliminar este perfil de usuario?')) return;

    try {
      const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar el perfil');
      onProfilesUpdated();
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el perfil.');
    }
  };

  return (
    <div className="space-y-6" id="profiles-manager-panel">
      {/* Intro Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-indigo-600" />
            Gestión de Perfiles y Multicompañía
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Asigna usuarios a compañías específicas (Odoo Company) y controla qué información pueden ver y gestionar según su rol.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-150"
        >
          <Plus className="h-4 w-4" />
          Crear Perfil
        </button>
      </div>

      {/* Grid Layout: Profiles List & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* List of profiles */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
            Perfiles de Usuario Configurados
          </div>

          <div className="space-y-3">
            {userProfiles.map((profile) => {
              const isActive = profile.id === activeProfileId;
              return (
                <div
                  key={profile.id}
                  className={`bg-white rounded-2xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-3xs hover:border-slate-300 ${
                    isActive ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      profile.role === 'admin' 
                        ? 'bg-rose-50 text-rose-600' 
                        : profile.role === 'company_admin'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {profile.role === 'admin' && <Shield className="h-5 w-5" />}
                      {profile.role === 'company_admin' && <Briefcase className="h-5 w-5" />}
                      {profile.role === 'cashier' && <User className="h-5 w-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-800">{profile.name}</h3>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          profile.role === 'admin'
                            ? 'bg-rose-100 text-rose-800'
                            : profile.role === 'company_admin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {profile.role === 'admin' ? 'Admin Global' : profile.role === 'company_admin' ? 'Admin Compañía' : 'Vendedor/Cajero'}
                        </span>
                        {isActive && (
                          <span className="bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Check className="h-2.5 w-2.5" /> Activo
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{profile.email || 'Sin correo electrónico'}</p>
                      
                      {/* Assigned Company info */}
                      {profile.role !== 'admin' && (
                        <div className="mt-2 text-[10px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg w-fit">
                          <span className="text-slate-400">Compañía:</span>
                          <span className="text-indigo-600">{profile.companyName || `ID: ${profile.companyId}`}</span>
                        </div>
                      )}
                      {profile.role === 'admin' && (
                        <div className="mt-2 text-[10px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg w-fit">
                          <span className="text-slate-400">Compañía:</span>
                          <span className="text-rose-600">Acceso Global (Todas las Compañías)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {!isActive && (
                      <button
                        onClick={() => onProfileChange(profile.id)}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
                      >
                        Activar
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(profile)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer transition-all"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {profile.id !== 'admin-global' && (
                      <button
                        onClick={() => handleDelete(profile.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Edit / Create Form Panel */}
        <div>
          {editingProfile ? (
            <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-3xs sticky top-24 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-indigo-600" />
                  {name ? `Editar: ${name}` : 'Nuevo Perfil'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Cancelar
                </button>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs flex items-start gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3.5 text-xs">
                {/* Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Nombre Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all font-medium"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@boticap.pe"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all font-medium"
                  />
                </div>

                {/* Role Selector */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Rol del Usuario</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 bg-white cursor-pointer transition-all font-medium"
                  >
                    <option value="admin">Administrador Global (Multi-Compañía)</option>
                    <option value="company_admin">Administrador de Compañía</option>
                    <option value="cashier">Cajero / Vendedor del Punto de Venta</option>
                  </select>
                </div>

                {/* Company Selector (hidden for admin) */}
                {role !== 'admin' && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="font-bold text-slate-600">Compañía Asociada (Odoo)</label>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 bg-white cursor-pointer transition-all font-medium"
                      required
                    >
                      <option value="">-- Seleccionar Compañía Odoo --</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">
                      El usuario solo visualizará y ganará comisiones de productos y ventas pertenecientes a esta compañía de Odoo.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-sm shadow-indigo-150 flex items-center justify-center gap-1.5"
              >
                {loading ? 'Guardando...' : 'Guardar Perfil'}
              </button>
            </form>
          ) : (
            <div className="bg-slate-100/50 rounded-2xl p-6 border border-dashed border-slate-300 text-center sticky top-24">
              <User className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-600">Crear o Editar Perfil</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Selecciona un perfil de la lista para editarlo o haz clic en "Crear Perfil" para dar de alta uno nuevo.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
