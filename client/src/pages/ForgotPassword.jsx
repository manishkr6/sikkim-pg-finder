import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      const data = await forgotPassword(email);
      toast.success(data?.message || 'If that email exists, a reset link has been sent.');
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Could not process request');
    }
  };

  return (
    <div className="relative min-h-screen pt-16 overflow-hidden bg-slate-100">
      <div className="flex items-center justify-center p-4 sm:p-6 lg:p-10 min-h-[calc(100svh-4rem)]">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl p-6 sm:p-8">
          <div className="mb-7">
            <h1 className="font-display text-3xl font-bold text-slate-900">Forgot Password</h1>
            <p className="text-slate-500 text-sm mt-1">Enter your email to get a reset link</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                  })}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-sm disabled:opacity-60">
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Back to <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
