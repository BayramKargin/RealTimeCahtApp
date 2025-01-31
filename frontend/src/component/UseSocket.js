import { useEffect, useState } from "react";
import io from "socket.io-client";

const useSocket = (url) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(url, { autoConnect: false });
    newSocket.on("connect", () => {
      console.log("Socket connected!" + newSocket.id);
    });
    newSocket.on("connect_error", (error) => {
      console.error("Connection Error:", error);
    });
    newSocket.connect();
    setSocket(newSocket);
    return () => {
      console.log("Disconnecting socket...");
      newSocket.close();
    };
  }, [url]);

  return socket;
};

export default useSocket;
