import React, { useState, useContext } from 'react';
import { Trash, KeySquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CarDataContext } from '../../context/CarDataContextProvider';

export default function CarDetails( { car, setCar } ) {

  const { setCarData } = useContext(CarDataContext);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  const deleteCar = async () => {
    try {
      const res = await fetch(`/api/cars_inventory/${car.id}`, { method: "DELETE" });
      if (res.ok) {
        setCarData(prev => prev.filter(c => c.id !== car.id));
        setShowDeleteConfirm(false);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Failed to delete car", err);
    }
  };

  return (
      <div className="max-w-auto mx-auto">
        <div className="bg-white dark:bg-[#1A2235] rounded-2xl shadow-xl mb-8 border border-slate-300 dark:border-slate-700">
          <div className="h-1 w-[97%] md:w-[99%] mx-auto bg-gradient-to-r from-indigo-800 to-cyan-400 rounded-t-2xl"></div>
          <div className="flex items-center justify-between mb-6 ml-2">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-600/90 dark:bg-indigo-500/90 rounded-xl">
                <KeySquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-slate-700 dark:text-slate-200 text-xl md:text-2xl font-bold font-mono mt-4">
                  <span className='dark:text-slate-300 text-slate-500'></span> {car?.vin_number || "No data"}
                </p>
                <p className='text-slate-500 text-md font-serif'>Vehicle Identification Number</p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-500/40 dark:bg-red-500/20 p-2 rounded-lg flex items-center justify-center mr-2"
            >
              <Trash className="h-4 w-4 text-slate-900 dark:text-white" />
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

        <div className="flex flex-col gap-2 w-full ml-2">
            <div className="p-2 rounded-xl">
              <p className="text-slate-500 text-sm font-medium">MAKE & MODEL</p>
              <p className="text-xl font-bold text-slate-950 dark:text-slate-50">{car?.make || "No data"}</p>
            </div>
            <div className="p-2 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">YEAR</p>
              <p className="text-xl font-bold text-slate-950 dark:text-slate-50">{car?.year || "No data"}</p>
            </div>  
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"></div>

      </div>
  );
};
