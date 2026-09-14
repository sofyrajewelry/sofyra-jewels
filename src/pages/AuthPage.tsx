import React, { useState, useEffect } from 'react';
import { adminAuthService } from '../services/adminAuthService';
import { ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const [hasAdminAccount, setHasAdminAccount] = useState(() => adminAuthService.hasAdminAccount());
  const [authView, setAuthView] = useState<'login' | 'register' | 'recovery'>(() =>
    adminAuthService.hasAdminAccount() ? 'login' : 'register'
  );

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authSecurityPin, setAuthSecurityPin] = useState('');

  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect immediately to admin dashboard
  useEffect(() => {
    if (adminAuthService.isAuthenticated()) {
      onNavigate('admin');
      return;
    }

    // Sync admin status with backend
    adminAuthService.init().then(res => {
      if (res.authenticated) {
        onNavigate('admin');
      } else {
        setHasAdminAccount(res.hasAdmin);
        if (res.hasAdmin) {
          setAuthView('login');
          if (res.email) setAuthEmail(res.email);
        } else {
          setAuthView('register');
        }
      }
    });
  }, [onNavigate]);

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = authEmail.trim();
    if (!cleanEmail) {
      setAuthError('Please enter your administrator email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminAuthService.login(cleanEmail, authPassword);
      if (res.success) {
        setAuthPassword('');
        onNavigate('admin');
      } else {
        setAuthError(res.error || 'Invalid administrator credentials');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('pattern') || msg.includes('did not match')) {
        setAuthError('Please check your email format and password.');
      } else {
        setAuthError('An unexpected authentication error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle First-Time Admin Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = authEmail.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!cleanEmail) {
      setAuthError('Please enter your private administrator email address.');
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      setAuthError('Please enter a valid email address (e.g. example@gmail.com).');
      return;
    }

    if (!authPassword) {
      setAuthError('Please enter a password.');
      return;
    }

    if (authPassword !== authConfirmPassword) {
      setAuthError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    if (authSecurityPin && authSecurityPin.trim()) {
      const pin = authSecurityPin.trim();
      if (pin.length < 4 || pin.length > 8) {
        setAuthError('Emergency Recovery PIN must be between 4 and 8 digits (or leave it blank).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await adminAuthService.registerAdmin(
        cleanEmail,
        authPassword,
        authSecurityPin && authSecurityPin.trim() ? authSecurityPin.trim() : undefined
      );

      if (res.success) {
        setHasAdminAccount(true);
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthSecurityPin('');
        setAuthSuccess('Administrator account registered and secured successfully! Redirecting...');
        setTimeout(() => {
          onNavigate('admin');
        }, 500);
      } else {
        setAuthError(res.error || 'Failed to create administrator account.');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('pattern') || msg.includes('did not match')) {
        setAuthError('Validation notice: Please ensure your email is formatted correctly (e.g. example@gmail.com) and password is at least 6 characters.');
      } else {
        setAuthError(msg || 'Failed to register administrator.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Password Recovery with PIN
  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (authPassword !== authConfirmPassword) {
      setAuthError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminAuthService.resetPasswordWithPin(
        authEmail,
        authSecurityPin,
        authPassword
      );

      if (res.success) {
        setAuthSuccess('Password successfully reset! You can now log in with your new password.');
        setAuthView('login');
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthSecurityPin('');
      } else {
        setAuthError(res.error || 'Recovery failed. Verify your email and PIN.');
      }
    } catch {
      setAuthError('Failed to complete recovery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-[#FAF9F6]">
      <div className="max-w-md w-full bg-white border border-stone-300 p-8 sm:p-10 shadow-xl">
        
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-black text-white mx-auto flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 stroke-[1.5]" />
          </div>

          <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 block mb-1 font-medium">
            SOFYRA Fine Jewellery
          </span>

          {!hasAdminAccount && (
            <div className="mb-2">
              <span className="inline-block px-3 py-1 bg-stone-900 text-white text-[10px] font-semibold uppercase tracking-widest">
                One-Time Setup
              </span>
            </div>
          )}

          <h2 className="font-editorial text-2xl sm:text-3xl uppercase tracking-wider text-black">
            {!hasAdminAccount
              ? 'Create Administrator Account'
              : authView === 'recovery'
              ? 'Security PIN Reset'
              : 'Sign in as Administrator'}
          </h2>

          <p className="text-xs text-stone-500 font-light mt-2 max-w-xs mx-auto">
            {!hasAdminAccount
              ? 'Create your private administrator email and password. Once established, public registration is locked permanently.'
              : authView === 'recovery'
              ? 'Enter your registered email and secret recovery PIN to reset your master password.'
              : 'Restricted administrative access. Authenticate with your private administrator credentials.'}
          </p>
        </div>

        {/* Error & Success Feedback Alerts */}
        {authError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {authSuccess && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authSuccess}</span>
          </div>
        )}

        {/* VIEW 1: FIRST-TIME REGISTRATION */}
        {!hasAdminAccount && (
          <form onSubmit={handleRegister} noValidate className="space-y-4">
            <div>
              <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                Private Admin Email *
              </label>
              <input
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={authEmail}
                onChange={e => {
                  setAuthEmail(e.target.value);
                  if (authError) setAuthError('');
                }}
                onBlur={() => setAuthEmail(prev => prev.trim())}
                placeholder="e.g. example@gmail.com"
                className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                Accepts standard email addresses (e.g. example@gmail.com). Designates the private SOFYRA Administrator.
              </span>
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                Admin Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={authPassword}
                  onChange={e => {
                    setAuthPassword(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder="Create a secure password (min 6 chars)"
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-3 pr-10 text-sm text-black focus:border-black focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-stone-400 hover:text-black cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                Confirm Admin Password *
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={authConfirmPassword}
                onChange={e => {
                  setAuthConfirmPassword(e.target.value);
                  if (authError) setAuthError('');
                }}
                placeholder="Confirm password"
                className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                Emergency Security Recovery PIN (Optional)
              </label>
              <input
                type="password"
                maxLength={8}
                autoComplete="off"
                value={authSecurityPin}
                onChange={e => {
                  setAuthSecurityPin(e.target.value);
                  if (authError) setAuthError('');
                }}
                placeholder="4 to 8 digits (or leave blank)"
                className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none font-mono"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                Optional recovery PIN if you ever need to reset your password. Can be left blank.
              </span>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200 text-[11px] text-stone-600 space-y-1">
              <p className="font-semibold text-stone-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-black" />
                Cryptographic Security Guarantee
              </p>
              <p className="text-[10px] leading-relaxed text-stone-500">
                Password is cryptographically salted & hashed with Web Crypto PBKDF2 (SHA-256, 100k rounds). Credentials are never hard-coded in source code or sent to external trackers.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-black text-white uppercase tracking-[0.2em] text-xs font-semibold hover:bg-stone-800 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Administrator Account...' : 'Create Administrator Account'}
            </button>
          </form>
        )}

        {/* VIEW 2: STANDARD LOGIN */}
        {hasAdminAccount && authView === 'login' && (
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div>
              <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                Admin Email
              </label>
              <input
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={authEmail}
                onChange={e => {
                  setAuthEmail(e.target.value);
                  if (authError) setAuthError('');
                }}
                onBlur={() => setAuthEmail(prev => prev.trim())}
                placeholder="Enter registered admin email"
                className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] tracking-wider uppercase text-stone-700 font-medium">
                  Admin Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('recovery');
                    setAuthError('');
                  }}
                  className="text-[10px] text-stone-500 hover:text-black uppercase tracking-wider underline cursor-pointer"
                >
                  Forgot PIN / Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={authPassword}
                  onChange={e => {
                    setAuthPassword(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder="Enter password..."
                  className="w-full bg-[#FAF9F6] border border-stone-300 p-3 pr-10 text-sm text-black focus:border-black focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-stone-400 hover:text-black cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-black text-white uppercase tracking-[0.2em] text-xs font-semibold hover:bg-stone-800 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying...' : 'Sign In as Administrator'}
            </button>
          </form>
        )}

        {/* VIEW 3: RECOVERY WITH PIN */}
        {hasAdminAccount && authView === 'recovery' && (
          <form onSubmit={handleRecovery} className="space-y-4">
            <div>
              <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                Registered Admin Email *
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="Admin email"
                className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                Security Recovery PIN *
              </label>
              <input
                type="password"
                required
                value={authSecurityPin}
                onChange={e => setAuthSecurityPin(e.target.value)}
                placeholder="Enter your security PIN"
                className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                New Admin Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-wider uppercase text-stone-700 mb-1 font-medium">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={authConfirmPassword}
                onChange={e => setAuthConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-[#FAF9F6] border border-stone-300 p-3 text-sm text-black focus:border-black focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-black text-white uppercase tracking-[0.2em] text-xs font-semibold hover:bg-stone-800 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Resetting...' : 'Verify PIN & Update Password'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthView('login');
                  setAuthError('');
                }}
                className="text-xs text-stone-500 hover:text-black uppercase tracking-wider"
              >
                &larr; Back to Login
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-stone-200 text-center">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-stone-500 hover:text-black cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </button>
        </div>

      </div>
    </div>
  );
};
