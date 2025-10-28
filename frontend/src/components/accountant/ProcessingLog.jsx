import React, { useState, useEffect, useRef } from "react";
import { X, Minimize, Maximize, Terminal } from "lucide-react";

const ProcessingLog = ({ logs, visible, onClose, onMinimize, minimized }) => {
  const logEndRef = useRef(null);
  const [expanded, setExpanded] = useState(false);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logEndRef.current && visible && !minimized) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, visible, minimized]);

  if (!visible) return null;

  return (
    <div
      className={`fixed ${
        minimized ? "bottom-0 right-0 w-auto h-auto" : expanded ? "inset-4" : "bottom-4 right-4 w-96 h-64"
      } bg-gray-900 border border-blue-900/30 rounded-lg shadow-lg z-50 flex flex-col transition-all duration-200 ease-in-out`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-lg border-b border-gray-700">
        <div className="flex items-center">
          <Terminal size={16} className="text-blue-400 mr-2" />
          <h3 className="text-sm font-medium text-white">Processing Log</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onMinimize}
            className="p-1 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white"
            title={minimized ? "Expand" : "Minimize"}
          >
            {minimized ? <Maximize size={14} /> : <Minimize size={14} />}
          </button>
          {!minimized && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white"
              title={expanded ? "Restore" : "Maximize"}
            >
              {expanded ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Log content */}
      {!minimized && (
        <div className="flex-1 p-3 overflow-auto bg-gray-950 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500 italic">No processing logs yet.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">[{log.timestamp}]</span>{" "}
                <span
                  className={`${
                    log.type === "error"
                      ? "text-red-400"
                      : log.type === "success"
                      ? "text-green-400"
                      : log.type === "warning"
                      ? "text-yellow-400"
                      : log.type === "info"
                      ? "text-blue-400"
                      : "text-gray-300"
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
};

export default ProcessingLog;