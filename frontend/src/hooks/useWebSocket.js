import { useEffect, useRef, useCallback, useState } from "react";

const WS_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

export default function useWebSocket(roomId, onMessage) {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isConnectingRef = useRef(false); 
  const hasJoinedRef = useRef(false); 
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const isTokenExpired = useCallback((token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = 60000; 
      
      return currentTime >= (expirationTime - bufferTime);
    } catch (error) {
      console.error("Error parsing token:", error);
      return true;
    }
  }, []);

  const getValidToken = useCallback(() => {
    const token = localStorage.getItem("access");
    
    if (!token || isTokenExpired(token)) {
      console.error("Token is missing or expired. Please log in again.");
      return null;
    }
    
    return token;
  }, [isTokenExpired]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log("Connection already in progress, skipping...");
      return;
    }

    if (!roomId || typeof roomId !== "string") {
      console.error("Invalid room ID");
      return;
    }

    // Check if already connected or connecting
    if (
      socketRef.current &&
      (socketRef.current.readyState === WS_STATES.CONNECTING ||
        socketRef.current.readyState === WS_STATES.OPEN)
    ) {
      console.log("WebSocket already connected or connecting");
      return;
    }

    const token = getValidToken();
    if (!token) {
      setConnectionStatus("error");
      return;
    }

    try {
      console.log(`Connecting to WebSocket for room ${roomId}...`);
      setConnectionStatus("connecting");
      isConnectingRef.current = true; // Mark as connecting

      const wsUrl = `ws://localhost:8000/ws/chat/${roomId}/?token=${token}`;
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log("WebSocket connected successfully");
        setConnectionStatus("connected");
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false; 
        hasJoinedRef.current = true; 
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "error") {
            console.error("Server error:", data.message);
            return;
          }
          
          onMessage(data);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("error");
        isConnectingRef.current = false;
      };

      socketRef.current.onclose = (event) => {
        console.log(`WebSocket closed: Code ${event.code}, Reason: ${event.reason || "No reason provided"}`);
        setConnectionStatus("disconnected");
        isConnectingRef.current = false;
        hasJoinedRef.current = false; // Reset join status

        // Handle different close codes
        if (event.code === 4003) {
          console.error("Authentication failed. Please log in again.");
          return;
        }

        if (event.code === 4004) {
          console.error("Authorization failed. You don't have access to this room.");
          return;
        }

        // Attempt to reconnect for other close codes
        if (
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          (event.code === 1006 || event.code === 1000 || event.code === 1001)
        ) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          console.log(`Attempting to reconnect in ${delay}ms... (Attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectAttemptsRef.current += 1;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error("Max reconnection attempts reached. Please refresh the page.");
          setConnectionStatus("failed");
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      setConnectionStatus("error");
      isConnectingRef.current = false;
    }
  }, [roomId, getValidToken, onMessage]);

  // Send message function
  const sendMessage = useCallback((content) => {
    if (!socketRef.current) {
      console.error("WebSocket is not initialized");
      return false;
    }

    if (socketRef.current.readyState !== WS_STATES.OPEN) {
      console.error("WebSocket is not open. Current state:", socketRef.current.readyState);
      return false;
    }

    try {
      socketRef.current.send(JSON.stringify({ content }));
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }, []);

  // Disconnect function
  const disconnect = useCallback(() => {
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket connection
    if (socketRef.current && socketRef.current.readyState === WS_STATES.OPEN) {
      console.log("Closing WebSocket connection...");
      socketRef.current.close(1000, "User disconnected");
    }
    
    socketRef.current = null;
    isConnectingRef.current = false;
    hasJoinedRef.current = false;
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [roomId]); // Only reconnect when roomId changes

  return { 
    sendMessage, 
    connectionStatus,
    disconnect,
    reconnect: connect 
  };
}