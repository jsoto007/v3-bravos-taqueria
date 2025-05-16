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

  if (!car) return <div className="text-gray-900 dark:text-white">Loading...</div>;

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
      <div className="p-4 sm:p-6 text-gray-900 dark:text-white">
        <h1>{car.make} {car.year}   |   VIN {car.vin_number}</h1>
        <PhotoGallery />
      </div>
      <div className="p-4 sm:p-6 text-gray-900 dark:text-white">
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
      <div className="p-4 sm:p-6 text-gray-900 dark:text-white flex flex-row items-center">
        <button className="mr-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Edit</button>
        <button className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
      </div>
    </div>
  );
}
  