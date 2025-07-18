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
        <div className="bg-grey-800 w-full bg-gray-100 dark:bg-gray-800 outline outline-white/15 lg:rounded-tl-[2rem] rounded-t-lg rounded-b-xl">
            <table className="w-full text-left ml-4 mt-6">
                <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Country</th>
                </tr>
                <tr>
                <td>Alfreds Futterkiste</td>
                <td>Maria Anders</td>
                <td>Germany</td>
                </tr>
                <tr>
                <td>Centro comercial Moctezuma</td>
                <td>Francisco Chang</td>
                <td>Mexico</td>
                </tr>
            </table>
        </div>
    )
  }
  
