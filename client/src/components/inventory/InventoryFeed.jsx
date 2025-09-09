import React, { useContext } from "react"
import { CarDataContext } from "../../context/CarDataContextProvider"


export default function InventoryFeed() {
  const { carData } = useContext(CarDataContext);

  const events = carData
  ? carData.flatMap(({ vin, history, id }) =>
    history.map(({ created_at, location, user, firstname, lastname, designated_location }) => ({
      vin,
      id,
      user,
      location,
      created_at,
      firstname,
      lastname,
      designated_location,
    }))
  )
: [];


  const latestByVin = new Map();
  events.forEach(event => {
    const existing = latestByVin.get(event.vin);
    if (!existing || new Date(event.created_at) > new Date(existing.created_at)) {
      latestByVin.set(event.vin, event);
    }
  });


  const latestEvents = Array.from(latestByVin.values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flow-root w-full px-2 sm:px-4 mt-4 font-mono max-h-[500px] overflow-y-auto">
      <p className="font-bold py-2">Recent Scans</p>
      <ul role="list" className="-mb-8 w-full">
        {latestEvents.length === 0 && (
          <li className="text-gray-500 dark:text-gray-400">No recent scans available.</li>
        )}
        {latestEvents.map((event, idx) => (
          <li key={`${event.vin}-${idx}`}>
            <div className="relative pb-8">
              {idx !== latestEvents.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                <span className="inline-block size-8 rounded-full overflow-hidden ring-8 ring-slate-200 dark:ring-gray-900 flex items-center justify-center">
                <span className="text-2xl leading-none">📍</span>
                </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">{event.firstname} {event.lastname ? event.lastname[0] + '.' : ''}</span> conducted inventory for VIN{' '}
                      <span className="font-medium text-gray-900 dark:text-white">{event.vin}</span> at{' '}
                      <span className="font-medium text-gray-900 dark:text-white">{event.designated_location || event.location}</span>.
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                    <time dateTime={event.created_at}>{formatDate(event.created_at)}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

