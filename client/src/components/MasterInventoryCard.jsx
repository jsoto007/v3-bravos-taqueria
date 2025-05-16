export default function MasterInventoryCard( { onInventory } ) {

    return (
       

        <div class="relative overflow-x-auto mt-6 rounded-md">

            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-6 py-3">
                            Make & Year
                        </th>
                        <th scope="col" class="px-6 py-3">
                            VIN
                        </th>
                        <th scope="col" class="px-6 py-3">
                            Location
                        </th>
                        <th scope="col" class="px-6 py-3">
                            Price
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {onInventory?.map((car) => (
                            <tr key={car.id} class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                            <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {car.make} {car.year}
                            </th>
                            <td class="px-6 py-4">
                                {car.vin_number}
                            </td>
                            <td class="px-6 py-4">
                                {car.location}
                            </td>
                            <td class="px-6 py-4">
                                ${car.purchase_price}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

      )
}