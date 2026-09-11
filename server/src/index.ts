import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "../../shared/events";
import { RoomManager } from "./rooms/RoomManager";
import { registerSocketHandlers } from "./socket/handlers";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

const roomManager = new RoomManager();

app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: roomManager.roomCount(), uptime: process.uptime() });
});

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"] },
  maxHttpBufferSize: 8 * 1024 * 1024, // matches MAX_RECORDING_BYTES in handlers.ts
});

registerSocketHandlers(io, roomManager);

setInterval(() => roomManager.sweepEmptyRooms(), 60_000);

server.listen(PORT, () => {
  console.log(`EchoChaos server listening on :${PORT} (CORS origin: ${CORS_ORIGIN})`);
});
