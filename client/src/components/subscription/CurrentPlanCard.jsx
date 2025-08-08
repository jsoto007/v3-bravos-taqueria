import { ChevronRight } from 'lucide-react'; // Adjust if you're using another icon lib

export default function CurrentPlanCard({ currentPlan, plans, setShowUpgradeModal }) {
  const plan = plans.find(p => p.id === currentPlan);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <h1>* component under construction</h1>
        <div className="mb-4 sm:mb-0">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {plan?.name} Plan
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            ${plan?.price}/month • Next billing: March 15, 2025
          </p>
        </div>

        <button 
          onClick={() => setShowUpgradeModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          Change Plan
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}
