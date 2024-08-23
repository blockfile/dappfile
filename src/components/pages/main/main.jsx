import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../navbar/navbar";
import Footer from "../../Footer/Footer";
import Loading from "../../assets/video/loading.mp4";
import { CSSTransition } from "react-transition-group";

import "./main.css"; // Import the CSS file

function Main() {
    const [greetings, setGreetings] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);
    const [showAbout, setShowAbout] = useState(false);
    const navigate = useNavigate();
    const messages = [
        " Welcome to TRONFILE!",
        "Please Enter your Command Selection:",
        "1: Back to Homepage.",
        "2: Go to dapp and start uploading.",
    ];
    const tronfile = "//TRONFILEBOT: ";
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (messageIndex < messages.length) {
                const currentMessage = messages[messageIndex];
                if (currentCharIndex < currentMessage.length) {
                    setGreetings((prevGreetings) => {
                        if (prevGreetings.length === messageIndex) {
                            return [
                                ...prevGreetings,
                                currentMessage[currentCharIndex],
                            ];
                        } else {
                            const updatedGreetings = [...prevGreetings];
                            updatedGreetings[messageIndex] +=
                                currentMessage[currentCharIndex];
                            return updatedGreetings;
                        }
                    });
                    setCurrentCharIndex(currentCharIndex + 1);
                } else if (messageIndex < messages.length - 1) {
                    setCurrentCharIndex(0);
                    setMessageIndex(messageIndex + 1);
                }
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [currentCharIndex, messageIndex, messages]);

    const handleInputKeyPress = (event) => {
        if (event.key === "Enter") {
            if (inputValue === "1") {
                setGreetings((prev) => [
                    ...prev,
                    "You will now be redirected to homepage.",
                ]);
                setShowLoading(true);
                setTimeout(() => {
                    setShowLoading(false);
                    window.location.href = "https://tronfile.xyz"; // Navigate to external link
                }, 5000);
            } else if (inputValue === "2") {
                setGreetings((prev) => [
                    ...prev,
                    "Redirecting to DApp upload page.",
                ]);
                setShowLoading(true);
                setTimeout(() => {
                    setShowLoading(false);
                    navigate("/uploadpage");
                }, 5000);
            } else {
                setGreetings((prev) => [...prev, "Invalid command."]);
            }
            setInputValue("");
        }
    };

    return (
        <div className="bg3 sm:overflow-hidden h-screen flex flex-col">
            <Navbar />
            <div className="flex-grow flex items-center justify-center flip-container mx-3  ">
                <div className={`flipper ${showAbout ? "flip" : ""}`}>
                    <div className="front w-[500px] h-[500px] bg-black flex flex-col justify-between rounded-b-lg  bg-opacity-40 rounded-t-lg">
                        <div className=" bg-red-600 py-1 font-Mono  flex justify-center space-x-4 rounded-t-xl">
                            <span>//TRONFILE.EXE</span>
                            <div className="animate-spin">
                                <span>/</span>
                            </div>
                        </div>
                        <div className="flex-grow text-white mx-2 mt-2 text-justify overflow-auto">
                            {greetings.map((greeting, index) => (
                                <div key={index} className="font-Mono">
                                    <span className="text-red-600">
                                        {tronfile}
                                    </span>
                                    {greeting}
                                </div>
                            ))}
                        </div>
                        <input
                            className="w-full h-8 bg-black bg-opacity-40 text-white pl-2 outline-none border-none caret-white font-Mono rounded-b-lg"
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleInputKeyPress}
                            placeholder="// TYPE YOUR COMMAND HERE.."
                        />
                    </div>
                </div>
            </div>

            <CSSTransition
                in={showLoading}
                timeout={300}
                classNames="fade"
                unmountOnExit>
                <div className="fixed inset-0 bg-black  flex items-center justify-center">
                    <video
                        autoPlay
                        loop
                        src={Loading}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute flex justify-center items-center w-full h-full"></div>
                </div>
            </CSSTransition>

            <Footer />
        </div>
    );
}

export default Main;
