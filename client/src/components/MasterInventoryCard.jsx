import { useNavigate } from 'react-router-dom';

// Shows table for admin inventory
export default function MasterInventoryCard( { onInventory } ) {
    const navigate = useNavigate();

    return (

        <div className="relative overflow-x-auto mt-6 rounded-md">

            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            Make & Year
                        </th>
                        <th scope="col" className="px-6 py-3">
                            VIN
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Location
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Price
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {onInventory?.map((car) => (
                            <tr
                              key={car.id}
                              onClick={() => navigate(`/master_inventory/${car.id}`)}
                              className="cursor-pointer bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {car.make} {car.year}
                            </th>
                            <td className="px-6 py-4">
                                {car.vin_number}
                            </td>
                            <td className="px-6 py-4">
                                {car.location}
                            </td>
                            <td className="px-6 py-4">
                                ${car.purchase_price}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

      )
}

