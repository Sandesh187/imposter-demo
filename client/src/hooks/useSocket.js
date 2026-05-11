import { useEffect, useMemo } from "react";
import { io } from "socket.io-client";

export function useSocket() {
  const socket = useMemo(() => {
    const url = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:3001" : window.location.origin);
    return io(url, {
      autoConnect: true,
      transports: ["websocket", "polling"]
    });
  }, []);

  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return socket;
}
