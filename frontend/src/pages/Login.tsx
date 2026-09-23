import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, Truck, UserCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useSessionStore } from '../store/sessionStore';

export const Login: React.FC = () => {
  const [pin, setPin] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'operator'>('operator');
  const [operatorCode, setOperatorCode] = useState('OP-003');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { setUser } = useSessionStore();
  const navigate = useNavigate();

  const handleLogin = async (overridePin?: string, overrideCode?: string, overrideRole?: 'admin' | 'operator') => {
    setError(null);
    setLoading(true);

    const activePin = overridePin || pin;
    const activeRole = overrideRole || selectedRole;
    const activeCode = overrideCode || operatorCode;

    try {
      const res = await api.login(activePin, activeRole === 'operator' ? activeCode : undefined, activeRole);
      setUser({
        role: res.role as 'admin' | 'operator',
        userId: res.user_id,
        name: res.name,
        operatorCode: res.operator_code,
        token: res.token
      });

      if (res.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/operator/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cat-black flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Subtle Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a2a2a_1px,transparent_1px),linear-gradient(to_bottom,#2a2a2a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-cat-gray-700/30">
        {/* CAT Triangle Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-14 bg-cat-black rounded-2xl flex items-center justify-center p-2 mb-3 shadow-lg border border-cat-yellow/30">
            <svg viewBox="0 0 100 85" className="w-12 h-10">
              <polygon points="50,0 100,85 0,85" fill="#FFCD11" />
              <polygon points="50,22 83,78 17,78" fill="#1A1A1A" />
              <text x="50" y="66" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="24" textAnchor="middle" fill="#FFFFFF">CAT</text>
            </svg>
          </div>
          <h1 className="text-xl font-black text-cat-black tracking-tight">OPERATOR INTELLIGENCE</h1>
          <p className="text-xs font-bold text-cat-yellow uppercase tracking-widest bg-cat-black px-2.5 py-0.5 rounded-md mt-1">
            Safety & Operations Copilot
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-cat-gray-50 rounded-2xl border border-cat-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('operator')}
            className={`py-2 rounded-xl text-xs font-black transition-all ${
              selectedRole === 'operator'
                ? 'bg-cat-yellow text-cat-black shadow-sm'
                : 'text-cat-gray-500 hover:text-cat-black'
            }`}
          >
            Machine Operator
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`py-2 rounded-xl text-xs font-black transition-all ${
              selectedRole === 'admin'
                ? 'bg-cat-yellow text-cat-black shadow-sm'
                : 'text-cat-gray-500 hover:text-cat-black'
            }`}
          >
            Fleet Supervisor
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-cat-red/10 border border-cat-red/30 text-cat-red rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
          {selectedRole === 'operator' && (
            <div>
              <label className="text-xs font-bold text-cat-gray-700 block mb-1">Operator ID Code</label>
              <input
                type="text"
                value={operatorCode}
                onChange={(e) => setOperatorCode(e.target.value)}
                placeholder="OP-001, OP-002, OP-003"
                className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-cat-yellow text-cat-black"
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-cat-gray-700 block mb-1">Security PIN</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-cat-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={selectedRole === 'admin' ? 'Enter 9999 for Admin' : 'Enter 1234'}
                className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-cat-yellow text-cat-black"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cat-yellow hover:bg-yellow-400 text-cat-black font-black text-xs py-3.5 rounded-xl transition-all shadow-md uppercase tracking-wider cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In to Cab Terminal'}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-6 pt-5 border-t border-cat-gray-100">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-cat-gray-500 text-center mb-3">
            One-Click Instant Demo Profiles
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLogin('1234', 'OP-003', 'operator')}
              className="p-2.5 bg-cat-gray-50 hover:bg-cat-yellow/20 border border-cat-gray-200 rounded-xl text-left transition-all"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-cat-black">
                <Truck className="w-3.5 h-3.5 text-cat-yellow" /> OP-003 Kumar
              </div>
              <p className="text-[10px] text-cat-gray-500 font-semibold truncate">Tipper • Live Map Flagship</p>
            </button>

            <button
              onClick={() => handleLogin('1234', 'OP-001', 'operator')}
              className="p-2.5 bg-cat-gray-50 hover:bg-cat-yellow/20 border border-cat-gray-200 rounded-xl text-left transition-all"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-cat-black">
                <UserCheck className="w-3.5 h-3.5 text-cat-green" /> OP-001 Ravi
              </div>
              <p className="text-[10px] text-cat-gray-500 font-semibold truncate">CAT 320 Excavator</p>
            </button>

            <button
              onClick={() => handleLogin('1234', 'OP-002', 'operator')}
              className="p-2.5 bg-cat-gray-50 hover:bg-cat-yellow/20 border border-cat-gray-200 rounded-xl text-left transition-all"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-cat-black">
                <UserCheck className="w-3.5 h-3.5 text-cat-orange" /> OP-002 Suresh
              </div>
              <p className="text-[10px] text-cat-gray-500 font-semibold truncate">CAT 950 Wheel Loader</p>
            </button>

            <button
              onClick={() => handleLogin('9999', 'ADMIN-01', 'admin')}
              className="p-2.5 bg-cat-gray-50 hover:bg-cat-yellow/20 border border-cat-gray-200 rounded-xl text-left transition-all"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-cat-black">
                <Shield className="w-3.5 h-3.5 text-cat-yellow" /> Supervisor
              </div>
              <p className="text-[10px] text-cat-gray-500 font-semibold truncate">Fleet Command & Dispatch</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
