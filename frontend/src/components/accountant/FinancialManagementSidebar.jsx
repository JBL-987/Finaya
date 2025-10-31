import {
  Calculator,
  Users,
  BarChart3,
  FileText,
  FolderOpen,
  CheckCircle2,
  Activity,
  FileChartColumn,
  Lightbulb,
  Wallet,
  TrendingUp,
  FileSpreadsheet,
  ChevronRight,
  ClipboardList,
  Brain
} from "lucide-react";

export default function FinancialManagementSidebar({
  activeMainCategory,
  setActiveMainCategory,
  activeSubTab,
  setActiveSubTab,
}) {
  // Main categories
  const mainCategories = [
    {
      id: "accountant",
      label: "Agentic Accountant",
      icon: <Calculator size={20} />,
      active: activeMainCategory === "accountant",
    },
    {
      id: "advisor",
      label: "Advisor",
      icon: <Users size={20} />,
      active: activeMainCategory === "advisor",
    },
  ];

  // Accountant sub-navigation items
  const accountantSubItems = [
    {
      id: "data-input",
      label: "Data Input",
      icon: <BarChart3 size={18} />,
    },
    {
      id: "log-trails",
      label: "Log Trails",
      icon: <ClipboardList size={18} />,
    },
    {
      id: "workspace",
      label: "Workspace",
      icon: <FolderOpen size={18} />,
    },
    {
      id: "validation",
      label: "Validation",
      icon: <CheckCircle2 size={18} />,
    },
    {
      id: "analysis",
      label: "Analysis",
      icon: <Activity size={18} />,
    },
    {
      id: "reports",
      label: "Reports",
      icon: <FileChartColumn size={18} />,
    },
    {
      id: "recommendations",
      label: "Recommendations",
      icon: <Lightbulb size={18} />,
    },
  ];

  // Advisor sub-navigation items
  const advisorSubItems = [
    {
      id: "financial-planning",
      label: "Financial Planning",
      icon: <Wallet size={18} />,
    },
    {
      id: "investment",
      label: "Investment",
      icon: <TrendingUp size={18} />,
    },
    {
      id: "tax-strategy",
      label: "Tax Strategy",
      icon: <FileSpreadsheet size={18} />,
    },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-800">
          <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Finaya
          </span>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-6">
            {/* Main Categories */}
            <div className="space-y-1">
              {mainCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveMainCategory(category.id);
                    if (category.id === "accountant") {
                      setActiveSubTab("data-input");
                    } else if (category.id === "advisor") {
                      setActiveSubTab("financial-planning");
                    }
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeMainCategory === category.id
                      ? "bg-gradient-to-r from-yellow-600 to-yellow-500 text-white shadow-lg shadow-yellow-500/25 border border-yellow-400/30"
                      : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400"
                  }`}
                >
                  <div className="flex items-center">
                    <span
                      className={`mr-3 ${
                        activeMainCategory === category.id
                          ? "text-yellow-300"
                          : "text-gray-400"
                      }`}
                    >
                      {category.icon}
                    </span>
                    {category.label}
                  </div>
                  {category.active && (
                    <ChevronRight size={16} className="text-yellow-400" />
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-800"></div>

            {/* Accountant Sub-Items */}
            {activeMainCategory === "accountant" && (
              <div className="space-y-1 pl-2">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Accountant Features
                </p>
                {accountantSubItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSubTab(item.id)}
                    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeSubTab === item.id
                        ? "bg-gradient-to-r from-gray-800 to-gray-700 text-yellow-400 border border-yellow-500/30"
                        : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400"
                    }`}
                  >
                    <span
                      className={`mr-3 ${
                        activeSubTab === item.id
                          ? "text-yellow-400"
                          : "text-gray-500"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* Advisor Sub-Items */}
            {activeMainCategory === "advisor" && (
              <div className="space-y-1 pl-2">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Advisor Features
                </p>
                {advisorSubItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSubTab(item.id)}
                    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeSubTab === item.id
                        ? "bg-gradient-to-r from-gray-800 to-gray-700 text-yellow-400 border border-yellow-500/30"
                        : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400"
                    }`}
                  >
                    <span
                      className={`mr-3 ${
                        activeSubTab === item.id
                          ? "text-yellow-400"
                          : "text-gray-500"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
