import { Menu, Search, Bell, Settings } from "lucide-react";
import { CURRENCIES, getCurrencySymbol, getCurrencyName } from "../../services/currencies";

export default function FinancialManagementHeader({ activeMainCategory, activeSubTab, selectedCurrency, setSelectedCurrency }) {
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

      {/* Currency Selector */}
      <div className="flex items-center mr-4">
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
        >
          {Object.entries(CURRENCIES).map(([code, info]) => (
            <option key={code} value={code}>
              {info.symbol} {code} - {info.name}
            </option>
          ))}
        </select>
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
