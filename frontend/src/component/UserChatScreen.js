import React, { useState, useEffect, useCallback } from "react";
import { GiftedChat } from "react-native-gifted-chat";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";

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
    AsyncStorage.getItem("@userId")
      .then((id) => {
        if (id) {
          console.log(id);
          newSocket.emit("register", { userId: id, socketId: newSocket.id });
        } else {
          console.error("No userId found in storage");
        }
      });
    return () => {
      console.log("Disconnecting socket...");
      newSocket.close();
    };
  }, [url]);

  return socket;
};

const UserChatScreen = ({ route }) => {
  const { userId } = route.params; // Sohbet edilen kullanıcının kimliği
  const [messages, setMessages] = useState([]);
  const socket = useSocket(API_URL);
  const [senderId, setSenderId] = useState(null);

  useEffect(() => {
    const fetchSenderId = async () => {
      const id = await AsyncStorage.getItem("@userId");
      if (!id) {
        console.error("No senderId found in storage");
        return;
      }
      setSenderId(id);
    };

    fetchSenderId();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!senderId) return;

      try {
        const response = await fetch(
          `${API_URL}/messages/${senderId}/${userId}`
        );
        const messages = await response.json();
        setMessages(
          messages.map((m) => ({
            _id: m._id,
            text: m.text,
            createdAt: new Date(m.createdAt),
            user: {
              _id: m.senderId,
            },
          }))
        );
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [userId, senderId, API_URL]);

  useEffect(() => {
    if (socket && senderId) {
      const handleNewMessage = (message) => {
        setMessages((prevMessages) =>
          GiftedChat.append(prevMessages, {
            _id: message._id,
            text: message.text,
            createdAt: new Date(message.createdAt), // Gelen mesajın zaman damgasını kullanın
            user: {
              _id: message.senderId,
            },
          })
        );
      };
      socket.on("newPrivateMessage", handleNewMessage);

      return () => {
        socket.off("newPrivateMessage", handleNewMessage);
      };
    }
  }, [socket, senderId]);

  const onSend = useCallback(
    (messages = []) => {
      if (!senderId) {
        console.error("No senderId found");
        return;
      }

      messages.forEach((message) => {
        if (socket) {
          socket.emit("register", { userId: senderId, socketId: socket.id });
          socket.emit("private message", {
            senderId: senderId,
            receiverId: userId,
            message: message.text,
          });
        }
      });

      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, messages)
      );
      console.log("gönderen socket id : " + socket.id);
    },
    [userId, socket, senderId]
  );

  return (
    <GiftedChat
      messages={messages}
      onSend={(messages) => onSend(messages)}
      user={{ _id: senderId }} // Oturum açan kullanıcının kimliği burada olmalı
    />
  );
};

export default UserChatScreen;
