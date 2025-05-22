

export default function AdminInventoryReviewDisplay( { error, matchingCars, userInventory } ) {

    return (
        <div className="p-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 min-h-screen">
            {error && <p className="text-red-500">Error: {error}</p>}
            {userInventory ? (
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold mb-2">Delta: cars in the master inventory which were not accounted for in the user's inventory</h2>
                        <ul className="list-disc list-inside space-y-1">
                            {matchingCars.map((car) => (
                                <li key={car.id} className="ml-4">{car.vin} {car.make}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-2">User's Inventory: all cars in the given user's inventory</h2>
                        <ul className="list-disc list-inside space-y-1">
                            {userInventory.cars?.map((car) => (
                                <li key={car.id} className="ml-4">{car.vin} {car.make}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                !error && <p className="text-gray-700 dark:text-gray-300">Loading...</p>
            )}
        </div>
    );
}