import { Menu, Search, Bell, Settings } from "lucide-react";

export default function FinancialManagementHeader({ activeMainCategory, activeSubTab }) {
  return (
    <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-gray-900">
      {/* Mobile menu button */}
      <button className="md:hidden text-gray-400 hover:text-white">
        <Menu size={24} />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2">
        <div className="text-sm text-gray-400">
          <span className="text-yellow-500 font-medium">Financial Analysis</span>
          <span className="mx-2">/</span>
          <span className="text-gray-300">
            {activeMainCategory === "accountant" ? "Agentic Accountant" : "Advisor"}
          </span>
          <span className="mx-2">/</span>
          <span className="text-white capitalize">
            {activeSubTab.replace("-", " ")}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md ml-auto mr-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            placeholder="Search transactions..."
          />
        </div>
      </div>

      {/* Right buttons */}
      <div className="flex items-center space-x-4">
        <button className="text-gray-400 hover:text-white transition-colors">
          <Bell size={20} />
        </button>
        <button className="text-gray-400 hover:text-white transition-colors">
          <Settings size={20} />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-500 to-slate-600 flex items-center justify-center">
          <span className="text-xs font-medium text-white">FA</span>
        </div>
      </div>
    </div>
  );
}
