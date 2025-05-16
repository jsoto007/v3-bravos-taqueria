

import React, { useState } from 'react';

const photos = [
  'https://hips.hearstapps.com/hmg-prod/images/2025-aston-martin-valhalla-105-6757330eaad2c.jpg?crop=0.726xw:0.725xh;0.117xw,0.129xh&resize=980:*',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2wU0MspuIezt2upcHp2i8PoEmfQVSVTxPa6SAVaoIpJmGApVJOjkqHNpIycruMAbZ3qY&usqp=CAU',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZQHcL2gekIv5WR2fO3PXdcqzsd8biwzVWAaJKty7iXoySm145-53YVqpQE2JfdsiNMKw&usqp=CAU',
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBx...'
];

const PhotoGallery = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center py-4 px-2 bg-white dark:bg-gray-900">
      <div className="mb-4">
        <div className="w-full h-48 flex items-center justify-center">
          <img
            src={photos[selectedIndex]}
            alt={`Selected Photo`}
            className="h-full object-contain rounded shadow-lg transition-all duration-500"
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
  );
}

export default PhotoGallery;