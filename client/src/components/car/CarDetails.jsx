import React, { useState } from 'react';
import { Car, Trash2, KeySquare } from 'lucide-react';

export default function CarDetails() {
  // Sample car data
  const [carData, setCarData] = useState({
    vin: 'JH4KA8260MC000000',
    make: 'Honda',
    model: 'Accord',
    year: 2021,
    color: 'Silver',
    mileage: 45000,
    owner: 'John Smith'
  });

  // Notes state
  const [notes, setNotes] = useState([
    { id: 1, text: 'Oil change due at 50,000 miles', createdAt: '2024-08-15T10:30:00Z' },
    { id: 2, text: 'Minor scratch on rear bumper', createdAt: '2024-08-10T14:20:00Z' },
  ]);

  // Scan history state
  const [scanHistory, setScanHistory] = useState([
    { id: 1, vin: 'JH4KA8260MC000000', location: 'Main Street Garage', user: 'Mike Johnson', dateTime: '2024-08-17T09:15:00Z' },
    { id: 2, vin: 'JH4KA8260MC000000', location: 'Downtown Service Center', user: 'Sarah Wilson', dateTime: '2024-08-16T16:45:00Z' },
    { id: 3, vin: 'JH4KA8260MC000000', location: 'Express Auto Check', user: 'David Brown', dateTime: '2024-08-15T11:30:00Z' },
  ]);

  // UI state
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [editText, setEditText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Note operations
  const addNote = () => {
    if (newNote.trim()) {
      const note = {
        id: Date.now(),
        text: newNote.trim(),
        createdAt: new Date().toISOString()
      };
      setNotes([note, ...notes]);
      setNewNote('');
    }
  };

  const startEdit = (note) => {
    setEditingNote(note.id);
    setEditText(note.text);
  };

  const saveEdit = () => {
    setNotes(notes.map(note => 
      note.id === editingNote 
        ? { ...note, text: editText }
        : note
    ));
    setEditingNote(null);
    setEditText('');
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const deleteCar = () => {
    // Reset all data
    setCarData(null);
    setNotes([]);
    setScanHistory([]);
    setShowDeleteConfirm(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // If car is deleted, show empty state
  if (!carData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 dark:bg-[#121A2A] p-6 flex items-center justify-center">
        <div className="text-center">
          <KeySquare className="mx-auto h-16 w-16 text-slate-500 dark:text-slate-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-50 mb-2">No Car Data</h2>
          <p className="text-slate-500 dark:text-slate-400">The car and all associated data have been deleted.</p>
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
                <p className="text-slate-700 dark:text-slate-200 text-2xl font-bold font-mono"><span className='dark:text-slate-400 text-slate-400'>VIN:</span> {carData.vin}</p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1 rounded hover:bg-slate-700 text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Car Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-slate-300/50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Make & Model</p>
              <p className="text-xl font-bold text-slate-950 dark:text-slate-50">{carData.make} {carData.model}</p>
            </div>
            <div className="bg-slate-300/50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Year</p>
              <p className="text-xl font-bold text-slate-950 dark:text-slate-50">{carData.year}</p>
            </div>
            <div className="bg-slate-300/50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Color</p>
              <p className="text-xl font-bold text-slate-950 dark:text-slate-50">{carData.color}</p>
            </div>
            <div className="bg-slate-300/50 dark:bg-slate-800 p-4 rounded-xl">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Mileage</p>
              <p className="text-xl font-bold text-slate-950 dark:text-slate-50">{carData.mileage.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"></div>

      </div>
  );
};
