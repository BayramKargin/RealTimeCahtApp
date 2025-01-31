import { useEffect, useState } from "react";
// import socket from "../../socket";
import { GiftedChat } from "react-native-gifted-chat";
import { useCallback } from "react";
import {API_URL} from "@env"
import io from "socket.io-client";

const ChatScreen = () => {
  const socket = io(`${API_URL}`);
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    socket.on("receive_message", (message) => {
      console.log("Sunucudan yeni mesaj alındı:", message);

      // Tarih bilgisini doğrula ve düzelt
      const validDate = new Date(message.createdAt);
      if (isNaN(validDate.getTime())) {
        // validDate 'Invalid Date' ise getTime() NaN döner
        message.createdAt = new Date(); // Geçersiz tarih varsa şu anki zamanı kullan
      }

      const newMessage = {
        ...message,
        createdAt: message.createdAt,
        _id: Math.round(Math.random() * 1000000),
        text: message,
        user: {
          _id: 1,
        },
      };
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, newMessage)
      );
    });

    return () => {
      socket.off("message");
    };
  }, []);
  const onSend = useCallback((newMessages) => {
    const messageText = newMessages[0].text;
    if (messageText) {
      socket.emit("send_message", messageText);
      const newMessage = {
        ...newMessages,
        createdAt: newMessages.createdAt,
        _id: Math.round(Math.random() * 1000000),
        text: messageText,
        user: {
          _id: 1,
        },
      };
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, newMessages)
      );
    } else {
      console.log("Empty message content");
    }
  }, []);
  return <GiftedChat messages={messages} onSend={messages => onSend(messages)} user={{ _id: 2 }} />;
};

export default ChatScreen;
