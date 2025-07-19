import React, { useContext } from "react";
import { CarDataContext } from "../../context/CarDataContextProvider";

export default function CompletedInventoryCard() {

    const { carData } = useContext(CarDataContext)
    
  const events = carData
    ? carData.flatMap(({ vin, history }) =>
        history.map(({ created_at, location, user }) => ({
          vin,
          user,
          location,
          created_at,
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

    console.log(carData)
    return (
      <div className="w-full bg-gray-100 dark:bg-gray-800 outline outline-white/15 lg:rounded-tl-[2rem] rounded-t-lg rounded-b-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left font-mono divide-y-6 divide-gray-400 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2">VIN</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-200/30">
              {latestEvents.map((item, index) => {
                const addressParts = item.location?.split(" ") || [];
                const number = addressParts[0] || "";
                const street = addressParts.slice(1, 3).join(" ") || "";
                return (
                  <tr key={index}>
                    <td className="px-4 py-2">{item.vin}</td>
                    <td className="px-4 py-2">{`${number} ${street}`}</td>
                    <td className="px-4 py-2">{item.user?.split('@')[0]}</td>
                    <td className="px-4 py-2">{formatDate(item.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
