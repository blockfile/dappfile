const TelegramBot = require("node-telegram-bot-api");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mongoose = require("mongoose");
require("dotenv").config();
const axios = require("axios");
const User = require("../server/model/user"); // Import the User model
const File = require("../server/model/models"); // Import the File model

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
let session = {};

// Import the fetch method from node-fetch
let fetch;
import("node-fetch")
    .then(({ default: fetched }) => (fetch = fetched))
    .catch((err) => console.error("Failed to load node-fetch:", err));

// Setup AWS S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
    region: "sgp1", // Optional as the endpoint defines the region
    endpoint: "https://sgp1.digitaloceanspaces.com",
    credentials: {
        accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
        secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // needed with custom endpoint
});

mongoose
    .connect(process.env.DATABASE_ACCESS)
    .then(() => console.log("MongoDB connected..."))
    .catch((err) => console.log("MongoDB connection error:", err));

const bannerUrl = "../src/components/assets/Images/banner.jpg"; // Replace with your banner image URL

const fetchTokenBalance = async (walletAddress) => {
    const apiKey = "ad46ddd1-006e-406a-9b94-aabf39bbb286";
    const contractAddress = "TPMo1RPVw5ZPSLjnoN8MiSpE8JvTCSaPdw"; // Your specific TRC20 contract address
    const url = `https://apilist.tronscanapi.com/api/account/tokens?address=${walletAddress}&start=0&limit=20&hidden=0&show=0&sortType=0&sortBy=0&apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data && response.data.data) {
            const tokenData = response.data.data.find(
                (token) => token.tokenId === contractAddress
            );

            if (tokenData) {
                const balance =
                    tokenData.balance / Math.pow(10, tokenData.tokenDecimal);
                return balance;
            } else {
                console.log("Token not found in wallet.");
                return 0;
            }
        } else {
            console.error("No token data found.");
            return 0;
        }
    } catch (error) {
        console.error("Error fetching TRC20 token balance:", error);
        return 0;
    }
};

const getUploadLimit = (balance) => {
    if (balance <= 0) return 50 * 1024 * 1024; // Default 50MB for 0 or negative balances
    if (balance < 100_000) return 100 * 1024 * 1024; // 100MB
    if (balance < 1_000_001) return 1 * 1024 * 1024 * 1024; // 1GB
    if (balance < 5_000_001) return 5 * 1024 * 1024 * 1024; // 5GB
    if (balance < 15_000_001) return 10 * 1024 * 1024 * 1024; // 10GB
    if (balance < 30_000_001) return 50 * 1024 * 1024 * 1024; // 50GB
    return 100 * 1024 * 1024 * 1024; // 100GB
};

const getTotalUploadedSize = async (walletAddress) => {
    const files = await File.find({ walletAddress });
    return files.reduce((total, file) => total + parseInt(file.size), 0);
};

async function getOrCreateUserWallet(chatId, newWalletAddress) {
    let user = await User.findOne({ chatId });

    if (!user) {
        // If the user doesn't exist, create a new one
        user = new User({ chatId, walletAddress: newWalletAddress });
        await user.save();
    } else if (!user.walletAddress) {
        // If the user exists but doesn't have a wallet address, update it
        user.walletAddress = newWalletAddress;
        await user.save();
    }

    return user.walletAddress;
}

async function showMainMenu(chatId) {
    const user = await User.findOne({ chatId });
    let buttons = [];

    if (user && user.walletAddress) {
        const walletAddress = user.walletAddress; // Use the stored wallet address
        const balance = await fetchTokenBalance(walletAddress);
        const uploadLimit = getUploadLimit(balance);
        const totalUploadedSize = await getTotalUploadedSize(walletAddress);
        const remainingSize = uploadLimit - totalUploadedSize;

        buttons.push([{ text: "Upload File", callback_data: "upload" }]);

        buttons.push([
            {
                text: `Token balance: ${balance} TRONFILE\nUpload limit: ${(
                    uploadLimit /
                    (1024 * 1024)
                ).toFixed(2)} MB\nTotal uploaded: ${(
                    totalUploadedSize /
                    (1024 * 1024)
                ).toFixed(2)} MB\nRemaining size: ${(
                    remainingSize /
                    (1024 * 1024)
                ).toFixed(2)} MB`,
                callback_data: "info",
            },
        ]);
        buttons.push([{ text: "Settings", callback_data: "settings" }]);
    } else {
        buttons.push([
            { text: "Set Wallet Address", callback_data: "set_wallet" },
        ]);
    }

    const media = [
        {
            type: "photo",
            media: bannerUrl,
            caption: "Welcome to TRONFILE",
        },
    ];

    await bot.sendMediaGroup(chatId, media);
    bot.sendMessage(chatId, "Choose an option below:", {
        reply_markup: {
            inline_keyboard: buttons,
        },
    });
}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    showMainMenu(chatId);
});

bot.on("callback_query", async (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const data = callbackQuery.data;

    switch (data) {
        case "upload":
            bot.sendMessage(
                chatId,
                "Please send the file you wish to upload.",
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Back", callback_data: "back" }],
                        ],
                    },
                }
            );
            break;
        case "set_wallet":
            bot.sendMessage(chatId, "Please send your wallet address.", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Back", callback_data: "back" }],
                    ],
                },
            });
            break;
        case "settings":
            const user = await User.findOne({ chatId });
            if (user && user.walletAddress) {
                const walletAddress = user.walletAddress;
                const balance = await fetchTokenBalance(walletAddress);
                const uploadLimit = getUploadLimit(balance);
                const totalUploadedSize = await getTotalUploadedSize(
                    walletAddress
                );
                const remainingSize = uploadLimit - totalUploadedSize;

                bot.sendMessage(
                    chatId,
                    `Current wallet address: ${walletAddress}\nToken balance: ${balance} TRONFILE\nUpload limit: ${(
                        uploadLimit /
                        (1024 * 1024)
                    ).toFixed(2)} MB\nTotal uploaded: ${(
                        totalUploadedSize /
                        (1024 * 1024)
                    ).toFixed(2)} MB\nRemaining size: ${(
                        remainingSize /
                        (1024 * 1024)
                    ).toFixed(2)} MB`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "Change Wallet Address",
                                        callback_data: "change_wallet",
                                    },
                                    {
                                        text: "Remove Wallet Address",
                                        callback_data: "remove_wallet",
                                    },
                                ],
                                [
                                    {
                                        text: "Refresh",
                                        callback_data: "refresh",
                                    },
                                    { text: "Back", callback_data: "back" },
                                ],
                            ],
                        },
                    }
                );
            } else {
                bot.sendMessage(
                    chatId,
                    "No wallet address found. Please set a wallet address.",
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "Back", callback_data: "back" }],
                            ],
                        },
                    }
                );
            }
            break;
        case "change_wallet":
            bot.sendMessage(chatId, "Please send your new wallet address.", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Back", callback_data: "back" }],
                    ],
                },
            });
            session[chatId] = { action: "change_wallet" };
            break;
        case "remove_wallet":
            await User.updateOne({ chatId }, { $unset: { walletAddress: "" } });
            bot.sendMessage(chatId, "Wallet address removed.", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Back", callback_data: "back" }],
                    ],
                },
            });
            break;
        case "refresh":
            const userRefresh = await User.findOne({ chatId });
            if (userRefresh && userRefresh.walletAddress) {
                const walletAddress = userRefresh.walletAddress;
                const balanceRefresh = await fetchTokenBalance(walletAddress);
                const uploadLimitRefresh = getUploadLimit(balanceRefresh);
                const totalUploadedSizeRefresh = await getTotalUploadedSize(
                    walletAddress
                );
                const remainingSizeRefresh =
                    uploadLimitRefresh - totalUploadedSizeRefresh;

                bot.sendMessage(
                    chatId,
                    `Current wallet address: ${walletAddress}\nToken balance: ${balanceRefresh} TRONFILE\nUpload limit: ${(
                        uploadLimitRefresh /
                        (1024 * 1024)
                    ).toFixed(2)} MB\nTotal uploaded: ${(
                        totalUploadedSizeRefresh /
                        (1024 * 1024)
                    ).toFixed(2)} MB\nRemaining size: ${(
                        remainingSizeRefresh /
                        (1024 * 1024)
                    ).toFixed(2)} MB`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "Change Wallet Address",
                                        callback_data: "change_wallet",
                                    },
                                    {
                                        text: "Remove Wallet Address",
                                        callback_data: "remove_wallet",
                                    },
                                ],
                                [
                                    {
                                        text: "Refresh",
                                        callback_data: "refresh",
                                    },
                                    { text: "Back", callback_data: "back" },
                                ],
                            ],
                        },
                    }
                );
            }
            break;
        case "back":
            showMainMenu(chatId);
            break;
        default:
            bot.sendMessage(chatId, "Unknown command. Please try again.", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Back", callback_data: "back" }],
                    ],
                },
            });
            break;
    }
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;

    if (msg.text && msg.text.startsWith("T")) {
        const walletAddress = msg.text; // Use the wallet address as provided
        const userAction = session[chatId] ? session[chatId].action : null;

        try {
            const existingWallet = await getOrCreateUserWallet(
                chatId,
                walletAddress
            );

            bot.sendMessage(
                chatId,
                `Wallet address set: ${existingWallet}. Please upload your file now.`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Back", callback_data: "back" }],
                        ],
                    },
                }
            );
        } catch (err) {
            console.error("Database Error:", err);
            bot.sendMessage(
                chatId,
                `Failed to save wallet address: ${err.message}`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Back", callback_data: "back" }],
                        ],
                    },
                }
            );
        }
    } else if (msg.document) {
        try {
            const user = await User.findOne({ chatId });

            if (!user || !user.walletAddress) {
                bot.sendMessage(
                    chatId,
                    "Please send your wallet address first.",
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "Back", callback_data: "back" }],
                            ],
                        },
                    }
                );
                return;
            }

            const walletAddress = user.walletAddress; // Use the stored wallet address
            const balance = await fetchTokenBalance(walletAddress);
            const uploadLimit = getUploadLimit(balance);
            const totalUploadedSize = await getTotalUploadedSize(walletAddress);
            const remainingSize = uploadLimit - totalUploadedSize;
            const fileId = msg.document.file_id;
            const fileName = msg.document.file_name || "default_filename";
            const mimeType =
                msg.document.mime_type || "application/octet-stream";

            const url = await bot.getFileLink(fileId);
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            if (buffer.length > remainingSize) {
                bot.sendMessage(
                    chatId,
                    `Your upload limit is ${(
                        uploadLimit /
                        (1024 * 1024)
                    ).toFixed(
                        2
                    )} MB based on your token balance. Your file size exceeds the remaining limit of ${(
                        remainingSize /
                        (1024 * 1024)
                    ).toFixed(2)} MB.`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "Back", callback_data: "back" }],
                            ],
                        },
                    }
                );
                return;
            }

            const filePath = `uploads/${walletAddress}/${fileName}`;

            const params = {
                Bucket: "fileumstorage",
                Key: filePath,
                Body: buffer,
                ACL: "public-read",
                ContentType: mimeType,
            };

            const command = new PutObjectCommand(params);

            try {
                const data = await s3Client.send(command);
                const newFile = new File({
                    walletAddress,
                    filename: fileName,
                    path: filePath, // Use the relative file path here
                    extension: fileName.split(".").pop(),
                    size: buffer.length.toString(),
                });

                try {
                    await newFile.save();
                    bot.sendMessage(
                        chatId,
                        `File uploaded successfully and saved to database.`,
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: "Back", callback_data: "back" }],
                                ],
                            },
                        }
                    );
                } catch (dbError) {
                    console.error("Database Error:", dbError);
                    bot.sendMessage(
                        chatId,
                        `Failed to save file info to database: ${dbError.message}`,
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: "Back", callback_data: "back" }],
                                ],
                            },
                        }
                    );
                }
            } catch (err) {
                console.error("AWS S3 Upload Error:", err);
                bot.sendMessage(
                    chatId,
                    `Failed to upload the file to storage: ${err.message}`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "Back", callback_data: "back" }],
                            ],
                        },
                    }
                );
            }
        } catch (err) {
            console.error("Error processing file:", err);
            bot.sendMessage(
                chatId,
                `Failed to process your file: ${err.message}`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Back", callback_data: "back" }],
                        ],
                    },
                }
            );
        }
    }
});

module.exports = bot;
