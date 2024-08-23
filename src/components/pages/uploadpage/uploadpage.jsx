import React, { useState, useContext, useEffect, useRef } from "react";
import Navbar from "../../navbar/navbar";
import axios from "axios";
import Footer from "../../Footer/Footer";
import "./uploadpage.css";

import { FiFilePlus } from "react-icons/fi";
import TokenContext from "../../assets/TokenContext";
import { Link } from "react-router-dom";

import {
    FaFilePdf,
    FaFileImage,
    FaFileAlt,
    FaFileVideo,
    FaFileAudio,
    FaFileCode,
    FaFileWord,
    FaFileExcel,
    FaFilePowerpoint,
    FaFileArchive,
    FaFileCsv,
} from "react-icons/fa";

const fileTypeIcons = {
    pdf: <FaFilePdf />,
    jpg: <FaFileImage />,
    jpeg: <FaFileImage />,
    png: <FaFileImage />,
    gif: <FaFileImage />,
    svg: <FaFileImage />,
    bmp: <FaFileImage />,
    txt: <FaFileAlt />,
    doc: <FaFileWord />,
    docx: <FaFileWord />,
    xls: <FaFileExcel />,
    xlsx: <FaFileExcel />,
    ppt: <FaFilePowerpoint />,
    pptx: <FaFilePowerpoint />,
    mp4: <FaFileVideo />,
    mkv: <FaFileVideo />,
    flv: <FaFileVideo />,
    webm: <FaFileVideo />,
    avchd: <FaFileVideo />,
    whm: <FaFileVideo />,
    mov: <FaFileVideo />,
    avi: <FaFileVideo />,
    wmv: <FaFileVideo />,
    mp3: <FaFileAudio />,
    wav: <FaFileAudio />,
    aac: <FaFileAudio />,
    flac: <FaFileAudio />,
    html: <FaFileCode />,
    css: <FaFileCode />,
    js: <FaFileCode />,
    jsx: <FaFileCode />,
    ts: <FaFileCode />,
    tsx: <FaFileCode />,
    json: <FaFileCode />,
    xml: <FaFileCode />,
    csv: <FaFileCsv />,
    zip: <FaFileArchive />,
    rar: <FaFileArchive />,
    "7z": <FaFileArchive />,
    tar: <FaFileArchive />,
    gz: <FaFileArchive />,
    bz2: <FaFileArchive />,
    // Add or remove file types as needed
};

