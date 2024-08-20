const TelegramBot = require("node-telegram-bot-api");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mongoose = require("mongoose");
require("dotenv").config();
const axios = require("axios");
const User = require("../server/model/user"); // Import the User model
const File = require("../server/model/models"); // Import the UserFile model

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
let session = {};
// Dynamically import node-fetch
const AWS = require("aws-sdk");

let fetch;
import("node-fetch")
    .then(({ default: fetched }) => (fetch = fetched))
    .catch((err) => console.error("Failed to load node-fetch:", err));

// Setup AWS S3 client for DigitalOcean Spaces
AWS.config.update({
    accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
    secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY,
    region: "sgp1", // This is optional as the endpoint defines the region in DigitalOcean Spaces
});

const s3 = new AWS.S3({
    endpoint: new AWS.Endpoint("https://sgp1.digitaloceanspaces.com"),
    s3ForcePathStyle: true, // needed with custom endpoint
});

mongoose
    .connect(process.env.DATABASE_ACCESS, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected..."))
    .catch((err) => console.log("MongoDB connection error:", err));

const bannerUrl = "../src/components/assets/Images/banner.jpg"; // Replace with your banner image URL

const fetchTokenBalance = async (walletAddress) => {
    const apiKey = "9IQVWBVV4U8DX8YI7EC56F3HBYJEE1EWNX"; // Replace with your BscScan API key
    const contractAddress = "0x2d4531984368ab56d71f8f5ed52c6fd383f9f278"; // The contract address for the token
    const url = `https://api.basescan.org/api?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${walletAddress}&tag=latest&apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data && response.data.result) {
            return response.data.result / 1e18; // Adjust based on the token's decimals
        }
    } catch (error) {
        console.error("Error fetching token balance:", error);
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

async function showMainMenu(chatId) {
    const user = await User.findOne({ chatId });
    let buttons = [[{ text: "Upload File", callback_data: "upload" }]];

    if (user && user.walletAddress) {
        const balance = await fetchTokenBalance(user.walletAddress);
        const uploadLimit = getUploadLimit(balance);
        const totalUploadedSize = await getTotalUploadedSize(
            user.walletAddress
        );
        const remainingSize = uploadLimit - totalUploadedSize;

        buttons.push([
            {
                text: `Token balance: ${balance} FILEUM\nUpload limit: ${(
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
            caption: "Welcome to FILEUM",
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
                const balance = await fetchTokenBalance(user.walletAddress);
                const uploadLimit = getUploadLimit(balance);
                const totalUploadedSize = await getTotalUploadedSize(
                    user.walletAddress
                );
                const remainingSize = uploadLimit - totalUploadedSize;

                bot.sendMessage(
                    chatId,
                    `Current wallet address: ${
                        user.walletAddress
                    }\nToken balance: ${balance} FILEUM\nUpload limit: ${(
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
                const balanceRefresh = await fetchTokenBalance(
                    userRefresh.walletAddress
                );
                const uploadLimitRefresh = getUploadLimit(balanceRefresh);
                const totalUploadedSizeRefresh = await getTotalUploadedSize(
                    userRefresh.walletAddress
                );
                const remainingSizeRefresh =
                    uploadLimitRefresh - totalUploadedSizeRefresh;

                bot.sendMessage(
                    chatId,
                    `Current wallet address: ${
                        userRefresh.walletAddress
                    }\nToken balance: ${balanceRefresh} ETF\nUpload limit: ${(
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
    }
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;

    if (msg.text && msg.text.startsWith("0x")) {
        const walletAddress = msg.text.toLowerCase(); // Convert to lowercase
        const userAction = session[chatId] ? session[chatId].action : null;

        try {
            let user = await User.findOne({ chatId });

            if (userAction === "change_wallet") {
                user.walletAddress = walletAddress;
                delete session[chatId];
            } else {
                if (!user) {
                    user = new User({ chatId, walletAddress });
                } else {
                    user.walletAddress = walletAddress;
                }
            }

            await user.save();
            bot.sendMessage(
                chatId,
                "Wallet address set. Please upload your file now.",
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

            const walletAddress = user.walletAddress.toLowerCase(); // Ensure wallet address is in lowercase
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

            s3.upload(params, async function (err, data) {
                if (err) {
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
                    return;
                }

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
                        "File uploaded successfully and saved to database.",
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
            });
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
