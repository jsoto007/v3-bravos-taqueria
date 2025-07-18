const people = [
    {
      name: 'Lindsay Walton',
      title: 'Front-end Developer',
      department: 'Optimization',
      email: 'lindsay.walton@example.com',
      role: 'Member',
      image:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
      name: 'Courtney Henry',
      title: 'Designer',
      department: 'Intranet',
      email: 'courtney.henry@example.com',
      role: 'Admin',
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
      name: 'Tom Cook',
      title: 'Director of Product',
      department: 'Directives',
      email: 'tom.cook@example.com',
      role: 'Member',
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
      name: 'Whitney Francis',
      title: 'Copywriter',
      department: 'Program',
      email: 'whitney.francis@example.com',
      role: 'Admin',
      image:
        'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
      name: 'Leonard Krasner',
      title: 'Senior Designer',
      department: 'Mobility',
      email: 'leonard.krasner@example.com',
      role: 'Owner',
      image:
        'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
      name: 'Floyd Miles',
      title: 'Principal Designer',
      department: 'Security',
      email: 'floyd.miles@example.com',
      role: 'Member',
      image:
        'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  ]
  
  export default function CompletedInventoryCard() {
    return (
      <div className="px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden rounded-lg">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">Users</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              A list of all the users in your account including their name, title, email and role.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              className="block rounded-md bg-indigo-600 dark:bg-indigo-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-400"
            >
              Add user
            </button>
          </div>
        </div>
        <div className="mt-8 flow-root rounded-xl">
          <div className="overflow-x-auto w-full">
            <div className="inline-block min-w-full align-middle sm:px-6 lg:px-8">
              <table className="min-w-full table-auto divide-y divide-gray-300 dark:divide-gray-600 rounded-xl">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-2 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white sm:pl-0">
                      Name
                    </th>
                    <th scope="col" className="px-2 sm:px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      Title
                    </th>
                    <th scope="col" className="px-2 sm:px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                
                  </tr>
                </thead>
             <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                  {people.map((person) => (
                    <tr key={person.email}>
                      <td className="whitespace-nowrap py-3 sm:py-5 pl-4 pr-2 text-xs sm:text-sm sm:pl-0">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="font-medium text-gray-900 dark:text-white">{person.name}</div>
                            <div className="mt-1 text-gray-500 dark:text-gray-400 break-words">{person.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <div className="text-gray-900 dark:text-white">{person.title}</div>
                        <div className="mt-1 text-gray-500 dark:text-gray-400">{person.department}</div>
                      </td>
                      <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20 dark:ring-green-700/40">
                          Active
                        </span>
                      </td>
                
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
  
