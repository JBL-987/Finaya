import React, { useState, useEffect } from "react";
import { Skeleton } from "../ui/Skeleton";
import { FileText } from "lucide-react";
import mammoth from "mammoth";

const DocxPreview = ({ url }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    if (!url) {
      console.error("No URL provided to DocxPreview component");
      setError("No URL provided for DOCX preview");
      setLoading(false);
      return;
    }

    console.log("DocxPreview: Fetching DOCX file from URL:", url);

    const fetchDocx = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch the DOCX data from the URL
        console.log("DocxPreview: Starting fetch request");
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch DOCX file: ${response.statusText}`);
        }

        // Check the content type
        const contentType = response.headers.get("content-type");
        console.log("DocxPreview: Response content type:", contentType);

        // Get the response as blob first to inspect it
        const blob = await response.blob();
        console.log("DocxPreview: Blob received:", blob.type, blob.size);

        setDebugInfo((prev) => ({
          ...prev,
          blobType: blob.type,
          blobSize: blob.size,
          contentType,
        }));

        // Convert blob to array buffer
        const arrayBuffer = await blob.arrayBuffer();
        console.log("DocxPreview: ArrayBuffer size:", arrayBuffer.byteLength);

        try {
          // Use mammoth.js to convert the DOCX to HTML
          console.log("DocxPreview: Converting DOCX to HTML with mammoth.js");

          // Check if this is actually a DOCX file by looking at the first few bytes
          const header = new Uint8Array(arrayBuffer.slice(0, 4));
          const headerHex = Array.from(header)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          console.log("DocxPreview: File header (hex):", headerHex);

          setDebugInfo((prev) => ({
            ...prev,
            fileHeader: headerHex,
            arrayBufferSize: arrayBuffer.byteLength,
          }));

          // DOCX files are ZIP files and should start with PK (50 4B)
          if (headerHex.startsWith("504b")) {
            console.log(
              "DocxPreview: File appears to be a valid ZIP/DOCX file"
            );
            const result = await mammoth.convertToHtml({ arrayBuffer });
            console.log("DocxPreview: Conversion successful");

            // Set the HTML content
            setHtmlContent(result.value);
            setLoading(false);
          } else {
            console.error(
              "DocxPreview: File does not appear to be a valid DOCX file"
            );
            throw new Error(
              "The file does not appear to be a valid DOCX document"
            );
          }
        } catch (conversionError) {
          console.error(
            "DocxPreview: Error converting DOCX to HTML:",
            conversionError
          );
          setDebugInfo((prev) => ({
            ...prev,
            conversionError: conversionError.message,
            stack: conversionError.stack,
          }));
          throw new Error(
            `Failed to convert DOCX file: ${conversionError.message}`
          );
        }
      } catch (err) {
        console.error("DocxPreview: Error processing DOCX:", err);
        setError(`Failed to load DOCX file: ${err.message}`);
        setDebugInfo((prev) => ({
          ...prev,
          finalError: err.message,
          stack: err.stack,
        }));
        setLoading(false);
      }
    };

    fetchDocx();
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-3 w-32 ml-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="mb-4 text-red-500">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>

        {Object.keys(debugInfo).length > 0 && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-xs text-gray-700 font-mono">
            <p className="font-bold mb-2">Debug Information:</p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6">
      {htmlContent ? (
        <div className="docx-content">
          <style>
            {`
              .docx-content {
                font-family: 'Calibri', 'Arial', sans-serif;
                line-height: 1.5;
                color: #333;
              }
              .docx-content h1 { font-size: 24px; margin-top: 24px; margin-bottom: 8px; }
              .docx-content h2 { font-size: 20px; margin-top: 20px; margin-bottom: 8px; }
              .docx-content h3 { font-size: 16px; margin-top: 16px; margin-bottom: 8px; }
              .docx-content p { margin-bottom: 16px; }
              .docx-content ul, .docx-content ol { margin-bottom: 16px; padding-left: 24px; }
              .docx-content table { border-collapse: collapse; margin-bottom: 16px; }
              .docx-content table, .docx-content th, .docx-content td { border: 1px solid #ddd; }
              .docx-content th, .docx-content td { padding: 8px; }
              .docx-content img { max-width: 100%; height: auto; }
            `}
          </style>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      ) : (
        <div className="text-center">
          <div className="bg-blue-50 p-6 rounded-lg mb-4 inline-block">
            <FileText size={48} className="text-blue-500 mx-auto mb-4" />
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-4">
            Document Preview
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            No content could be extracted from this document. Please download
            the file to view it in Microsoft Word or another word processor.
          </p>

          {/* Debug information */}
          {Object.keys(debugInfo).length > 0 && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-xs text-left text-gray-700 font-mono">
              <p className="font-bold mb-2">Technical Details:</p>
              <pre className="overflow-auto max-h-40">
                {JSON.stringify(
                  {
                    fileType: debugInfo.blobType,
                    fileSize: debugInfo.blobSize,
                    headerCheck: debugInfo.fileHeader?.startsWith("504b")
                      ? "Valid DOCX/ZIP header"
                      : "Invalid DOCX header",
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}

          {/* Fallback: Offer to download */}
          <div className="mt-6">
            <a
              href={url}
              download
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <FileText size={16} className="mr-2" />
              Download Document
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocxPreview;
