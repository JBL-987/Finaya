import React, { useEffect } from "react";
import { CheckCircle, AlertTriangle, FileText, ArrowRight } from "lucide-react";
import { formatCurrency } from "../../services/currencies";
import { useCurrency } from "../../contexts/CurrencyContext";

const SimpleValidationAnimation = ({
  transaction,
  document,
  status = "pending", // pending, valid, warning, error
}) => {
  const { selectedCurrency } = useCurrency();
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

  // We're not using the callback approach anymore
  // This component is now purely presentational

  // Status icon and color
  const getStatusIcon = () => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "valid":
        return "border-green-500/30 bg-green-900/10";
      case "warning":
        return "border-yellow-500/30 bg-yellow-900/10";
      case "error":
        return "border-red-500/30 bg-red-900/10";
      default:
        return "border-blue-500/30 bg-blue-900/10";
    }
  };

  return (
    <div
      className={`border ${getStatusColor()} rounded-lg p-4 flex items-center validation-animation-item`}
      data-index={transaction?.id}
    >
      <div className="flex-1 flex items-center">
        <div className="bg-gray-800 rounded-lg p-3 mr-4">
          <FileText className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <div className="text-white font-medium">
            {document?.name || "Unknown Document"}
          </div>
          <div className="text-sm text-gray-400">Source Document</div>
        </div>
      </div>

      <div className="mx-4 flex items-center">
        <ArrowRight className="h-5 w-5 text-blue-400 animate-pulse" />
      </div>

      <div className="flex-1 flex items-center">
        <div className="bg-gray-800 rounded-lg p-3 mr-4">
          <FileText className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <div className="text-white font-medium truncate max-w-[200px]">
            {transaction?.description || "Unknown Transaction"}
          </div>
          <div className="text-sm text-gray-400">
            {formatAmount(transaction)} •{" "}
            {formatDate(transaction?.date)}
          </div>
        </div>
      </div>

      <div className="ml-4">{getStatusIcon()}</div>
    </div>
  );
};

export default SimpleValidationAnimation;
