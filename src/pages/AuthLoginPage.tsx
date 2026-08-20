import React, { useState, useEffect } from 'react';
import { User, LoginSession, AuthAuditLog } from '../types';
import { api } from '../services/api';
import { Shield, Key, Database, UserCheck, Lock, LogOut, CheckCircle2, Server, Terminal, Sparkles, RefreshCw, Cpu, Layers, Eye, EyeOff } from 'lucide-react';

interface AuthLoginPageProps {
  currentUser: User | null;
  onUserLogin: (user: User) => void;
  onUserLogout: () => void;
}

export const AuthLoginPage: React.FC<AuthLoginPageProps> = ({
  currentUser,
  onUserLogin,
  onUserLogout
}) => {
  const [activeDbTab, setActiveDbTab] = useState<'users' | 'sessions' | 'audit_logs'>('users');
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [sessionsList, setSessionsList] = useState<LoginSession[]>([]);
  const [authLogsList, setAuthLogsList] = useState<AuthAuditLog[]>([]);

  // Login form states
  const [emailInput, setEmailInput] = useState<string>('anishramesh18@gmail.com');
  const [passwordInput, setPasswordInput] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAuthDbCollections = async () => {
    try {
      const [info, users, sessions, logs] = await Promise.all([
        api.getAuthDbInfo(),
        api.getAuthUsers(),
        api.getAuthSessions(),
        api.getAuthAuditLogs()
      ]);
      setDbInfo(info);
      setUsersList(users);
      setSessionsList(sessions);
      setAuthLogsList(logs);
    } catch (err) {
      console.error('Failed fetching auth db collections:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAuthDbCollections();
    }
  }, [currentUser]);

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetEmail = (emailInput || '').trim();

    // Strict domain requirement: email address must end with @gmail.com
    if (!targetEmail.toLowerCase().endsWith('@gmail.com')) {
      setErrorMessage('Invalid statement: Email address must end with @gmail.com');
      setIsLoggingIn(false);
      return;
    }

    try {
      const result = await api.login(targetEmail, passwordInput);
      onUserLogin(result.user);
      setSuccessMessage(`Signed in as ${result.user.name} (${result.user.role})`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email address or credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await api.logout();
      onUserLogout();
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------------------------------------------------------------
  // 1. STANDALONE MINIMAL LOGIN PAGE (When unauthenticated)
  // ---------------------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-[#1E293B] rounded-2xl border border-slate-800 p-8 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-rose-500/10 rounded-2xl text-rose-400 border border-rose-500/20 mb-1">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Lead Architect Portal</h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              AIOps Control Plane & MongoDB Identity Verification
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Email Address
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="anishramesh18@gmail.com"
                className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none transition-all shadow-inner"
              />
              <span className="text-[10px] text-slate-500 block">
                Must end with <code className="text-rose-400 font-mono">@gmail.com</code>
              </span>
            </div>

            {/* Password Field with Eye Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 rounded-xl pl-4 pr-11 py-3 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Statement Display */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono font-medium flex items-start space-x-2 animate-shake">
                <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Statement Display */}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-900/30 flex items-center justify-center space-x-2 transition-all cursor-pointer font-mono"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In as Lead Architect</span>
                </>
              )}
            </button>

          </form>

          {/* Footer MongoDB Badge */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <div className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-slate-500">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Database: <code className="text-slate-300">aiops_auth_db</code></span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. AUTHENTICATED USER MANAGER & MONGODB EXPLORER (When logged in)
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 text-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight">MongoDB Identity & Security Store</h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center space-x-1">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>DB: aiops_auth_db</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Current authenticated session for Lead Architect <code className="text-rose-300 font-mono">{currentUser.email}</code>
            </p>
          </div>
        </div>

        <button
          onClick={handleLogoutClick}
          className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center space-x-1.5 cursor-pointer transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Database Explorer Grid */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white">MongoDB Collection Explorer</h2>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              URI: mongodb://localhost:27017/aiops_auth_db
            </p>
          </div>

          {dbInfo && (
            <div className="flex items-center space-x-2 text-[10px] font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="text-slate-400">Collections:</span>
              <span className="text-sky-300 font-bold">users ({dbInfo.collections.users_count})</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-300 font-bold">sessions ({dbInfo.collections.active_sessions_count})</span>
            </div>
          )}
        </div>

        {/* Collection Tabs */}
        <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveDbTab('users')}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeDbTab === 'users'
                ? 'bg-sky-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>users ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveDbTab('sessions')}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeDbTab === 'sessions'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>login_sessions ({sessionsList.length})</span>
          </button>

          <button
            onClick={() => setActiveDbTab('audit_logs')}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeDbTab === 'audit_logs'
                ? 'bg-amber-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>auth_audit_logs ({authLogsList.length})</span>
          </button>
        </div>

        {/* TAB 1: users Collection Documents */}
        {activeDbTab === 'users' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Collection: <code className="text-sky-300 font-bold">aiops_auth_db.users</code></span>
              <span>BSON Documents: {usersList.length}</span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {usersList.map((u) => (
                <div key={u.id} className="bg-slate-900 rounded-xl p-3.5 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 font-mono text-[10px]">_id: {u.id}</span>
                      <span className="text-white font-bold">{u.name}</span>
                      <span className="text-sky-400 text-[10px]">({u.email})</span>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                      u.is_lead_architect ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}>
                      {u.role}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">{u.title}</p>

                  <div className="bg-slate-950 p-2 rounded-lg text-[10px] text-emerald-400 overflow-x-auto">
                    <pre>{JSON.stringify({
                      _id: u.id,
                      username: u.username,
                      email: u.email,
                      role: u.role,
                      is_admin: u.is_admin,
                      is_lead_architect: u.is_lead_architect,
                      database: u.database,
                      permissions_count: u.permissions.length,
                      last_login: u.last_login
                    }, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: login_sessions Collection Documents */}
        {activeDbTab === 'sessions' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Collection: <code className="text-emerald-300 font-bold">aiops_auth_db.login_sessions</code></span>
              <span>Active Sessions: {sessionsList.filter(s => s.status === 'ACTIVE').length}</span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {sessionsList.map((s) => (
                <div key={s.id} className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold">{s.user_name} ({s.role})</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                      s.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-sky-400 flex items-center justify-between">
                    <span>Token: {s.session_token}</span>
                    <span>IP: {s.ip_address}</span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Login Timestamp: {new Date(s.login_timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: auth_audit_logs Collection Documents */}
        {activeDbTab === 'audit_logs' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Collection: <code className="text-amber-300 font-bold">aiops_auth_db.auth_audit_logs</code></span>
              <span>Audit Logs: {authLogsList.length}</span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {authLogsList.map((log) => (
                <div key={log.id} className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold">[{log.event_type}]</span>
                    <span className="text-slate-500 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-white font-semibold">{log.user_name} ({log.user_email})</div>
                  <div className="text-slate-400 text-[10px]">{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

