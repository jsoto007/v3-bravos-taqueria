import React from "react";
import PhotoGallery from "../shared/PhotoGellery";
import AdminCarDelete from "./AdminCarDelete";


export default function AdminCarInfo( { car, showEdit, setShowEdit } ) {

  console.log("CarID:", car)
  console.log("CarID:", car.id)

    return (
        <div className="mt-6 divide-y-4 divide-gray-200 font-mono dark:divide-gray-700 overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
        <div className="p-4 sm:p-6 text-gray-900 dark:text-white">
          <h1 className="text-xl text-bold mb-2 font-serif">{car.make} {car.year}</h1>
          <PhotoGallery />
        </div>
        <div className="p-4 sm:p-6 text-gray-900 dark:text-white">
          <table className="min-w-full  divide-gray-200 dark:divide-gray-700">
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-2 font-medium">VIN</td>
                <td className="px-4 py-2">{car.vin_number}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Location</td>
                <td className="px-4 py-2">{car.location}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Year</td>
                <td className="px-4 py-2">{car.year}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Make</td>
                <td className="px-4 py-2">{car.make}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Purchased Price</td>
                <td className="px-4 py-2">${car.purchase_price}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Selling Price</td>
                <td className="px-4 py-2">${car.selling_price}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Sold Price</td>
                <td className="px-4 py-2">${car.sold_price}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Is Sold</td>
                <td className="px-4 py-2">{car.is_sold ? "Yes" : "No"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 sm:p-6 text-gray-900 dark:text-white flex flex-row items-center">
            <button 
                className="mr-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setShowEdit(!showEdit)}
            >
                Edit
            </button>
            <AdminCarDelete car={car} />
        </div>
      </div>
    );
    
}