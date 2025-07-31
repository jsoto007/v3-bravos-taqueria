import '/src/index.css';
import { Link } from 'react-router-dom';
import logo  from '/logo.png'


export default function LandingPageNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 shadow-md">
      <div className="scroll-smooth mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
      <div className="flex-shrink-0">
      <button
        onClick={() => {
        window.location.href = '/';
        }}
        className="text-xl font-bold text-gray-900 dark:text-white"
      >
        <img src={logo} alt="Logo" className="h-8 w-auto rounded-lg" />
      </button>
      </div>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-8 text-gray-700 dark:text-gray-200">
          <a
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('landing-page-hero')?.scrollIntoView({ behavior: 'smooth' });
            }}
            href="#landing-page-hero"
            className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            About
          </a>
          <a
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('pricingDiv')?.scrollIntoView({ behavior: 'smooth' });
            }}
            href="#pricingDiv"
            className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Pricing
          </a>
          <a
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
            }}
            href="#footer"
            className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Contact
          </a>
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