import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText, ShieldCheck, Upload, Sparkles, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';

export default function ListYourPG() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, updateCurrentUser } = useAuth();
  const { requestOwner } = useData();

  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [propertyDocument, setPropertyDocument] = useState(null);
  const [identityDocument, setIdentityDocument] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ownerStatus = currentUser?.ownerRequestStatus || 'none';

  const onSubmitRequest = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error('Valid name is required');
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!propertyDocument || !identityDocument) {
      toast.error('Please upload both required documents');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestOwner({ fullName, phoneNumber, propertyDocument, identityDocument });
      updateCurrentUser({ ...currentUser, ownerRequestStatus: 'pending' });
      toast.success('Owner access request submitted successfully');
    } catch (e2) {
      toast.error(e2?.response?.data?.message || e2.message || 'Could not submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="bg-gradient-to-r from-indigo-950 via-blue-950 to-indigo-900 rounded-[2.2rem] px-6 sm:px-10 py-14 text-center text-white shadow-xl">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight">Own a Property in Sikkim?</h1>
          <p className="mt-5 text-slate-200 text-lg max-w-2xl mx-auto">
            Submit your verification documents to request owner access and list your PG on our platform.
          </p>
          {ownerStatus === 'approved' && (
            <button
              onClick={() => navigate('/owner')}
              className="mt-8 bg-white text-slate-900 font-bold px-8 py-4 rounded-full hover:bg-slate-100 transition-all inline-flex items-center gap-2"
            >
              Go to Owner Dashboard <ArrowRight size={18} />
            </button>
          )}
        </section>

        <section className="mt-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <h2 className="font-semibold text-slate-900 text-xl mb-2">Request Owner Access</h2>
          <p className="text-slate-500 text-sm mb-7">
            Upload one property proof document and one identity document. Admin will review and approve your owner access.
          </p>

          {ownerStatus === 'approved' ? (
            <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-7">
              <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-emerald-200/30 blur-2xl" />
              <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-teal-200/30 blur-2xl" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                  <Sparkles size={13} /> OWNER ACCESS ACTIVE
                </div>

                <h3 className="mt-4 text-2xl font-bold text-slate-900">You are verified as a Property Owner</h3>
                <p className="mt-2 text-slate-600 max-w-2xl">
                  Your documents have been reviewed and approved. You can now create listings, manage your PGs,
                  and receive tenant interest directly from your dashboard.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/owner')}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Building2 size={16} /> Open Owner Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/owner/add')}
                    className="btn-outline inline-flex items-center gap-2"
                  >
                    List New PG <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          ) : ownerStatus === 'pending' ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2 text-amber-800 font-semibold">
                <CheckCircle2 size={18} />
                Request Already Submitted
              </div>
              <p className="mt-2 text-sm text-amber-700">
                Your request is under review by admin. You will get owner access after approval.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmitRequest} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Property Document</label>
                  <p className="text-xs text-slate-500 mb-3">Upload property paper/rent agreement (PDF/Image)</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer text-sm">
                    <Upload size={14} /> Choose File
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => setPropertyDocument(e.target.files?.[0] || null)}
                    />
                  </label>
                  <p className="text-xs text-slate-500 mt-2 break-all">{propertyDocument?.name || 'No file selected'}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Identity Document</label>
                  <p className="text-xs text-slate-500 mb-3">Upload Aadhaar/Voter ID (PDF/Image)</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer text-sm">
                    <FileText size={14} /> Choose File
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => setIdentityDocument(e.target.files?.[0] || null)}
                    />
                  </label>
                  <p className="text-xs text-slate-500 mt-2 break-all">{identityDocument?.name || 'No file selected'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 flex items-start gap-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                Admin uses these documents only for verification and future reference.
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary px-6 py-3 disabled:opacity-60">
                {isSubmitting ? 'Submitting Request...' : 'Request Owner Access'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
