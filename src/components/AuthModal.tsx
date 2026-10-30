import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Mail, Lock, ArrowRight, RotateCw, AlertTriangle, KeyRound, UserPlus, LogIn } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { signInWithGoogle, signInWithPassword, signUpWithPassword } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUpWithPassword(cleanEmail, password);
      } else {
        await signInWithPassword(cleanEmail, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#36241E]/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#E5DBC8] rounded-3xl border-2 border-[#36241E] shadow-[8px_8px_0px_#36241E] p-6 sm:p-7 animate-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Ticket Notch Cutouts */}
        <div className="ticket-notch-left" />
        <div className="ticket-notch-right" />

        <div className="ticket-dashed-frame p-4 sm:p-5 space-y-4 relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-[#36241E] text-[#D9A83A] hover:bg-[#5B6838] transition-colors cursor-pointer border-2 border-[#36241E]"
            aria-label="Close"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mb-2 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#DFB4C4] text-[#36241E] border border-[#36241E] text-[10px] font-mono font-black uppercase tracking-wider mb-1.5">
              <span className="text-[#D9A83A]">★</span>
              <span>Passenger Pass Checkpoint</span>
            </div>
            <h2 className="text-2xl font-black font-display text-[#36241E]">
              {mode === 'signin' ? 'Sign In to CrewHub' : 'Create Your Builder Pass'}
            </h2>
            <p className="text-xs text-[#543E36] font-mono font-semibold mt-1">
              {mode === 'signin'
                ? 'Sign in with your email and password or Google to access your team.'
                : 'Register with your email and a secure password to unlock hackathon squads.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl border-2 border-[#36241E] bg-[#DFD2BE] p-0.5">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-mono font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#36241E] text-[#F5EDE2] shadow-[1px_1px_0px_#231612]'
                  : 'text-[#36241E] hover:text-black'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-mono font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#36241E] text-[#F5EDE2] shadow-[1px_1px_0px_#231612]'
                  : 'text-[#36241E] hover:text-black'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-200 text-red-950 text-xs font-mono font-bold flex items-start gap-2 border-2 border-red-900 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-2.5 rounded-full btn-retro-parchment text-[#36241E] font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border-2 border-[#36241E] hover:bg-[#F3EDE2] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-2 flex items-center justify-center">
            <div className="w-full border-t-2 border-dashed border-[#36241E]/30" />
            <span className="absolute px-2 bg-[#E5DBC8] text-[10px] font-mono font-black uppercase text-[#36241E]">
              OR WITH EMAIL & PASSWORD
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-black font-mono uppercase text-[#36241E] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#543E36]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu or personal@gmail.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-[#EFE7D8] border-2 border-[#36241E] text-[#36241E] focus:outline-hidden placeholder:text-[#543E36]/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black font-mono uppercase text-[#36241E] mb-1">
                Password {mode === 'signup' && <span className="text-[10px] text-[#543E36]">(min 6 chars)</span>}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#543E36]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-[#EFE7D8] border-2 border-[#36241E] text-[#36241E] focus:outline-hidden placeholder:text-[#543E36]/50"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-black font-mono uppercase text-[#36241E] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#543E36]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-[#EFE7D8] border-2 border-[#36241E] text-[#36241E] focus:outline-hidden placeholder:text-[#543E36]/50"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full btn-retro-moss text-[#F5EDE2] font-mono font-black text-xs uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
            >
              {loading ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Account & Enter' : 'Sign In to CrewHub'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-[#36241E]/20 text-xs font-mono text-[#543E36]">
            {mode === 'signin' ? (
              <span>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="font-black text-[#36241E] underline hover:text-[#5B6838] cursor-pointer"
                >
                  Create one now →
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); }}
                  className="font-black text-[#36241E] underline hover:text-[#5B6838] cursor-pointer"
                >
                  Sign in here →
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
