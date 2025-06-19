import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminCarInfo from "./AdminCarInfo";
import AdminCarEdit from "./AdminCarEdit";

// Shows one car for the admin inventory
export default function MasterCarContainer() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/master_inventory/${id}`)
      .then((res) => res.json())
      .then((data) => setCar(data))
      .catch((err) => setError(err));
  }, [id]);

  if (!car) return <div className="text-gray-900 dark:text-white mt-16">Loading...</div>;

  return (
    <div className="mt-12">
      {!showEdit ? (
        <AdminCarInfo car={car} showEdit={showEdit} setShowEdit={setShowEdit} />
      ) : (
        <AdminCarEdit car={car} onSave={setCar} showEdit={showEdit} setShowEdit={setShowEdit} />
      )}
    </div>
  );
}