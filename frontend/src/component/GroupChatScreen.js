import React, { useState, useEffect, useCallback } from "react";
import { GiftedChat } from "react-native-gifted-chat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useSocket from "./UseSocket";
import { API_URL } from "@env";

const GroupChatScreen = ({ route }) => {
  const { groupId } = route.params; // Sohbet edilen grubun kimliği
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

    // Grup mesajlarını al
    useEffect(() => {
      const fetchMessages = async () => {
        try {
          const response = await fetch(`${API_URL}/messages/${groupId}`);
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
    }, [groupId]);


  useEffect(() => {
    if (socket && senderId) {
      console.log(`Socket ID: ${socket.id}, Sender ID: ${senderId}`); // Loglama ekledik
      socket.emit("register", { userId: senderId, socketId: socket.id });
      socket.emit("joinGroup", { groupId: groupId, userId: senderId });
      console.log(`User ${senderId} joined group ${groupId}`); // Odaya katılımı loglayın

      const handleNewMessage = (message) => {
        console.log("new message :", message);
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

      socket.on("newGroupMessage", handleNewMessage);

      return () => {
        socket.off("newGroupMessage", handleNewMessage);
      };
    } else {
      console.log("Socket or SenderId not found");
    }
  }, [socket, senderId, groupId]); // Bağımlılık dizisini güncelledik

  const onSend = useCallback(
    (messages = []) => {
      if (!senderId) {
        console.error("No senderId found");
        return;
      }

      messages.forEach((message) => {
        if (socket) {
          socket.emit("groupMessage", {
            groupId,
            senderId: senderId,
            message: message.text,
          });
        }
      });

      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, messages)
      );
    },
    [groupId, socket, senderId]
  );

  return (
    <GiftedChat
      messages={messages}
      onSend={(messages) => onSend(messages)}
      user={{ _id: senderId }} // Oturum açan kullanıcının kimliği burada olmalı
    />
  );
};

export default GroupChatScreen;
