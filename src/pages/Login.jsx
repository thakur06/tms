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

  const API = 'http://localhost:4000/api';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
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
      const response = await fetch(`${API}/auth/send-otp`, {
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
      const response = await fetch(`${API}/auth/verify-otp`, {
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
      const response = await fetch(`${API}/auth/reset-password`, {
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
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500 mb-8">Please enter your details to sign in.</p>
            
            <form className="space-y-5" onSubmit={handleLogin}>
              {info && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                  {info}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute top-3.5 left-4 text-gray-400" />
                  <input 
                    type="email" 
                    placeholder="john@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete='off'
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <FiLock className="absolute top-3.5 left-4 text-gray-400" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-600 cursor-pointer">
                  <input type="checkbox" className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  Remember me
                </label>
                <button type="button" onClick={() => setView('forgot')} className="font-semibold text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </button>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98]"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        );

      case 'forgot':
        return (
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <button onClick={() => setView('login')} className="flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
              <FiArrowLeft className="mr-2" /> Back to Login
            </button>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-500 mb-8">Enter your email and we'll send you an OTP code.</p>
            
            <div className="space-y-6">
              {info && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                  {info}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div className="relative">
                <FiMail className="absolute top-3.5 left-4 text-gray-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>
              <button
                onClick={handleSendOtp}
                disabled={resendLoading}
                className="w-full py-3.5 bg-indigo-600 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
              >
                {resendLoading ? 'Sending...' : 'Send OTP Code'}
              </button>
            </div>
          </div>
        );

      case 'otp':
        return (
          <div className="animate-in fade-in slide-in-from-right duration-500 text-center">
            <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-full mb-6">
              <FiShield size={32} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Email</h2>
            <p className="text-gray-500 mb-8">We've sent a 6-digit code to <span className="text-gray-900 font-medium">{email || 'your email'}</span></p>

            {info && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6 text-left">
                {info}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 text-left">
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
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all bg-gray-50"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={otpLoading}
              className="w-full py-3.5 bg-green-600 disabled:bg-green-400 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              <FiCheckCircle /> {otpLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <p className="mt-6 text-sm text-gray-500">
              Didn't get the code?{' '}
              <button
                disabled={resendCooldown > 0 || resendLoading}
                onClick={handleSendOtp}
                className={`font-bold hover:underline ${resendCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600'}`}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
              </button>
            </p>
          </div>
        );

      case 'reset':
        return (
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <button onClick={() => setView('login')} className="flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
              <FiArrowLeft className="mr-2" /> Back to Login
            </button>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h2>
            <p className="text-gray-500 mb-8">Create a new password for your account.</p>

            {info && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">
                {info}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <FiLock className="absolute top-3.5 left-4 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute top-3.5 left-4 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98]"
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
    <div className="min-h-screen w-full flex bg-white">
      {/* LEFT SIDE: Visual Panel (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20 bg-[url('/fibre.png')]"></div>
        <div className="relative z-10 max-w-lg text-center">
          <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight">
            Streamline your workflow with us.
          </h1>
          <p className="text-indigo-100 text-lg mb-8">
            Join 10,000+ teams managing their projects with our modern interface.
          </p>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <p className="text-white italic text-sm">"The best UI kit we've ever used. Simple, clean, and fast."</p>
            <p className="text-indigo-200 text-xs mt-2">— Sarah Jenkins, CEO at TechFlow</p>
          </div>
        </div>
        {/* Decorative Circles */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-400 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* RIGHT SIDE: Form Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 md:px-16 lg:px-24 py-12">
        <div className="w-full max-w-md">
          {/* Logo Placeholder */}
          <div className="flex items-center gap-2 mb-12 lg:hidden">
            <div className='w-full shadow-xs shadow-fuchsia-100 p-4 ch'>
          <img className="" src='./logo.png'/></div>
            {/* <span className="text-xl font-bold tracking-tight">BrandName</span> */}
          </div>

          {renderForm()}

          {/* Bottom Link */}
          {/* <div className="mt-10 text-center text-sm text-gray-500">
            New to our platform? <button className="text-indigo-600 font-bold hover:underline">Create an account</button>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;