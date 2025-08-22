import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarDataContext } from "../../context/CarDataContextProvider";
import { UserContext } from "../../context/UserContextProvider";


export default function CompletedInventoryCard() {
  const { carData } = useContext(CarDataContext);
  const { currentUser } = useContext(UserContext);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  console.log(carData)
  const events = carData
    ? carData.flatMap(({ vin, history, id }) =>
        history.map(({ created_at, location, user }) => ({
          vin,
          id,
          user,
          location,
          created_at,
        }))
      )
    : [];

  console.log(currentUser)

  const latestByVin = new Map();
  events.forEach((event) => {
    const existing = latestByVin.get(event.vin);
    if (!existing || new Date(event.created_at) > new Date(existing.created_at)) {
      latestByVin.set(event.vin, event);
    }
  });

  const latestEvents = Array.from(latestByVin.values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const filteredEvents = latestEvents.filter(({ vin, year, make }) => {
    const term = searchTerm.toLowerCase();
    return (
      vin.toLowerCase().includes(term) ||
      (year && year.toString().includes(term)) ||
      (make && make.toLowerCase().includes(term))
    );
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 outline outline-white/15 lg:rounded-tl-[2rem] rounded-t-lg rounded-b-xl overflow-hidden">
      <div className="p-4">
        <input
          type="text"
          placeholder="Search by VIN, year, or make"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>

      <div className="overflow-y-auto max-h-[400px] sm:max-h-[500px]">
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
              {filteredEvents.map((item, index) => {
                const addressParts = item.location?.split(" ") || [];
                const number = addressParts[0] || "";
                const street = addressParts.slice(1, 3).join(" ") || "";
              return (
                <tr
                  key={item.id}
                  onClick={() => {
                    if (currentUser?.admin) {
                      navigate(`/cars/${item.id}`);
                    }
                  }}
                  className={currentUser?.admin ? "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" : ""}
                >
                  <td className="px-4 py-2">{item.vin}</td>
                  <td className="px-4 py-2">{`${number} ${street}`}</td>
                  <td className="px-4 py-2">{item.user?.split("@")[0]}</td>
                  <td className="px-4 py-2">{formatDate(item.created_at)}</td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}