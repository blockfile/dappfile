import React, { useState, useContext, useEffect } from "react";
import "./navbar.css";
import logo from "../assets/Images/logo.png";
import makeBlockie from "ethereum-blockies-base64";
import axios from "axios";
import TokenContext from "../assets/TokenContext";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3 from "web3";

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

    const [provider, setProvider] = useState(null);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const formatAddress = (address) =>
        address
            ? `${address.substring(0, 6)}...${address.substring(
                  address.length - 4
              )}`
            : "";

    const fetchTronTokenBalance = async (walletAddress) => {
        const apiKey = "ad46ddd1-006e-406a-9b94-aabf39bbb286";
        const contractAddress = "TFenNvccFr9zvkh9xhQspcAxY4xxttNkWg";
        const url = `https://apilist.tronscanapi.com/api/account/tokens?address=${walletAddress}&start=0&limit=20&hidden=0&show=0&sortType=0&sortBy=0&apikey=${apiKey}`;

        try {
            const response = await axios.get(url);
            if (response.data && response.data.data) {
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

    const handleModalBackgroundClick = (event) => {
        if (event.target.className.includes("modal-background")) {
            setShowDisconnectModal(false);
        }
    };

    const connectTronLink = async () => {
        try {
            // Check if TronLink is installed
            if (window.tronWeb && window.tronWeb.defaultAddress) {
                // Check if TronLink is ready (wallet is unlocked)
                if (window.tronWeb.ready) {
                    const tronLinkAccount =
                        window.tronWeb.defaultAddress.base58;
                    setAccount(tronLinkAccount);
                    setIsConnected(true);
                    setBlockieImage(makeBlockie(tronLinkAccount));
                    fetchTronTokenBalance(tronLinkAccount);
                } else {
                    // Request the user to unlock TronLink
                    await window.tronLink.request({
                        method: "tron_requestAccounts",
                    });

                    // Re-check if TronLink is ready after the request
                    if (window.tronWeb.ready) {
                        const tronLinkAccount =
                            window.tronWeb.defaultAddress.base58;
                        setAccount(tronLinkAccount);
                        setIsConnected(true);
                        setBlockieImage(makeBlockie(tronLinkAccount));
                        fetchTronTokenBalance(tronLinkAccount);
                    } else {
                        alert("Please unlock your TronLink wallet.");
                    }
                }
            } else {
                alert(
                    "TronLink is not installed. Please install TronLink to use this feature."
                );
            }
        } catch (error) {
            console.error("Error connecting to TronLink", error);
            alert(
                "There was an error connecting to TronLink. Please try again."
            );
        }
    };

    const handleConnectWallet = async () => {
        if (window.ethereum && typeof window.ethereum.request === "function") {
            try {
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
                setAccount(accounts[0]);
                setIsConnected(true);
                setBlockieImage(makeBlockie(accounts[0]));
                fetchTronTokenBalance(accounts[0]);
            } catch (error) {
                console.error(error);
            }
        } else {
            alert(
                "MetaMask is not installed or your browser does not support Ethereum wallets."
            );
        }
    };

    const connectToMetaMask = async () => {
        if (window.ethereum && window.ethereum.isMetaMask) {
            try {
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
                setAccount(accounts[0]);
                setIsConnected(true);
                setBlockieImage(makeBlockie(accounts[0]));
                fetchTronTokenBalance(accounts[0]);
                setShowDisconnectModal(false);
            } catch (error) {
                console.error("Error connecting to MetaMask", error);
            }
        } else {
            console.log(
                "MetaMask is not installed or not the active provider."
            );
        }
    };

    const connectOKXWallet = async () => {
        if (typeof window.okxwallet !== "undefined") {
            console.log("OKX Wallet is installed!");
            try {
                const accounts = await window.okxwallet.request({
                    method: "eth_requestAccounts",
                });
                setAccount(accounts[0]);
                setIsConnected(true);
                setBlockieImage(makeBlockie(accounts[0]));
                fetchTronTokenBalance(accounts[0]);
                setShowDisconnectModal(false);
            } catch (error) {
                console.error("Error connecting to OKX Wallet:", error);
            }
        } else {
            alert("OKX Wallet is not installed or not supported.");
        }
    };

    const connectWithWalletConnect = async () => {
        const provider = new WalletConnectProvider({
            rpc: {
                8453: "https://mainnet.base.org",
            },
            chainId: 8453,
            bridge: "https://bridge.walletconnect.org",
        });

        try {
            await provider.enable();
            const web3 = new Web3(provider);

            const accounts = await web3.eth.getAccounts();
            const account = accounts[0];

            setAccount(account);
            setIsConnected(true);
            setBlockieImage(makeBlockie(account));
            fetchTronTokenBalance(account);
            setShowDisconnectModal(false);
        } catch (error) {
            console.error("Error connecting with WalletConnect:", error);
        }
    };

    useEffect(() => {
        const checkIfWalletIsConnected = async () => {
            if (window.tronWeb && window.tronWeb.ready) {
                const tronLinkAccount = window.tronWeb.defaultAddress.base58;
                if (tronLinkAccount) {
                    setAccount(tronLinkAccount);
                    setIsConnected(true);
                    setBlockieImage(makeBlockie(tronLinkAccount));
                    fetchTronTokenBalance(tronLinkAccount);
                }
            } else if (
                window.ethereum &&
                typeof window.ethereum.request === "function"
            ) {
                const accounts = await window.ethereum.request({
                    method: "eth_accounts",
                });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    setIsConnected(true);
                    setBlockieImage(makeBlockie(accounts[0]));
                    fetchTronTokenBalance(accounts[0]);
                }
            }
        };

        checkIfWalletIsConnected();

        const handleAccountsChanged = (accounts) => {
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                setIsConnected(true);
                setBlockieImage(makeBlockie(accounts[0]));
                fetchTronTokenBalance(accounts[0]);
            } else {
                setIsConnected(false);
                setAccount("");
                setBlockieImage("");
                setTokenBalance(0);
            }
        };

        if (window.ethereum) {
            window.ethereum.on("accountsChanged", handleAccountsChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener(
                    "accountsChanged",
                    handleAccountsChanged
                );
            }
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
                                    onClick={setShowDisconnectModal}
                                    className="text-gray-900 modal-shape connect-wallet-button hover:bg-gray-100   focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 me-2 mb-2">
                                    Connect Wallet
                                </button>
                            </div>
                        ) : (
                            <ul className="flex space-x-5 text-xl mt-2 justify-end mr-2 ">
                                <li className=" border-1    border-gray-200 focus:ring-4  focus:outline-none focus:ring-gray-100 w-[250px] h-[43px] hidden lg:block text-sm text-center  items-center   mb-2">
                                    <div className="flex space-x-2 pl-5 my-2 ">
                                        <div>
                                            <img
                                                src={logo}
                                                alt="emptylogo"
                                                className="h-7 w-7 mb-2 rounded-full"
                                            />
                                        </div>
                                        <span className="  text-xl shadow-2xl mb-1 ">
                                            {tokenBalance.toFixed(0)}
                                        </span>
                                        <span className="  text-xl shadow-2xl mb-1 ">
                                            TRONFILE
                                        </span>
                                    </div>
                                </li>
                                <li className=" border-1 cursor-pointer     focus:ring-4 focus:outline-none focus:ring-gray-100 w-[250px] h-[43px] hidden lg:block  text-sm text-center  items-center   mb-2">
                                    <div className="flex space-x-2 ml-10 my-2  ">
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
            {isMobileMenuOpen && (
                <>
                    <div
                        onClick={toggleMobileMenu}
                        className="fixed top-0 left-0 w-full h-full backdrop-blur-xl bg-black bg-opacity-50 z-40 "></div>
                    <ul className="fixed top-0 right-0 left-0 mt-2 mr-2 flex flex-col space-y-4 text-xl z-50 p-4 items-center font-anta">
                        <div className="flex justify-between">
                            <div className="flex space-x-2">
                                <img
                                    src={logo}
                                    alt=""
                                    className=" h-12  my-auto "
                                />
                                <div className="my-auto">
                                    <span className=" text-3xl">TRONFILE</span>
                                </div>
                            </div>
                        </div>
                        {!isConnected ? (
                            <li className="w-full">
                                <button
                                    onClick={setShowDisconnectModal}
                                    className="w-full text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex justify-center items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
                                    Connect Wallet
                                </button>
                            </li>
                        ) : (
                            <>
                                <li className="w-full border border-gray-500  hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-gray-500 rounded-lg text-sm text-center flex justify-center items-center py-2">
                                    <Link to="/">
                                        <div className="flex space-x-2 justify-center items-center cursor-pointer ">
                                            <IoArrowBackCircleOutline
                                                size={30}
                                            />
                                            <span className="text-xl shadow-2xl">
                                                RETURN TO DASHBOARD
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                                <li className="w-full border border-gray-500 focus:ring-4 focus:outline-none  focus:ring-gray-500 rounded-lg text-sm text-center flex justify-center items-center py-2">
                                    <div className="flex space-x-2 justify-center items-center">
                                        <img
                                            src={logo}
                                            alt="emptylogo"
                                            className="h-7 w-7 rounded-full"
                                        />
                                        <span className="text-xl shadow-2xl">
                                            {tokenBalance.toFixed(0)}
                                        </span>
                                        <span className="text-xl shadow-2xl">
                                            TRONFILE
                                        </span>
                                    </div>
                                </li>
                                <li className="w-full border border-gray-500 focus:ring-4 focus:outline-none rounded-lg text-sm flex justify-center items-center py-2">
                                    <div className="flex space-x-2 justify-center items-center">
                                        <img
                                            src={blockieImage}
                                            alt="emptylogo"
                                            className="h-7 w-7 rounded-full cursor-pointer"
                                        />

                                        <span
                                            onClick={() =>
                                                setShowDisconnectConfirmationModal(
                                                    true
                                                )
                                            }
                                            className="cursor-pointer text-xl shadow-2xl">
                                            {formatAddress(account)}
                                        </span>
                                    </div>
                                </li>
                            </>
                        )}
                    </ul>
                </>
            )}

            {showDisconnectModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center  z-50  modal-background font-Mono"
                    onClick={handleModalBackgroundClick}>
                    <div className="bg-gray-400 bg-opacity-15 p-4  backdrop-blur-xl modal-div">
                        <div className="mb-10 mt-5">
                            <div className=" text-left text-3xl ">
                                CONNECTING
                                <span className=" animate-pulse">.</span>
                                <span className=" animate-pulse">.</span>
                                <span className=" animate-pulse">.</span>
                            </div>
                            <svg
                                class="ModalBox_box__divider__4L1XL md:w-[430px] sm:w-[300px]"
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
                            className="mt-4 modal-shape px-24 py-2 hover:bg-lime-950 bg-gray-900  border-2 border-gray-700  font-Mono"
                            onClick={connectToMetaMask}>
                            <button className=" text-white p-2 rounded-lg  ">
                                METAMASK
                            </button>
                        </div>

                        <div
                            className="mt-4 modal-shape  py-2 bg-gray-900  hover:bg-lime-950 border-2 border-gray-700"
                            onClick={connectOKXWallet}>
                            <button className=" text-white p-2 rounded-lg">
                                OKXWALLET
                            </button>
                        </div>

                        <div
                            className="mt-4 modal-shape px-24 py-2 bg-gray-900  hover:bg-lime-950 border-2 border-gray-700"
                            onClick={connectWithWalletConnect}>
                            <button className=" text-white p-2 rounded-lg ">
                                WALLET CONNECT
                            </button>
                        </div>
                        <div
                            className="mt-4 modal-shape px-24 py-2 bg-gray-900  hover:bg-lime-950 border-2 border-gray-700"
                            onClick={connectTronLink}>
                            <button className=" text-white p-2 rounded-lg ">
                                TRONLINK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDisconnectConfirmationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 font-Mono">
                    <div className=" bg-gray-800 p-4 rounded-lg modal-shape">
                        <p className=" text-left text-3xl">DISCONNECT</p>
                        <svg
                            class="ModalBox_box__divider__4L1XL md:w-[430px] sm:w-[300px]"
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
