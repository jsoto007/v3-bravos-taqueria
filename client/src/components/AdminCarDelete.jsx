import { useNavigate } from "react-router-dom";

export default function AdminCarDelete({ car }) {
    const navigate = useNavigate();

    const handleDelete = async () => {
        const confirmed = window.confirm("After deleting this record you will not be able to get it back. Are you sure you want to delete this car?");
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/master_inventory/${car.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete car");


            navigate("/master_inventory");
        } catch (error) {
            alert("There was a problem deleting the car.");
        }
    };

    return (
        <div>
            <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
                Delete
            </button>
        </div>
    );
}
