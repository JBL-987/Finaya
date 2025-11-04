import React, { useState, useEffect } from "react";
import {
  Receipt,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Trash,
} from "lucide-react";
import { Skeleton } from "../ui/Skeleton";
import { formatCurrency } from "../../services/currencies";
import { useCurrency } from "../../contexts/CurrencyContext";

const LogTrails = ({
  transactions,
  onViewTransaction,
  onDeleteTransaction,
  onExportTransactions,
  onDeleteAllTransactions,
}) => {
  const { selectedCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Set loading to false after initial render
  useEffect(() => {
    console.log('LogTrails component mounted, transactions:', transactions?.length || 0);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Log when transactions change
  useEffect(() => {
    console.log('LogTrails transactions updated:', transactions?.length || 0);
  }, [transactions]);

  // Filter transactions based on search term and filter type
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.sourceFile
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (transaction.reference &&
        transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      filterType === "all" || transaction.transactionType === filterType;

    return matchesSearch && matchesFilter;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle special cases for sorting
    if (sortField === "amount") {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else if (sortField === "timestamp" || sortField === "date") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format amount for display
  const formatAmount = (transaction) => {
    if (!transaction || transaction.amount === undefined || transaction.amount === null) return "N/A";
    return formatCurrency(transaction.amount, transaction.currency || selectedCurrency);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48 bg-gray-700" />
          <Skeleton className="h-4 w-32 bg-gray-700" />
        </div>

        {/* Search and Filter Bar Skeleton */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 flex-1 bg-gray-700" />
          <Skeleton className="h-10 w-32 bg-gray-700" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-20 bg-gray-700" />
            <Skeleton className="h-10 w-24 bg-gray-700" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">
                    <Skeleton className="h-4 w-16 bg-gray-700" />
                  </th>
                  <th className="px-4 py-3">
                    <Skeleton className="h-4 w-24 bg-gray-700" />
                  </th>
                  <th className="px-4 py-3">
                    <Skeleton className="h-4 w-20 bg-gray-700" />
                  </th>
                  <th className="px-4 py-3">
                    <Skeleton className="h-4 w-16 bg-gray-700" />
                  </th>
                  <th className="px-4 py-3">
                    <Skeleton className="h-4 w-16 bg-gray-700" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <Skeleton className="h-4 w-16 bg-gray-700" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-20 bg-gray-700" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-32 bg-gray-700" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-6 w-20 bg-gray-700 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-16 bg-gray-700" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24 bg-gray-700" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-6 w-6 bg-gray-700" />
                        <Skeleton className="h-6 w-6 bg-gray-700" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Log Trails</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {transactions.length} transactions
          </span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-gray-900 border border-blue-900/30 rounded-lg p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search transactions..."
          />
        </div>

        <div className="flex space-x-2">
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-8"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
              <option value="transfer">Transfers</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => onExportTransactions && onExportTransactions()}
              className="px-3 py-2 bg-blue-900/30 text-blue-400 rounded-md hover:bg-blue-900/50 transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>

            <button
              onClick={() =>
                onDeleteAllTransactions && onDeleteAllTransactions()
              }
              className="px-3 py-2 bg-red-900/30 text-red-400 rounded-md hover:bg-red-900/50 transition-colors flex items-center"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete All
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-900 border border-blue-900/30 rounded-lg overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No Transactions
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Process documents to extract transactions or add manual entries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
                <tr>
                  <th
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center">
                      Date
                      {sortField === "date" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                      {sortField !== "date" && (
                        <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => handleSort("description")}
                  >
                    <div className="flex items-center">
                      Description
                      {sortField === "description" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                      {sortField !== "description" && (
                        <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center">
                      Category
                      {sortField === "category" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                      {sortField !== "category" && (
                        <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center">
                      Amount
                      {sortField === "amount" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                      {sortField !== "amount" && (
                        <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sortedTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-white">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {transaction.description || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                        {transaction.category || "Uncategorized"}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 font-medium ${
                        transaction.transactionType === "expense"
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {transaction.transactionType === "expense" ? "-" : "+"}
                      {formatAmount(transaction)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-400" />
                      {transaction.sourceFile || "Manual Entry"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() =>
                            onViewTransaction && onViewTransaction(transaction)
                          }
                          className="p-1 text-gray-400 hover:text-white"
                          title="View Details"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            onDeleteTransaction &&
                            onDeleteTransaction(transaction.id)
                          }
                          className="p-1 text-gray-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogTrails;
