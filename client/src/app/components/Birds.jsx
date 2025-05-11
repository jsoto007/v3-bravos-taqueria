'use client'
import React, { useEffect, useState } from "react"

export default function Birds() {
    const [birds, setBirds] = useState()

    useEffect(() => {
        fetch("/birds")
          .then((r) => r.json())
          .then((birdsArray) => {
            setBirds(birdsArray);
          });
      }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Birds List</h1>
            {birds ? (
                <ul className="space-y-2">
                    {birds.map((bird, index) => (
                        <li key={index} className="bg-blue-100 p-4 rounded shadow">
                            {bird.name}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">Loading...</p>
            )}
        </div>
    )
}