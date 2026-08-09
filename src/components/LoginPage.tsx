import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, ShieldAlert, KeyRound, Building2, Eye, EyeOff, CheckSquare } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

const DEMO_USERS: Record<string, { pass: string; name: string; role: string; avatarUrl?: string }> = {
  madamlim: {
    pass: 'Finance123',
    name: 'Madam Lim',
    role: 'Finance Director'
  },
  executive: {
    pass: 'Exec123',
    name: 'Accounts Executive',
    role: 'Accounts Executive'
  },
  admin: {
    pass: 'Admin123',
    name: 'System Admin',
    role: 'System Administrator'
  }
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    const account = DEMO_USERS[cleanUsername];

    if (account && account.pass === password) {
      onLoginSuccess({
        username: cleanUsername,
        name: account.name,
        role: account.role
      });
    } else {
      setErrorMessage('Invalid username or password. Please try again.');
    }
  };

  const fillQuickDemo = (userKey: string) => {
    const demo = DEMO_USERS[userKey];
    if (demo) {
      setUsername(userKey);
      setPassword(demo.pass);
      setErrorMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950">
      <div className="max-w-md w-full space-y-6">
        {/* Top Company Branding Card Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white font-extrabold text-2xl shadow-lg ring-4 ring-blue-500/20">
            BH
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Boon Huat Hardware & Supplies Pte Ltd
            </h1>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mt-1">
              Accounts Payable Credit Reminder System
            </p>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Sign in to Finance Portal</h2>
            <p className="text-xs text-slate-500 mt-0.5">Please enter your staff credentials to continue.</p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800 font-medium">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-username"
                  type="text"
                  required
                  placeholder="e.g. madamlim"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-login-submit"
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <KeyRound className="w-4 h-4 text-blue-200" />
              <span>Secure Login</span>
            </button>
          </form>

          {/* Demo Accounts Quick-Fill Panel */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Demo Authorised Accounts:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('madamlim')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all cursor-pointer group"
              >
                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Madam Lim</p>
                <p className="text-[10px] text-slate-500">Finance Director</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">madamlim / Finance123</p>
              </button>

              <button
                type="button"
                onClick={() => fillQuickDemo('executive')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all cursor-pointer group"
              >
                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Accounts Exec</p>
                <p className="text-[10px] text-slate-500">Executive</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">executive / Exec123</p>
              </button>

              <button
                type="button"
                onClick={() => fillQuickDemo('admin')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all cursor-pointer group"
              >
                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">System Admin</p>
                <p className="text-[10px] text-slate-500">Administrator</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">admin / Admin123</p>
              </button>
            </div>
          </div>
        </div>

        {/* Security Confidentiality Notice */}
        <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-center space-y-1">
          <p className="text-[11px] font-semibold text-slate-300 flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Confidentiality Notice</span>
          </p>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            This system contains confidential supplier payment information. Access is restricted to authorised personnel only.
          </p>
        </div>
      </div>
    </div>
  );
};
