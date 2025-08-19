import { useState, useEffect } from "react";

export default function CarNotes() {
  const [carNotes, setCarNotes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/car_notes")
      .then(resp => {
        if (!resp.ok) throw new Error("Failed to fetch car notes");
        return resp.json();
      })
      .then(notes => setCarNotes(notes))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p className="text-red-500 mt-20">Error: {error}</p>;

  console.log("Car Notes", carNotes)

  return (
    <>
      {carNotes.length === 0 ? (
        <p>No notes available.</p>
      ) : (
        <ul className="mt-20 text-white">
          {carNotes.map(note => (
            <li key={note.id}>{note.content}</li>
          ))}
        </ul>
      )}
    </>
  );
}