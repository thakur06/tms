import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowLeft, FiShield, FiKey, FiCheckCircle, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'otp' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

   const server=import.meta.env.VITE_SERVER_ADDRESS;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const response = await fetch(`${server}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success && data.token) {
        // Use auth context to update authentication state
        login(data.token, data.user);

        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = (seconds) => {
    setResendCooldown(seconds);
    const id = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    setError('');
    setInfo('');
    setOtpDigits(['', '', '', '', '', '']);

    if (!email) {
      setError('Please enter your email.');
      return;
    }

    setResendLoading(true);
    try {
      const response = await fetch(`${server}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP');

      setInfo(data.message || 'OTP sent. Valid for 5 minutes.');
      setView('otp');
      startResendCooldown(30);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setInfo('');

    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch(`${server}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'OTP verification failed');

      setResetToken(data.resetToken || '');
      setView('reset');
      setInfo('OTP verified. Please set a new password.');
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!resetToken) {
      setError('Missing reset token. Please verify OTP again.');
      setView('forgot');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${server}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reset password');

      setInfo('Password reset successfully. Please login with your new password.');
      setView('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (view) {
      case 'login':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">Welcome Back</h2>
            <p className="text-slate-400 mb-8 text-center">Please enter your details to sign in.</p>
            
            <form className="space-y-5" onSubmit={handleLogin}>
              {info && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                  {info}
                </div>
              )}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="ui-label">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute top-3.5 left-4 text-slate-500" />
                  <input 
                    type="email" 
                    placeholder="john@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete='off'
                    required
                    className="ui-input pl-11" 
                  />
                </div>
              </div>
              
              <div>
                <label className="ui-label">Password</label>
                <div className="relative">
                  <FiLock className="absolute top-3.5 left-4 text-slate-500" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="ui-input pl-11" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-slate-400 cursor-pointer hover:text-white transition-colors">
                  <input type="checkbox" className="mr-2 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500/50" />
                  Remember me
                </label>
                <button type="button" onClick={() => setView('forgot')} className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </button>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full ui-btn ui-btn-primary shadow-indigo-500/20"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        );

      case 'forgot':
        return (
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <button onClick={() => setView('login')} className="flex items-center text-sm text-slate-400 hover:text-white mb-6 transition-colors">
              <FiArrowLeft className="mr-2" /> Back to Login
            </button>
            <h2 className="text-3xl font-bold text-white mb-2 text-center">Reset Password</h2>
            <p className="text-slate-400 mb-8 text-center">Enter your email and we'll send you an OTP code.</p>
            
            <div className="space-y-6">
              {info && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm">
                  {info}
                </div>
              )}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div className="relative">
                <FiMail className="absolute top-3.5 left-4 text-slate-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="ui-input pl-11" 
                />
              </div>
              <button
                onClick={handleSendOtp}
                disabled={resendLoading}
                className="w-full ui-btn ui-btn-primary"
              >
                {resendLoading ? 'Sending...' : 'Send OTP Code'}
              </button>
            </div>
          </div>
        );

      case 'otp':
        return (
          <div className="animate-in fade-in slide-in-from-right duration-500 text-center">
            <div className="inline-flex p-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full mb-6 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <FiShield size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Verify Email</h2>
            <p className="text-slate-400 mb-8">We've sent a 6-digit code to <span className="text-white font-medium">{email || 'your email'}</span></p>

            {info && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm mb-6 text-left">
                {info}
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 text-left">
                {error}
              </div>
            )}
            
            <div className="flex justify-between gap-2 mb-8">
              {otpDigits.map((d, idx) => (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={d}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 1);
                    setOtpDigits((prev) => {
                      const next = [...prev];
                      next[idx] = v;
                      return next;
                    });
                    if (v && e.target.nextSibling) {
                      e.target.nextSibling.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otpDigits[idx] && e.target.previousSibling) {
                      e.target.previousSibling.focus();
                    }
                  }}
                  className="w-12 h-14 text-center text-xl font-bold bg-[#030712]/50 border border-white/10 rounded-xl focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)] outline-none transition-all text-white"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={otpLoading}
              className="w-full ui-btn bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 border-none"
            >
              <FiCheckCircle /> {otpLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <p className="mt-6 text-sm text-slate-500">
              Didn't get the code?{' '}
              <button
                disabled={resendCooldown > 0 || resendLoading}
                onClick={handleSendOtp}
                className={`font-bold hover:underline ${resendCooldown > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-indigo-400'}`}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
              </button>
            </p>
          </div>
        );

      case 'reset':
        return (
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <button onClick={() => setView('login')} className="flex items-center text-sm text-slate-400 hover:text-white mb-6 transition-colors">
              <FiArrowLeft className="mr-2" /> Back to Login
            </button>
            <h2 className="text-3xl font-bold text-white mb-2 text-center">Set New Password</h2>
            <p className="text-slate-400 mb-8 text-center">Create a new password for your account.</p>

            {info && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm mb-4">
                {info}
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleResetPassword}>
              <div>
                <label className="ui-label">New Password</label>
                <div className="relative">
                  <FiLock className="absolute top-3.5 left-4 text-slate-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ui-input pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="ui-label">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute top-3.5 left-4 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ui-input pl-11"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full ui-btn ui-btn-primary"
              >
                {loading ? 'Saving...' : 'Reset Password'}
              </button>
            </form>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[#030712]">
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute inset-0 bg-[url('/fibre.png')] opacity-10 mix-blend-overlay"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
           <img className="h-16 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" src='./fav.png' alt="Logo"/>
           <h1 className="text-2xl font-bold tracking-tight text-white/90">Biogas Engineering</h1>
        </div>

        <div className="ui-card p-1">
          <div className="bg-[#0b1221]/80 backdrop-blur-xl rounded-[1.2rem] p-6 sm:p-10 border border-white/5 shadow-2xl">
            {renderForm()}
          </div>
        </div>
        
        <p className="text-center text-slate-500 text-xs mt-8">
          &copy; {new Date().getFullYear()} Biogas Engineering. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;