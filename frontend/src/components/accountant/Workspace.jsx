import React, { useState, useRef, useEffect } from "react";
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Download,
  FileText,
  BarChart3,
  Receipt,
  ClipboardCheck,
  MoreHorizontal,
  MoveHorizontal,
  Eye,
} from "lucide-react";
import FilePreview from "./FilePreview";

const Workspace = ({
  files,
  handleFileDownload,
  handleFileDelete,
  handleFileProcessing,
  analyzingFile,
}) => {
  // Initial folder structure based on the image
  const [folderStructure, setFolderStructure] = useState({
    Financial_Reports: {
      expanded: false,
      description:
        "All main financial reports (Balance Sheet, Income Statement, etc.)",
      purpose: "For stakeholders (investors, board, auditors)",
      files: [],
    },
    Managerial_Reports: {
      expanded: false,
      description: "All reports for internal use (performance, cost, forecast)",
      purpose: "For CEO, managers, decision making",
      files: [],
    },
    Tax_Reports: {
      expanded: false,
      description: "Official tax reports for the government",
      purpose: "For tax compliance and SPT reporting",
      files: [],
    },
    Compliance_Documents: {
      expanded: false,
      description:
        "Audit reports, proof of tax compliance, internal control documents",
      purpose: "For legal proof and external reviews",
      files: [],
    },
    Uncategorized: {
      expanded: true,
      description: "Files that have not been categorized yet",
      purpose: "Temporary storage for new uploads",
      files: files || [],
    },
  });

  // Update Uncategorized folder when files prop changes
  useEffect(() => {
    if (files && files.length > 0) {
      // Only add files that don't already exist in any folder
      const allExistingFiles = new Set();

      // Collect all files from all folders
      Object.values(folderStructure).forEach((folder) => {
        folder.files.forEach((file) => {
          allExistingFiles.add(file.name);
        });
      });

      // Filter out files that already exist in any folder
      const newFiles = files.filter((file) => !allExistingFiles.has(file.name));

      if (newFiles.length > 0) {
        setFolderStructure((prev) => ({
          ...prev,
          Uncategorized: {
            ...prev["Uncategorized"],
            files: [...prev["Uncategorized"].files, ...newFiles],
          },
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // State for the currently selected file
  const [selectedFile, setSelectedFile] = useState(null);

  // State for the folder being renamed or created
  const [editingFolder, setEditingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");

  // Drag and drop states
  const [draggedFile, setDraggedFile] = useState(null);
  const [draggedFileFolder, setDraggedFileFolder] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const dragCounter = useRef(0);

  // Toggle folder expansion
  const toggleFolder = (folderName) => {
    setFolderStructure((prev) => ({
      ...prev,
      [folderName]: {
        ...prev[folderName],
        expanded: !prev[folderName].expanded,
      },
    }));
  };

  // Create a new folder
  const createFolder = () => {
    setEditingFolder("new");
    setNewFolderName("New_Folder");
  };

  // Save a new folder
  const saveNewFolder = () => {
    if (newFolderName.trim() && !folderStructure[newFolderName]) {
      setFolderStructure((prev) => ({
        ...prev,
        [newFolderName]: {
          expanded: false,
          description: "Custom folder",
          purpose: "User defined purpose",
          files: [],
        },
      }));
      setEditingFolder(null);
      setNewFolderName("");
    }
  };

  // Rename a folder
  const renameFolder = (oldName) => {
    setEditingFolder(oldName);
    setNewFolderName(oldName);
  };

  // Save folder rename
  const saveFolderRename = (oldName) => {
    if (
      newFolderName.trim() &&
      !folderStructure[newFolderName] &&
      newFolderName !== oldName
    ) {
      const { [oldName]: folderToRename, ...restFolders } = folderStructure;
      setFolderStructure({
        ...restFolders,
        [newFolderName]: folderToRename,
      });
    }
    setEditingFolder(null);
    setNewFolderName("");
  };

  // Delete a folder
  const deleteFolder = (folderName) => {
    if (folderName === "Uncategorized") {
      return; // Prevent deletion of the Uncategorized folder
    }

    // Move files from the deleted folder to Uncategorized
    const filesToMove = folderStructure[folderName].files;

    setFolderStructure((prev) => {
      const { [folderName]: _, ...rest } = prev;
      return {
        ...rest,
        Uncategorized: {
          ...prev.Uncategorized,
          files: [...prev.Uncategorized.files, ...filesToMove],
        },
      };
    });
  };

  // Move a file to a folder
  const moveFileToFolder = (fileName, targetFolder) => {
    // Find which folder currently contains the file
    let sourceFolder = null;
    let fileToMove = null;

    Object.keys(folderStructure).forEach((folder) => {
      const fileIndex = folderStructure[folder].files.findIndex(
        (file) => file.name === fileName
      );
      if (fileIndex !== -1) {
        sourceFolder = folder;
        fileToMove = folderStructure[folder].files[fileIndex];
      }
    });

    if (sourceFolder && fileToMove) {
      // Remove from source folder and add to target folder
      setFolderStructure((prev) => {
        const updatedSourceFiles = prev[sourceFolder].files.filter(
          (file) => file.name !== fileName
        );
        const updatedTargetFiles = [...prev[targetFolder].files, fileToMove];

        return {
          ...prev,
          [sourceFolder]: {
            ...prev[sourceFolder],
            files: updatedSourceFiles,
          },
          [targetFolder]: {
            ...prev[targetFolder],
            files: updatedTargetFiles,
          },
        };
      });
    }
  };

  // Check if a file has been processed
  const isFileProcessed = (fileName) => {
    const processedFiles = JSON.parse(
      localStorage.getItem("processedFiles") || "[]"
    );
    return processedFiles.includes(fileName);
  };

  // Get appropriate icon for file type
  const getFileIcon = (fileName) => {
    // Check if this is a manual entry PDF (follows our naming pattern)
    const isManualEntry =
      fileName.startsWith("Transaction_") ||
      fileName.match(/^\d{4}-\d{2}-\d{2}_[A-Z][a-z]+/);

    if (isManualEntry) {
      return <Receipt size={16} className="text-green-400" />;
    }

    const extension = fileName.split(".").pop().toLowerCase();

    if (["pdf", "doc", "docx", "txt"].includes(extension)) {
      return <FileText size={16} className="text-blue-400" />;
    } else if (["xls", "xlsx", "csv"].includes(extension)) {
      return <BarChart3 size={16} className="text-green-400" />;
    } else if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
      return <File size={16} className="text-purple-400" />;
    } else if (
      ["tax", "spt"].includes(extension) ||
      fileName.toLowerCase().includes("tax")
    ) {
      return <Receipt size={16} className="text-red-400" />;
    } else if (
      fileName.toLowerCase().includes("audit") ||
      fileName.toLowerCase().includes("compliance")
    ) {
      return <ClipboardCheck size={16} className="text-yellow-400" />;
    } else {
      return <File size={16} className="text-gray-400" />;
    }
  };

  // Render folder context menu
  const renderFolderMenu = (folderName) => {
    return (
      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
        <div className="py-1" role="menu" aria-orientation="vertical">
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
            onClick={() => renameFolder(folderName)}
          >
            Rename
          </button>
          {folderName !== "Uncategorized" && (
            <button
              className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
              onClick={() => deleteFolder(folderName)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render file context menu
  const renderFileMenu = (file, folderName) => {
    return (
      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
        <div className="py-1" role="menu" aria-orientation="vertical">
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
            onClick={() => handleFileDownload(file.name)}
          >
            Download
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
            onClick={() => handleFileProcessing(file.name)}
            disabled={analyzingFile === file.name}
          >
            {analyzingFile === file.name
              ? "Processing..."
              : isFileProcessed(file.name)
              ? "Process Again"
              : "Process to Log Trails"}
          </button>
          <div className="border-t border-gray-700 my-1"></div>
          <div className="px-4 py-2 text-xs text-gray-500">Move to folder:</div>
          {Object.keys(folderStructure)
            .filter((folder) => folder !== folderName)
            .map((folder) => (
              <button
                key={folder}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                onClick={() => moveFileToFolder(file.name, folder)}
              >
                {folder}
              </button>
            ))}
          <div className="border-t border-gray-700 my-1"></div>
          <button
            className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
            onClick={() => handleFileDelete(file.name)}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  // State for context menus
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    type: null, // 'folder' or 'file'
    item: null,
    folder: null,
    x: 0,
    y: 0,
  });

  // State for file preview
  const [previewFile, setPreviewFile] = useState(null);

  // Handle right-click on folder or file
  const handleContextMenu = (e, type, item, folder = null) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      type,
      item,
      folder,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Close context menu when clicking elsewhere
  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      type: null,
      item: null,
      folder: null,
      x: 0,
      y: 0,
    });
  };

  // Drag and drop handlers
  const handleFileDragStart = (e, file, folderName) => {
    setDraggedFile(file);
    setDraggedFileFolder(folderName);

    // Create a ghost image for dragging
    const ghostElement = document.createElement("div");
    ghostElement.classList.add(
      "bg-gray-800",
      "text-white",
      "px-2",
      "py-1",
      "rounded",
      "text-sm",
      "opacity-80"
    );
    ghostElement.innerText = file.name;
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 0, 0);

    // Set data for the drag operation
    e.dataTransfer.setData("text/plain", file.name);
    e.dataTransfer.effectAllowed = "move";

    // Remove the ghost element after it's been used
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };

  const handleFolderDragEnter = (e, folderName) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;

    if (draggedFile && draggedFileFolder !== folderName) {
      setDragOverFolder(folderName);
    }
  };

  const handleFolderDragLeave = (e, folderName) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;

    if (dragCounter.current === 0) {
      setDragOverFolder(null);
    }
  };

  const handleFolderDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleFolderDrop = (e, targetFolder) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragOverFolder(null);

    if (draggedFile && draggedFileFolder !== targetFolder) {
      moveFileToFolder(draggedFile.name, targetFolder);
    }

    setDraggedFile(null);
    setDraggedFileFolder(null);
  };

  const handleDragEnd = () => {
    setDraggedFile(null);
    setDraggedFileFolder(null);
    setDragOverFolder(null);
    dragCounter.current = 0;
  };

  // File preview handlers
  const openFilePreview = async (file) => {
    try {
      // Show loading indicator
      setPreviewFile({ name: file.name, loading: true });

      // We need to fetch the actual file data from the backend
      // This is similar to the handleFileDownload function in App.jsx

      // Since we don't have direct access to the actor here, we'll use the handleFileDownload function
      // But we need to modify our approach to get the actual file data

      // First, let's check the file extension
      const fileExtension = file.name.split(".").pop().toLowerCase();

      // List of file types we can preview
      const previewableTypes = [
        "pdf",
        "jpg",
        "jpeg",
        "png",
        "gif",
        "csv",
        "txt",
        "xlsx",
        "xls",
        "docx",
        "doc",
      ];

      if (previewableTypes.includes(fileExtension)) {
        // For these file types, we'll try to get the actual file data
        // We'll use the handleFileDownload function but modify it to not trigger a download
        console.log(`Fetching ${file.name} for preview...`);

        handleFileDownload(file.name, true)
          .then((fileBlob) => {
            if (fileBlob) {
              console.log(
                `Successfully fetched blob for ${file.name}`,
                fileBlob
              );
              setPreviewFile({
                name: file.name,
                blob: fileBlob,
                type: fileExtension,
              });
            } else {
              console.log(`No blob returned for ${file.name}`);
              // Fallback to placeholder if we couldn't get the file data
              setPreviewFile({
                name: file.name,
                isPreviewPlaceholder: true,
                type: fileExtension,
              });
            }
          })
          .catch((error) => {
            console.error("Error fetching file for preview:", error);
            setPreviewFile({
              name: file.name,
              isPreviewPlaceholder: true,
              type: fileExtension,
            });
          });
      } else {
        console.log(`File type ${fileExtension} is not previewable`);
        // For other file types, just show the placeholder
        setPreviewFile({
          name: file.name,
          isPreviewPlaceholder: true,
          type: fileExtension,
        });
      }
    } catch (error) {
      console.error("Error preparing file preview:", error);
      setPreviewFile(null);
    }
  };

  const closeFilePreview = () => {
    setPreviewFile(null);
  };

  return (
    <div className="space-y-6" onClick={closeContextMenu}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Workspace</h1>
        <button
          onClick={createFolder}
          className="flex items-center px-3 py-1 text-sm font-medium rounded-md bg-yellow-500 text-white hover:bg-yellow-600 transition-colors shadow-md"
        >
          <Plus size={16} className="mr-1 text-white" />
          New Folder
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-blue-900/30 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Total Folders</h3>
            <Folder className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">
            {Object.keys(folderStructure).length}
          </p>
        </div>

        <div className="bg-gray-900 border border-blue-900/30 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Total Files</h3>
            <FileText className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            {Object.values(folderStructure).reduce(
              (total, folder) => total + folder.files.length,
              0
            )}
          </p>
        </div>

        <div className="bg-gray-900 border border-blue-900/30 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Uncategorized</h3>
            <File className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            {folderStructure.Uncategorized.files.length}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-gray-900 border border-blue-900/30 p-6 shadow-lg">
        <h2 className="mb-6 text-xl font-bold text-white">File Explorer</h2>

        <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3 mb-4 flex items-center">
          <MoveHorizontal size={18} className="text-yellow-400 mr-2" />
          <p className="text-sm text-yellow-300">
            <span className="font-medium text-yellow-400">Pro Tip:</span> Drag and drop files
            between folders to organize your documents.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-300">Name</div>
            <div className="text-sm font-medium text-gray-300">Description</div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {/* Folder creation input */}
            {editingFolder === "new" && (
              <div className="flex items-center px-4 py-2 border-b border-gray-700">
                <Folder size={16} className="text-white mr-2" />
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveNewFolder()}
                  onBlur={saveNewFolder}
                  autoFocus
                  className="bg-gray-700 text-white px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Folders and files */}
            {Object.entries(folderStructure).map(([folderName, folder]) => (
              <div
                key={folderName}
                className="border-b border-gray-700 last:border-0"
              >
                {/* Folder row */}
                <div
                  className={`flex items-center justify-between px-4 py-2 hover:bg-gray-700 cursor-pointer ${
                    dragOverFolder === folderName
                      ? "bg-blue-900/30 border border-blue-500/50"
                      : ""
                  }`}
                  onClick={() => toggleFolder(folderName)}
                  onContextMenu={(e) =>
                    handleContextMenu(e, "folder", folderName)
                  }
                  onDragEnter={(e) => handleFolderDragEnter(e, folderName)}
                  onDragLeave={(e) => handleFolderDragLeave(e, folderName)}
                  onDragOver={handleFolderDragOver}
                  onDrop={(e) => handleFolderDrop(e, folderName)}
                >
                  <div className="flex items-center">
                    {folder.expanded ? (
                      <ChevronDown size={16} className="text-gray-400 mr-1" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400 mr-1" />
                    )}
                    <Folder size={16} className="text-white mr-2" />

                    {editingFolder === folderName ? (
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && saveFolderRename(folderName)
                        }
                        onBlur={() => saveFolderRename(folderName)}
                        autoFocus
                        className="bg-gray-700 text-white px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-white">{folderName}</span>
                    )}

                    <span className="ml-2 text-xs text-gray-500">
                      ({folder.files.length}{" "}
                      {folder.files.length === 1 ? "file" : "files"})
                    </span>
                  </div>

                  <div className="text-sm text-gray-400 truncate max-w-xs hidden md:block">
                    {folder.description}
                  </div>

                  <button
                    className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, "folder", folderName);
                    }}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {/* Files in folder */}
                {folder.expanded && folder.files.length > 0 && (
                  <div className="pl-8 border-t border-gray-700 bg-gray-800/50">
                    {folder.files.map((file) => (
                      <div
                        key={file.name}
                        className={`flex items-center justify-between px-4 py-2 hover:bg-gray-700 cursor-pointer ${
                          selectedFile === file.name ? "bg-gray-700" : ""
                        } ${draggedFile === file ? "opacity-50" : ""}`}
                        onClick={() => setSelectedFile(file.name)}
                        onContextMenu={(e) =>
                          handleContextMenu(e, "file", file, folderName)
                        }
                        draggable="true"
                        onDragStart={(e) =>
                          handleFileDragStart(e, file, folderName)
                        }
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-center">
                          {getFileIcon(file.name)}
                          <div className="ml-2">
                            <span className="text-gray-300">{file.name}</span>
                            {isFileProcessed(file.name) && (
                              <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-900/50 text-green-400 rounded-full">
                                Processed
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            className="text-gray-400 hover:text-green-400 p-1 rounded-full hover:bg-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              openFilePreview(file);
                            }}
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="text-gray-400 hover:text-blue-400 p-1 rounded-full hover:bg-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileDownload(file.name);
                            }}
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            className="text-gray-400 hover:text-purple-400 p-1 rounded-full hover:bg-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Show context menu with move options
                              handleContextMenu(e, "file", file, folderName);
                            }}
                            title="Move to folder"
                          >
                            <MoveHorizontal size={16} />
                          </button>
                          <button
                            className="text-gray-400 hover:text-red-400 p-1 rounded-full hover:bg-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileDelete(file.name);
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContextMenu(e, "file", file, folderName);
                            }}
                            title="More options"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty folder message */}
                {folder.expanded && folder.files.length === 0 && (
                  <div className="pl-8 py-2 text-sm text-gray-500 border-t border-gray-700 bg-gray-800/50">
                    This folder is empty
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {contextMenu.type === "folder" && renderFolderMenu(contextMenu.item)}
          {contextMenu.type === "file" &&
            renderFileMenu(contextMenu.item, contextMenu.folder)}
        </div>
      )}

      {/* File Preview */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={closeFilePreview}
          onDownload={() => handleFileDownload(previewFile.name)}
        />
      )}
    </div>
  );
};

export default Workspace;
