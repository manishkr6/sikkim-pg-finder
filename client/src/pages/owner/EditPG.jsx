import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import AddPG from './AddPG';

export default function EditPG() {
  const { id } = useParams();
  const { getPGById } = useData();
  const navigate = useNavigate();
  const pg = getPGById(id);
  if (!pg) {
    navigate('/owner');
    return null;
  }
  return <AddPG editMode existingPG={pg} />;
}
