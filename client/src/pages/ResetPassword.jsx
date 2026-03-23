import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch('password', '');

  const onSubmit = async ({ password: nextPassword }) => {
    try {
      const data = await resetPassword(token, nextPassword);
      toast.success('Password reset successful');
      const user = data?.user;
      if (user?.role === 'admin') navigate('/admin');
      else if (user?.role === 'owner') navigate('/owner');
      else navigate('/dashboard');
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Could not reset password');
    }
  };

  return (
    <div className="relative min-h-screen pt-16 overflow-hidden bg-slate-100">
      <div className="flex items-center justify-center p-4 sm:p-6 lg:p-10 min-h-[calc(100svh-4rem)]">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl p-6 sm:p-8">
          <div className="mb-7">
            <h1 className="font-display text-3xl font-bold text-slate-900">Reset Password</h1>
            <p className="text-slate-500 text-sm mt-1">Set your new password</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'At least 6 characters' },
                  })}
                  className="input-field pl-10 pr-10"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm password',
                    validate: (v) => v === password || 'Passwords do not match',
                  })}
                  className="input-field pl-10 pr-10"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-sm disabled:opacity-60">
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
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
