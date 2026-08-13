import express from 'express';

const app = express();
const PORT = 8000;

// Middleware to read JSON Context
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.json({ message: "Express server is running!" });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});