// SkeletonCard.jsx
export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
        <div className="flex justify-between">
          <div className="h-4 skeleton rounded w-1/3" />
          <div className="h-4 skeleton rounded w-1/4" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 skeleton rounded-full w-16" />
          <div className="h-6 skeleton rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

// EmptyState.jsx
export function EmptyState({ title = 'Nothing here', message = 'No results found.', icon: Icon, actionLabel, onAction }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/75 backdrop-blur-sm flex flex-col items-center justify-center py-14 sm:py-20 px-4 text-center shadow-sm">
      {Icon && (
        <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-cyan-100 rounded-2xl flex items-center justify-center mb-5 border border-white shadow-sm">
          <Icon size={28} className="text-primary-500" />
        </div>
      )}
      <h3 className="text-slate-800 font-semibold text-lg mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-6">{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">{actionLabel}</button>
      )}
    </div>
  );
}

// Pagination.jsx
export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 text-sm rounded-xl transition-colors font-medium ${
            p === currentPage ? 'bg-primary-600 text-white shadow-sm' : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}

// StarRating.jsx
import { Star } from 'lucide-react';
export function StarRating({ rating = 0, size = 'md', interactive = false, onChange }) {
  const sizes = { sm: 12, md: 16, lg: 22 };
  const s = sizes[size] || 16;
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type={interactive ? 'button' : undefined}
          onClick={interactive ? () => onChange?.(i) : undefined}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
        >
          <Star size={s} className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-200'} />
        </button>
      ))}
    </div>
  );
}
