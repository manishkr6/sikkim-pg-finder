import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../../hooks/useData';
import Modal from '../../components/ui/Modal';
import StatusPill from '../../components/ui/StatusPill';

export default function AdminPending() {
  const { pgs, approvePG, rejectPG, users } = useData();
  const [expanded, setExpanded] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const newPGs = pgs.filter(p => p.status === 'pending' && !p.isDeleted);
  const updatePGs = pgs.filter(p => p.status === 'pending_update' && !p.isDeleted);

  const handleApprove = (id) => {
    approvePG(id);
    toast.success('PG approved successfully!');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { toast.error('Please enter a rejection reason'); return; }
    rejectPG(rejectModal, rejectReason);
    setRejectModal(null);
    setRejectReason('');
    toast.success('PG rejected');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Pending Approvals</h1>
        <p className="text-slate-500 text-sm mt-1">Review and approve or reject PG submissions</p>
      </div>

      <PGSection title="New Submissions" pgs={newPGs} expanded={expanded} setExpanded={setExpanded}
        onApprove={handleApprove} onReject={setRejectModal} users={users} />
      <PGSection title="Pending Updates" pgs={updatePGs} expanded={expanded} setExpanded={setExpanded}
        onApprove={handleApprove} onReject={setRejectModal} users={users} />

      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }}
        title="Reject PG Listing" onConfirm={handleReject} confirmText="Reject" confirmVariant="danger">
        <p className="text-sm text-slate-600 mb-4">Please provide a reason for rejection. The owner will be notified.</p>
        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4}
          placeholder="e.g., Incomplete documentation, inaccurate images..." className="input-field resize-none text-sm" />
      </Modal>
    </div>
  );
}

function PGSection({ title, pgs, expanded, setExpanded, onApprove, onReject, users }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-semibold text-slate-900 text-lg">{title}</h2>
        <span className="bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">{pgs.length}</span>
      </div>
      {pgs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <p className="text-slate-400 text-sm">No {title.toLowerCase()} at the moment 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pgs.map(pg => {
            const owner = users.find(u => u.id === pg.ownerId);
            const isExpanded = expanded === pg.id;
            return (
              <div key={pg.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 flex gap-4">
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-primary-50 shrink-0">
                    {pg.images?.[0] ? <img src={pg.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Home size={20} className="text-primary-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 truncate">{pg.title}</h3>
                        <p className="text-slate-500 text-xs mt-0.5">{pg.location.area}, {pg.location.city} · by <span className="font-medium">{owner?.name}</span></p>
                      </div>
                      <StatusPill status={pg.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-primary-600 font-semibold text-sm">₹{pg.price.toLocaleString('en-IN')}/mo</span>
                      <span className="text-slate-400 text-xs">{pg.roomType} · {pg.genderPreference}</span>
                      <span className="text-slate-400 text-xs">{pg.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => onApprove(pg.id)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-medium transition-colors">
                      <Check size={13} /> Approve
                    </button>
                    <button onClick={() => onReject(pg.id)} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-medium transition-colors">
                      <X size={13} /> Reject
                    </button>
                    <button onClick={() => setExpanded(isExpanded ? null : pg.id)} className="flex items-center gap-1 px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium transition-colors">
                      Details {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50">
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{pg.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {pg.amenities.map(a => <span key={a} className="bg-white text-slate-600 text-xs px-2.5 py-1 rounded-full border border-slate-200">{a}</span>)}
                    </div>
                    <p className="text-xs text-slate-500">Contact: {pg.contactNumber}</p>
                    {pg.images?.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto">
                        {pg.images.map((img, i) => (
                          <img key={i} src={img} alt="" className="w-28 h-20 rounded-xl object-cover shrink-0" />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
