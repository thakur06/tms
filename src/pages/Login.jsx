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
            <h2 className="text-3xl font-black text-gray-900 mb-2 text-center tracking-tight">Welcome Back</h2>
            <p className="text-gray-500 mb-8 text-center font-medium">Please enter your details to sign in.</p>
            
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
    <div className="min-h-screen w-full flex bg-[#f8fafc] overflow-hidden">
      {/* Left Side: Illustration / Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-linear-to-br from-blue-700 via-blue-800 to-blue-900 items-center justify-center p-12">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-size-[40px_40px]" />
        <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse delay-700" />
        
        <div className="relative z-10 max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-10"
          >
            <div className="inline-block p-6 rounded-[2.5rem] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl mb-8">
              <img className="h-24 w-auto drop-shadow-2xl" src='./fav.png' alt="Logo"/>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-6 leading-tight">
              Engineering <br/> <span className="text-blue-300">The Future</span> of Biogas.
            </h1>
            <p className="text-blue-100/70 text-lg font-medium leading-relaxed mb-10 italic">
              "Efficiency is not just a metric, it's our philosophy. Welcome to the workspace of high-performance analytics."
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 text-left">
              <div className="text-2xl font-black text-white mb-1">10X</div>
              <div className="text-xs font-black text-blue-200 uppercase tracking-widest">Efficiency</div>
            </div>
            <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 text-left">
              <div className="text-2xl font-black text-white mb-1">Real-time</div>
              <div className="text-xs font-black text-blue-200 uppercase tracking-widest">Analytics</div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-12 right-12 flex justify-between items-center text-blue-200/40 text-[10px] uppercase font-black tracking-[0.2em]">
          <span>© {new Date().getFullYear()} BIOGAS ENGINEERING</span>
          <span>ENTERPRISE SOLUTIONS</span>
        </div>
      </div>

      {/* Right Side: Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 relative bg-[#f8fafc]">
        {/* Mobile Background Elements */}
        <div className="lg:hidden absolute inset-0 bg-linear-to-b from-blue-50/50 to-white -z-10" />
        
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <img className="h-12 mx-auto mb-4" src='./fav.png' alt="Logo"/>
            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Biogas Engineering</h1>
          </div>

          <div className="relative">
             {renderForm()}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100">
             <div className="flex flex-col sm:flex-row gap-4 justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                <div className="flex gap-4">
                  <a href="#" className="hover:text-[#161efd] transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-[#161efd] transition-colors">Contact Support</a>
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