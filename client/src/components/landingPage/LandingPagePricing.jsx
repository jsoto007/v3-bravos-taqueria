import React, { useContext, useState } from 'react'
import { CheckIcon } from '@heroicons/react/20/solid'
import { UserContext } from '../../context/UserContextProvider'
import { useNavigate } from 'react-router-dom'

const tiers = {
  monthly: [
    {
      name: 'Starter',
      id: 'tier-starter',
      price: 'Free',
      description: 'Perfect for independent dealers getting started.',
      features: [
        '1 admin account',
        'Up to 15 vehicles',
        'Basic inventory tracking',
        'Email support (48-hour response time)',
      ],
      href: '#',
      link: '', // no Stripe link for free plan
      mostPopular: false,
    },
    {
      name: 'Professional',
      id: 'tier-professional-month',
      price: '$99.87',
      description: 'Best for growing dealerships managing higher volumes.',
      features: [
        '2 admin accounts',
        '10 user accounts',
        'Up to 250 vehicles',
        'Advanced reporting & analytics',
        'VIN decoding + location tracking',
        '24-hour support response time',
      ],
      href: '#',
      link: 'https://buy.stripe.com/14A3cwe9E8PcaZY3oH2cg02',
      mostPopular: true,
    },
    {
      name: 'Enterprise',
      id: 'tier-enterprise-month',
      price: '$199.87',
      description: 'Full-scale solution with dedicated support for large dealer networks.',
      features: [
        'Unlimited admin and user accounts',
        'Unlimited vehicle listings',
        'Custom integrations (e.g. DMS, CRM)',
        'AI-powered recommendations & analytics',
        'Real-time multi-location tracking',
        '1-hour priority support',
      ],
      href: '#',
      link: 'https://buy.stripe.com/3cI00k4z43uSaZYcZh2cg00',
      mostPopular: false,
    },
  ],
  yearly: [
    {
      name: 'Starter',
      id: 'tier-starter-year',
      price: 'Free',
      description: 'Perfect for independent dealers getting started.',
      features: [
        '1 admin account',
        '1 user account',
        'Up to 15 vehicles',
        'Basic inventory tracking',
        'Email support (48-hour response time)',
      ],
      href: '#',
      link: '', // no Stripe link for free plan
      mostPopular: false,
    },
    {
      name: 'Professional',
      id: 'tier-professional-year',
      price: '$1,198.44',
      description: 'Best for growing dealerships managing higher volumes.',
      features: [
        '2 admin accounts',
        '10 user accounts',
        'Up to 250 vehicles',
        'Advanced reporting & analytics',
        'VIN decoding + location tracking',
        '24-hour support response time',
      ],
      href: '#',
      link: 'https://buy.stripe.com/8x28wQfdIc1o9VUbVd2cg03',
      mostPopular: true,
    },
    {
      name: 'Enterprise',
      id: 'tier-enterprise-year',
      price: '$2,398.44',
      description: 'Full-scale solution with dedicated support for large dealer networks.',
      features: [
        'Unlimited admin and user accounts',
        'Unlimited vehicle listings',
        'Custom integrations (e.g. DMS, CRM)',
        'AI-powered recommendations & analytics',
        'Real-time multi-location tracking',
        '1-hour priority support',
      ],
      href: '#',
      link: 'https://buy.stripe.com/4gM00k7Lgd5s1pogbt2cg01',
      mostPopular: false,
    },
  ],
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function LandingPagePricing() {
  const { currentUser } = useContext(UserContext)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const navigate = useNavigate()

  const handleBuy = (link) => {
    if (!link) return
    if (!currentUser) {
      navigate('/auth')
    } else {
      window.open(link, '_blank')
    }
  }

  return (
    <div id='pricingDiv' className="bg-blue-900/10 dark:bg-blue-950/20 py-24 sm:py-32 rounded-sm">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base/7 font-semibold text-indigo-600">Pricing</h2>
          <p className="mt-2 text-balance text-5xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Choose the right plan for you
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-center text-lg font-medium text-gray-600 dark:text-gray-400 sm:text-xl/8">
            Choose an affordable plan that’s packed with the best features for engaging your audience, creating customer
            loyalty, and driving sales.
          </p>
          <fieldset aria-label="Payment frequency" className="mt-6 flex justify-center">
            <div className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-sm font-semibold ring-1 ring-inset ring-gray-200 dark:ring-gray-700">
              <label className="group relative rounded-full px-3 py-1 has-[:checked]:bg-indigo-600 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value="monthly"
                  checked={billingCycle === 'monthly'}
                  onChange={() => setBillingCycle('monthly')}
                  className="absolute inset-0 appearance-none rounded-full cursor-pointer"
                />
                <span className="text-gray-500 dark:text-gray-300 group-has-[:checked]:text-white">Monthly</span>
              </label>
              <label className="group relative rounded-full px-3 py-1 has-[:checked]:bg-indigo-600 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value="yearly"
                  checked={billingCycle === 'yearly'}
                  onChange={() => setBillingCycle('yearly')}
                  className="absolute inset-0 appearance-none rounded-full cursor-pointer"
                />
                <span className="text-gray-500 dark:text-gray-300 group-has-[:checked]:text-white">Yearly</span>
              </label>
            </div>
        </fieldset>
        </div>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {tiers[billingCycle].map((tier, tierIdx) => (
            <div
              key={tier.id}
              className={classNames(
                tier.mostPopular ? 'lg:z-10 lg:rounded-b-none' : 'lg:mt-8',
                tierIdx === 0 ? 'lg:rounded-r-none' : '',
                tierIdx === tiers[billingCycle].length - 1 ? 'lg:rounded-l-none' : '',
                'bg-white dark:bg-gray-800 ring-gray-200 dark:ring-gray-700',
                'flex flex-col justify-between rounded-3xl p-8 ring-1 xl:p-10',
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    id={tier.id}
                    className="text-lg/8 font-semibold text-gray-900 dark:text-white"
                  >
                    {tier.name}
                  </h3>
                  {tier.mostPopular ? (
                    <p className="rounded-full bg-indigo-600/10 px-2.5 py-1 text-xs/5 font-semibold text-indigo-600">
                      Most popular
                    </p>
                  ) : null}
                </div>
                <p className="mt-4 text-sm/6 text-gray-600 dark:text-gray-400">{tier.description}</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">{tier.price}</span>
                  {tier.name !== 'Starter' && (
                    <span className="text-sm/6 font-semibold text-gray-600 dark:text-gray-400">
                      {billingCycle === 'monthly' ? '/month' : '/year'}
                    </span>
                  )}
                </p>
                <ul role="list" className="mt-8 space-y-3 text-sm/6 text-gray-600 dark:text-gray-400">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleBuy(tier.link)}
                aria-describedby={tier.id}
                className={classNames(
                  tier.mostPopular
                    ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500'
                    : 'text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-200 dark:ring-indigo-400/30 hover:ring-indigo-300 dark:hover:ring-indigo-400/50',
                  'mt-8 block rounded-md px-3 py-2 text-center text-sm/6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 w-full',
                )}
              >
                {tier.name === 'Starter' ? 'Get Started' : 'Buy Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}