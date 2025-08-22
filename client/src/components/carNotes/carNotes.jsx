import { Edit3, Plus, X, Trash2, CheckCheck, Check } from "lucide-react";
import { useState, useEffect } from "react";

export default function CarNotes( { notes, car } ) {


  const [carNotes, setCarNotes] = useState([]);
  const [error, setError] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [editText, setEditText] = useState("");


  useEffect(() => {
    fetch("/api/car_notes")
      .then(resp => {
        if (!resp.ok) throw new Error("Failed to fetch car notes");
        return resp.json();
      })
      .then(notes => setCarNotes(notes))
      .catch(err => setError(err.message));
  }, []);


  // Helper to format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }

  // Add a new note
  function addNote() {
    if (!newNote.trim()) return;
    fetch("/api/car_notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ car_inventory_id: car?.id, content: newNote })
    })
    .then(resp => {
      if (!resp.ok) throw new Error("Failed to add note");
      return resp.json();
    })
    .then(note => {
      setCarNotes([note, ...carNotes]);
      setNewNote("");
    })
    .catch(err => setError(err.message));
  }

  // Start editing a note
  function startEdit(note) {
    setEditingNote(note.id);
    setEditText(note.content);
  }

  // Save edited note
  function saveEdit(noteId) {
    fetch(`/api/car_notes/${noteId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content: editText })
    })
    .then(resp => {
      if (!resp.ok) throw new Error("Failed to update note");
      return resp.json();
    })
    .then(updatedNote => {
      setCarNotes(carNotes.map(n =>
        n.id === noteId ? updatedNote : n
      ));
      setEditingNote(null);
      setEditText("");
    })
    .catch(err => setError(err.message));
  }

  // Delete note
  function deleteNote(noteId) {
    fetch(`/api/car_notes/${noteId}`, {
      method: "DELETE"
    })
    .then(resp => {
      if (!resp.ok) throw new Error("Failed to delete note");
      setCarNotes(carNotes.filter(n => n.id !== noteId));
    })
    .catch(err => setError(err.message));
  }

  if (error) return <p className="text-red-500 mt-20">Error: {error}</p>;

  return (
    <div className="max-w-auto mx-auto p-6 bg-white dark:bg-[#1A2235] border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg max-h-[600px] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-950 dark:text-slate-50 flex items-center gap-2">
        <span>Car Notes</span>
      </h2>
      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 px-3 py-2 rounded bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-50 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500"
          type="text"
          placeholder="Add a new note..."
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") addNote(); }}
        />
        <button
          className="p-2 rounded bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white flex items-center"
          onClick={addNote}
          aria-label="Add note"
        >
          <Plus size={18} />
        </button>
      </div>
      {carNotes.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-center">No notes available.</p>
      ) : (
        <ul className="space-y-4">
          {carNotes.map(note => (
            <li
              key={note.id}
              className="flex items-start bg-slate-200 dark:bg-slate-800 rounded p-4 shadow group"
            >
              <div className="flex-1">
                {editingNote === note.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      className="px-2 py-1 rounded bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-50 border border-slate-300 dark:border-slate-700 focus:outline-none"
                      type="text"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(note.id); }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white flex items-center"
                        onClick={() => saveEdit(note.id)}
                        aria-label="Save"
                      >
                        <Check size={16}/>
                      </button>
                      <button
                        className="p-1 font-bold ml-2 rounded bg-slate-400 dark:bg-slate-700 text-white flex items-center"
                        onClick={() => { setEditingNote(null); setEditText(""); }}
                        aria-label="Cancel"
                      >
                        <X Can size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-950 dark:text-slate-50">{note.content}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatDate(note.created_at)}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 ml-4 mt-1 opacity-70 group-hover:opacity-100">
                {editingNote !== note.id && (
                  <>
                    <button
                      className="p-1 rounded hover:bg-slate-700 text-indigo-600 dark:text-indigo-500"
                      onClick={() => startEdit(note)}
                      aria-label="Edit"
                    >
                      <Edit3 size={16} /> 
                    </button>
                    <button
                      className="p-1 rounded hover:bg-slate-700 text-red-400"
                      onClick={() => deleteNote(note.id)}
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}