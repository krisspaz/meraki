import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { loginSchema, LoginSchemaType } from '../../schemas/validation';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Lock, User, Sparkles, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-meraki-darker flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-meraki-purple/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="glass-panel p-8 md:p-10 rounded-[2rem] border border-white/5 max-w-md w-full relative z-10 space-y-8 shadow-2xl">
        {/* Logo and title */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-meraki-gradient flex items-center justify-center mx-auto shadow-lg shadow-meraki-purple/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display font-extrabold text-2xl tracking-tight text-white uppercase">Expo 360 Meraki</h2>
            <span className="text-[10px] uppercase tracking-widest text-meraki-accent font-semibold block leading-none">Panel Administrativo</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs font-semibold text-slate-300 block">Usuario</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario administrativo"
                className={`w-full pl-10 glass-input ${errors.username ? 'border-rose-500' : ''}`}
                disabled={loading}
                {...register('username')}
              />
            </div>
            {errors.username && <p className="text-[11px] text-rose-400 font-medium">{errors.username.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-slate-300 block">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                className={`w-full pl-10 glass-input ${errors.password ? 'border-rose-500' : ''}`}
                disabled={loading}
                {...register('password')}
              />
            </div>
            {errors.password && <p className="text-[11px] text-rose-400 font-medium">{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-meraki w-full flex items-center justify-center gap-2 mt-2"
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
            className="text-[10px] text-slate-500 hover:text-white transition-colors"
          >
            Volver al portal público de registro
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Login;
