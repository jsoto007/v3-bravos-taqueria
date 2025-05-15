

export default function MasterInventoryCard( { onInventory } ) {

    return (
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">Cars Inventory</h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                A list of all the cars in your account including their model, VIN, Location and the user who uploaded the car.
              </p>
            </div>
          </div>
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-3">
                        Make & Year
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                        VIN
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Location
                      </th>

                    </tr>
                  </thead>
                    <tbody className="bg-white dark:bg-gray-900">
                        {onInventory?.map((car) => (
                            <tr key={car.id} className="even:bg-gray-50 dark:even:bg-gray-800">
                            <td className="whitespace-nowrap py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                {car.make} {car.year}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-300">{car.vin_number}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-300">{car.location}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 dark:text-gray-300">{car.uploaded_by}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )
}