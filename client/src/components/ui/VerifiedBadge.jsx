import { ShieldCheck } from 'lucide-react';

export default function VerifiedBadge({ size = 'md' }) {
  if (size === 'sm') return (
    <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
      <ShieldCheck size={10} /> Verified
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm px-3 py-1 rounded-full font-medium">
      <ShieldCheck size={14} /> Verified Listing
    </span>
  );
}
