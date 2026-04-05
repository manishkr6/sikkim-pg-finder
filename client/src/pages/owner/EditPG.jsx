import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { useAuth } from '../../hooks/useAuth';
import AddPG from './AddPG';

export default function EditPG() {
  const { id } = useParams();
  const { getPGById, getOwnerPGById } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [resolved, setResolved] = useState(false);

  const pg = useMemo(() => {
    if (!id || !currentUser?.id) return null;
    return getOwnerPGById(currentUser.id, id) || getPGById(id);
  }, [id, currentUser?.id, getOwnerPGById, getPGById]);

  useEffect(() => {
    const timer = setTimeout(() => setResolved(true), 700);
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    if (resolved && !pg) {
      navigate('/owner');
    }
  }, [resolved, pg, navigate]);

  if (!pg) {
    return (
      <div className="min-h-screen pt-16 bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading PG details...</p>
      </div>
    );
  }

  return <AddPG editMode existingPG={pg} />;
}
