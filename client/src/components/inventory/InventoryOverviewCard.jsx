import { useContext } from 'react'
import { CarDataContext } from '../../context/CarDataContextProvider'
import { UserContext } from '../../context/UserContextProvider'

// function classNames(...classes) {
//   return classes.filter(Boolean).join(' ')
// }

export default function InventoryOverviewCard() {
  const { carData } = useContext(CarDataContext)
  const { currentUser } = useContext(UserContext)

  const now = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(now.getDate() - 30)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(now.getDate() - 7)

  // Flatten all scan history entries from all cars
  const allScans = carData.flatMap(car => car.history || [])

  const totalCars = new Set(carData.map(car => car.vin)).size
  const newCars = new Set(
    carData.filter(car => new Date(car.created_at) >= thirtyDaysAgo).map(car => car.vin)
  ).size
  const totalScans = allScans.filter(scan => new Date(scan.created_at) >= thirtyDaysAgo).length
  const totalScansThisWeek = allScans.filter(scan => new Date(scan.created_at) >= sevenDaysAgo).length

  console.log(carData)
  const stats = currentUser?.admin
    ? [
        { name: 'Total Cars in Inventory', stat: totalCars },
        { name: 'New Cars Added This Month', stat: newCars },
        { name: 'Total Scans in Past 30 Days', stat: totalScans },
      ]
    : [
        { name: 'Total Scans in Past 30 Days', stat: totalScans },
        { name: 'Total Scans in Past 7 Days', stat: totalScansThisWeek },
      ]

  return (
    <div>
      <h3 className="text-base mt-4 font-mono font-semibold text-gray-900 dark:text-gray-100">Last 30 days</h3>
      <dl className="mt-5 grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-900">
        {stats.map((item) => (
          <div key={item.name} className="px-4 py-5 sm:p-6">
            <dt className="text-base font-normal text-gray-900 dark:text-gray-100">{item.name}</dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                {item.stat}
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
