
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Save, X } from 'lucide-react';

export default function AssignedLocations() {
  const [locations, setLocations] = useState([
    { id: 1, name: 'Los Angeles Lot', longitude: -118.2437, latitude: 34.0522 },
    { id: 2, name: 'New York Facility', longitude: -74.0060, latitude: 40.7128 },
    { id: 3, name: 'Chicago Warehouse', longitude: -87.6298, latitude: 41.8781 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    longitude: '',
    latitude: ''
  });
  const [errors, setErrors] = useState({});

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Location name is required';
    }
    
    const longitude = parseFloat(formData.longitude);
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      newErrors.longitude = 'Longitude must be a number between -180 and 180';
    }
    
    const latitude = parseFloat(formData.latitude);
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      newErrors.latitude = 'Latitude must be a number between -90 and 90';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Open modal for adding new location
  const handleAddLocation = () => {
    setEditingLocation(null);
    setFormData({ name: '', longitude: '', latitude: '' });
    setErrors({});
    setIsModalOpen(true);
  };

  // Open modal for editing existing location
  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      longitude: location.longitude.toString(),
      latitude: location.latitude.toString()
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Save location (add or update)
  const handleSaveLocation = () => {
    if (!validateForm()) return;

    const locationData = {
      name: formData.name.trim(),
      longitude: parseFloat(formData.longitude),
      latitude: parseFloat(formData.latitude)
    };

    if (editingLocation) {
      // Update existing location
      setLocations(prev => 
        prev.map(loc => 
          loc.id === editingLocation.id 
            ? { ...loc, ...locationData }
            : loc
        )
      );
    } else {
      // Add new location
      const newLocation = {
        id: Math.max(...locations.map(l => l.id), 0) + 1,
        ...locationData
      };
      setLocations(prev => [...prev, newLocation]);
    }

    setIsModalOpen(false);
    setFormData({ name: '', longitude: '', latitude: '' });
    setEditingLocation(null);
    setErrors({});
  };

  // Delete location
  const handleDeleteLocation = (locationId) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      setLocations(prev => prev.filter(loc => loc.id !== locationId));
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', longitude: '', latitude: '' });
    setEditingLocation(null);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Designated Locations</h1>
            <p className="text-gray-400">Manage your group's designated locations</p>
          </div>
          <button
            onClick={handleAddLocation}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add Location
          </button>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <div
              key={location.id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="text-yellow-500" size={20} />
                  <h3 className="text-xl font-semibold">{location.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditLocation(location)}
                    className="text-gray-400 hover:text-yellow-500 transition-colors"
                    title="Edit location"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteLocation(location.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete location"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Longitude:</span>
                  <span className="text-gray-200">{location.longitude}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Latitude:</span>
                  <span className="text-gray-200">{location.latitude}°</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => window.open(`https://maps.google.com/?q=${location.latitude},${location.longitude}`, '_blank')}
                  className="text-yellow-500 hover:text-yellow-400 text-sm font-medium transition-colors"
                >
                  View on Maps →
                </button>
              </div>
            </div>
          ))}
        </div>

        {locations.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No locations yet</h3>
            <p className="text-gray-500 mb-6">Add your first designated location to get started</p>
            <button
              onClick={handleAddLocation}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-lg font-semibold flex items-center gap-2 mx-auto transition-colors"
            >
              <Plus size={20} />
              Add First Location
            </button>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {editingLocation ? 'Edit Location' : 'Add New Location'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Location Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Enter location name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Longitude */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Longitude * <span className="text-gray-500">(-180 to 180)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      errors.longitude ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="e.g., -118.2437"
                    min="-180"
                    max="180"
                  />
                  {errors.longitude && <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>}
                </div>

                {/* Latitude */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Latitude * <span className="text-gray-500">(-90 to 90)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      errors.latitude ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="e.g., 34.0522"
                    min="-90"
                    max="90"
                  />
                  {errors.latitude && <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLocation}
                    className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-md flex items-center justify-center gap-2 transition-colors"
                  >
                    <Save size={18} />
                    {editingLocation ? 'Update' : 'Add'} Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


