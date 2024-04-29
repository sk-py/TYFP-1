const express = require("express");
const app = express();
const http = require("http");
// const { Server } = require("socket.io");
const ACTIONS = require("./src/Actions");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:5000",
    // origin: true,
  },
});

const userSocketMap = {};
const storedOffer = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        userName: userSocketMap[socketId],
      };
    }
  );
}

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, userName }) => {
    
    if (Object.keys(userSocketMap).length > 2) {
      const message = "Room is full ";
      console.log("message", message);
      socket.emit("roomFull", { message });
      return;
    }
    console.log("roomId", roomId, userName);

    userSocketMap[socket.id] = userName;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        userName,
        socketId: socket.id,
        count: userSocketMap.length,
        storedOffer,
      });
    });
    console.log("Count -----> ", userSocketMap);
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    console.log("Disconnectd");
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
    delete storedOffer[socket.id];
    console.log("storedOffer", storedOffer);
  });
  socket.on("offerCreated", async ({ offer, mySocketId }) => {
    storedOffer[mySocketId] = offer;
    console.log("Stored Offer", storedOffer);
    console.log("mySocketId", await mySocketId);

    // await socket.emit("getStoredOffers", { storedOffer });
  });

  socket.on("requestStoredOffer", async () => {
    socket.emit("takeStoredOffer", storedOffer);
  });

  socket.on("answerCreated", async ({ answer, mySocketId }) => {
    storedOffer[mySocketId] = answer;
    console.log("Stored Offer", storedOffer);
    console.log("mySocketId", await mySocketId);
    await socket.emit("getStoredOffers", { storedOffer });
    await socket.emit("takeStoredAnswer", { storedOffer });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
