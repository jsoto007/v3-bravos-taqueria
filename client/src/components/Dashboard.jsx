import CompletedInventoryCard from "./completedInventories/CompletedInventoryCard"


export default function Dashboard() {
  return (
    <div className="bg-white dark:bg-gray-900/30 text-gray-900 dark:text-white mt-20 rounded-xl">
      <div className="mx-auto">
        <p className="mt-2 max-w-lg text-pretty text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Dashboard
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
          <div className="flex p-px lg:col-span-4">
            <CompletedInventoryCard />
         
          </div>
          <div className="flex p-px lg:col-span-2">
            <div className="w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 outline outline-white/15 lg:rounded-tr-[2rem]">
              <img
                alt=""
                src="https://tailwindcss.com/plus-assets/img/component-images/dark-bento-02-integrations.png"
                className="h-80 object-cover"
              />
              <div className="p-10">
                <h3 className="text-sm/4 font-semibold text-gray-500 dark:text-gray-400">Integrations</h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-900 dark:text-white">Connect your favorite tools</p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-500 dark:text-gray-400">
                  Curabitur auctor, ex quis auctor venenatis, eros arcu rhoncus massa.
                </p>
              </div>
            </div>
          </div>
          <div className="flex p-px lg:col-span-2">
            <div className="w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 outline outline-white/15 lg:rounded-bl-[2rem]">
              <img
                alt=""
                src="https://tailwindcss.com/plus-assets/img/component-images/dark-bento-02-security.png"
                className="h-80 object-cover"
              />
              <div className="p-10">
                <h3 className="text-sm/4 font-semibold text-gray-500 dark:text-gray-400">Security</h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-900 dark:text-white">Advanced access control</p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-500 dark:text-gray-400">
                  Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia.
                </p>
              </div>
            </div>
          </div>
          <div className="flex p-px lg:col-span-4">
            <div className="w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 outline outline-white/15 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]">
              <img
                alt=""
                src="https://tailwindcss.com/plus-assets/img/component-images/dark-bento-02-performance.png"
                className="h-80 object-cover object-left"
              />
              <div className="p-10">
                <h3 className="text-sm/4 font-semibold text-gray-500 dark:text-gray-400">Performance</h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-900 dark:text-white">Lightning-fast builds</p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-500 dark:text-gray-400">
                  Sed congue eros non finibus molestie. Vestibulum euismod augue vel commodo vulputate. Maecenas at
                  augue sed elit dictum vulputate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
