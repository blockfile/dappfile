import React, { useState, useContext, useEffect } from "react";
import "./navbar.css";
import logo from "../assets/Images/logo.png";
import makeBlockie from "ethereum-blockies-base64";
import axios from "axios";
import TokenContext from "../assets/TokenContext";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { IoArrowBackCircleOutline } from "react-icons/io5";

function Navbar() {
    const [isConnected, setIsConnected] = useState(false);
    const [account, setAccount] = useState("");
    const [blockieImage, setBlockieImage] = useState("");
    const { tokenBalance, setTokenBalance } = useContext(TokenContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showDisconnectModal, setShowDisconnectModal] = useState(false);
    const [
        showDisconnectConfirmationModal,
        setShowDisconnectConfirmationModal,
    ] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Function to format the wallet address for display
    const formatAddress = (address) =>
        address
            ? `${address.substring(0, 6)}...${address.substring(
                  address.length - 4
              )}`
            : "";

    // Function to fetch token balance from TronScan API
    const fetchTokenBalance = async (walletAddress) => {
        const apiKey = "ad46ddd1-006e-406a-9b94-aabf39bbb286";
        const contractAddress = "TPMo1RPVw5ZPSLjnoN8MiSpE8JvTCSaPdw"; // Your specific TRC20 contract address
        const url = `https://apilist.tronscanapi.com/api/account/tokens?address=${walletAddress}&start=0&limit=20&hidden=0&show=0&sortType=0&sortBy=0&apikey=${apiKey}`;

        try {
            const response = await axios.get(url);
            if (response.data && response.data.data) {
                // Find the specific token using the contract address
                const tokenData = response.data.data.find(
                    (token) => token.tokenId === contractAddress
                );

                if (tokenData) {
                    const balance =
                        tokenData.balance /
                        Math.pow(10, tokenData.tokenDecimal);
                    setTokenBalance(balance);
                } else {
                    console.log("Token not found in wallet.");
                    setTokenBalance(0);
                }
            } else {
                console.error("No token data found.");
                setTokenBalance(0);
            }
        } catch (error) {
            console.error("Error fetching TRC20 token balance:", error);
            setTokenBalance(0);
        }
    };

    // This function will be triggered when the modal background is clicked
    const handleModalBackgroundClick = (event) => {
        // Check if the click is on the modal background (and not the modal itself)
        if (event.target.className.includes("modal-background")) {
            setShowDisconnectModal(false); // Close the modal
        }
    };

    // Handle connection to TronLink
    const handleConnectTronWallet = async () => {
        if (window.tronWeb && window.tronWeb.ready) {
            const connectedAccount = window.tronWeb.defaultAddress.base58;
            setAccount(connectedAccount);
            setIsConnected(true);
            setBlockieImage(makeBlockie(connectedAccount));
            fetchTokenBalance(connectedAccount);
            setShowDisconnectModal(false);
        } else {
            alert("Please unlock your TronLink wallet.");
        }
    };

    // Check if TronLink is connected
    useEffect(() => {
        const checkTronLinkConnection = () => {
            if (
                window.tronWeb &&
                window.tronWeb.ready &&
                window.tronWeb.defaultAddress.base58
            ) {
                const connectedAccount = window.tronWeb.defaultAddress.base58;
                setAccount(connectedAccount);
                setIsConnected(true);
                setBlockieImage(makeBlockie(connectedAccount));
                fetchTokenBalance(connectedAccount);
            } else {
                setIsConnected(false);
            }
        };

        checkTronLinkConnection();

        const handleAddressChanged = (address) => {
            if (address.base58) {
                setAccount(address.base58);
                setIsConnected(true);
                setBlockieImage(makeBlockie(address.base58));
                fetchTokenBalance(address.base58);
            } else {
                setIsConnected(false);
                setAccount("");
                setBlockieImage("");
                setTokenBalance(0);
            }
        };

        // Listen for account changes in TronLink
        window.tronWeb?.on("addressChanged", handleAddressChanged);

        // Cleanup listener on unmount
        return () => {
            window.tronWeb?.off("addressChanged", handleAddressChanged);
        };
    }, [setTokenBalance]);

    const handleDisconnect = () => {
        setIsConnected(false);
        setAccount("");
        setBlockieImage("");
        setShowDisconnectConfirmationModal(false);
    };

    return (
        <div>
            <nav className=" backdrop-blur-3xl hover:text-black text-white md:w-3/4 bg-black bg-opacity-35  rounded-b-xl mx-auto modal-nav">
                <div className="flex justify-between">
                    <div className="flex space-x-2">
                        <img
                            src={logo}
                            alt=""
                            className=" h-12  my-auto ml-5"
                        />
                        <div className="my-auto">
                            <Link to="/">
                                <span className=" text-3xl">TRONFILE</span>
                            </Link>
                        </div>
                        <div className="md:hidden absolute right-0 pr-4 mt-2">
                            <button onClick={toggleMobileMenu}>
                                {isMobileMenuOpen ? (
                                    <FaTimes size={24} />
                                ) : (
                                    <FaBars size={24} />
                                )}
                            </button>
                        </div>
                    </div>
                    <div
                        className={`${
                            isMobileMenuOpen ? "flex" : "hidden"
                        } md:flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 `}>
                        {!isConnected ? (
                            <div className="p-2 hidden lg:block ">
                                <button
                                    type="button"
                                    onClick={() => setShowDisconnectModal(true)}
                                    className="text-gray-900 modal-shape connect-wallet-button hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 me-2 mb-2">
                                    Connect Wallet
                                </button>
                            </div>
                        ) : (
                            <ul className="flex space-x-5 text-xl mt-2 justify-end mr-2">
                                <li className="border-1 border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 w-[250px] h-[43px] hidden lg:block text-sm text-center items-center mb-2">
                                    <div className="flex space-x-2 pl-5 my-2">
                                        <div>
                                            <img
                                                src={logo}
                                                alt="emptylogo"
                                                className="h-7 w-7 mb-2 rounded-full"
                                            />
                                        </div>
                                        <span className="text-xl shadow-2xl mb-1">
                                            {tokenBalance.toFixed(0)}
                                        </span>
                                        <span className="text-xl shadow-2xl mb-1">
                                            TRONFILE
                                        </span>
                                    </div>
                                </li>
                                <li className="border-1 cursor-pointer focus:ring-4 focus:outline-none focus:ring-gray-100 w-[250px] h-[43px] hidden lg:block text-sm text-center items-center mb-2">
                                    <div className="flex space-x-2 ml-10 my-2">
                                        <div>
                                            <img
                                                src={blockieImage}
                                                alt="emptylogo"
                                                className="h-7 w-7 mb-2 rounded-full cursor-pointer"
                                            />
                                        </div>
                                        <span
                                            onClick={() =>
                                                setShowDisconnectConfirmationModal(
                                                    true
                                                )
                                            }
                                            className="cursor-pointer text-xl shadow-2xl mb-1">
                                            {formatAddress(account)}
                                        </span>
                                    </div>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </nav>

            {/* Modal for Wallet Connection */}
            {showDisconnectModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 modal-background font-Mono"
                    onClick={handleModalBackgroundClick}>
                    <div className="bg-gray-400 bg-opacity-15 p-4 backdrop-blur-xl modal-div">
                        <div className="mb-10 mt-5">
                            <div className=" text-left text-3xl ">
                                CONNECTING
                                <span className=" animate-pulse">.</span>
                                <span className=" animate-pulse">.</span>
                                <span className=" animate-pulse">.</span>
                            </div>
                            <svg
                                className="ModalBox_box__divider__4L1XL md:w-[430px] sm:w-[300px]"
                                height="13"
                                viewBox="0 0 426 13"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M 426 12 L 280.913 12 L 259.304 1 L 0 1"
                                    stroke="inherit"></path>
                            </svg>
                        </div>
                        <div
                            className="mt-4 modal-shape px-24 py-2 bg-gray-900 hover:bg-lime-950 border-2 border-gray-700"
                            onClick={handleConnectTronWallet}>
                            <button className=" text-white p-2 rounded-lg ">
                                TRONLINK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Disconnect Confirmation */}
            {showDisconnectConfirmationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 font-Mono">
                    <div className=" bg-gray-800 p-4 rounded-lg modal-shape">
                        <p className=" text-left text-3xl">DISCONNECT</p>
                        <svg
                            className="ModalBox_box__divider__4L1XL md:w-[430px] sm:w-[300px]"
                            width="426"
                            height="13"
                            viewBox="0 0 426 13"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M 426 12 L 280.913 12 L 259.304 1 L 0 1"
                                stroke="inherit"></path>
                        </svg>
                        <p>Are you sure you want to disconnect your wallet?</p>

                        <div className="flex justify-end space-x-2 mt-4">
                            <button
                                onClick={() =>
                                    setShowDisconnectConfirmationModal(false)
                                }
                                className="px-4 py-2 text-black rounded bg-gray-200">
                                Cancel
                            </button>
                            <button
                                onClick={handleDisconnect}
                                className="px-4 py-2 rounded bg-red-500 text-black">
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Navbar;
