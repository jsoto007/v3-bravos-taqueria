export default function AdminInventoryReviewDisplay( { error, matchingCars, userInventory } ) {

    const userInventoryVINs = new Set(userInventory?.cars?.map(car => car.vin));
    const unmatchedCars = matchingCars.filter(car => !userInventoryVINs.has(car.vin));

    return (
        <div className="p-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 min-h-screen">
            {error && <p className="text-red-500">Error: {error}</p>}
            {userInventory ? (
                <div className="space-y-8">
                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <caption className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                                Delta
                                <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                                    Cars in the master inventory which were not accounted for in the user's inventory.
                                </p>
                            </caption>
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">VIN</th>
                                    <th scope="col" className="px-6 py-3">Make</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unmatchedCars.map((car) => (
                                    <tr key={car.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                            {car.vin}
                                        </th>
                                        <td className="px-6 py-4">
                                            {car.make}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <caption className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                                User's Inventory
                                <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                                    All cars in the given user's inventory.
                                </p>
                            </caption>
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">VIN</th>
                                    <th scope="col" className="px-6 py-3">Make</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userInventory?.cars?.map((car) => (
                                    <tr key={car.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                            {car.vin}
                                        </th>
                                        <td className="px-6 py-4">
                                            {car.make}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                !error && <p className="text-gray-700 dark:text-gray-300">Loading...</p>
            )}
        </div>
    );
}
