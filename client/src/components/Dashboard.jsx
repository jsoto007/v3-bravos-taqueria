import { useState, useEffect } from "react";
import CarsCart from "./CarsCart";

export default function Dashboard() {
  const [user, setUser] = useState([]);

  useEffect(() => {
    fetch("/api/birds")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch birds");
        return r.json();
      })
      .then((data) => setUser(data))
      .catch((error) => console.error("Fetch error:", error));
  }, []);


  return (
    <div className="text-black">
      <h1>Hello from the dashboard</h1>
      <h2>This is a fetch from the server</h2>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      {user.length > 0 ? (
        <ul>
          {user.map((bird, index) => (
            <li key={index}>{bird.name}</li>
          ))}
        </ul>
      ) : (
        <p>No birds found.</p>
      )}
    </div>
  );
}