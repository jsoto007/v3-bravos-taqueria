

const timeline = [
  {
    id: 1,
    username: 'John Doe',
    vin: '1HGCM82633A004352',
    location: 'Lot A',
    date: 'Jul 17',
    datetime: '2025-07-18',
    userImage: '../../../public/logo.png',
  },
  {
    id: 2,
    username: 'Maria Smith',
    vin: 'WDBJF65JX1B123456',
    location: 'Garage B',
    date: 'Jul 18',
    datetime: '2025-07-18',
    userImage: '../../../public/logo.png',
  },
  {
    id: 3,
    username: 'Maria Smith',
    vin: 'WDBJF65JX1B123456',
    location: 'Garage B',
    date: 'Jul 18',
    datetime: '2025-07-17',
    userImage: '../../../public/logo.png',
  },
  {
    id: 4,
    username: 'Maria Smith',
    vin: 'WDBJF65JX1B123456',
    location: 'Garage B',
    date: 'Jul 18',
    datetime: '2025-07-17',
    userImage: '../../../public/logo.png',
  },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function InventoryFeed() {
  return (
    <div className="flow-root w-full px-2 sm:px-4 mt-4 font-mono">
        <p>Recent Scans</p>
      <ul role="list" className="-mb-8 w-full">
        {timeline.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== timeline.length - 1 ? (
                <span aria-hidden="true" className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="inline-block size-8 rounded-full overflow-hidden ring-8 ring-white dark:ring-gray-900">
                    <img src={event.userImage} alt={event.username} className="h-full w-full object-cover" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">{event.username}</span> conducted inventory for VIN <span className="font-medium text-gray-900 dark:text-white">{event.vin}</span> at <span className="font-medium text-gray-900 dark:text-white">{event.location}</span>.
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                    <time dateTime={event.datetime}>{event.date}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
