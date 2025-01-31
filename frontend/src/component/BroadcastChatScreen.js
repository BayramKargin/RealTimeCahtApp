import React, { useState, useEffect, useCallback } from "react";
import { GiftedChat } from "react-native-gifted-chat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useSocket from "./UseSocket"; // Socket hook'unuzu buraya import edin
import { API_URL } from "@env";

const BroadcastChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const socket = useSocket(API_URL);
  const [senderId, setSenderId] = useState(null);

  // Kullanıcının senderId'sini almak için
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
      try {
        const response = await fetch(`${API_URL}/broadcastMessages`);
        const data = await response.json();
        const formattedMessages = data.map(msg => ({
          _id: msg._id,
          text: msg.text,
          createdAt: new Date(msg.createdAt),
          user: {
            _id: msg.senderId,
          },
        }));
        setMessages(formattedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, []);

  // Bağlı olan kullanıcıyı kaydetmek ve yayınlanan mesajları almak için
  useEffect(() => {
    if (socket && senderId) {
      console.log(`Socket ID: ${socket.id}, Sender ID: ${senderId}`);
      socket.emit("register", { userId: senderId, socketId: socket.id });
      console.log(`User ${senderId} registered with socket ID ${socket.id}`);

      const handleNewBroadcastMessage = (message) => {
        console.log("new broadcast message :", message);
        setMessages((prevMessages) =>
          GiftedChat.append(prevMessages, {
            _id: message._id,
            text: message.text,
            createdAt: new Date(message.createdAt),
            user: {
              _id: message.user._id,
            },
          })
        );
      };

      socket.on("newBroadcastMessage", handleNewBroadcastMessage);

      return () => {
        socket.off("newBroadcastMessage", handleNewBroadcastMessage);
      };
    } else {
      console.log("Socket or SenderId not found");
    }
  }, [socket, senderId]);

  const onBroadcastSend = useCallback(
    (messages = []) => {
      if (!senderId) {
        console.error("No senderId found");
        return;
      }

      messages.forEach((message) => {
        if (socket) {
          socket.emit("broadcastMessage", {
            senderId: senderId,
            message: message.text,
          });
        }
      });

      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, messages)
      );
    },
    [socket, senderId]
  );

  return (
    <GiftedChat
      messages={messages}
      onSend={(messages) => onBroadcastSend(messages)}
      user={{ _id: senderId }}
    />
  );
};

export default BroadcastChatScreen;
