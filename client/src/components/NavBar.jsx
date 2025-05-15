import { Outlet, Link } from "react-router-dom"
import Logout from "./Logout"


export default function NavBar() {
    return (
      <>
        <nav className="bg-slate-400/10 dark:bg-gray-800/30 p-4 rounded-xl font-bold">
          <ul className="flex space-x-6 text-gray-900 dark:text-white">
            <li>
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300">
                Home
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-gray-600 dark:hover:text-gray-300">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/crete_inventory" className="hover:text-gray-600 dark:hover:text-gray-300">
                Add Inventory
              </Link>
            </li>
            <li>
              <Link to="/client_outreach" className="hover:text-gray-600 dark:hover:text-gray-300">
                Client Outreach
              </Link>
            </li>

            
            <li className="ml-auto hover:text-gray-600 dark:hover:text-gray-300">
              <Logout />
            </li>

          </ul>
        </nav>

        <Outlet />
      </>
    )
}
