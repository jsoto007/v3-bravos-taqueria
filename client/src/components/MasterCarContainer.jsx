import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PhotoGallery from "../shared/PhotoGellery";

// Shows one car for the admin inventory
export default function MasterCarContainer() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  console.log(id)

  useEffect(() => {
    fetch(`/api/master_inventory/${id}`)
      .then((res) => res.json())
      .then((data) => setCar(data))
      .catch((err) => console.error("Failed to fetch car:", err));
  }, [id]);

  if (!car) return <div className="text-black">Loading...</div>;

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
      <div className="px-4 py-5 sm:px-6 text-black">
        <h1>{car.make} {car.year}   |   VIN {car.vin_number}</h1>
        <PhotoGallery />
      </div>
      <div className="px-4 py-5 sm:p-6 text-black">
        <ul>
          <li>Vin: {car.vin_number}</li>
          <li>Location: {car.location}</li>
          <li>Year: {car.year}</li>
          <li>Make: {car.make}</li>
          <li>Purchased Price: {car.purchase_price}</li>
          <li>Selling Price: {car.selling_price}</li>
          <li>Sold Price: {car.sold_price}</li>
          <li>Is Sold: {car.is_sold ? "Yes" : "No"}</li>
        </ul>
      </div>
      <div className="px-4 py-4 sm:px-6 text-black">
        <button className="mr-10">Edit</button>
        <button>Delete</button>
      </div>
    </div>
  );
}
  