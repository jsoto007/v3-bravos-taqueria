import React from "react";


export default function CompletedInventoryCard({ inventory }) {
    if (!inventory) return null;

    return (
        <div className="flex flex-col items-center bg-white dark:bg-gray-800/30 shadow-md rounded-lg transition-colors duration-300 pt-2 mt-4 px-4 py-3 w-full sm:w-auto">
            <p className="text-gray-700 text-sm dark:text-gray-300 mb-1">Date</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-white mb-2">
                {inventory.created_at ? new Date(inventory.created_at).toLocaleDateString() : "Unknown date"}
            </p>
            <p className="text-gray-700 text-sm dark:text-gray-300 mb-1">Total Cars</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-white">
                {inventory.car_inventories?.length ?? 0}
            </p>
            <p className="text-gray-700 text-sm dark:text-gray-300 mb-1">Done By</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-white">
                {inventory.user.email}
            </p>
        </div>
    );
}


