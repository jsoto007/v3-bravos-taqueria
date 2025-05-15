import React from "react";


export default function CompletedInventoryCard({ inventory }) {
    if (!inventory) return null;

    return (
        <div className="flex items-center justify-center bg-white dark:bg-gray-800/30 shadow-md rounded-lg p-4 transition-colors duration-300 mt-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mr-6">
                Inventory #{inventory.id ?? "N/A"}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-1 mr-6">
                Completed: {inventory.created_at ? new Date(inventory.created_at).toLocaleDateString() : "Unknown date"}
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
                Total Cars: {inventory.car_inventories?.length ?? 0}
            </p>
        </div>
    );
}

