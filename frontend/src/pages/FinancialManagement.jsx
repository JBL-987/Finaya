import { useState, useEffect } from "react";

// Import modular components
import FinancialManagementSidebar from "../components/accountant/FinancialManagementSidebar";
import FinancialManagementHeader from "../components/accountant/FinancialManagementHeader";
import FinancialManagementContent from "../components/accountant/FinancialManagementContent";

function FinancialManagement({ addGlobalLog }) {
  const [activeMainCategory, setActiveMainCategory] = useState("accountant");
  const [activeSubTab, setActiveSubTab] = useState("data-input");

  // Handle transactions loaded from content component
  const handleTransactionsLoaded = (transactions) => {
    console.log("Transactions loaded:", transactions.length);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <FinancialManagementSidebar
          activeMainCategory={activeMainCategory}
          setActiveMainCategory={setActiveMainCategory}
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
          showFinancialAnalysis={true}
        />

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top header */}
          <FinancialManagementHeader
            activeMainCategory={activeMainCategory}
            activeSubTab={activeSubTab}
          />

          {/* Content area */}
          <FinancialManagementContent
            activeMainCategory={activeMainCategory}
            activeSubTab={activeSubTab}
            onLoadTransactions={handleTransactionsLoaded}
            addGlobalLog={addGlobalLog}
          />
        </div>
      </div>
    </div>
  );
}

export default FinancialManagement;
