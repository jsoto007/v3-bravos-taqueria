import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid'

const stats = [
  { name: 'Total Cars in Inventory', stat: '220', previousStat: '240', change: '8.3%', changeType: 'decrease' },
  { name: 'Total Cars Sold This Month', stat: '45', previousStat: '30', change: '50%', changeType: 'increase' },
  { name: 'Sales Rate', stat: '20.45%', previousStat: '12.50%', change: '7.95%', changeType: 'increase' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function InventoryOverviewCard() {
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
                <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">from {item.previousStat}</span>
              </div>

              <div
                className={classNames(
                  item.changeType === 'increase'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                  'inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0',
                )}
              >
                {item.changeType === 'increase' ? (
                  <ArrowUpIcon aria-hidden="true" className="-ml-1 mr-0.5 size-5 shrink-0 self-center text-green-500" />
                ) : (
                  <ArrowDownIcon aria-hidden="true" className="-ml-1 mr-0.5 size-5 shrink-0 self-center text-red-500" />
                )}

                <span className="sr-only"> {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by </span>
                {item.change}
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
