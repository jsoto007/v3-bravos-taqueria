import { Link } from 'react-router-dom';
import logo  from '/logo.png'


export default function LandingPageNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
      <div className="flex-shrink-0">
        <button
          onClick={() => {
            const el = document.getElementById('landing-page-hero');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-xl font-bold text-gray-900 dark:text-white"
        >
          <img src={logo} alt="Logo" className="h-8 w-auto rounded-lg" />
        </button>
      </div>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-8 text-gray-700 dark:text-gray-200">
          <Link to="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400">About</Link>
          <Link to="/sales" className="hover:text-indigo-600 dark:hover:text-indigo-400">Pricing</Link>
          <Link to="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400">Contact</Link>
        </div>

        {/* Log In Button */}
        <div className="flex-shrink-0">
          <Link
            to="/auth"
            className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Log in
          </Link>
        </div>
      </div>
    </nav>
  );
}