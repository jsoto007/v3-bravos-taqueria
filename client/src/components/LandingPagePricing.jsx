import { CheckIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react';

const tiers = [
    {
      name: 'Starter',
      id: 'tier-starter',
      href: '#',
      priceMonthly: '$49.99',
      description: 'Perfect for independent dealers getting started.',
      features: [
        '1 admin account',
        '3 user accounts',
        'Up to 100 vehicles',
        'Basic inventory tracking',
        'Email support (48-hour response time)',
      ],
      mostPopular: false,
    },
    {
      name: 'Professional',
      id: 'tier-professional',
      href: '#',
      priceMonthly: '$99.99',
      description: 'Best for growing dealerships managing higher volumes.',
      features: [
        '2 admin accounts',
        '10 user accounts',
        'Up to 250 vehicles',
        'Advanced reporting & analytics',
        'VIN decoding + location tracking',
        '24-hour support response time',
      ],
      mostPopular: true,
    },
    {
      name: 'Enterprise',
      id: 'tier-enterprise',
      href: '#',
      priceMonthly: '$199.99',
      description: 'Full-scale solution with dedicated support for large dealer networks.',
      features: [
        'Unlimited admin and user accounts',
        'Unlimited vehicle listings',
        'Custom integrations (e.g. DMS, CRM)',
        'AI-powered recommendations & analytics',
        'Real-time multi-location tracking',
        '1-hour priority support',
      ],
      mostPopular: false,
    },
  ]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function LandingPagePricing() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(matchMedia.matches);

    const handler = (e) => setIsDark(e.matches);
    matchMedia.addEventListener('change', handler);
    return () => matchMedia.removeEventListener('change', handler);
  }, []);

  return (
    <div className={`${isDark ? 'bg-blue-950/20' : 'bg-blue-900/10'} py-24 sm:py-32 rounded-sm`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base/7 font-semibold text-indigo-600">Pricing</h2>
          <p className={`mt-2 text-balance text-5xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'} sm:text-6xl`}>
            Choose the right plan for you
          </p>
        </div>
        <p className={`mx-auto mt-6 max-w-2xl text-pretty text-center text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} sm:text-xl/8`}>
          Choose an affordable plan that’s packed with the best features for engaging your audience, creating customer
          loyalty, and driving sales.
        </p>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier, tierIdx) => (
            <div
              key={tier.id}
              className={classNames(
                tier.mostPopular ? 'lg:z-10 lg:rounded-b-none' : 'lg:mt-8',
                tierIdx === 0 ? 'lg:rounded-r-none' : '',
                tierIdx === tiers.length - 1 ? 'lg:rounded-l-none' : '',
                `${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'}`,
                'flex flex-col justify-between rounded-3xl p-8 ring-1 xl:p-10',
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    id={tier.id}
                    className={classNames(
                      tier.mostPopular ? 'text-indigo-600' : (isDark ? 'text-white' : 'text-gray-900'),
                      'text-lg/8 font-semibold',
                    )}
                  >
                    {tier.name}
                  </h3>
                  {tier.mostPopular ? (
                    <p className={`rounded-full bg-indigo-600/10 px-2.5 py-1 text-xs/5 font-semibold text-indigo-600`}>
                      Most popular
                    </p>
                  ) : null}
                </div>
                <p className={`mt-4 text-sm/6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tier.description}</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className={`text-4xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{tier.priceMonthly}</span>
                  <span className={`text-sm/6 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>/month</span>
                </p>
                <ul role="list" className={`mt-8 space-y-3 text-sm/6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href={tier.href}
                aria-describedby={tier.id}
                className={classNames(
                  tier.mostPopular
                    ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500'
                    : (isDark
                        ? 'text-indigo-400 ring-1 ring-inset ring-indigo-400/30 hover:ring-indigo-400/50'
                        : 'text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300'),
                  'mt-8 block rounded-md px-3 py-2 text-center text-sm/6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
                )}
              >
                Buy plan
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
