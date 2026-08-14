import express from 'express';
import { matchRouter } from "./routes/matches.js"
import * as http from "node:http";
import {attachWebSocketServer} from "./ws/server.js";
const app = express();
const PORT = Number(process.env.PORT||8000);
const HOST = process.env.HOST||'0.0.0.0';

// Middleware to read JSON Context
app.use(express.json());
const server=http.createServer(app);

// Routes
app.get("/", (req, res) => {
    res.json({ message: "Express server is running!" });
});

app.use('/matches',matchRouter);

const {broadcastMatchCreated} = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
// Start server
server.listen(PORT, HOST,() => {
    const baseUrl = HOST==='0.0.0.0'? `http://localhost:${PORT}`: `http://${HOST}:${PORT}`;
    console.log(`Server is running on ${baseUrl}`);
    console.log(`WebSocket Server is running on ${baseUrl.replace('http','ws')}/ws`);
});