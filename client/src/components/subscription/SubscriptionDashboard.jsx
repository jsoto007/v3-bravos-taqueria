import AdminSignupUser from "../authentication/AdminSignupUser";
import AssignedLocations from "../admin/AssignedLocations";

import { useState } from "react";
import {
  CreditCard,
  Calendar,
  Users,
  BarChart3,
  Settings,
  ChevronRight,
  Download,
  MapPinned,
} from "lucide-react";

import ActionBtn from "../../shared/ActionBtn";

export default function SubscriptionDashboard() {
  const [currentPlan, setCurrentPlan] = useState("pro");
  const [activeTab, setActiveTab] = useState("overview");

  const plans = [
    { id: "starter", name: "Starter", price: 9 },
    { id: "pro", name: "Pro", price: 29 },
    { id: "enterprise", name: "Enterprise", price: 99 },
  ];

  const usage = {
    projects: { used: 12, limit: 25 },
    storage: { used: 45, limit: 100 },
    teamMembers: { used: 8, limit: 15 },
  };

  const plan = plans.find((p) => p.id === currentPlan);

  const tabs = [
    { id: "overview", name: "Overview", icon: BarChart3 },
    { id: "billing", name: "Billing", icon: CreditCard },
    { id: "accounts", name: "Accounts", icon: Users },
    { id: "locations", name: "Assigned Locations", icon: MapPinned },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Current Plan */}
            <h1>* Component under construction</h1>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {plan?.name} Plan
                    </h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    ${plan?.price}/month • Next billing: March 15, 2025
                  </p>
                </div>
                <ActionBtn
                  label="Change Plan"
                  onClick={() => console.log("Change Plan clicked")}
                  iconRight={<ChevronRight className="w-4 h-4 ml-1" />}
                />
              </div>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(usage).map(([key, { used, limit }]) => (
                <div
                  key={key}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </h3>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {used} / {limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${(used / limit) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "billing":
        return (
          <div className="space-y-6">
            {/* Payment Method */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Payment Method
              </h2>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <CreditCard className="w-8 h-8 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    •••• •••• •••• 4242
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Expires 12/2027
                  </p>
                </div>
                <ActionBtn
                  label="Update"
                  onClick={() => console.log("Update payment method")}
                />
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Billing History
                </h2>
                <ActionBtn
                  label="Download All"
                  onClick={() => console.log("Download All")}
                  iconLeft={<Download className="w-4 h-4 mr-1" />}
                />
              </div>
              <div className="space-y-4">
                {["Feb", "Jan", "Dec"].map((month, i) => (
                  <div
                    key={i}
                    className="flex justify-between py-3 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {month} 15, 2025
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-900 dark:text-white font-medium">
                        $29.00
                      </span>
                      <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 text-xs rounded-full">
                        Paid
                      </span>
                      <Download className="w-4 h-4 text-purple-600 dark:text-purple-400 cursor-pointer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "accounts":
        return <div> <AdminSignupUser /></div>;
      case "locations":
        return <div className="text-gray-600 dark:text-gray-400"
          >
            <AssignedLocations />
          </div>;
      case "settings":
        return <p className="text-gray-600 dark:text-gray-400">Settings tab under construction. Note that this option will allow the admin to crate user accounts</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors mt-10">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-left">Settings</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your user's settings, locations, subscription and billing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? "border-purple-500 text-purple-600 dark:text-purple-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderTab()}</div>
    </div>
  );
}