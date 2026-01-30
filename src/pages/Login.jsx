import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowLeft, FiShield, FiKey, FiCheckCircle, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
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

        // Navigate to home
        navigate('/');
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
            <h2 className="text-3xl font-black text-white mb-2 text-center tracking-tight">Welcome Back</h2>
            <p className="text-gray-400 mb-8 text-center font-medium">Please enter your details to sign in.</p>
            
            <form className="space-y-5" onSubmit={handleLogin}>
              {info && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm font-bold">
                  {info}
                </div>
              )}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm font-bold">
                  {error}
                </div>
              )}
              
              <div>
                <label className="ui-label text-gray-300">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute top-3.5 left-4 text-gray-500" />
                  <input 
                    type="email" 
                    placeholder="john@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete='off'
                    required
                    className="ui-input pl-11 bg-zinc-900 border-white/10 text-white focus:border-amber-500 focus:ring-amber-500/20 placeholder-gray-600" 
                  />
                </div>
              </div>
              
              <div>
                <label className="ui-label text-gray-300">Password</label>
                <div className="relative">
                  <FiLock className="absolute top-3.5 left-4 text-gray-500" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="ui-input pl-11 bg-zinc-900 border-white/10 text-white focus:border-amber-500 focus:ring-amber-500/20 placeholder-gray-600" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-400 cursor-pointer hover:text-white transition-colors font-medium">
                  <input type="checkbox" className="mr-2 rounded border-white/10 bg-white/5 text-amber-500 focus:ring-amber-500/50" />
                  Remember me
                </label>
                <button type="button" onClick={() => setView('forgot')} className="font-bold text-amber-500 hover:text-amber-400 transition-colors">
                  Forgot password?
                </button>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full ui-btn bg-amber-500 hover:bg-amber-400 text-zinc-900 shadow-amber-500/20 font-black tracking-wide uppercase"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        );

      case 'forgot':
        return (
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <button onClick={() => setView('login')} className="flex items-center text-sm text-gray-400 hover:text-gray-900 mb-6 transition-colors font-bold">
              <FiArrowLeft className="mr-2" /> Back to Login
            </button>
            <h2 className="text-3xl font-black text-gray-900 mb-2 text-center tracking-tight">Reset Password</h2>
            <p className="text-gray-500 mb-8 text-center font-medium">Enter your email and we'll send you an OTP code.</p>
            
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
            <div className="inline-flex p-4 bg-blue-50 text-[#161efd] border border-blue-100 rounded-full mb-6 shadow-lg shadow-blue-500/10">
              <FiShield size={32} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Verify Email</h2>
            <p className="text-gray-500 mb-8 font-medium">We've sent a 6-digit code to <span className="text-gray-900 font-black">{email || 'your email'}</span></p>

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
            <button onClick={() => setView('login')} className="flex items-center text-sm text-gray-400 hover:text-gray-900 mb-6 transition-colors font-bold">
              <FiArrowLeft className="mr-2" /> Back to Login
            </button>
            <h2 className="text-3xl font-black text-gray-900 mb-2 text-center tracking-tight">Set New Password</h2>
            <p className="text-gray-500 mb-8 text-center font-medium">Create a new password for your account.</p>

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
    <div className="min-h-screen w-full flex bg-zinc-950 overflow-hidden text-gray-200">
      {/* Left Side: Illustration / Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-950 items-center justify-center p-12 border-r border-white/10">
        <div className="absolute inset-0 z-0">
          <svg className="w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
             {/* Simple tech background grid */}
             <defs>
               <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                 <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" className="text-white/10" strokeWidth="0.05"/>
               </pattern>
               <radialGradient id="globe-gradient" cx="50%" cy="50%" r="50%">
                 <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                 <stop offset="100%" stopColor="transparent" />
               </radialGradient>
             </defs>
             <rect width="100%" height="100%" fill="url(#grid)" mask="url(#fade)" />
          </svg>
          
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-zinc-950/20 to-zinc-950/90" />
        </div>
        
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] pointer-events-none z-0 opacity-80">
            {/* Realistic Globe Container */}
            <div className="w-full h-full relative flex items-center justify-center">
              {/* Globe Sphere */}
              <div className="w-[500px] h-[500px] rounded-full relative overflow-hidden bg-[#111111] shadow-[0_0_100px_rgba(245,158,11,0.2)] ring-1 ring-white/10">
                
                {/* Rotating Map Texture */}
                <motion.div 
                   className="absolute inset-0 flex"
                   animate={{ x: ["0%", "-50%"] }}
                   transition={{ duration: 30, ease: "linear", repeat: Infinity }}
                >
                   {/* Two copies of the map for seamless loop */}
                   <svg viewBox="0 0 1000 500" className="h-full w-auto aspect-2/1 min-w-max text-white/10 fill-current">
                     <path d="M145.2 216.7c-3.2-1.9-8.4-6.4-11.7-10.1-5-5.6-7.8-10.8-7.8-14.7 0-4.6-2.5-9.3-5-9.3-1.1 0-2.8 1.9-3.9 4.3-3.2 6.8-.7 10.9 8.2 13.9 6.1 2.1 6.8 2.6 7.4 5.9.5 2.6 1.7 4.9 2.7 5.1 2.5.5 8.1 3.5 10.1 5.3 1.9 1.7 1.9 2 0 4.1-3 3.3-3.6 5.5-2.2 7.7 2.3 3.8 11.2 5.5 13.5 2.7 1.1-1.3 2-5 2-8.2 0-3.2.9-6.9 2-8.2 1.9-2.2 4.1-1.1 5.4 2.7 1.7 4.9 11.2 11.6 15 10.6 2.3-.6 5.3-2.9 6.8-5.1 1.4-2.2 3.6-4 4.8-4 .7 0 1.9-1.9 2.6-4.3.8-2.3 2.5-4.2 3.8-4.2 1.3 0 2.4-1.9 2.4-4.2 0-3.8 2.3-5.3 10.6-6.6 5.6-.9 9.3-2.7 8.1-4.1-1.1-1.3-1.4-3.5-.7-4.8.7-1.3 1.2-4.8 1.1-7.7-.2-4.1.7-5.5 3.3-5 5.6 1.1 8 0 8.7-4 .4-2 .2-5.7-.2-8.2-.5-2.5.3-4.6 1.7-4.6 2.5 0 2.4 2.6-.4 8.2-1.6 3.1-2.9 8.2-2.9 11.2 0 3-1.5 6.7-3.3 8.2-1.8 1.5-3.3 3.9-3.3 5.4s-1.8 3.5-3.9 4.5c-2.2 1-3.9 3.2-3.9 4.8 0 2.1-.9 3-3.2 3-1.8 0-4.4 1.2-5.8 2.7-2.1 2.2-2.5 4.3-1.3 6.9 1 2.2 1 4.8 0 5.7-1.1 1-1.4 3.7-.7 6.1.7 2.3 2.6 4.6 4.1 5.1 3.2 1 3.2 4.4 0 4.4-1.4 0-4.2 2-6.1 4.5-5.9 7.4-6.1 11.2-.5 12.3 4.2.8 5.6 3.1 3 4.8-3.9 2.5-3.8 2.6 1.2 4.4 3.3 1.2 5.9 3 5.9 4.1 0 1.1-1.2 2-2.7 2-3.5 0-5.4 6-3.2 10.1 2.3 4.4 1.1 12.7-2.1 14.5-1.9 1.1-2.4 1.9-1.1 1.9 3.9 0 6.6-8.7 4.1-12.9-.8-1.5-.1-2.7 1.6-2.7 2.5 0 5.3 3.6 5.3 6.8 0 2-1 4.9-2.1 6.3-2.1 2.6 2.3 10 6.8 11.5 5.1 1.7 5.1 1.8 3.5 5.8-1 2.2-2.4 4-3.2 4-2.1 0-7.3 9.4-7.3 13.2 0 1.9-1 3.4-2.2 3.4-1.2 0-3.3 1.5-4.7 3.3-1.3 1.8-6.1 4.5-10.6 6.1l-8.2 2.8 4.7 3.7c4 3.1 4.5 4 3 5.1-1.1.8-2 3.8-2 6.6 0 2.8-.7 5.1-1.6 5.1-2.9 0-3.6 4.7-1.2 8.2 1.7 2.5 1.7 2.8 0 4.2-2.5 2.1-1.1 8 2.2 9.5 3.3 1.5 2.8 5.4-.8 6.4-2.5.7-2.9 6.8-1 14.7 1.5 6.2 3.8 6.7 5.1 1.3.7-2.9 1.3-4 1.3-2.4 0 5.4-8.8 8.1-16.7 5.1-4.9-1.8-9.4-2.5-9.9-1.6-.5.9-4.8 2.8-9.5 4.3l-8.6 2.6-4.9-3.7c-6.8-5.1-14.8-12.8-15.7-15.2-.6-1.5-2.8-5.1-5-8.1-4-5.3-4-5.7.5-6.8 2.5-.6 6.9-3.3 9.7-5.9 5.3-4.9 6.1-4.9 11.9.4 6.8 6.2 10 7.3 13.9 4.8 2.1-1.3 4.3-5 4.9-8.2l1.1-5.7-8.2-1.9c-4.5-1-10.2-2.9-12.7-4.1l-4.5-2.2 2.8-5.1c1.5-2.8 2.8-6.6 2.8-8.4 0-1.8.8-3.7 1.8-4.3 1-.5 1.5-1.9 1.1-3s-1.4-2-2.2-2c-.9 0-1.3-2.3-1-5.1.4-2.8 0-6.4-.8-8-.9-1.6-1.3-5-1-7.5.3-5.3-2-7.5-8.2-7.5-3.3 0-6.1.6-6.1 1.4 0 .7-2.6 1.7-5.8 2.2-8.6 1.3-11.6 3.6-6.1 4.6 1.9.3 2.4.9 1.1 1.1-3 1-8.3 15-9.1 24.1-.2 2.2.8 6.2 2.4 9 3.5 6.3 3.6 6.1 5.7-9.3.9-7 2.8-9.8 8.4-12.7 3.3-1.7 5.3-4 4.5-5.1-.9-1.1-.3-5.6 1.3-9.9 1.6-4.3 2.2-8.1 1.4-8.5-.8-.4-1.2-3.1-.9-6 .4-2.9.1-5.6-.7-6-1.5-.7-2.1-7.2-1-10.7.6-1.9-.1-6.4-1.6-10-1.4-3.6-2-6.5-1.3-6.5.6 0 1.1-.9 1.1-2 0-3.3-3-4.4-8.4-3-3.6.9-6.3 3.8-6.8 7.3-.4 2.3-1.6 5.6-2.7 7.3-1.1 1.7-1.3 4.6-.3 6.6 1 1.9.9 4.8-.2 6.5-1.8 2.8-1.5 4.1 1.2 5.1 1.8.7 3.8 2.6 4.4 4.1 1.9 4.7-6.2 16.5-12.6 18.2-3 .8-6.2 2.1-7.1 2.9-.9.8-3.3 1.2-5.4.8-4.4-.8-5.7.5-6.2 6.5-.4 4.3-.2 4.9 1.8 4.9 1.3 0 2.4 1 2.4 2.2 0 1.2 1 2.2 2.2 2.2 1.2 0 2.2 1.4 2.2 3s2.3 2.9 5.2 2.9c4.2 0 5.4.6 6.1 3 .5 1.6 2.5 3.3 4.5 3.6 2.8.5 3.6 1.5 3.6 4.3 0 2.3.9 3.6 2.7 4 3 2.8-.5 8.1-5.3 8.1-2.9 0-3.6.6-4.5 4.1-.7 2.3-.9 5.8-.5 7.7.5 1.9 0 4.3-1.1 5.4-1.1 1.1-3.6 1.7-5.5 1.3-1.9-.4-5.2-.1-7.2.7-3.2 1.2-3.4 1-2-.9 2.2-3 2.2-3.1-1.3-4.1-3.6-1.1-4-2.9-1.9-8.4 1.1-3 1.2-3.3 1-3.3-.3 0-1.7 2.2-3.2 5-1.5 2.7-3.7 5.7-5 6.6-1.3.9-3.4 3.3-4.7 5.3-3.1 4.8-1.7 9.8 2.6 9.8 4 0 5.8 2.4 4.8 6.4-.3 1.4-.4 4.8-.2 7.5l.3 4.9-2.9-2.9c-2.8-2.8-3-2.8-4.8-.4-1.9 2.5-4.2 3.1-9 2.1-3.3-.7-6.5-1.7-7.2-2.3-2.1-1.7-4.1 1.4-2.8 4.4 1.2 2.7.2 4-3.5 4.8-2.6.5-6.1 1.8-7.7 2.8-2.2 1.3-9.1 1.2-12.5-.2-2.8-1.1-3.1-.7-3.3 3.9-.1 2.9-.6 5-1 4.7-.4-.3-2.2 1.1-3.9 3.2-1.7 2-3.8 3.7-4.6 3.7-1 0-1.4 3.7-.6 5.8 1.4 3.4.2 4.4-4 3.4-2.8-.7-5.5.1-7.5 2.1-1.6 1.6-4.3 2.3-6.1 1.6l-3.2-1.2 1 2.8c1.6 4.3-.2 5.5-3.3 2.2-2.1-2.2-2.8-2.2-4.5-.4-2.5 2.7-2.6 2.7-5.6.8-1.7-1.1-3.8-1.2-4.8-.3-1 .9-4.8.9-8.4 0-5.8-1.4-6.3-1.7-5-3.1.8-.9 1-2.9.5-4.4-.6-1.5-1.7-3.2-2.4-3.8-.8-.6-1.4-3.1-1.4-5.6 0-3.1-.8-4.5-2.5-4.5-1.4 0-2.5-1.3-2.5-2.9 0-1.5-1.2-2.9-2.6-2.9-1.4 0-4.3 1.9-6.4 4.1-3.5 3.8-3.7 3.8-3.4-.6.3-3.6-.9-5-7.7-9.4-4.8-3.1-5.7-4.3-5-6.8.5-1.7 0-3.3-1.1-3.6-1.1-.3-1.5-2-1-3.8.5-1.8.1-4.7-1-6.4-1.1-1.7-1.4-6.5-.8-10.7l1-7.6-5.8-.3c-3.1-.2-6.5.3-7.5 1.1-1 .8-4.5 1-7.8.4-6.3-1.1-7-1.6-4.3-2.9 1.4-.7 5.2-1.3 8.3-1.4 3.2-.1 6.3-.9 6.8-1.6.5-.7 3.3-.9 6.1-.3 2.8.5 7.2.2 9.8-.7 3.8-1.3 5-1.1 8 1.5 2 1.7 4 3 4.4 2.8.3-.2 2.6.7 5.1 2 2.4 1.3 5.4 2.4 6.7 2.4 1.3 0 2.4-.7 2.4-1.6 0-.8 2.1-2.9 4.7-4.7 6.4-4.4 6.7-4.9 2-4.9-2.7 0-5.6-1.1-6.4-2.4-.8-1.3-1.6-1.7-1.7-.8-.1.9-2.1-1.2-4.3-4.7-4.1-6.1-4.7-6.2-12.7-2.1-4.3 2.1-8.3 3.6-8.9 3.2-.5-.4-2.6.2-4.5 1.4-1.9 1.1-5 1.8-6.9 1.5-4.5-.7-6.9-3.7-7-8.8-.1-4.2-2-12.2-2.8-12.2-.4 0-3.7 2.9-7.2 6.5-3.6 3.6-8.5 6.6-11 6.8-2.5.1-4.5 1-4.5 1.9 0 .9-1.9 1.6-4.1 1.6-3.4 0-4 .5-3.7 3.2.2 1.9-.3 3.5-1.1 3.5-.8 0-.9 1.8-.3 4 .6 2.2.1 4-1.1 4-1.2 0-3.6 1.2-5.4 2.7-5.1 4.2-9 4.3-7.2.2.7-1.6 1.3-4.1 1.3-5.4 0-4.1 7.1-13.4 9.1-12 .6.4 1.1-.3 1.1-1.6 0-1.8 1.7-2.1 6.9-1.5 5.8.6 6.8.3 6.8-2.3 0-1.7 1.2-3 2.6-3s2.1-1.8 1.5-4c-.6-2.2.2-4 1.9-4 1.6 0 2-1 1-2.3-.9-1.2-.2-3 1.5-4 1.7-1 2.3-2.1 1.4-2.5-.9-.4-.7-2.8.5-5.3 1.1-2.5 1.5-5.2.8-6.1-.7-.8-1.7-.7-2.3.1-.6.9-2.8 1.6-4.8 1.6-3 0-3.6-.5-3.4-3.1.2-1.9-.3-5.6-1.1-8.2-.8-2.6-.9-5.1-.3-5.5.7-.4 3.7-1.5 6.8-2.5 3.1-1 4.8-2.5 3.9-3.4-1-1-1.6-.2-1.4 1.8.3 2 1.3 2.4 2.5.8 2.2-2.8 5.7-2.9 8.7-.3 1.7 1.5 5.2 2.7 7.7 2.7 4.5 0 8.3-4.6 7.4-9.1-.5-2.2-.1-4 1-4 1 0 1.2-1.8 .4-4-.8-2.2-1-5.6-.4-7.5.9-2.7 1-3.5 .2-2.9-1.7 1.3-6.2 1.5-13.6 .6-5-.5-10.2-1-11.6-1-1.4 0-4.4-.9-6.6-2-5.7-2.9-5.6-2.9 6.2-4.1 6.5-.7 13.9.7 17.5 3.3 1.8 1.3 4.1 1.6 5.1.7.9-.8 4.2-1.3 7.2-1.1 3 .2 6.5-.2 7.7-.8 2.9-1.6 16.5-1.5 16.5 .1 0 .6-.9 2-2 3s-2 2.6-2 3.5c0 1 .8 1.3 1.8 .7 1-.7 3.3-1.2 5-1.1 5.3 .3 6.5 1.5 4.3 4.3-1.6 2-1.4 2.5 1.1 2.5 1.7 0 3.1 .9 3.1 1.9 0 1.1 3.5 2.1 7.8 2.3 l7.9 .4 2.1-4c1.1-2.2 2.1-4.8 2.1-5.7 0-.9 1.3-4.2 3-7.5l2.9-6-1.5-3.1c-2.4-4.8 .6-12.9 4.3-11.3 1.4 .6 5.7 1 9.4 .8 9.3-.5 12.8 1.8 5.7 3.8-2.7 .7-3.9 1.9-2.7 2.7 3.6 2.5 14.3-1.6 14.3-5.4 0-1.4 1.2-2.3 2.7-2 1.4 .3 2.6-.2 2.6-1.1 0-.9 1.6-1.6 3.6-1.6 4.3 0 4.1-.3-1.1-2.7-4-1.9-5.1-3.3-2.6-3.3 .9 0 3.3-1 5.3-2.2 2-1.2 5.1-1.9 6.8-1.5 2.8.6 3.1 .3 2.2-2.7-.6-1.9-2.7-5.5-4.8-7.9-2-2.5-3.1-4.8-2.4-5.2 .7-.4 3.7 .8 6.5 2.7 2.9 1.9 6.8 3.5 8.7 3.7 1.9 .1 4.7 1 6.3 1.9 1.6 .9 4.3 1 6 .1 4.5-2.2 16.3-1.7 21 1 2.9 1.6 3 2 1.5 3.7 -1.1 1.3 -1.4 4.5 -.6 7.2 .8 2.7 1.1 6.7 .7 8.9 -.4 2.2 -1.5 7.1 -2.5 10.9 -1 3.8 -3.1 7.1 -4.8 7.3 -4.1 .6 -4.2 2.5 -.3 4.2 2.3 .9 2.9 2 2.1 3.6 -1.1 2.1 -1.4 6.8 -.6 14.1 .5 3.9 -.2 7.7 -1.6 8.5 -1.4 .8 -2.5 2.3 -2.5 3.3 0 1.1 .9 2 2 2 1.1 0 3.8 2.3 6 5.1 2.2 2.8 6.3 7 9.1 9.3 6.9 5.8 9.1 10.1 7.6 14.5 -.7 2.2 -2.5 4 -3.9 4 -1.7 0 -2.3 .9 -1.8 2.7 .4 1.4 .1 3.4 -.7 4.5 -1.3 1.8 -1.2 2 .5 2 1.1 0 2 1.5 2 3.3 0 3.6 4.6 10.7 7.1 11 l2.3 .3 -1.8 2.2 c-2.2 2.6 -2.3 5.3 -.2 7.3 1.3 1.3 1.4 3 .3 4.8 -1.7 2.9 .5 6.2 3.3 4.9 2.5 -1.1 3.2 -1.1 5.3 .3 1.4 .9 3.5 1.3 4.8 .8 1.9 -.7 2.3 -.3 1.5 1.5 -.5 1.3 -.2 4.1 .6 6.3 1.2 3.1 1.2 4.3 .1 6.3 -1.8 3.3 .8 10 3.9 10 1.2 0 1.8 1.2 1.4 2.7 -.4 1.5 .3 3.4 1.6 4.3 1.3 .9 2.7 3 3.1 4.7 .5 1.7 2.4 4.2 4.2 5.5 1.8 1.3 4.1 3.4 5.3 4.7 1.7 1.9 1.7 2.3 -1.1 2.3 z" />
                     {/* Duplicate path shifted for loop */}
                     <path transform="translate(500, 0)" d="M145.2 216.7c-3.2-1.9-8.4-6.4-11.7-10.1-5-5.6-7.8-10.8-7.8-14.7 0-4.6-2.5-9.3-5-9.3-1.1 0-2.8 1.9-3.9 4.3-3.2 6.8-.7 10.9 8.2 13.9 6.1 2.1 6.8 2.6 7.4 5.9.5 2.6 1.7 4.9 2.7 5.1 2.5.5 8.1 3.5 10.1 5.3 1.9 1.7 1.9 2 0 4.1-3 3.3-3.6 5.5-2.2 7.7 2.3 3.8 11.2 5.5 13.5 2.7 1.1-1.3 2-5 2-8.2 0-3.2.9-6.9 2-8.2 1.9-2.2 4.1-1.1 5.4 2.7 1.7 4.9 11.2 11.6 15 10.6 2.3-.6 5.3-2.9 6.8-5.1 1.4-2.2 3.6-4 4.8-4 .7 0 1.9-1.9 2.6-4.3.8-2.3 2.5-4.2 3.8-4.2 1.3 0 2.4-1.9 2.4-4.2 0-3.8 2.3-5.3 10.6-6.6 5.6-.9 9.3-2.7 8.1-4.1-1.1-1.3-1.4-3.5-.7-4.8.7-1.3 1.2-4.8 1.1-7.7-.2-4.1.7-5.5 3.3-5 5.6 1.1 8 0 8.7-4 .4-2 .2-5.7-.2-8.2-.5-2.5.3-4.6 1.7-4.6 2.5 0 2.4 2.6-.4 8.2-1.6 3.1-2.9 8.2-2.9 11.2 0 3-1.5 6.7-3.3 8.2-1.8 1.5-3.3 3.9-3.3 5.4s-1.8 3.5-3.9 4.5c-2.2 1-3.9 3.2-3.9 4.8 0 2.1-.9 3-3.2 3-1.8 0-4.4 1.2-5.8 2.7-2.1 2.2-2.5 4.3-1.3 6.9 1 2.2 1 4.8 0 5.7-1.1 1-1.4 3.7-.7 6.1.7 2.3 2.6 4.6 4.1 5.1 3.2 1 3.2 4.4 0 4.4-1.4 0-4.2 2-6.1 4.5-5.9 7.4-6.1 11.2-.5 12.3 4.2.8 5.6 3.1 3 4.8-3.9 2.5-3.8 2.6 1.2 4.4 3.3 1.2 5.9 3 5.9 4.1 0 1.1-1.2 2-2.7 2-3.5 0-5.4 6-3.2 10.1 2.3 4.4 1.1 12.7-2.1 14.5-1.9 1.1-2.4 1.9-1.1 1.9 3.9 0 6.6-8.7 4.1-12.9-.8-1.5-.1-2.7 1.6-2.7 2.5 0 5.3 3.6 5.3 6.8 0 2-1 4.9-2.1 6.3-2.1 2.6 2.3 10 6.8 11.5 5.1 1.7 5.1 1.8 3.5 5.8-1 2.2-2.4 4-3.2 4-2.1 0-7.3 9.4-7.3 13.2 0 1.9-1 3.4-2.2 3.4-1.2 0-3.3 1.5-4.7 3.3-1.3 1.8-6.1 4.5-10.6 6.1l-8.2 2.8 4.7 3.7c4 3.1 4.5 4 3 5.1-1.1.8-2 3.8-2 6.6 0 2.8-.7 5.1-1.6 5.1-2.9 0-3.6 4.7-1.2 8.2 1.7 2.5 1.7 2.8 0 4.2-2.5 2.1-1.1 8 2.2 9.5 3.3 1.5 2.8 5.4-.8 6.4-2.5.7-2.9 6.8-1 14.7 1.5 6.2 3.8 6.7 5.1 1.3.7-2.9 1.3-4 1.3-2.4 0 5.4-8.8 8.1-16.7 5.1-4.9-1.8-9.4-2.5-9.9-1.6-.5.9-4.8 2.8-9.5 4.3l-8.6 2.6-4.9-3.7c-6.8-5.1-14.8-12.8-15.7-15.2-.6-1.5-2.8-5.1-5-8.1-4-5.3-4-5.7.5-6.8 2.5-.6 6.9-3.3 9.7-5.9 5.3-4.9 6.1-4.9 11.9.4 6.8 6.2 10 7.3 13.9 4.8 2.1-1.3 4.3-5 4.9-8.2l1.1-5.7-8.2-1.9c-4.5-1-10.2-2.9-12.7-4.1l-4.5-2.2 2.8-5.1c1.5-2.8 2.8-6.6 2.8-8.4 0-1.8.8-3.7 1.8-4.3 1-.5 1.5-1.9 1.1-3s-1.4-2-2.2-2c-.9 0-1.3-2.3-1-5.1.4-2.8 0-6.4-.8-8-.9-1.6-1.3-5-1-7.5.3-5.3-2-7.5-8.2-7.5-3.3 0-6.1.6-6.1 1.4 0 .7-2.6 1.7-5.8 2.2-8.6 1.3-11.6 3.6-6.1 4.6 1.9.3 2.4.9 1.1 1.1-3 1-8.3 15-9.1 24.1-.2 2.2.8 6.2 2.4 9 3.5 6.3 3.6 6.1 5.7-9.3.9-7 2.8-9.8 8.4-12.7 3.3-1.7 5.3-4 4.5-5.1-.9-1.1-.3-5.6 1.3-9.9 1.6-4.3 2.2-8.1 1.4-8.5-.8-.4-1.2-3.1-.9-6 .4-2.9.1-5.6-.7-6-1.5-.7-2.1-7.2-1-10.7.6-1.9-.1-6.4-1.6-10-1.4-3.6-2-6.5-1.3-6.5.6 0 1.1-.9 1.1-2 0-3.3-3-4.4-8.4-3-3.6.9-6.3 3.8-6.8 7.3-.4 2.3-1.6 5.6-2.7 7.3-1.1 1.7-1.3 4.6-.3 6.6 1 1.9.9 4.8-.2 6.5-1.8 2.8-1.5 4.1 1.2 5.1 1.8.7 3.8 2.6 4.4 4.1 1.9 4.7-6.2 16.5-12.6 18.2-3 .8-6.2 2.1-7.1 2.9-.9.8-3.3 1.2-5.4.8-4.4-.8-5.7.5-6.2 6.5-.4 4.3-.2 4.9 1.8 4.9 1.3 0 2.4 1 2.4 2.2 0 1.2 1 2.2 2.2 2.2 1.2 0 2.2 1.4 2.2 3s2.3 2.9 5.2 2.9c4.2 0 5.4.6 6.1 3 .5 1.6 2.5 3.3 4.5 3.6 2.8.5 3.6 1.5 3.6 4.3 0 2.3.9 3.6 2.7 4 3 2.8-.5 8.1-5.3 8.1-2.9 0-3.6.6-4.5 4.1-.7 2.3-.9 5.8-.5 7.7.5 1.9 0 4.3-1.1 5.4-1.1 1.1-3.6 1.7-5.5 1.3-1.9-.4-5.2-.1-7.2.7-3.2 1.2-3.4 1-2-.9 2.2-3 2.2-3.1-1.3-4.1-3.6-1.1-4-2.9-1.9-8.4 1.1-3 1.2-3.3 1-3.3-.3 0-1.7 2.2-3.2 5-1.5 2.7-3.7 5.7-5 6.6-1.3.9-3.4 3.3-4.7 5.3-3.1 4.8-1.7 9.8 2.6 9.8 4 0 5.8 2.4 4.8 6.4-.3 1.4-.4 4.8-.2 7.5l.3 4.9-2.9-2.9c-2.8-2.8-3-2.8-4.8-.4-1.9 2.5-4.2 3.1-9 2.1-3.3-.7-6.5-1.7-7.2-2.3-2.1-1.7-4.1 1.4-2.8 4.4 1.2 2.7.2 4-3.5 4.8-2.6.5-6.1 1.8-7.7 2.8-2.2 1.3-9.1 1.2-12.5-.2-2.8-1.1-3.1-.7-3.3 3.9-.1 2.9-.6 5-1 4.7-.4-.3-2.2 1.1-3.9 3.2-1.7 2-3.8 3.7-4.6 3.7-1 0-1.4 3.7-.6 5.8 1.4 3.4.2 4.4-4 3.4-2.8-.7-5.5.1-7.5 2.1-1.6 1.6-4.3 2.3-6.1 1.6l-3.2-1.2 1 2.8c1.6 4.3-.2 5.5-3.3 2.2-2.1-2.2-2.8-2.2-4.5-.4-2.5 2.7-2.6 2.7-5.6.8-1.7-1.1-3.8-1.2-4.8-.3-1 .9-4.8.9-8.4 0-5.8-1.4-6.3-1.7-5-3.1.8-.9 1-2.9.5-4.4-.6-1.5-1.7-3.2-2.4-3.8-.8-.6-1.4-3.1-1.4-5.6 0-3.1-.8-4.5-2.5-4.5-1.4 0-2.5-1.3-2.5-2.9 0-1.5-1.2-2.9-2.6-2.9-1.4 0-4.3 1.9-6.4 4.1-3.5 3.8-3.7 3.8-3.4-.6.3-3.6-.9-5-7.7-9.4-4.8-3.1-5.7-4.3-5-6.8.5-1.7 0-3.3-1.1-3.6-1.1-.3-1.5-2-1-3.8.5-1.8.1-4.7-1-6.4-1.1-1.7-1.4-6.5-.8-10.7l1-7.6-5.8-.3c-3.1-.2-6.5.3-7.5 1.1-1 .8-4.5 1-7.8.4-6.3-1.1-7-1.6-4.3-2.9 1.4-.7 5.2-1.3 8.3-1.4 3.2-.1 6.3-.9 6.8-1.6.5-.7 3.3-.9 6.1-.3 2.8.5 7.2.2 9.8-.7 3.8-1.3 5-1.1 8 1.5 2 1.7 4 3 4.4 2.8.3-.2 2.6.7 5.1 2 2.4 1.3 5.4 2.4 6.7 2.4 1.3 0 2.4-.7 2.4-1.6 0-.8 2.1-2.9 4.7-4.7 6.4-4.4 6.7-4.9 2-4.9-2.7 0-5.6-1.1-6.4-2.4-.8-1.3-1.6-1.7-1.7-.8-.1.9-2.1-1.2-4.3-4.7-4.1-6.1-4.7-6.2-12.7-2.1-4.3 2.1-8.3 3.6-8.9 3.2-.5-.4-2.6.2-4.5 1.4-1.9 1.1-5 1.8-6.9 1.5-4.5-.7-6.9-3.7-7-8.8-.1-4.2-2-12.2-2.8-12.2-.4 0-3.7 2.9-7.2 6.5-3.6 3.6-8.5 6.6-11 6.8-2.5.1-4.5 1-4.5 1.9 0 .9-1.9 1.6-4.1 1.6-3.4 0-4 .5-3.7 3.2.2 1.9-.3 3.5-1.1 3.5-.8 0-.9 1.8-.3 4 .6 2.2.1 4-1.1 4-1.2 0-3.6 1.2-5.4 2.7-5.1 4.2-9 4.3-7.2.2.7-1.6 1.3-4.1 1.3-5.4 0-4.1 7.1-13.4 9.1-12 .6.4 1.1-.3 1.1-1.6 0-1.8 1.7-2.1 6.9-1.5 5.8.6 6.8.3 6.8-2.3 0-1.7 1.2-3 2.6-3s2.1-1.8 1.5-4c-.6-2.2.2-4 1.9-4 1.6 0 2-1 1-2.3-.9-1.2-.2-3 1.5-4 1.7-1 2.3-2.1 1.4-2.5-.9-.4-.7-2.8.5-5.3 1.1-2.5 1.5-5.2.8-6.1-.7-.8-1.7-.7-2.3.1-.6.9-2.8 1.6-4.8 1.6-3 0-3.6-.5-3.4-3.1.2-1.9-.3-5.6-1.1-8.2-.8-2.6-.9-5.1-.3-5.5.7-.4 3.7-1.5 6.8-2.5 3.1-1 4.8-2.5 3.9-3.4-1-1-1.6-.2-1.4 1.8.3 2 1.3 2.4 2.5.8 2.2-2.8 5.7-2.9 8.7-.3 1.7 1.5 5.2 2.7 7.7 2.7 4.5 0 8.3-4.6 7.4-9.1-.5-2.2-.1-4 1-4 1 0 1.2-1.8 .4-4-.8-2.2-1-5.6-.4-7.5.9-2.7 1-3.5 .2-2.9-1.7 1.3-6.2 1.5-13.6 .6-5-.5-10.2-1-11.6-1-1.4 0-4.4-.9-6.6-2-5.7-2.9-5.6-2.9 6.2-4.1 6.5-.7 13.9.7 17.5 3.3 1.8 1.3 4.1 1.6 5.1.7.9-.8 4.2-1.3 7.2-1.1 3 .2 6.5-.2 7.7-.8 2.9-1.6 16.5-1.5 16.5 .1 0 .6-.9 2-2 3s-2 2.6-2 3.5c0 1 .8 1.3 1.8 .7 1-.7 3.3-1.2 5-1.1 5.3 .3 6.5 1.5 4.3 4.3-1.6 2-1.4 2.5 1.1 2.5 1.7 0 3.1 .9 3.1 1.9 0 1.1 3.5 2.1 7.8 2.3 l7.9 .4 2.1-4c1.1-2.2 2.1-4.8 2.1-5.7 0-.9 1.3-4.2 3-7.5l2.9-6-1.5-3.1c-2.4-4.8 .6-12.9 4.3-11.3 1.4 .6 5.7 1 9.4 .8 9.3-.5 12.8 1.8 5.7 3.8-2.7 .7-3.9 1.9-2.7 2.7 3.6 2.5 14.3-1.6 14.3-5.4 0-1.4 1.2-2.3 2.7-2 1.4 .3 2.6-.2 2.6-1.1 0-.9 1.6-1.6 3.6-1.6 4.3 0 4.1-.3-1.1-2.7-4-1.9-5.1-3.3-2.6-3.3 .9 0 3.3-1 5.3-2.2 2-1.2 5.1-1.9 6.8-1.5 2.8.6 3.1 .3 2.2-2.7-.6-1.9-2.7-5.5-4.8-7.9-2-2.5-3.1-4.8-2.4-5.2 .7-.4 3.7 .8 6.5 2.7 2.9 1.9 6.8 3.5 8.7 3.7 1.9 .1 4.7 1 6.3 1.9 1.6 .9 4.3 1 6 .1 4.5-2.2 16.3-1.7 21 1 2.9 1.6 3 2 1.5 3.7 -1.1 1.3 -1.4 4.5 -.6 7.2 .8 2.7 1.1 6.7 .7 8.9 -.4 2.2 -1.5 7.1 -2.5 10.9 -1 3.8 -3.1 7.1 -4.8 7.3 -4.1 .6 -4.2 2.5 -.3 4.2 2.3 .9 2.9 2 2.1 3.6 -1.1 2.1 -1.4 6.8 -.6 14.1 .5 3.9 -.2 7.7 -1.6 8.5 -1.4 .8 -2.5 2.3 -2.5 3.3 0 1.1 .9 2 2 2 1.1 0 3.8 2.3 6 5.1 2.2 2.8 6.3 7 9.1 9.3 6.9 5.8 9.1 10.1 7.6 14.5 -.7 2.2 -2.5 4 -3.9 4 -1.7 0 -2.3 .9 -1.8 2.7 .4 1.4 .1 3.4 -.7 4.5 -1.3 1.8 -1.2 2 .5 2 1.1 0 2 1.5 2 3.3 0 3.6 4.6 10.7 7.1 11 l2.3 .3 -1.8 2.2 c-2.2 2.6 -2.3 5.3 -.2 7.3 1.3 1.3 1.4 3 .3 4.8 -1.7 2.9 .5 6.2 3.3 4.9 2.5 -1.1 3.2 -1.1 5.3 .3 1.4 .9 3.5 1.3 4.8 .8 1.9 -.7 2.3 -.3 1.5 1.5 -.5 1.3 -.2 4.1 .6 6.3 1.2 3.1 1.2 4.3 .1 6.3 -1.8 3.3 .8 10 3.9 10 1.2 0 1.8 1.2 1.4 2.7 -.4 1.5 .3 3.4 1.6 4.3 1.3 .9 2.7 3 3.1 4.7 .5 1.7 2.4 4.2 4.2 5.5 1.8 1.3 4.1 3.4 5.3 4.7 1.7 1.9 1.7 2.3 -1.1 2.3 z" />
                   </svg>
                </motion.div>

                {/* Atmosphere/Shadow Overlay for Sphere effect */}
                <div className="absolute inset-0 rounded-full shadow-[inset_20px_0_50px_rgba(0,0,0,0.9),inset_-10px_0_20px_rgba(255,255,255,0.05)] pointer-events-none" />
                <div className="absolute inset-0 rounded-full bg-radial-gradient from-transparent via-transparent to-black/80 pointer-events-none" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.9) 100%)' }} />
              </div>
            </div>
        </div>
        
        <div className="relative z-10 max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-10"
          >
            <div className="inline-block p-8 rounded-[3rem] shadow-2xl mb-10 ">
              <img className="h-28 w-auto drop-shadow-2xl" src='./fav.png' alt="Logo"/>
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter mb-6 leading-none">
              Engineering <br/> <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-amber-600">The Future</span>
            </h1>
            <p className="text-3xl font-thin text-white tracking-tight mb-2">of Biogas Integration</p>
            <p className="text-gray-400 text-sm font-medium leading-relaxed mb-12 max-w-sm mx-auto">
              Welcome to the next generation workspace. Efficiency meets intelligence in a unified platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-zinc-900/40 backdrop-blur-md border border-white/5 text-left group hover:bg-zinc-900/60 hover:border-amber-500/30 transition-all duration-300">
              <div className="text-3xl font-black text-white mb-2 group-hover:text-amber-500 transition-colors">10X</div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] group-hover:text-gray-300 transition-colors">Efficiency</div>
            </div>
            <div className="p-6 rounded-3xl bg-zinc-900/40 backdrop-blur-md border border-white/5 text-left group hover:bg-zinc-900/60 hover:border-amber-500/30 transition-all duration-300">
              <div className="text-3xl font-black text-white mb-2 group-hover:text-amber-500 transition-colors">Zero</div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] group-hover:text-gray-300 transition-colors">Latency</div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-12 right-12 flex justify-between items-center text-gray-600 text-[10px] uppercase font-black tracking-[0.2em]">
          <span>© {new Date().getFullYear()} BIOGAS ENGINEERING</span>
          <span>ENTERPRISE SOLUTIONS</span>
        </div>
      </div>

      {/* Right Side: Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 relative bg-zinc-950">
        {/* Mobile Background Elements */}
        <div className="lg:hidden absolute inset-0 bg-linear-to-b from-zinc-900/50 to-zinc-950 -z-10" />
        
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <img className="h-12 mx-auto mb-4" src='./fav.png' alt="Logo"/>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">Biogas Engineering</h1>
          </div>

          <div className="relative">
             {renderForm()}
          </div>

          <div className="mt-12 pt-8 border-t border-white/5">
             <div className="flex flex-col sm:flex-row gap-4 justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                <div className="flex gap-4">
                  <a href="#" className="hover:text-amber-500 transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-amber-500 transition-colors">Contact Support</a>
                </div>
                <div className="sm:hidden lg:block text-center sm:text-right">
                  System Version v2.4.0
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;