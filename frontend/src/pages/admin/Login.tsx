import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { loginSchema, LoginSchemaType } from '../../schemas/validation';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Lock, User, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, loading, error } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginSchemaType) => {
    try {
      await login(data.username, data.password);
    } catch (e) {
      // El error ya queda registrado en el hook useAuth
    }
  };

  return (
    <div className="min-h-screen bg-[#120E29] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#DBB8FF]/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel p-8 md:p-10 rounded-[2rem] border border-[#DBB8FF]/20 max-w-md w-full relative z-10 space-y-8 shadow-2xl bg-[#1A1638]/90">
        {/* Logo and title */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-meraki-gradient p-[2px] mx-auto shadow-lg shadow-[#3939FF]/30">
            <div className="w-full h-full bg-[#120E29] rounded-[14px] p-2 flex items-center justify-center">
              <img src="/logo-1.png" alt="Meraki Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="font-display font-black text-2xl tracking-tight text-white uppercase">Expo 360 Meraki</h2>
            <span className="text-[10px] uppercase tracking-widest text-[#AEE6ED] font-black block leading-none">Panel Administrativo</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs font-bold text-slate-200 block">Usuario</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario administrativo"
                style={{ paddingLeft: '2.75rem' }}
                className={`w-full glass-input ${errors.username ? 'border-rose-500' : ''}`}
                disabled={loading}
                {...register('username')}
              />
            </div>
            {errors.username && <p className="text-[11px] text-rose-400 font-semibold">{errors.username.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-bold text-slate-200 block">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                style={{ paddingLeft: '2.75rem' }}
                className={`w-full glass-input ${errors.password ? 'border-rose-500' : ''}`}
                disabled={loading}
                {...register('password')}
              />
            </div>
            {errors.password && <p className="text-[11px] text-rose-400 font-semibold">{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-meraki w-full flex items-center justify-center gap-2 mt-4 shadow-lg shadow-[#FF5B22]/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Entrar al Panel</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Volver al portal público de registro
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Login;
