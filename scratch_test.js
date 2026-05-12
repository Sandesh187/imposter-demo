import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("Connected to server");
  
  socket.emit("create-room", { playerName: "Tester" }, (res) => {
    console.log("Create room response:", res);
    
    if (res.ok) {
      const { playerId, room } = res;
      console.log(`Saved playerId: ${playerId}, Room Code: ${room.code}`);
      
      // Simulate disconnect and reconnect
      socket.disconnect();
      
      setTimeout(() => {
        console.log("Reconnecting to simulate page refresh...");
        const socket2 = io("http://localhost:3001");
        socket2.on("connect", () => {
          console.log("Socket 2 connected. Attempting to restore session...");
          
          socket2.emit("reconnect-session", { playerId }, (reconnectRes) => {
            console.log("Reconnect session response:", reconnectRes);
            if (reconnectRes.ok && reconnectRes.room.code === room.code) {
              console.log("SUCCESS! Session restored correctly.");
            } else {
              console.log("FAILED! Session not restored.");
            }
            socket2.disconnect();
            process.exit(0);
          });
        });
      }, 1000);
    } else {
      console.log("Failed to create room.");
      process.exit(1);
    }
  });
});
