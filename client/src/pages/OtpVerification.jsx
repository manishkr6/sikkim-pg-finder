import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const OTP_LENGTH = 6;

export default function OtpVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();

  const [otp, setOtp] = useState('');
  const [emailInput, setEmailInput] = useState(location.state?.email || '');
  const [purposeInput, setPurposeInput] = useState(location.state?.purpose || 'signup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const onVerify = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== OTP_LENGTH) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    if (!emailInput) {
      toast.error('Email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await verifyOtp(emailInput, otp.trim(), purposeInput);
      toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'owner') navigate('/owner');
      else navigate('/dashboard');
    } catch (e2) {
      toast.error(e2?.response?.data?.message || e2.message || 'OTP verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!emailInput) {
      toast.error('Email is required');
      return;
    }

    setIsResending(true);
    try {
      const result = await resendOtp(emailInput, purposeInput);
      toast.success(result?.message || 'OTP resent');
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Could not resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-16 overflow-hidden bg-slate-100">
      <div className="flex items-center justify-center p-4 sm:p-6 lg:p-10 min-h-[calc(100svh-4rem)]">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl p-6 sm:p-8">
          <div className="mb-7">
            <h1 className="font-display text-3xl font-bold text-slate-900">OTP Verification</h1>
            <p className="text-slate-500 text-sm mt-1">Enter the code sent to your email</p>
          </div>

          <form onSubmit={onVerify} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">OTP Code</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                className="input-field text-center tracking-[0.35em] text-lg font-semibold"
                placeholder="000000"
                inputMode="numeric"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Purpose</label>
              <input value="Signup" className="input-field bg-slate-50" readOnly />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-sm disabled:opacity-60">
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onResend}
              disabled={isResending}
              className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline disabled:opacity-60"
            >
              <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
              {isResending ? 'Resending...' : 'Resend OTP'}
            </button>
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline">
              <ShieldCheck size={14} /> Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
