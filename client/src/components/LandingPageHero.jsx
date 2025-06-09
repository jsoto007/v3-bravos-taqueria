import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react';
import loginLogo from '../assets/autoTracker-login-logo.png';

export default function LandingPageHero() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(matchMedia.matches);

    const handler = (e) => setIsDark(e.matches);
    matchMedia.addEventListener('change', handler);
    return () => matchMedia.removeEventListener('change', handler);
  }, []);

  return (
    <div className={`relative isolate overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <svg
        aria-hidden="true"
        className={`absolute inset-0 -z-10 size-full ${isDark ? 'stroke-white/10' : 'stroke-gray-200'} [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]`}
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
              <span className={`rounded-full ${isDark ? 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20' : 'bg-indigo-600/10 text-indigo-600 ring-indigo-600/10'} px-3 py-1 text-sm/6 font-semibold ring-1 ring-inset`}>
                What's new
              </span>
              <span className={`inline-flex items-center space-x-2 text-sm/6 font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span>Just shipped v1.0</span>
                <ChevronRightIcon aria-hidden="true" className="size-5 text-gray-400" />
              </span>
            </a>
          </div>
          <h1 className={`mt-10 text-pretty text-5xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'} sm:text-7xl`}>
          Supercharge Your Dealer  
          </h1>
          <p className={`mt-8 text-pretty text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} sm:text-xl/8`}>
            Streamline your inventory with real-time tracking and VIN decoding.
            Know where every car is, what’s selling fast, and auto-post to multiple dealer platforms.
            Get AI-powered insights and smart recommendations — even while you're on vacation.
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
                className={`text-sm/6 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              Log In <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className={`${isDark ? '' : '-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4'}`}>
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
