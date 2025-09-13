import React, { useState } from 'react';
import { Trash2, KeySquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CarDetails( { car, setCar } ) {


  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  const deleteCar = async () => {
    try {
      const res = await fetch(`/api/cars_inventory/${car.id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteConfirm(false);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Failed to delete car", err);
    }
  };


  // If car is deleted, show empty state
  if (!car) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 dark:from-[#121A2A] dark:via-slate-800 dark:to-slate-900 p-6 flex items-center justify-center transition-colors duration-300">
        <div className="text-center bg-white dark:bg-slate-900 rounded-xl shadow-md p-8 transition-colors duration-300">
          <KeySquare className="mx-auto h-16 w-16 text-slate-500 dark:text-slate-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-50 mb-2 transition-colors duration-300">
            No Car Data
          </h2>
          <p className="text-slate-500 dark:text-slate-400 transition-colors duration-300">
            The car and all associated data have been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
      <div className="max-w-auto mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1A2235] rounded-2xl shadow-xl p-8 mb-8 border border-slate-300 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-600 dark:bg-indigo-500 rounded-xl">
                <KeySquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-slate-700 dark:text-slate-200 text-lg md:text-2xl font-bold font-mono">
                  <span className='dark:text-slate-400 text-slate-500'>VIN:</span> {car.vin_number}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1 rounded hover:bg-slate-700 text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {showDeleteConfirm && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-80">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Delete Car</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">Are you sure you want to delete this car and all associated data?</p>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={deleteCar}
                      className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-slate-300/50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Make & Model</p>
              <p className="text-xl font-bold text-slate-950 dark:text-slate-50">{car.make}</p>
            </div>
            <div className="bg-slate-300/50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Year</p>
              <p className="text-xl font-bold text-slate-950 dark:text-slate-50">{car.year}</p>
            </div>
            <div className="bg-slate-300/50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Color</p>
              <p className="text-xl font-bold text-slate-950 dark:text-slate-50">Pending feature</p>
            </div>
            <div className="bg-slate-300/50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Body style</p>
              <p className="text-xl font-bold text-slate-950 dark:text-slate-50">pending feature</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"></div>

      </div>
  );
};
