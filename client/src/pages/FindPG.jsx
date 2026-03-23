import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown, Search } from 'lucide-react';
import { useData } from '../hooks/useData';
import PGCard from '../components/ui/PGCard';
import { SkeletonCard, EmptyState, Pagination } from '../components/ui/index.jsx';

const AMENITY_LIST = ['WiFi', 'Food', 'AC', 'Parking', 'Laundry', 'CCTV', 'Water', 'Gym'];
const CITIES = ['Gangtok', 'Singtam', 'Namchi', 'Jorethang', 'Gyalshing', 'Mangan', 'Ravangla', 'Pakyong', 'Rangpo'];
const PER_PAGE = 9;

export default function FindPG() {
  const { getApprovedPGs } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    roomType: '',
    gender: '',
    amenities: [],
  });

  const [sort, setSort] = useState('newest');
  const [searchInput, setSearchInput] = useState(filters.location);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const allPGs = getApprovedPGs();

  const filtered = useMemo(() => {
    let result = [...allPGs];

    if (filters.location)
      result = result.filter(pg =>
        pg.location.city.toLowerCase().includes(filters.location.toLowerCase()) ||
        pg.location.area.toLowerCase().includes(filters.location.toLowerCase())
      );

    if (filters.minPrice) result = result.filter(pg => pg.price >= Number(filters.minPrice));
    if (filters.maxPrice) result = result.filter(pg => pg.price <= Number(filters.maxPrice));
    if (filters.roomType) result = result.filter(pg => pg.roomType === filters.roomType);
    if (filters.gender) result = result.filter(pg => pg.genderPreference === filters.gender);
    if (filters.amenities.length > 0)
      result = result.filter(pg => filters.amenities.every(a => pg.amenities.includes(a)));

    switch (sort) {
      case 'price_low': result.sort((a, b) => a.price - b.price); break;
      case 'price_high': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.averageRating - a.averageRating); break;
      default: result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [allPGs, filters, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const setFilter = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);

    const params = new URLSearchParams(searchParams);
    if (val) params.set(key, val);
    else params.delete(key);
    setSearchParams(params);
  };

  const toggleAmenity = (a) => {
    const updated = filters.amenities.includes(a)
      ? filters.amenities.filter(x => x !== a)
      : [...filters.amenities, a];

    setFilter('amenities', updated);
  };

  const clearFilters = () => {
    setFilters({ location: '', minPrice: '', maxPrice: '', roomType: '', gender: '', amenities: [] });
    setSearchInput('');
    setSearchParams({});
    setPage(1);
  };

  const activeFilterCount =
    [filters.location, filters.minPrice, filters.maxPrice, filters.roomType, filters.gender].filter(Boolean).length +
    filters.amenities.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-16">

      {/* 🔥 NEW HERO TEXT SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Find Your Perfect PG 🏡
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            Discover verified PG accommodations across Sikkim. Filter by price, amenities, and location to find the best stay for you.
          </p>
        </div>
      </div>

      {/* 🔥 SEARCH BAR (NOW SCROLLABLE, NOT STICKY) */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">

            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <Search size={16} className="text-slate-400" />

              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setFilter('location', searchInput)}
                placeholder="Search by city or area..."
                className="flex-1 bg-transparent text-sm outline-none"
              />

              {searchInput && (
                <button onClick={() => { setSearchInput(''); setFilter('location', ''); }}>
                  <X size={14} className="text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            <button
              onClick={() => setFilter('location', searchInput)}
              className="btn-primary py-2.5 text-sm px-5 w-full sm:w-auto"
            >
              Search
            </button>

            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 relative"
            >
              <SlidersHorizontal size={15} /> Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* SIDEBAR */}
          <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block w-full lg:w-72`}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">

              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-900">Filters</h3>

                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-primary-600 flex items-center gap-1">
                    <X size={12} /> Clear
                  </button>
                )}
              </div>

              <FilterSection title="Location">
                <select value={filters.location} onChange={e => setFilter('location', e.target.value)} className="input-field text-sm">
                  <option value="">All Locations</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FilterSection>

              <FilterSection title="Price Range">
                <div className="flex gap-2">
                  <input type="number" placeholder="Min ₹" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} className="input-field text-sm w-1/2" />
                  <input type="number" placeholder="Max ₹" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} className="input-field text-sm w-1/2" />
                </div>
              </FilterSection>

              <FilterSection title="Room Type">
                {['', 'Single', 'Double', 'Triple'].map(rt => (
                  <label key={rt} className="flex items-center gap-2 mb-2">
                    <input type="radio" checked={filters.roomType === rt} onChange={() => setFilter('roomType', rt)} />
                    <span className="text-sm">{rt || 'All'}</span>
                  </label>
                ))}
              </FilterSection>

              <FilterSection title="Gender Preference">
                {['', 'Boys', 'Girls', 'Co-ed'].map(g => (
                  <label key={g} className="flex items-center gap-2 mb-2">
                    <input type="radio" checked={filters.gender === g} onChange={() => setFilter('gender', g)} />
                    <span className="text-sm">{g || 'All'}</span>
                  </label>
                ))}
              </FilterSection>

              <FilterSection title="Amenities" last>
                <div className="grid grid-cols-2 gap-y-2">
                  {AMENITY_LIST.map(a => (
                    <label key={a} className="flex items-center gap-2">
                      <input type="checkbox" checked={filters.amenities.includes(a)} onChange={() => toggleAmenity(a)} />
                      <span className="text-sm">{a}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

            </div>
          </aside>

          {/* RESULTS */}
          <main className="flex-1">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
              <p className="text-slate-600 text-sm">
                Showing <span className="font-semibold text-slate-900">{filtered.length}</span> properties
              </p>

              <select value={sort} onChange={e => setSort(e.target.value)} className="input-field text-sm w-full sm:w-auto">
                <option value="newest">Newest</option>
                <option value="price_low">Low to High</option>
                <option value="price_high">High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : paginated.length === 0 ? (
              <EmptyState
                title="No PGs found"
                message="Try adjusting your filters."
                icon={Search}
                actionLabel="Clear Filters"
                onAction={clearFilters}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginated.map(pg => <PGCard key={pg.id} pg={pg} />)}
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children, last = false }) {
  const [open, setOpen] = useState(true);

  return (
    <div className={`${last ? '' : 'border-b border-slate-100 pb-5 mb-5'}`}>
      <button onClick={() => setOpen(!open)} className="flex justify-between w-full mb-3">
        <span className="text-sm font-semibold">{title}</span>
        <ChevronDown size={15} className={`${open ? 'rotate-180' : ''}`} />
      </button>
      {open && children}
    </div>
  );
}