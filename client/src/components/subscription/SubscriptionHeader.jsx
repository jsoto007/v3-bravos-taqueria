export default function SubscriptionHeader() {
    return (
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-tl-lg rounded-r-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your subscription and billing</p>
            </div>
  
            <div>
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }