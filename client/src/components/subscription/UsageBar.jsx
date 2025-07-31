import React from 'react';

const colorMap = {
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
};

export default function UsageBar({ used, limit, color = 'purple' }) {
  const percentage = (used / limit) * 100;
  const clamped = Math.min(percentage, 100);
  const barColor = colorMap[color] || colorMap.purple;

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
