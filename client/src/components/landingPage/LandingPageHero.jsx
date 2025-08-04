import { ChevronRightIcon } from '@heroicons/react/20/solid'
import loginLogo from '../../assets/autoTracker-login-logo.png'

export default function LandingPageHero() {
  return (
    <div id="landing-page-hero" className="relative isolate overflow-hidden bg-white dark:bg-gray-900">
      <svg
        aria-hidden="true"
        className="absolute inset-0 -z-10 size-full stroke-gray-200 dark:stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
      >
        <defs>
          <pattern
            x="50%"
            y={-1}
            id="0787a7c5-978c-4f66-83c7-11c213f99cb7"
            width={200}
            height={200}
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 200V.5H200" fill="none" />
          </pattern>
        </defs>
        <rect fill="url(#0787a7c5-978c-4f66-83c7-11c213f99cb7)" width="100%" height="100%" strokeWidth={0} />
      </svg>
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:shrink-0 lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <a href="#" className="inline-flex space-x-6">
              <span className="rounded-full px-3 py-1 text-sm/6 font-semibold ring-1 ring-inset bg-indigo-600/10 text-indigo-600 ring-indigo-600/10 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20">
                What's new
              </span>
              <span className="inline-flex items-center space-x-2 text-sm/6 font-medium text-gray-600 dark:text-gray-300">
                <span>Just shipped v1.0</span>
                <ChevronRightIcon aria-hidden="true" className="size-5 text-gray-400" />
              </span>
            </a>
          </div>
          <h1 className="mt-10 text-pretty text-5xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-7xl">
          Supercharge Your Dealership
          </h1>
          <p className="mt-8 text-pretty text-lg font-medium text-gray-500 dark:text-gray-400 sm:text-xl/8">
            Easily conduct and manage your car inventory with powerful tracking tools. 
            Monitor each vehicle's last known location, assigned user, and status in real time. 
            Simplify audits, reduce errors, and stay in control — wherever you are.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <button
              onClick={() => {
                const el = document.getElementById('pricingDiv');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Get started
            </button>
            <a 
                href="/auth" 
                className="text-sm/6 font-semibold text-gray-900 dark:text-white"
            >
              Log In <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 dark:bg-transparent lg:-m-4 lg:rounded-2xl lg:p-4">
                <img
                    alt="Login"
                    src={loginLogo}
                    className="h-168 w-auto object-cover rounded-lg bg-blend-multiply"
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
