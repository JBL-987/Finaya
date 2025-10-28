import React, { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, FileText, ArrowRight } from "lucide-react";

const ValidationAnimation = ({
  transaction,
  document,
  onComplete,
  status = "pending", // pending, valid, warning, error
}) => {
  const [stage, setStage] = useState(0);
  const [showCheckmark, setShowCheckmark] = useState(false);

  // Animation stages:
  // 0: Initial state
  // 1: Document highlighted
  // 2: Arrow animated
  // 3: Transaction highlighted
  // 4: Validation result shown

  useEffect(() => {
    const timers = [];

    // Stage 1: Highlight document
    timers.push(setTimeout(() => setStage(1), 500));

    // Stage 2: Animate arrow
    timers.push(setTimeout(() => setStage(2), 1200));

    // Stage 3: Highlight transaction
    timers.push(setTimeout(() => setStage(3), 1900));

    // Stage 4: Show validation result
    timers.push(
      setTimeout(() => {
        setStage(4);
        setShowCheckmark(true);
      }, 2600)
    );

    // Complete animation
    timers.push(
      setTimeout(() => {
        if (onComplete) onComplete(status);
        // Call the global callback if it exists
        if (window.validationAnimationComplete) {
          window.validationAnimationComplete(status);
        }
      }, 3300)
    );

    return () => {
      // Clean up timers if component unmounts
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [onComplete, status]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format amount for display
  const formatAmount = (amount) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="bg-gray-900 border border-blue-900/30 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-medium text-white mb-4">
        Validating Transaction
      </h3>

      <div className="flex items-center justify-between">
        {/* Document Side */}
        <div
          className={`p-4 rounded-lg ${
            stage >= 1
              ? "bg-blue-900/30 border border-blue-500/50"
              : "bg-gray-800 border border-gray-700"
          } transition-all duration-300 w-2/5`}
        >
          <div className="flex items-center mb-2">
            <FileText className="h-5 w-5 text-blue-400 mr-2" />
            <h4 className="text-white font-medium">Source Document</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white">{document?.name || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Type:</span>
              <span className="text-white">{document?.type || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Date:</span>
              <span className="text-white">{formatDate(document?.date)}</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div
          className={`flex-shrink-0 mx-4 transition-all duration-500 ${
            stage >= 2 ? "opacity-100" : "opacity-30"
          }`}
        >
          <div className="relative">
            <div
              className={`h-0.5 w-12 bg-blue-500 ${
                stage >= 2 ? "animate-pulse" : ""
              }`}
            ></div>
            <ArrowRight
              className={`h-5 w-5 text-blue-500 absolute -right-2.5 -top-2 ${
                stage >= 2 ? "animate-bounce" : ""
              }`}
            />
          </div>
        </div>

        {/* Transaction Side */}
        <div
          className={`p-4 rounded-lg ${
            stage >= 3
              ? "bg-blue-900/30 border border-blue-500/50"
              : "bg-gray-800 border border-gray-700"
          } transition-all duration-300 w-2/5`}
        >
          <div className="flex items-center mb-2">
            <FileText className="h-5 w-5 text-blue-400 mr-2" />
            <h4 className="text-white font-medium">Log Trail Entry</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Description:</span>
              <span className="text-white">
                {transaction?.description || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span
                className={`${
                  transaction?.transactionType === "expense"
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {formatAmount(transaction?.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Date:</span>
              <span className="text-white">
                {formatDate(transaction?.date)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Result */}
      <div
        className={`mt-6 flex items-center justify-center transition-all duration-300 ${
          showCheckmark
            ? "opacity-100 transform translate-y-0"
            : "opacity-0 transform -translate-y-4"
        }`}
      >
        {status === "valid" && (
          <div className="flex items-center bg-green-900/30 text-green-400 px-4 py-2 rounded-full">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Validation Successful</span>
          </div>
        )}
        {status === "warning" && (
          <div className="flex items-center bg-yellow-900/30 text-yellow-400 px-4 py-2 rounded-full">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Validation Warning</span>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center bg-red-900/30 text-red-400 px-4 py-2 rounded-full">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Validation Failed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationAnimation;