export default function InventoryFilesDownloadCard() {
    return (
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-5 sm:px-6">
        <div className="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
          <div className="ml-4 mt-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Completed Inventories</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Download your inventory as an Excel file. Pick your date range below.
            </p>
          </div>
          <div className="ml-4 mt-4 shrink-0">
            <button
              type="button"
              className="relative inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
                Download
            </button>
          </div>
        </div>
      </div>
    )
  }