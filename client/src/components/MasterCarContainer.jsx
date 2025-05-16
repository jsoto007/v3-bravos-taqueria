import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminCarInfo from "./AdminCarInfo";
import AdminCarEdit from "./AdminCarEdit";

// Shows one car for the admin inventory
export default function MasterCarContainer() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    fetch(`/api/master_inventory/${id}`)
      .then((res) => res.json())
      .then((data) => setCar(data))
      .catch((err) => console.error("Failed to fetch car:", err));
  }, [id]);

  if (!car) return <div className="text-gray-900 dark:text-white">Loading...</div>;

  return (
    <>
      {!showEdit ? (
        <AdminCarInfo car={car} showEdit={showEdit} setShowEdit={setShowEdit} />
      ) : (
        <AdminCarEdit car={car} onSave={setCar} showEdit={showEdit} setShowEdit={setShowEdit} />
      )}
    </>
  );
}