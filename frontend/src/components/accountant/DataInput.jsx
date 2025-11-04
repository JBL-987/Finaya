import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Upload,
  ArrowUpRight,
  Calculator,
  FileUp,
  PenLine,
  Trash2,
  CheckSquare,
  Square,
  PlayCircle,
  Eye,
  X,
  FileText,
  File,
} from "lucide-react";
import ManualDataInput from "./ManualDataInput";
import AIWorkflowProgress from "../AIWorkflowProgress";
import CSVPreview from "./CSVPreview";
import ExcelPreview from "./ExcelPreview";
import DocxPreview from "./DocxPreview";
import FilePreview from "./FilePreview";
import { Skeleton } from "../ui/Skeleton";

const DataInput = ({
  onFileUpload,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  dragActive,
  files,
  isLoading,
  handleFileDownload,
  handleFileDelete,
  handleProcessAllFiles,
  errorMessage,
  fileTransferProgress,
  onSaveManualData,
}) => {
  const [inputMode, setInputMode] = useState("file");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [showWorkflowProgress, setShowWorkflowProgress] = useState(false);
  const [processingFileName, setProcessingFileName] = useState("");
  const [componentLoading, setComponentLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Set loading to false after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setComponentLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveManualData = (data) => {
    if (onSaveManualData) onSaveManualData(data);
    else alert("Transaction saved successfully!");
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  const getPreviewComponent = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'csv':
        return CSVPreview;
      case 'xlsx':
      case 'xls':
        return ExcelPreview;
      case 'docx':
      case 'doc':
        return DocxPreview;
      default:
        return FilePreview;
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) {
      return <FileText size={16} className="text-blue-400" />;
    } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return <FileSpreadsheet size={16} className="text-green-400" />;
    } else {
      return <File size={16} className="text-gray-400" />;
    }
  };

  if (componentLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48 bg-gray-700" />
        </div>

        {/* Mode Toggle Skeleton */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 flex">
          <Skeleton className="h-10 flex-1 bg-gray-700" />
          <Skeleton className="h-10 flex-1 bg-gray-700 ml-2" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-24 bg-gray-700" />
                <Skeleton className="h-5 w-5 bg-gray-700" />
              </div>
              <Skeleton className="h-8 w-12 bg-gray-700" />
              <Skeleton className="h-3 w-32 mt-2 bg-gray-700" />
            </div>
          ))}
        </div>

        {/* Upload Area Skeleton */}
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-gray-900 p-10">
          <Skeleton className="h-20 w-20 rounded-full bg-gray-700 mb-4" />
          <Skeleton className="h-6 w-64 bg-gray-700 mb-2" />
          <Skeleton className="h-4 w-48 bg-gray-700 mb-6" />
          <Skeleton className="h-12 w-32 bg-gray-700" />
        </div>

        {/* Document List Skeleton */}
        <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-40 bg-gray-700" />
            <Skeleton className="h-8 w-24 bg-gray-700" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 rounded-lg border border-gray-700">
                <Skeleton className="h-10 w-10 rounded-full bg-gray-700" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48 bg-gray-700" />
                  <Skeleton className="h-3 w-32 bg-gray-700" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-16 bg-gray-700" />
                  <Skeleton className="h-8 w-16 bg-gray-700" />
                  <Skeleton className="h-8 w-16 bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Data Input</h1>
      </div>

      {/* Mode Toggle */}
      <div className="bg-gray-900 border border-yellow-700/30 rounded-lg p-2 flex">
        <button
          onClick={() => setInputMode("file")}
          className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center ${
            inputMode === "file"
              ? "bg-gradient-to-r from-yellow-600 to-amber-500 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <FileUp size={18} className="mr-2" />
          File Upload
        </button>
        <button
          onClick={() => setInputMode("manual")}
          className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center ${
            inputMode === "manual"
              ? "bg-gradient-to-r from-yellow-600 to-amber-500 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <PenLine size={18} className="mr-2" />
          Manual Entry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-yellow-700/30 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Documents</h3>
            <FileSpreadsheet className="h-5 w-5 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">{files.length}</p>
          <p className="text-sm text-yellow-400 mt-2 flex items-center">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span>Upload new documents</span>
          </p>
        </div>

        <div className="bg-gray-900 border border-yellow-700/30 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Manual Entries</h3>
            <Calculator className="h-5 w-5 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-sm text-yellow-400 mt-2 flex items-center">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span>Add new transaction</span>
          </p>
        </div>
      </div>

      {/* Conditional */}
      {inputMode === "file" ? (
        <>
          {/* Upload Area */}
          <div
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed ${
              dragActive ? "border-yellow-500 bg-gray-800/50" : "border-gray-700"
            } bg-gray-900 p-10 shadow-md transition-colors`}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-900/30">
              <Upload className="h-10 w-10 text-yellow-400" />
            </div>
            <p className="mb-2 text-xl font-medium text-white">
              Drag and drop your files here
            </p>
            <p className="mb-6 text-sm text-gray-400">or click to browse</p>
            <input type="file" onChange={onFileUpload} className="hidden" id="fileInput" />
            <label
              htmlFor="fileInput"
              className="cursor-pointer rounded-lg bg-gradient-to-r from-yellow-600 to-amber-500 px-6 py-3 text-base font-medium text-white hover:opacity-90 transition-all"
            >
              Choose File
            </label>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="flex items-center rounded-lg bg-red-900/30 border border-red-800 p-4 text-sm text-red-300 shadow-sm">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Progress */}
          {fileTransferProgress && (
            <div className="rounded-lg bg-gray-900 border border-yellow-700/30 p-6 shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-base font-medium text-white">
                  {fileTransferProgress.mode} {fileTransferProgress.fileName}
                </span>
                <span className="text-base font-medium text-yellow-400">
                  {fileTransferProgress.progress}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-800">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-yellow-600 to-amber-500 transition-all duration-300"
                  style={{ width: `${fileTransferProgress.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Document List */}
          <div className="rounded-xl bg-gray-900 border border-yellow-700/30 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Your Documents</h2>
              {files.length > 0 && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleProcessAllFiles}
                    className="px-3 py-2 bg-yellow-900/30 text-yellow-400 rounded-md hover:bg-yellow-900/50 flex items-center text-sm"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Process All
                  </button>
                </div>
              )}
            </div>

            {/* FIX: loading hanya muncul kalau ada file yang sedang di-load */}
            {isLoading && files.length > 0 ? (
              <div className="space-y-4">
                {[1,2,3].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 rounded-lg border border-gray-700">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="py-16 text-center">
                <FileSpreadsheet className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                <p className="text-lg text-gray-400">
                  You have no documents yet. Upload some to get started!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800">
                        {getFileIcon(file.name)}
                      </div>
                      <span className="text-base font-medium text-white">
                        {file.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:w-auto">
                      <button
                        onClick={() => handlePreviewFile(file)}
                        className="flex items-center justify-center rounded-lg bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-900/50 transition"
                      >
                        <Eye size={16} className="mr-1" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleFileDownload(file.name)}
                        className="flex items-center justify-center rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-yellow-400 hover:bg-gray-700 transition"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => {
                          setProcessingFileName(file.name);
                          setShowWorkflowProgress(true);
                        }}
                        className="flex items-center justify-center rounded-lg bg-gradient-to-r from-yellow-600 to-amber-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
                      >
                        🤖 AI Process
                      </button>
                      <button
                        onClick={() => handleFileDelete(file.name)}
                        className="flex items-center justify-center rounded-lg bg-red-900/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/50 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <ManualDataInput onSaveData={handleSaveManualData} />
      )}

      {/* AI Workflow Progress Modal */}
      {showWorkflowProgress && (
        <AIWorkflowProgress
          fileName={processingFileName}
          onComplete={(results) => {
            setShowWorkflowProgress(false);
            // Refresh data or show success message
            if (window.location) {
              window.location.reload(); // Simple refresh for now
            }
          }}
          onError={(error) => {
            setShowWorkflowProgress(false);
            console.error('Workflow error:', error);
            // Could show error toast here
          }}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                Preview: {previewFile.name}
              </h3>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewFile(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 max-h-[calc(90vh-80px)] overflow-auto">
              {(() => {
                const PreviewComponent = getPreviewComponent(previewFile.name);
                return <PreviewComponent url={previewFile.url || `/api/files/${previewFile.name}`} />;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataInput;
