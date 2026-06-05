import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAccessToken } from "../api/authState";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

let globalSocket: Socket | null = null;
let globalToken: string | null = null;

export function useSocket() {
  const token = useAccessToken();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      // Disconnect if logged out
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        globalToken = null;
      }
      return;
    }

    // Reuse existing connection if same token
    if (globalSocket?.connected && globalToken === token) {
      socketRef.current = globalSocket;
      return;
    }

    // Disconnect stale connection
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    globalSocket = socket;
    globalToken = token;
    socketRef.current = socket;

    return () => {
      // Keep alive — don't disconnect on component unmount
    };
  }, [token]);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    const socket = socketRef.current || globalSocket;
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    const socket = socketRef.current || globalSocket;
    socket?.emit(event, data);
  }, []);

  const joinRoom = useCallback((room: string) => {
    const socket = socketRef.current || globalSocket;
    socket?.emit("join-interview", room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    const socket = socketRef.current || globalSocket;
    socket?.emit("leave-interview", room);
  }, []);

  return { on, emit, joinRoom, leaveRoom, socket: socketRef.current || globalSocket };
}

/** Subscribe to interview-related notifications globally */
export function useInterviewNotifications(
  onNotification: (event: string, data: any) => void
) {
  const { on } = useSocket();

  useEffect(() => {
    const events = [
      "interview:assigned",
      "interview:accepted",
      "interview:declined",
      "interview:updated",
      "interview:completed",
      "interview:cancelled",
      "interview:session_completed",
    ];

    const cleanups = events.map((event) =>
      on(event, (data) => onNotification(event, data))
    );

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [on, onNotification]);
}
