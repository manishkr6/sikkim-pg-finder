export default function StatusPill({ status }) {
  const styles = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    pending_update: 'bg-orange-100 text-orange-700 border-orange-200',
  };
  const dots = {
    pending: 'bg-amber-500',
    approved: 'bg-emerald-500',
    rejected: 'bg-red-500',
    pending_update: 'bg-orange-500',
  };
  const labels = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    pending_update: 'Pending Update',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${styles[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || 'bg-slate-400'}`} />
      {labels[status] || status}
    </span>
  );
}
