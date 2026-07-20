import React, { useState } from 'react';
import { 
  useAdminInvitations, 
  useCreateInvitationMutation, 
  useCreateBulkInvitationMutation, 
  useToggleInvitationMutation 
} from '../../services/queries';
import { formatDateLong } from '../../utils/formatters';
import { 
  Loader2, Plus, Search, Copy, Check, Power, 
  PowerOff, Calendar, Users, FileSpreadsheet, X, Save 
} from 'lucide-react';

export const Invitations: React.FC = () => {
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  
  // Queries
  const { data: invData, isLoading } = useAdminInvitations(skip, limit, search);
  
  // Mutations
  const createMutation = useCreateInvitationMutation();
  const createBulkMutation = useCreateBulkInvitationMutation();
  const toggleMutation = useToggleInvitationMutation();

  // Estados locales
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulario Individual
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [expiration, setExpiration] = useState('');

  // Formulario Bulk
  const [prefix, setPrefix] = useState('INV');
  const [bulkQuantity, setBulkQuantity] = useState(10);
  const [bulkMaxUses, setBulkMaxUses] = useState(1);
  const [bulkExpiration, setBulkExpiration] = useState('');

  const handleCopyLink = (id: number, token: string) => {
    // Generar enlace completo
    const fullLink = `${window.location.origin}/invitacion/${token}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    createMutation.mutate({
      invited_name: name || undefined,
      email: email || undefined,
      phone: phone || undefined,
      max_uses: maxUses,
      expiration_date: expiration ? new Date(expiration).toISOString() : undefined,
      status: 'active'
    }, {
      onSuccess: () => {
        setIsSingleModalOpen(false);
        setName('');
        setEmail('');
        setPhone('');
        setMaxUses(1);
        setExpiration('');
      },
      onError: (err: any) => {
        const detail = err.response?.data?.detail;
        setErrorMsg(detail?.message || 'Error al crear la invitación.');
      }
    });
  };

  const handleCreateBulk = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    createBulkMutation.mutate({
      prefix,
      quantity: bulkQuantity,
      max_uses_per_invitation: bulkMaxUses,
      expiration_date: bulkExpiration ? new Date(bulkExpiration).toISOString() : undefined
    }, {
      onSuccess: () => {
        setIsBulkModalOpen(false);
        setPrefix('INV');
        setBulkQuantity(10);
        setBulkMaxUses(1);
        setBulkExpiration('');
      },
      onError: (err: any) => {
        const detail = err.response?.data?.detail;
        setErrorMsg(detail?.message || 'Error al generar las invitaciones.');
      }
    });
  };

  const handleToggle = (id: number, currentStatus: string) => {
    const isCurrentlyActive = currentStatus === 'active' || currentStatus === 'used' || currentStatus === 'exhausted';
    toggleMutation.mutate({ id, active: !isCurrentlyActive });
  };

  // Descarga CSV del listado actual visible en el cliente
  const handleDownloadClientCSV = () => {
    if (!invData?.invitations) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Codigo;Nombre;Correo;Telefono;Limite Usos;Usados;Enlace;Estado\r\n";
    
    invData.invitations.forEach((inv) => {
      const link = `${window.location.origin}/invitacion/${inv.token}`;
      csvContent += `${inv.code};${inv.invited_name || ""};${inv.email || ""};${inv.phone || ""};${inv.max_uses};${inv.used_count};${link};${inv.status}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invitaciones_pagina_${skip / limit + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = invData ? Math.ceil(invData.total / limit) : 0;
  const currentPage = skip / limit + 1;

  return (
    <div className="space-y-6">
      {/* Cabecera Administrativa */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-meraki-card border border-white/5 p-6 rounded-2xl shadow-lg gap-4">
        <div>
          <h3 className="font-display font-bold text-base text-white">Gestión de Invitaciones</h3>
          <p className="text-xs text-slate-500 mt-1">Genera enlaces únicos de invitaciones individuales o grupales.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleDownloadClientCSV}
            className="flex items-center gap-2 py-2 px-3 text-xs bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/20 rounded-xl transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar CSV de Página</span>
          </button>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 py-2 px-3.5 text-xs bg-meraki-purple/10 hover:bg-meraki-purple/20 text-meraki-accent border border-meraki-purple/20 rounded-xl transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Generar en Lote</span>
          </button>
          <button
            onClick={openCreateSingleModal => setIsSingleModalOpen(true)}
            className="btn-meraki flex items-center gap-2 py-2 px-4 text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Invitación</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar invitación por nombre o código..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSkip(0); // Reiniciar paginación al buscar
            }}
            className="w-full pl-10 glass-input text-xs"
          />
        </div>
      </div>

      {/* Listado */}
      <div className="bg-meraki-card border border-white/5 rounded-2xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 text-meraki-purple animate-spin mr-3" />
            <span>Cargando invitaciones...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-white/5 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Invitado</th>
                  <th className="py-3 px-4">Correo / Tel.</th>
                  <th className="py-3 px-4 text-center">Usos</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Enlace</th>
                  <th className="py-3 px-4 text-center rounded-r-lg">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invData?.invitations.map((inv) => {
                  const isActive = ['active', 'used', 'exhausted'].includes(inv.status);
                  return (
                    <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-meraki-accent">{inv.code}</td>
                      <td className="py-3.5 px-4 text-white font-medium">
                        {inv.invited_name || <span className="text-slate-500 italic">Sin nombre (Genérica)</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block text-slate-400">{inv.email || '-'}</span>
                        <span className="block text-[10px] text-slate-500">{inv.phone || ''}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {inv.used_count} / {inv.max_uses}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {inv.expiration_date ? formatDateLong(inv.expiration_date) : <span className="text-slate-500">Nunca expira</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          inv.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          inv.status === 'used' || inv.status === 'exhausted' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {inv.status === 'active' ? 'Disponible' :
                           inv.status === 'used' ? 'Usada' :
                           inv.status === 'exhausted' ? 'Agotada' :
                           inv.status === 'expired' ? 'Expirada' : 'Deshabilitada'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleCopyLink(inv.id, inv.token)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                          title="Copiar enlace de invitación"
                        >
                          {copiedId === inv.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 animate-scale-in" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggle(inv.id, inv.status)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isActive
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                          }`}
                          title={isActive ? "Deshabilitar Invitación" : "Habilitar Invitación"}
                        >
                          {isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {invData?.invitations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      No se encontraron invitaciones para el término buscado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-4 bg-white/5 border-t border-white/5 flex justify-between items-center text-xs">
            <span className="text-slate-500">Página {currentPage} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={skip === 0}
                onClick={() => setSkip(Math.max(0, skip - limit))}
                className="py-1 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-300 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setSkip(skip + limit)}
                className="py-1 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-300 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Invitación Individual */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 p-6 md:p-8 space-y-6 bg-meraki-card text-slate-300">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-extrabold text-lg text-white">Crear Invitación</h3>
              <button onClick={() => setIsSingleModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSingle} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Nombre del Invitado (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Carlos Mendoza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Correo (Opcional)</label>
                  <input
                    type="email"
                    placeholder="carlos@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Teléfono (Opcional)</label>
                  <input
                    type="text"
                    placeholder="+506 8888 8888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Cantidad Máxima Usos</label>
                  <input
                    type="number"
                    min={1}
                    value={maxUses}
                    onChange={(e) => setMaxUses(parseInt(e.target.value))}
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Fecha de Vencimiento (Opcional)</label>
                  <input
                    type="datetime-local"
                    value={expiration}
                    onChange={(e) => setExpiration(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 btn-meraki flex items-center justify-center gap-2 py-2.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Crear Enlace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lote Bulk */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 p-6 md:p-8 space-y-6 bg-meraki-card text-slate-300">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-extrabold text-lg text-white">Generación de Lote</h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateBulk} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Prefijo del Código</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Cantidad a Generar</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={bulkQuantity}
                    onChange={(e) => setBulkQuantity(parseInt(e.target.value))}
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Usos por Invitación</label>
                  <input
                    type="number"
                    min={1}
                    value={bulkMaxUses}
                    onChange={(e) => setBulkMaxUses(parseInt(e.target.value))}
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Vencimiento (Opcional)</label>
                  <input
                    type="datetime-local"
                    value={bulkExpiration}
                    onChange={(e) => setBulkExpiration(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createBulkMutation.isPending}
                  className="flex-1 btn-meraki flex items-center justify-center gap-2 py-2.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Generar Lote</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Invitations;
