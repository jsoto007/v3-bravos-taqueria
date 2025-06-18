import React, { useState, useEffect } from 'react';
import PhotosPopUpMenu from './PhotosPopUpMenu';



const PhotoGallery = ( { carInventory } ) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const handlePhotoClick = () => setIsFullscreen(true);
  const handleClose = () => setIsFullscreen(false);
  // const photos = carInventory.photos.map(photo => photo.url);
  const photos = carInventory.photos.map(
    photo => `${import.meta.env.VITE_BACKEND_URL}${photo.url}`
  );

  console.log("Photos", carInventory.photos)


  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // swipe left
      setSelectedIndex((selectedIndex + 1) % photos.length);
    } else if (distance < -minSwipeDistance) {
      // swipe right
      setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length);
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };
  
  console.log("PHOTOS:", carInventory.photos[selectedIndex])

  return (
    <>
      <div className="flex flex-col items-center justify-center py-4 px-2 bg-white dark:bg-gray-900 rounded-md">
        <div className="mb-4 w-full">
          <div className="w-full flex justify-end">
            <PhotosPopUpMenu 
              carInventoryId={carInventory.id} 
              selectedPhoto={carInventory.photos[selectedIndex]}
            />
          </div>
          <div className="w-full h-48 flex items-center justify-center">
            <img
              src={photos[selectedIndex]}
              alt={`Selected Photo`}
              className="h-full object-contain rounded shadow-lg transition-all duration-500 cursor-pointer"
              onClick={handlePhotoClick}
            />
          </div>
        </div>
        <div className="flex overflow-x-auto space-x-4 pb-2">
          {photos.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`Thumbnail ${index + 1}`}
              className={`w-24 h-16 object-cover rounded cursor-pointer border-2 transition duration-300 ${
                index === selectedIndex
                  ? 'border-blue-500 dark:border-blue-300'
                  : 'border-transparent'
              }`}
              onClick={() => setSelectedIndex(index)}
            />
          ))}
        </div>
      </div>
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <button
            className="absolute top-4 right-4 text-white text-2xl z-20"
            onClick={handleClose}
          >
            &times;
          </button>
          <div
            className="relative w-full h-full flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10"
              onClick={() => setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length)}
            />
            <div
              className="absolute right-0 top-0 w-1/2 h-full cursor-pointer z-10"
              onClick={() => setSelectedIndex((selectedIndex + 1) % photos.length)}
            />
            <img
              src={photos[selectedIndex]}
              alt={`Fullscreen Photo`}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded z-20"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default PhotoGallery;