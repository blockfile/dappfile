module.exports = {
    apps: [
        {
            name: "backend",
            script: "./server/server.js",
            cwd: "./server", // Ensure this points to the directory containing server.js
            env: {
                SPACES_ACCESS_KEY_ID: "DO00U4ECB98HX87HX9PF",
                SPACES_SECRET_ACCESS_KEY:
                    "gaFjG7KzrmrAjLTgRpOKhjRZ9LnJP1tveyLVVDpUoF8",
                DATABASE_ACCESS:
                    "mongodb+srv://sphereprotocol:sphereprotocol%402024@cluster0.8prwtk2.mongodb.net/sphere",
                PINATA_JWT_TOKEN:
                    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxMDNmZTQzZS0yMmEyLTRmNGItYmM2Mi1jZWU4ZDAwZWNmNDAiLCJlbWFpbCI6InJlbnppdmFuMTAyMDEzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJiOWI4Y2Y2MjczZjhhMjU1NTM4MiIsInNjb3BlZEtleVNlY3JldCI6IjBjODg0MmEzMzMxZGQzYWY4NzYxYWE2NzQyN2Q2MzUzOGRlYmRiOGU2MzJlYjY4OWRkNWNmZGMwMDBiYzg4MjUiLCJpYXQiOjE3MTE1MjI5ODd9.TifShSs0X2xWp9aHisfvk4BAd2vOsLeGJfKjgzgGdI0",
            },
        },
    ],
};
