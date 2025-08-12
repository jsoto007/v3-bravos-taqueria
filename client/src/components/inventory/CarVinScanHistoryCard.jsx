
import React from 'react';
import { Calendar, MapPin, User, KeySquare } from 'lucide-react';

// const CarVINScanner = ({ selectedCar, scanHistory }) => {

export default function CarVinScanHistoryCard( { selectedCar, scanHistory } ) {


  // Default props if not provided
  const defaultCar = {
    vin: '1HGCM82633A123456',
    make: 'Honda',
    model: 'Accord',
    year: '2023'
  };

  const defaultScanHistory = [
    {
      id: 1,
      user: 'John Smith',
      location: 'Los Angeles, CA',
      dateTime: '2024-08-12 09:30:15'
    },
    {
      id: 2,
      user: 'Sarah Johnson',
      location: 'San Francisco, CA',
      dateTime: '2024-08-10 14:22:08'
    },
    {
      id: 3,
      user: 'Mike Davis',
      location: 'Sacramento, CA',
      dateTime: '2024-08-08 11:15:33'
    },
    {
      id: 4,
      user: 'Emily Wilson',
      location: 'Oakland, CA',
      dateTime: '2024-08-05 16:45:22'
    },
    {
      id: 5,
      user: 'Robert Brown',
      location: 'San Jose, CA',
      dateTime: '2024-08-03 13:12:45'
    }
  ];

  const car = selectedCar || defaultCar;
  const history = scanHistory || defaultScanHistory;

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    };
  };

  return (
    <div className="mt-20 max-w-auto mx-auto p-6 bg-white dark:bg-gray-900 rounded-md">
      {/* VIN Information Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 mb-8 border border-blue-200 dark:border-gray-600">
        <div className="flex items-center gap-3 mb-4">
          <KeySquare className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Vehicle Information</h1>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">VIN Number</label>
              <div className="mt-1 p-3 bg-white dark:bg-gray-800 rounded-md border-2 border-blue-300 font-mono text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 tracking-wider break-all">
                {car.vin}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Year</label>
                <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded-md border font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
                  {car.year}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Make</label>
                <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded-md border font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
                  {car.make}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Model</label>
                <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded-md border font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
                  {car.model}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scan History Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
            Scan History
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total scans: {history.length}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User
                  </div>
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date & Time
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((scan, index) => {
                const { date, time } = formatDateTime(scan.dateTime);
                return (
                  <tr 
                    key={scan.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index === 0 ? 'bg-blue-50 dark:bg-gray-900' : ''}`}
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                            {scan.user}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">{scan.location}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        <div className="font-medium">{date}</div>
                        <div className="text-gray-500 dark:text-gray-400">{time}</div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {history.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No scan history available</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Scans will appear here once the vehicle is inspected</p>
          </div>
        )}
      </div>
    </div>
  );
};
