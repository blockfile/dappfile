import React from "react";
import { FaTwitter, FaTelegram } from "react-icons/fa";
import { BsGlobe } from "react-icons/bs";
import "./Footer.css";
function Footer() {
    return (
        <div className="flex flex-col justify-center items-center   text-white text-center font-anta  pb-2">
            <div className=" absolute bottom-10 left-0 right-0 flex justify-center items-center space-x-7  ">
                <a
                    href="https://t.me/TRONFILE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xl text-red-600">
                    <FaTelegram />
                </a>
                <a
                    href=" https://x.com/tronfile_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xl text-red-600">
                    <FaTwitter />
                </a>
                <a
                    href="https://tronfile.xyz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xl text-red-600">
                    <BsGlobe />
                </a>
            </div>

            <div className=" bottom-2 left-0 right-0 mt-5 absolute  text-xs text-red-600 ">
                <span> ©2024 TRONFILE | All Rights Reserved | V2.1.0</span>
            </div>
        </div>
    );
}

export default Footer;
