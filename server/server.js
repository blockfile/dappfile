require("dotenv").config();
const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const cors = require("cors");
const bot = require("./telegramBot"); // Import the bot setup
const File = require("../server/model/models"); // Ensure the path is correct
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const app = express();
app.use(cors());
app.use(express.static("public"));

app.use(express.json({ limit: "10000mb" }));
app.use(express.urlencoded({ limit: "10000mb", extended: true }));

// Multer configuration for handling multipart/form-data with no file size limit
const storage = multer.memoryStorage(); // Using memory storage
const upload = multer({
    storage: storage,
    limits: { fileSize: Infinity }, // No limit on file size
});

// WebSocket connection handler

// Fallback route handler (for SPA routing)

const corsOptions = {
    origin: [
        "https://dapp.fileum.xyz",
        "http://localhost:3000",
        "http://159.89.209.121:3000",
    ], // Add your production and development URLs here
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

const spacesEndpoint = new AWS.Endpoint("sgp1.digitaloceanspaces.com");
const s3 = new AWS.S3({
    endpoint: spacesEndpoint.hostname, // Correct, just the hostname, no "https://"
    accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
    secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY,
});
const mongoose = require("mongoose");

mongoose
    .connect(process.env.DATABASE_ACCESS, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected..."))
    .catch((err) => console.log(err));

app.get("/api/totalSize", async (req, res) => {
    const { walletAddress } = req.query;
    try {
        const totalSize = await File.aggregate([
            { $match: { walletAddress: walletAddress, isFolder: false } },
            { $addFields: { numericSize: { $toLong: "$size" } } }, // Convert size to number
            { $group: { _id: null, totalSize: { $sum: "$numericSize" } } },
        ]);

        if (totalSize.length > 0) {
            res.json({ totalSize: totalSize[0].totalSize });
        } else {
            res.json({ totalSize: 0 });
        }
    } catch (error) {
        console.error("Error fetching total uploaded size:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/api/download/:id", async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).send("File not found");
        }

        // Example for local file system, adjust the path as needed
        const filePath = `${__dirname}/path/to/your/files/${file.filename}`;

        res.download(filePath, file.filename, (err) => {
            if (err) {
                console.error("Error downloading file:", err);
                res.status(500).send("Error downloading file");
            }
        });
    } catch (error) {
        console.error("Error fetching file:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.delete("/api/delete/:filename", async (req, res) => {
    const { filename } = req.params;

    try {
        const file = await File.findOne({ filename });
        if (!file) {
            return res.status(404).send("File not found.");
        }

        // Now you have the walletAddress, you can construct the correct path
        const filePath = `uploads/${file.walletAddress}/${filename}`;

        const deleteParams = {
            Bucket: "fileumstorage",
            Key: filePath,
        };

        console.log(`Deleting file with key: ${filePath}`);
        s3.deleteObject(deleteParams, async (err, data) => {
            if (err) {
                console.error("Error deleting file from Spaces:", err);
                return res.status(500).send(err);
            }

            await File.deleteOne({ filename });
            res.send({ success: true, message: "File deleted successfully." });
        });
    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/api/delete-multiple", async (req, res) => {
    const { fileIds } = req.body; // Expect an array of file IDs

    if (!fileIds || fileIds.length === 0) {
        return res.status(400).send("No file IDs provided.");
    }

    try {
        // Iterate over each fileId and delete the corresponding file
        const deletePromises = fileIds.map(async (fileId) => {
            const file = await File.findById(fileId);
            if (!file) {
                console.warn(`File not found for ID: ${fileId}`);
                return;
            }

            const fileKey = `uploads/${file.walletAddress}/${file.filename}`;

            // Asynchronously delete from DigitalOcean Spaces
            await new Promise((resolve, reject) => {
                s3.deleteObject(
                    { Bucket: "fileumstorage", Key: fileKey },
                    (err, data) => {
                        if (err) {
                            console.error(
                                "Error deleting file from Spaces:",
                                err
                            );
                            reject(err);
                        } else {
                            resolve(data);
                        }
                    }
                );
            });

            // Delete from MongoDB
            await File.findByIdAndDelete(fileId);
        });

        // Wait for all deletions to complete
        await Promise.all(deletePromises);

        res.send({ success: true, message: "Files deleted successfully." });
    } catch (error) {
        console.error("Error deleting files:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/api/files", async (req, res) => {
    const { walletAddress } = req.query;

    try {
        const files = await File.find({ walletAddress });
        res.json(files);
    } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).send("Error fetching files");
    }
});
app.get("/api/files/:id", async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).send("File not found");
        }
        res.json(file);
    } catch (error) {
        console.error("Error fetching file:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.post("/api/create-folder", upload.none(), async (req, res) => {
    const { folderName, walletAddress } = req.body;

    const folderPath = `uploads/${walletAddress}/${folderName}/`;

    const params = {
        Bucket: "fileumstorage",
        Key: folderPath,
        ACL: "public-read",
    };

    s3.putObject(params, async function (err, data) {
        if (err) {
            console.error("Error occurred while creating folder", err);
            return res.status(500).send(err);
        }

        // Optionally save folder metadata to MongoDB
        try {
            const newFolder = await File.create({
                filename: folderName,
                walletAddress: walletAddress,
                isFolder: true, // You might want a flag to distinguish folders
                // Include other metadata as needed
            });

            res.send({ s3Data: data, dbData: newFolder });
        } catch (dbError) {
            console.error("Database error:", dbError);
            return res.status(500).send(dbError);
        }
    });
});
app.post("/api/upload", upload.single("file"), async (req, res) => {
    const walletAddress = req.body.walletAddress;
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }
    const { originalname, mimetype, size } = req.file;
    const filePath = `${walletAddress}/${originalname}`;

    // Specify Content-Disposition for attachment to ensure it prompts as a download
    const contentDisposition = `attachment; filename="${originalname}"`;

    const params = {
        Bucket: "fileumstorage",
        Key: `uploads/${filePath}`,
        Body: req.file.buffer,
        ACL: "public-read",
        ContentType: mimetype,
        ContentDisposition: contentDisposition, // Set Content-Disposition header here
    };

    s3.upload(params, async function (err, data) {
        if (err) {
            console.error("Error occurred", err);
            return res.status(500).send(err);
        }
        try {
            const newFile = await File.create({
                filename: originalname,
                path: `uploads/${filePath}`,
                extension: originalname.split(".").pop(),
                size: size.toString(),
                walletAddress: walletAddress,
                url: data.Location,
            });
            res.send({ s3Data: data, dbData: newFile });
        } catch (dbError) {
            console.error("Database error:", dbError);
            res.status(500).send(dbError);
        }
    });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, function () {
    console.log(`Server running on port ${PORT}`);
});

// Set the timeout to 0 to disable it, allowing uploads of any duration
server.timeout = 0;
