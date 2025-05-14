import { Outlet, Link } from "react-router-dom"


export default function NavBar() {
    return (
      <>
        <nav className="bg-slate-400/20 dark:bg-gray-800 p-4 rounded-xl">
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
              <Link to="/cars" className="hover:text-gray-600 dark:hover:text-gray-300">
                Cars
              </Link>
            </li>
          </ul>
        </nav>

        <Outlet />
      </>
    )
}
