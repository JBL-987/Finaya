import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCw,
  FileText,
  Image,
  FileSpreadsheet,
  FileText as FileTextIcon,
  File,
} from "lucide-react";
import CSVPreview from "./CSVpreview";
import ExcelPreview from "./ExcelPreview";
import DocxPreview from "./DocxPreview";

const FilePreview = ({ file, onClose, onDownload }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileType, setFileType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (file) {
      console.log("FilePreview: File object received:", file);

      // Handle loading state
      if (file.loading) {
        setLoading(true);
        setError(null);
        return;
      }

      // Handle placeholder case (when we don't have the actual file data)
      if (file.isPreviewPlaceholder) {
        console.log("FilePreview: Using placeholder for", file.name);
        setFileType(file.type || "");
        setLoading(false);
        return;
      }

      // Check if we have a blob property (from our custom fetch)
      if (file.blob && file.blob instanceof Blob) {
        console.log(
          "FilePreview: Creating URL from blob for",
          file.name,
          file.blob.type,
          file.blob.size
        );

        // Create object URL for the blob
        const url = URL.createObjectURL(file.blob);
        console.log("FilePreview: Created URL:", url);

        setPreviewUrl(url);
        setFileType(file.type || file.name.split(".").pop().toLowerCase());
        setLoading(false);

        // Clean up URL when component unmounts
        return () => {
          console.log("FilePreview: Cleaning up URL:", url);
          URL.revokeObjectURL(url);
        };
      }
      // Check if file itself is a Blob or File object
      else if (file instanceof Blob || file instanceof File) {
        console.log("FilePreview: File is a Blob/File object");

        // Create object URL for the file
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setFileType(file.name.split(".").pop().toLowerCase());
        setLoading(false);

        // Clean up URL when component unmounts
        return () => {
          URL.revokeObjectURL(url);
        };
      } else {
        console.log(
          "FilePreview: File is not a Blob or doesn't have a blob property:",
          file
        );
        // If file is not a Blob (just a metadata object), we need to fetch the actual file data
        setLoading(false);
        setError("Preview not available. Please download the file to view it.");
      }
    }
  }, [file]);

  // Handle errors
  const handleError = (error, fileType) => {
    console.error(`Error loading ${fileType}:`, error);
    setError(
      `Failed to load ${fileType}. The file might be corrupted or not supported by your browser.`
    );
    setLoading(false);
  };

  // Zoom functions
  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  };

  // Rotation function
  const rotateClockwise = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  // Reset view function
  const resetView = () => {
    setScale(1);
    setRotation(0);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Render preview based on file type
  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-400 text-center p-4">
            <p>{error}</p>
          </div>
        </div>
      );
    }

    // Handle placeholder case (when we don't have the actual file data)
    if (file.isPreviewPlaceholder) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
            <span className="text-sm text-gray-300">File Preview</span>
          </div>
          <div className="flex-1 overflow-auto bg-gray-900 p-4">
            <div className="bg-gray-800 rounded p-4 text-gray-300 flex flex-col items-center justify-center h-full">
              <div className="bg-blue-900/20 p-6 rounded-lg mb-4">
                <FileText size={48} className="text-blue-400 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-medium text-white mb-4">
                Preview Not Available
              </h3>
              <p className="text-center mb-6 max-w-md">
                Direct file preview is not available in this version. We're
                working on adding this feature soon.
              </p>
              <button
                onClick={onDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download size={16} className="mr-2" />
                Download {file.name}
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (fileType) {
      case "pdf":
        return (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">PDF Preview</span>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-900 p-4">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  title={file.name}
                  className="w-full h-full border-0 rounded"
                  style={{
                    minHeight: "500px",
                    backgroundColor: "white",
                  }}
                />
              ) : (
                <div className="bg-gray-800 rounded p-4 text-gray-300 flex flex-col items-center justify-center h-full">
                  <div className="bg-blue-900/20 p-6 rounded-lg mb-4">
                    <FileText
                      size={48}
                      className="text-blue-400 mx-auto mb-4"
                    />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-4">
                    PDF Preview
                  </h3>
                  <p className="text-center mb-6 max-w-md">
                    PDF preview is available in most modern browsers. If you're
                    seeing this message, your browser might not support inline
                    PDF viewing.
                  </p>
                  <button
                    onClick={onDownload}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Download size={16} className="mr-2" />
                    Download {file.name}
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Image Preview</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={zoomOut}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
                  title="Zoom Out"
                >
                  <span className="text-lg font-bold">-</span>
                </button>
                <span className="text-sm text-gray-300">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
                  title="Zoom In"
                >
                  <span className="text-lg font-bold">+</span>
                </button>
                <button
                  onClick={rotateClockwise}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
                  title="Rotate"
                >
                  <RotateCw size={16} />
                </button>
                <button
                  onClick={resetView}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
                  title="Reset View"
                >
                  <span className="text-xs font-bold">100%</span>
                </button>
                <button
                  onClick={onDownload}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-900 p-4 file-preview-content">
              <div className="image-preview-container">
                <img
                  src={previewUrl}
                  alt={file.name}
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                    maxWidth: scale <= 1 ? "100%" : "none",
                    maxHeight: scale <= 1 ? "100%" : "none",
                    objectFit: "contain",
                  }}
                  className="transition-transform duration-200"
                />
              </div>
            </div>
          </div>
        );

      case "csv":
        return (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
              <span className="text-sm text-gray-300">CSV Preview</span>
            </div>
            <div className="flex-1 overflow-auto bg-gray-900 p-4">
              {previewUrl ? (
                <div
                  className="bg-white rounded overflow-auto"
                  style={{ maxHeight: "calc(80vh - 100px)" }}
                >
                  <CSVPreview url={previewUrl} />
                </div>
              ) : (
                <div className="bg-gray-800 rounded p-4 text-gray-300 flex flex-col items-center justify-center h-full">
                  <div className="bg-blue-900/20 p-6 rounded-lg mb-4">
                    <FileSpreadsheet
                      size={48}
                      className="text-blue-400 mx-auto mb-4"
                    />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-4">
                    CSV Preview
                  </h3>
                  <p className="text-center mb-6 max-w-md">
                    {loading
                      ? "Loading CSV data..."
                      : "Unable to load CSV data. Please try downloading the file instead."}
                  </p>
                  {!loading && (
                    <button
                      onClick={onDownload}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Download size={16} className="mr-2" />
                      Download {file.name}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case "xlsx":
      case "xls":
        return (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
              <span className="text-sm text-gray-300">
                Excel Spreadsheet Preview
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onDownload}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Download Excel file"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Close preview"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-900 p-4">
              {previewUrl ? (
                <div
                  className="bg-white rounded overflow-auto"
                  style={{ maxHeight: "calc(80vh - 100px)" }}
                >
                  <ExcelPreview url={previewUrl} />
                </div>
              ) : (
                <div className="bg-gray-800 rounded p-4 text-gray-300 flex flex-col items-center justify-center h-full">
                  <div className="bg-blue-900/20 p-6 rounded-lg mb-4">
                    <FileSpreadsheet
                      size={48}
                      className="text-blue-400 mx-auto mb-4"
                    />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-4">
                    Excel Spreadsheet Preview
                  </h3>
                  <p className="text-center mb-6 max-w-md">
                    {loading
                      ? "Loading Excel data..."
                      : "Excel files require specialized libraries to parse. Please download the file to view it in Excel."}
                  </p>
                  <button
                    onClick={onDownload}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Download size={16} className="mr-2" />
                    Download {file.name}
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case "doc":
      case "docx":
        return (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
              <span className="text-sm text-gray-300">Document Preview</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onDownload}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Download document"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Close preview"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="bg-blue-900/20 px-3 py-2 text-xs text-blue-300 flex items-center">
              <span className="mr-1">💡</span>
              <span>
                DOCX files are previewed using mammoth.js. Some formatting may
                be lost. Download for best results.
              </span>
            </div>
            <div className="flex-1 overflow-auto bg-gray-900 p-4">
              {previewUrl ? (
                <div
                  className="bg-white rounded overflow-auto"
                  style={{ maxHeight: "calc(80vh - 100px)" }}
                >
                  <DocxPreview url={previewUrl} />
                </div>
              ) : (
                <div className="bg-gray-800 rounded p-4 text-gray-300 flex flex-col items-center justify-center h-full">
                  <div className="bg-blue-900/20 p-6 rounded-lg mb-4">
                    <FileText
                      size={48}
                      className="text-blue-400 mx-auto mb-4"
                    />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-4">
                    Document Preview
                  </h3>
                  <p className="text-center mb-6 max-w-md">
                    {loading
                      ? "Loading document..."
                      : "Unable to preview this document. Please download the file to view it in Microsoft Word or another word processor."}
                  </p>
                  <button
                    onClick={onDownload}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Download size={16} className="mr-2" />
                    Download {file.name}
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case "txt":
        return (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
              <span className="text-sm text-gray-300">Text File Preview</span>
            </div>
            <div className="flex-1 overflow-auto bg-gray-900 p-4">
              <iframe
                src={previewUrl}
                title={file.name}
                className="w-full h-full bg-white rounded"
                style={{ minHeight: "400px" }}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
              <span className="text-sm text-gray-300">File Preview</span>
            </div>
            <div className="flex-1 overflow-auto bg-gray-900 p-4">
              <div className="bg-gray-800 rounded p-4 text-gray-300">
                <p className="mb-4">
                  Preview is not available for this file type.
                </p>
                <p>
                  Please download the file to view it in an appropriate
                  application.
                </p>
                <button
                  onClick={onDownload}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Download size={16} className="mr-2" />
                  Download {file.name}
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  // Add CSS for image preview
  React.useEffect(() => {
    // Add CSS for better image preview scrolling
    const style = document.createElement("style");
    style.textContent = `
      .file-preview-container {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .file-preview-content {
        flex: 1;
        position: relative;
        overflow: auto;
      }

      .image-preview-container {
        min-height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .image-preview-container img {
        transition: transform 0.2s ease;
      }

      /* When zoomed in, allow scrolling */
      .zoomed-in {
        overflow: auto !important;
      }

      .zoomed-in .image-preview-container {
        min-width: max-content;
        min-height: max-content;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 ${
        isFullscreen ? "fullscreen" : ""
      }`}
    >
      <div
        className={`bg-gray-900 border border-gray-700 rounded-lg shadow-xl flex flex-col ${
          isFullscreen
            ? "w-full h-full rounded-none"
            : "max-w-5xl w-full max-h-[90vh]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white truncate max-w-md">
            {file?.name}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onDownload}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white"
              title="Download"
            >
              <Download size={18} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-auto ${scale > 1 ? "zoomed-in" : ""}`}>
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;