function UploadPage() {
    const [files, setFiles] = useState([]);
    const [account, setAccount] = useState("");
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const contextMenuRef = useRef(null);
    const [contextMenuFileIds, setContextMenuFileIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef(null);

    const [totalUploadedSize, setTotalUploadedSize] = useState(0);
    const [uploadQueue, setUploadQueue] = useState([]);
    const { tokenBalance } = useContext(TokenContext);
    const [maxUploadSize, setMaxUploadSize] = useState(5 * 1024 * 1024 * 1024); // Default to 5GB
    const [windowSize, setWindowSize] = useState(window.innerWidth);
    const isWalletConnected = Boolean(account);

    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);
    const [greetings, setGreetings] = useState([]);
    const [startTyping, setStartTyping] = useState(false);

    const messages = ["Please select file you want to upload."];
    const tronfile = "//TRONFILEBOT: ";

    useEffect(() => {
        let timer;
        if (startTyping) {
            if (messageIndex < messages.length) {
                const currentMessage = messages[messageIndex];
                if (currentCharIndex < currentMessage.length) {
                    timer = setTimeout(() => {
                        setGreetings((prevGreetings) => {
                            const updatedGreetings = [...prevGreetings];
                            if (prevGreetings.length === messageIndex) {
                                updatedGreetings.push(
                                    currentMessage[currentCharIndex]
                                );
                            } else {
                                updatedGreetings[messageIndex] +=
                                    currentMessage[currentCharIndex];
                            }
                            return updatedGreetings;
                        });
                        setCurrentCharIndex(currentCharIndex + 1);
                    }, 40);
                } else if (messageIndex < messages.length - 1) {
                    setCurrentCharIndex(0);
                    setMessageIndex(messageIndex + 1);
                } else {
                    setStartTyping(false);
                    setCurrentCharIndex(0);
                    setMessageIndex(0);
                }
            }
        }
        return () => clearTimeout(timer);
    }, [currentCharIndex, messageIndex, messages, startTyping]);

    useEffect(() => {
        console.log("Updated tokenBalance: ", tokenBalance);
        let newSize;

        if (tokenBalance >= 30000001 && tokenBalance <= 100000000) {
            newSize = 100 * 1024 * 1024 * 1024; // 100GB
        } else if (tokenBalance >= 15000001 && tokenBalance <= 30000000) {
            newSize = 50 * 1024 * 1024 * 1024; // 50GB
        } else if (tokenBalance >= 5000001 && tokenBalance <= 15000000) {
            newSize = 10 * 1024 * 1024 * 1024; // 10GB
        } else if (tokenBalance >= 1000001 && tokenBalance <= 5000000) {
            newSize = 5 * 1024 * 1024 * 1024; // 5GB
        } else if (tokenBalance >= 100001 && tokenBalance <= 1000000) {
            newSize = 1 * 1024 * 1024 * 1024; // 1GB
        } else if (tokenBalance >= 1 && tokenBalance <= 100000) {
            newSize = 100 * 1024 * 1024; // 100MB
        } else {
            newSize = 50 * 1024 * 1024; // Default to 50MB for 0 or negative token balances
        }

        setMaxUploadSize(newSize);
    }, [tokenBalance]);

    useEffect(() => {
        const checkTronLink = async () => {
            const tronWeb = window.tronWeb;
            if (tronWeb && tronWeb.ready) {
                if (tronWeb.defaultAddress.base58) {
                    setAccount(tronWeb.defaultAddress.base58);
                }
            } else {
                console.log("Waiting for TronLink...");
                setTimeout(checkTronLink, 1000);
            }
        };

        checkTronLink();
    }, []);

    useEffect(() => {
        const tronWeb = window.tronWeb;

        const accountChanged = (account) => {
            if (account.base58) {
                setAccount(account.base58);
            } else {
                setAccount("");
            }
        };

        if (tronWeb) {
            tronWeb.on("addressChanged", accountChanged);
        }

        return () => {
            if (tronWeb) {
                tronWeb.off("addressChanged", accountChanged);
            }
        };
    }, []);

    const connectTronLink = async () => {
        const tronWeb = window.tronWeb;
        if (tronWeb) {
            if (!tronWeb.ready) {
                alert("Please log in to TronLink.");
            } else {
                setAccount(tronWeb.defaultAddress.base58);
            }
        } else {
            alert(
                "TronLink is not installed. Please install TronLink to use this feature."
            );
        }
    };

    const fetchFiles = async () => {
        if (account) {
            try {
                const response = await axios.get(
                    `https://dapp.tronfile.xyz/api/files?walletAddress=${account}`
                );
                console.log(response.data);
                setFiles(response.data);
            } catch (error) {
                console.error("Error fetching files:", error);
            }
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [account]);

    useEffect(() => {
        const handleRightClick = (event) => {
            event.preventDefault();
        };

        document.addEventListener("contextmenu", handleRightClick);
        return () => {
            document.removeEventListener("contextmenu", handleRightClick);
        };
    }, []);

    const recalculateUploadPercentage = async () => {
        await fetchTotalUploadedSize();
        fetchFiles();
    };

    const fetchTotalUploadedSize = async () => {
        if (account) {
            try {
                const response = await axios.get(
                    `https://dapp.tronfile.xyz/api/totalSize?walletAddress=${account}`
                );
                const { totalSize } = response.data;
                setTotalUploadedSize(totalSize);
            } catch (error) {
                console.error("Error fetching total uploaded size:", error);
                setTotalUploadedSize(0);
            }
        }
    };

    useEffect(() => {
        fetchTotalUploadedSize();
    }, [account]);

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        const newQueue = selectedFiles.map((file) => {
            const { token, cancel } = axios.CancelToken.source();
            const initialMessage = `//TRONFILE: ${file.name} /`;
            setGreetings((prev) => [...prev, initialMessage]);
            return {
                file,
                progress: 0,
                status: "queued",
                cancelToken: token,
                cancel,
                messageIndex: greetings.length,
            };
        });
        setUploadQueue((prevQueue) => [...prevQueue, ...newQueue]);
    };

    const updateFileProgress = (index, progress) => {
        const newQueue = [...uploadQueue];
        const fileData = newQueue[index];
        fileData.progress = progress;

        const newGreetings = [...greetings];
        const slashes = "/".repeat(progress / 10);
        newGreetings[
            fileData.messageIndex
        ] = `//TRONFILE: ${fileData.file.name} ${slashes}`;

        setUploadQueue(newQueue);
        setGreetings(newGreetings);
    };

    const updateTotalUploadedSize = () => {
        const totalSize = uploadQueue.reduce((acc, file) => {
            return acc + (file.status === "done" ? file.file.size : 0);
        }, 0);
        setTotalUploadedSize(totalSize);
    };

    const updateFileStatus = (index, status) => {
        setUploadQueue((currentQueue) =>
            currentQueue.map((file, i) =>
                i === index ? { ...file, status } : file
            )
        );
        updateTotalUploadedSize();
    };

    const toggleFileSelection = (fileId) => {
        const newSelection = new Set(selectedFiles);
        if (newSelection.has(fileId)) {
            newSelection.delete(fileId);
        } else {
            newSelection.add(fileId);
        }
        setSelectedFiles(newSelection);
    };

    const handleUpload = async () => {
        let allUploadsCompleted = true;

        const filesToUploadSize = uploadQueue.reduce(
            (acc, fileData) => acc + fileData.file.size,
            0
        );

        if (totalUploadedSize + filesToUploadSize > maxUploadSize) {
            alert("You have exceeded your allocated upload space.");
            return;
        }

        for (let i = 0; i < uploadQueue.length; i++) {
            const fileData = uploadQueue[i];
            if (fileData.status === "queued") {
                updateFileStatus(i, "uploading");

                const formData = new FormData();
                formData.append("file", fileData.file);
                formData.append("walletAddress", account);

                try {
                    await axios.post(
                        "https://dapp.tronfile.xyz/api/upload",
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                            onUploadProgress: (progressEvent) => {
                                const percentCompleted = Math.round(
                                    (progressEvent.loaded * 100) /
                                        progressEvent.total
                                );
                                updateFileProgress(i, percentCompleted);
                            },
                            cancelToken: fileData.cancelToken,
                        }
                    );

                    updateFileStatus(i, "done");
                    setTotalUploadedSize(
                        (prevSize) => prevSize + fileData.file.size
                    );
                } catch (error) {
                    if (axios.isCancel(error)) {
                        console.log("Upload canceled", error.message);
                        updateFileStatus(i, "cancelled");
                    } else {
                        console.error("Error uploading file:", error);
                        updateFileStatus(i, "error");
                    }
                    allUploadsCompleted = false;
                }
            }
        }

        const allFilesProcessed = () =>
            uploadQueue.every((file) =>
                ["done", "error", "cancelled"].includes(file.status)
            );

        const checkUploadCompletion = setInterval(() => {
            if (allFilesProcessed()) {
                clearInterval(checkUploadCompletion);
                if (allUploadsCompleted) {
                    alert("All files have been uploaded successfully!");
                    fetchFiles();
                } else {
                    alert("Some files were not uploaded successfully.");
                }
            }
        }, 500);
    };

    const handleContextMenu = (event, fileId) => {
        event.preventDefault();
        if (selectedFiles.has(fileId) || selectedFiles.size > 0) {
            const selectedFileIds =
                selectedFiles.size > 1 ? [...selectedFiles] : [fileId];
            setContextMenuFileIds(selectedFileIds);

            const menu = contextMenuRef.current;
            menu.style.top = `${event.clientY}px`;
            menu.style.left = `${event.clientX}px`;
            menu.style.display = "block";
        }
    };

    const hideContextMenu = () => {
        const menu = contextMenuRef.current;
        if (menu) {
            menu.style.display = "none";
        }
    };

    useEffect(() => {
        const allUploadsCompleted = uploadQueue.every((file) =>
            ["done", "error", "cancelled"].includes(file.status)
        );

        if (allUploadsCompleted && uploadQueue.length > 0) {
            fetchFiles();
            fetchTotalUploadedSize();
        }
    }, [uploadQueue]);

    const removeFileFromQueue = (indexToRemove) => {
        const fileData = uploadQueue[indexToRemove];

        if (fileData.status === "uploading") {
            const confirmCancel = window.confirm(
                "Do you want to cancel uploading?"
            );
            if (confirmCancel) {
                fileData.cancel("Upload cancelled by the user.");
                setUploadQueue((currentQueue) =>
                    currentQueue.filter((_, index) => index !== indexToRemove)
                );
            }
        } else {
            setUploadQueue((currentQueue) =>
                currentQueue.filter((_, index) => index !== indexToRemove)
            );
        }
    };

    const deleteFiles = async () => {
        if (selectedFiles.size === 0) {
            alert("Please select one or more files to delete.");
            return;
        }

        const fileIds = Array.from(selectedFiles);

        try {
            const response = await axios.post(
                "https://dapp.tronfile.xyz/api/delete-multiple",
                { fileIds },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.success) {
                setFiles((prevFiles) =>
                    prevFiles.filter((file) => !selectedFiles.has(file._id))
                );
                await recalculateUploadPercentage();
                setSelectedFiles(new Set());
                alert("Selected files deleted successfully!");
            } else {
                alert("Failed to delete selected files.");
            }
        } catch (error) {
            console.error("Error deleting selected files:", error);
            alert("Error deleting selected files.");
        }
        hideContextMenu();
    };

    const moveFile = (fileId) => {
        console.log("Move File", fileId);
        hideContextMenu();
    };

    const copyLink = (fileId) => {
        const file = files.find((f) => f._id === fileId);
        if (file) {
            const downloadUrl = `https://dapp.tronfile.xyz/download/${fileId}`;

            navigator.clipboard
                .writeText(downloadUrl)
                .then(() => alert("Link copied to clipboard!"))
                .catch((err) => alert("Failed to copy link. Error: " + err));
            hideContextMenu();
        } else {
            alert("File not found.");
        }
    };

    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (
                contextMenuRef.current &&
                !contextMenuRef.current.contains(e.target)
            ) {
                hideContextMenu();
            }
        };

        document.addEventListener("click", handleGlobalClick);
        return () => document.removeEventListener("click", handleGlobalClick);
    }, []);

    const closeModal = () => {
        const allDone = uploadQueue.every((file) => file.status === "done");

        setGreetings([]);
        setCurrentCharIndex(0);
        setMessageIndex(0);
        setStartTyping(false);

        setIsModalOpen(false);
        if (allDone || window.confirm("Do you want to clear your selection?")) {
            setUploadQueue([]);
        }
        fetchFiles();
    };

    const handleUploadButtonClick = () => {
        setIsModalOpen(!isModalOpen);
        setStartTyping(true);
    };

    const handleIconClick = () => {
        fileInputRef.current.click();

        const addingFilesMessage = "Adding Files...";
        if (!greetings.includes(addingFilesMessage)) {
            setGreetings((prevGreetings) => [
                ...prevGreetings,
                addingFilesMessage,
            ]);
        }

        setStartTyping(true);
        setCurrentCharIndex(0);
        setMessageIndex(greetings.length);
    };

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " Bytes";
        else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        else if (bytes < 1024 * 1024 * 1024)
            return (bytes / 1024 / 1024).toFixed(2) + " MB";
        else return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
    }

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allFileIds = new Set(files.map((file) => file._id));
            setSelectedFiles(allFileIds);
        } else {
            setSelectedFiles(new Set());
        }
    };

    const uploadPercentage = Math.min(
        100,
        (totalUploadedSize / maxUploadSize) * 100
    ).toFixed(2);

    useEffect(() => {
        function handleResize() {
            setWindowSize(window.innerWidth);
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div>
            <div className=" bg2 text-white h-screen font-anta">
                <Navbar />
                <div className="flex">
                    <div className="w-full p-4">
                        <div className=" md:flex justify-between mx-6 my-2">
                            <div className="mt-3">
                                <span className="text-lg font-Mono">
                                    My Files
                                </span>
                            </div>

                            <div className="md:flex sm:space-y-4 space-x-4">
                                <div className="font-Mono">
                                    <div className="w-full bg-gray-300 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{
                                                width: `${uploadPercentage}%`,
                                            }}></div>
                                    </div>
                                    <div className="text-sm sm:text-center md:text-right mt-1 font-Mono">
                                        {uploadPercentage}% (
                                        {(
                                            totalUploadedSize /
                                            (1024 * 1024)
                                        ).toFixed(2)}{" "}
                                        MB /{" "}
                                        {(
                                            maxUploadSize /
                                            (1024 * 1024)
                                        ).toFixed(2)}{" "}
                                        MB)
                                    </div>
                                </div>
                                <div className="font-Mono">
                                    <button
                                        onClick={handleUploadButtonClick}
                                        className={`${
                                            isWalletConnected
                                                ? "bg-blue-500 hover:bg-blue-700"
                                                : "bg-gray-500 cursor-not-allowed"
                                        } text-white font-bold py-2 px-4 rounded`}
                                        disabled={!isWalletConnected}>
                                        Upload
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex mx-6 my-2 space-x-4 font-Mono">
                            <div className="">
                                <div className="">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox accent-green-500"
                                        onChange={handleSelectAll}
                                        checked={
                                            files.length > 0 &&
                                            selectedFiles.size === files.length
                                        }
                                    />

                                    <span className=""> SELECT ALL FILES</span>
                                </div>
                            </div>
                        </div>
                        {files.length === 0 ? (
                            <div className="text-center text-5xl">
                                {isWalletConnected
                                    ? "This folder is empty"
                                    : "Please connect your TRON wallet first."}
                            </div>
                        ) : (
                            <div className="files-table-container md:max-h-[750px] overflow-y-auto sm:max-h-[600px] bg-black font-Mono rounded-t-xl">
                                <div className=" bg-slate-500 flex justify-center space-x-4">
                                    <span className="my-auto">
                                        //TRONFILE.EXE
                                    </span>
                                    <div className="animate-spin">
                                        <span>/</span>
                                    </div>
                                </div>
                                <div>
                                    <table className="min-w-full table-command-line">
                                        <tbody>
                                            {Array.isArray(files) &&
                                                files.map((file, idx) => (
                                                    <tr
                                                        key={file.fileId}
                                                        className={` hover:bg-slate-700 border-gray-700 ${
                                                            selectedFiles.has(
                                                                file._id
                                                            )
                                                                ? "bg-blue-500"
                                                                : "bg-transparent"
                                                        }`}
                                                        onClick={() =>
                                                            toggleFileSelection(
                                                                file._id
                                                            )
                                                        }
                                                        onContextMenu={(e) =>
                                                            handleContextMenu(
                                                                e,
                                                                file._id
                                                            )
                                                        }>
                                                        <td className="px-6 text-sm font-medium text-left table-cell">
                                                            <div className="flex items-center space-x-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedFiles.has(
                                                                        file._id
                                                                    )}
                                                                    onChange={() =>
                                                                        toggleFileSelection(
                                                                            file._id
                                                                        )
                                                                    }
                                                                    className="form-checkbox input-checkbox"
                                                                />
                                                                {(() => {
                                                                    const fileExtension =
                                                                        file.filename
                                                                            .split(
                                                                                "."
                                                                            )
                                                                            .pop()
                                                                            .toLowerCase();
                                                                    const IconComponent =
                                                                        fileTypeIcons[
                                                                            fileExtension
                                                                        ] || (
                                                                            <FaFileAlt />
                                                                        );
                                                                    return IconComponent;
                                                                })()}
                                                                <div className="">
                                                                    <span className="hidden sm:block truncate max-w-xs text-green-500">
                                                                        //
                                                                        {
                                                                            file.filename
                                                                        }
                                                                    </span>
                                                                    <span className="block sm:hidden truncate max-w-xs">
                                                                        {file
                                                                            .filename
                                                                            .length >
                                                                        6
                                                                            ? `//${file.filename.substring(
                                                                                  0,
                                                                                  6
                                                                              )}…`
                                                                            : `//${file.filename}`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-xs text-gray-500"></td>
                                                        <td className="text-xs text-gray-500 space-x-6 table-cell">
                                                            <span className="file-size text-xs text-gray-400">
                                                                {formatFileSize(
                                                                    file.size
                                                                )}
                                                            </span>
                                                            <span>
                                                                {new Date(
                                                                    file.createdAt
                                                                ).toLocaleString()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div
                    ref={contextMenuRef}
                    className="context-menu"
                    onContextMenu={(e) => e.preventDefault()}>
                    {contextMenuFileIds.length === 1 && (
                        <Link to={`/download/${contextMenuFileIds[0]}`}>
                            <button>Download</button>
                        </Link>
                    )}

                    <button onClick={() => deleteFiles(contextMenuFileIds)}>
                        Delete
                    </button>
                    <button onClick={() => moveFile(contextMenuFileIds)}>
                        Move
                    </button>
                    {contextMenuFileIds.length === 1 && (
                        <button onClick={() => copyLink(contextMenuFileIds[0])}>
                            Copy Link
                        </button>
                    )}
                </div>
                {isModalOpen && (
                    <div className="fixed inset-0 backdrop-blur-sm z-50 flex justify-center items-center">
                        <div className=" bg-black p-4 rounded-2xl shadow-lg ">
                            <div>
                                <button
                                    onClick={closeModal}
                                    className="flex justify-end text-5xl text-white">
                                    &times;
                                </button>
                            </div>

                            <div className=" overflow-y-auto max-h-[600px] files-table-container">
                                {uploadQueue.length > 0 ? (
                                    <div className="sm:mx-2 sm:my-2 md:mx-24 md:my-24">
                                        {uploadQueue.map((fileData, index) => (
                                            <div key={index} className="mb-4">
                                                <div className="flex justify-between items-center space-x-2 text-white">
                                                    <div className=" filename ">
                                                        {fileData.file.name}
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            removeFileFromQueue(
                                                                index
                                                            )
                                                        }
                                                        className="text-red-500 hover:text-red-700 mr-2 ">
                                                        X
                                                    </button>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-5 dark:bg-gray-700 my-2 relative">
                                                    <div></div>
                                                    <div
                                                        className="bg-blue-600 h-5 rounded-full text-white text-sm flex items-center justify-end"
                                                        style={{
                                                            width: `${fileData.progress}%`,
                                                        }}>
                                                        <div
                                                            className={`${
                                                                fileData.progress <
                                                                10
                                                                    ? "hidden"
                                                                    : "mx-auto my-auto"
                                                            }`}>
                                                            {fileData.progress}%
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-center text-white text-sm">
                                                    {fileData.status ===
                                                        "uploading" &&
                                                        "Uploading..."}
                                                    {fileData.status ===
                                                        "finalizing" &&
                                                        "Finalizing..."}
                                                    {fileData.status ===
                                                        "done" &&
                                                        "Upload Complete!"}
                                                    {fileData.status ===
                                                        "error" &&
                                                        "Error in upload."}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-grow flex items-center justify-center">
                                        <div className="lg:w-[500px] lg:h-[500px] md:w-[400px] md:h-[400px] sm:w-[300px] sm:h-[300px] bg-black flex flex-col justify-between rounded-b-lg mx-2 bg-opacity-40 rounded-t-lg">
                                            <div className="  py-1 font-Mono flex justify-center space-x-4 rounded-t-xl">
                                                <span>//TRONFILE.EXE</span>
                                                <div className="animate-spin">
                                                    <span>/</span>
                                                </div>
                                            </div>
                                            <div className="flex-grow text-white mx-2 mt-2 text-justify overflow-auto">
                                                {greetings.map(
                                                    (greeting, index) => (
                                                        <div
                                                            key={index}
                                                            className="font-Mono">
                                                            <span className="text-green-500">
                                                                {tronfile}
                                                            </span>
                                                            {greeting}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex space-x-5 justify-center mb-5">
                                    <div
                                        onClick={handleIconClick}
                                        className="cursor-pointer">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <div className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                            <FiFilePlus size={24} />
                                            <span>Add Files</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploadQueue.some(
                                        (file) => file.status === "uploading"
                                    )}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                    Start Upload
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default UploadPage;
