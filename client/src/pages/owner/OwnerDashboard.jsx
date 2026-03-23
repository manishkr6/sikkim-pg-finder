import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Building2, CheckCircle, Clock, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import StatusPill from '../../components/ui/StatusPill';
import Modal from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/index.jsx';

const TABS = [
  { id: 'pgs', label: 'My PGs', icon: Building2 },
  { id: 'add', label: 'Add New PG', icon: Plus },
];

export default function OwnerDashboard() {
  const { currentUser } = useAuth();
  const { getOwnerPGs, deletePG } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pgs');
  const [deleteId, setDeleteId] = useState(null);

  const myPGs = getOwnerPGs(currentUser?.id);
  const stats = {
    total: myPGs.length,
    approved: myPGs.filter(p => p.status === 'approved').length,
    pending: myPGs.filter(p => p.status === 'pending' || p.status === 'pending_update').length,
    rejected: myPGs.filter(p => p.status === 'rejected').length,
  };

  const handleDelete = () => {
    deletePG(deleteId);
    setDeleteId(null);
    toast.success('PG deleted successfully');
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Owner Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your PG properties</p>
          </div>
          <button onClick={() => navigate('/owner/add')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add New PG
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-primary-600', bg: 'bg-primary-50' },
            { label: 'Approved', value: stats.approved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-white`}>
              <div className={`text-3xl font-bold font-display ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* PG List */}
        {myPGs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <EmptyState
              title="No PGs listed yet"
              message="Start by adding your first property listing."
              icon={Home}
              actionLabel="Add New PG"
              onAction={() => navigate('/owner/add')}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {myPGs.map(pg => (
              <div key={pg.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex gap-4 hover:shadow-md transition-shadow">
                <div className="w-24 h-20 rounded-xl overflow-hidden bg-primary-100 shrink-0">
                  {pg.images?.[0] ? (
                    <img src={pg.images[0]} alt={pg.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Home size={24} className="text-primary-300" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 truncate">{pg.title}</h3>
                      <p className="text-slate-500 text-xs mt-0.5">{pg.location.area}, {pg.location.city}</p>
                    </div>
                    <StatusPill status={pg.status} />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-primary-600 font-semibold text-sm">₹{pg.price.toLocaleString('en-IN')}/mo</span>
                    <span className="text-slate-400 text-xs">{pg.roomType} · {pg.genderPreference}</span>
                  </div>
                  {pg.rejectionReason && (
                    <p className="text-red-500 text-xs mt-2 bg-red-50 px-3 py-1.5 rounded-lg">
                      Rejection reason: {pg.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => navigate(`/owner/edit/${pg.id}`)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => setDeleteId(pg.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete PG"
        onConfirm={handleDelete} confirmText="Delete" confirmVariant="danger">
        <p className="text-slate-600 text-sm">Are you sure you want to delete this PG? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
