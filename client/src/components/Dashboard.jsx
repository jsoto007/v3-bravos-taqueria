import CompletedInventoryCard from "./completedInventories/CompletedInventoryCard"
import InventoryFeed from "./inventory/InventoryFeed"
import InventoryFilesDownloadCard from "./inventory/InventoryFilesDownloadCard"
import InventoryOverviewCard from "./inventory/InventoryOverviewCard"
import AddCarBtn from "../shared/AddCarBtn"
import FadeIn from "../shared/FadeIn"


export default function Dashboard() {
  return (
    <FadeIn>
      <div className="bg-neutral-50 dark:bg-gray-900/30 text-gray-900 dark:text-white mt-10 rounded-xl pt-4">

        <div className="mx-auto">
          <p className="mt-2 flex justify-start text-pretty text-4xl font-serif font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Dashboard
          </p>
          <div className="flex justify-end mt-4">
            <AddCarBtn />
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
            <div className="flex p-px lg:col-span-4">
              <CompletedInventoryCard />
          
            </div>
            <div className="flex p-px lg:col-span-2">
              <div className="w-full overflow-hidden rounded-lg bg-white dark:bg-gray-800 outline outline-white/15 lg:rounded-tr-[2rem]">
              <InventoryFeed />
          
              </div>
            </div>
            <div className="flex p-px lg:col-span-2">
              <div className="w-full overflow-hidden rounded-lg bg-white dark:bg-gray-800 outline outline-white/15 lg:rounded-bl-[2rem]">
              <InventoryOverviewCard />
              </div>
            </div>
            <div className="flex p-px lg:col-span-4">
              <div className="w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 outline outline-white/15 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]">
                <InventoryFilesDownloadCard />
                </div>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  )
}
