const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

const Message = require("./models/Message");
const CryptoJS = require("crypto-js");
const encryptionKey = "anahtar123";

const Group = require("./models/Group");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/myDatabase")
  .then(() => console.log("MongoDB connection successful"))
  .catch((err) => console.error("MongoDB connection error:", err));

function encryptText(text) {
  return CryptoJS.AES.encrypt(text, encryptionKey).toString();
}

function decryptText(encryptedText) {
  const bytes = CryptoJS.AES.decrypt(encryptedText, encryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Grup oluşturma (Örnek)
app.post("/groups", async (req, res) => {
  const { name, members } = req.body; // `members` bilgisini de istekten al
  try {
    // Yeni grup oluştur, `members` bilgisini de ekleyerek
    const group = new Group({
      name,
      members: members.map((memberId) => ({ userId: memberId })), // `members` dizisini MongoDB'ye uygun şekilde düzenle
    });

    await group.save(); // Grubu veritabanına kaydet
    res.status(201).json({ success: true, groupId: group._id }); // Başarılı yanıt dön
  } catch (error) {
    // Hata durumunda 500 durum kodu ile hata mesajı gönder
    res.status(500).json({
      success: false,
      message: "Failed to create group",
      error: error.message,
    });
  }
});

app.get("/my-groups/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    // ObjectId oluştururken 'new' kullanın
    const objectId = new mongoose.Types.ObjectId(userId);

    const groups = await Group.find({
      "members.userId": objectId,
    });

    res.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res
      .status(500)
      .send({ message: "Error fetching groups", error: error.toString() });
  }
});

app.get("/groups", async (req, res) => {
  try {
    const groups = await Group.find(); // Group, MongoDB modeliniz
    res.json(groups);
  } catch (error) {
    res.status(500).send({ message: "Error fetching groups", error });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hashedPassword,
    });
    const newUser = await user.save();
    res.status(201).send("User created");
  } catch (error) {
    res.status(500).send("Error creating the user");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Veritabanında kullanıcıyı bul
    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.send(user);
    } else {
      res.status(400).send("Kullanıcı adı veya şifre hatalı.1");
    }
  } catch (error) {
    res.status(500).send("Sunucu hatası: " + error.message);
  }
});

// Kullanıcıları listeleme endpoint'i
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Parolalar hariç tüm kullanıcı bilgileri
    console.log(users);
    res.send(users);
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
});

app.get('/messages/:receiverId', async (req, res) => {
  const { receiverId } = req.params;
  try {
      const messages = await Message.find({ receiverId }).sort({ createdAt: 1 });
      const decryptedMessages = messages.map((msg) => {
        console.log("mesagges:  " + msg.text);
        return { ...msg.toObject(), text: decryptText(msg.text) }; // Şifre çözme işlemi
      });
  
      res.json(decryptedMessages);
      //res.status(200).json(messages);
  } catch (err) {
      res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/broadcastMessages', async (req, res) => {
  try {

      const messages = await Message.find({ receiverId: "broadcast" }).sort({ createdAt: 1 });
      const decryptedMessages = messages.map((msg) => {
        console.log("mesagges:  " + msg.text);
        return { ...msg.toObject(), text: decryptText(msg.text) }; // Şifre çözme işlemi
      });
      res.status(200).json(decryptedMessages);
  } catch (err) {
      res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get("/messages/:userId/:contactId", async (req, res) => {
  try {
    const { userId, contactId } = req.params;
    console.log(userId + contactId);
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId },
      ],
    }).sort({ createdAt: -1 }); // Mesajları zaman sırasına göre sırala

    const decryptedMessages = messages.map((msg) => {
      console.log("mesagges:  " + msg.text);
      return { ...msg.toObject(), text: decryptText(msg.text) }; // Şifre çözme işlemi
    });

    res.json(decryptedMessages);
    console.log("decrypt messages:  " + decryptedMessages);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    res.status(500).send("Error fetching messages");
  }
});

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*", // Tüm domain'lerden gelen bağlantılara izin verir (Dikkatli kullanılmalıdır)
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("authenticate", async ({ userId }) => {
    try {
      // Kullanıcının veritabanındaki kaydını bul ve socketId'yi güncelle
      await User.findByIdAndUpdate(userId, { socketId: socket.id });
      console.log(`User ${userId} connected with socket ID: ${socket.id}`);
      socket.emit("authenticated", { socketId: socket.id });
    } catch (error) {
      console.error("Error updating user socket ID:", error);
    }
  });

  socket.on("register", async ({ userId, socketId }) => {
    try {
      await User.findOneAndUpdate(
        { _id: userId },
        { socketId: socketId },
        { new: true }
      );
      console.log(`User ${userId} registered with socket ID ${socketId}`);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("send_message", (message) => {
    console.log("alınan message:", message);
    io.emit("receive_message", message + " alındı");
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected");
  });

  //Birebir mesajlar için
  socket.on("private message", async ({ senderId, receiverId, message }) => {
    try {
      const encryptedMessage = encryptText(message);
      const decryptedMessage = decryptText(encryptedMessage);

      const fromUser = await User.findOne({ _id: senderId });
      const toUser = await User.findOne({ _id: receiverId });
      // Mesajı veritabanına kaydet
      const savedMessage = new Message({
        senderId,
        receiverId,
        text: encryptedMessage,
      });
      await savedMessage.save();

      if (toUser && toUser.socketId) {
        io.to(toUser.socketId).emit("newPrivateMessage", {
          _id: new mongoose.Types.ObjectId(), // Benzersiz bir _id ekliyoruz
          text: message,
          createdAt: new Date(),
          user: { _id: senderId },
        });
        console.log(`Message from ${senderId} to ${receiverId}: ${message}`);
      } else {
        console.log(`User ${receiverId} not found or not connected`);
      }

      console.log(`Message from ${senderId} to ${receiverId}: ${message}`);
    } catch (error) {
      console.error("Error handling private message:", error);
      socket.emit("error", { message: "Message could not be sent." });
    }
  });

  // Gruba katılma
  socket.on("joinGroup", async ({ groupId}) => {
    try {
      const group = await Group.findById(groupId);
      if (group) {
        socket.join(groupId.toString()); // Kullanıcıyı ilgili odaya ekle (string'e çeviriyoruz)
        console.log(`Userjoined group ${groupId}`);

        // Odaya katılan kullanıcıları kontrol edin ve loglayın
        const room = io.sockets.adapter.rooms.get(groupId.toString());
        if (room) {
          console.log(`Users in room ${groupId}:`, Array.from(room));
        } else {
          console.log(`No users in room ${groupId}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Grup mesajı gönderme
  socket.on("groupMessage", async ({ groupId, senderId, message }) => {
    try {
      const encryptedMessage = encryptText(message);
      const group = await Group.findById(groupId).populate("members");
      if (group) {
        const messageData = {
          _id: new mongoose.Types.ObjectId(),
          text: message,
          createdAt: new Date(),
          user: { _id: senderId },
        };

        const savedMessage = new Message({
          senderId,
          receiverId: groupId,
          text: encryptedMessage,
        });
        await savedMessage.save();

        io.to(groupId).emit("newGroupMessage", messageData);
        console.log(`Message from ${senderId} to group ${groupId}: ${message}`);
      }
    } catch (err) {
      console.error(err);
    }
  });

   // Yeni: Tüm kullanıcılara mesaj gönderme
   socket.on('broadcastMessage', async ({ senderId, message }) => {
    try {
      const encryptedMessage = encryptText(message);
        const messageData = {
            text: message,
            senderId: senderId,
            receiverId: "broadcast",
            createdAt: new Date()
        };
        const newMessage = new Message({
          text: encryptedMessage,
          senderId: messageData.senderId,
          createdAt: messageData.createdAt,
          receiverId: "broadcast" // Broadcast mesajları için groupId'yi null olarak ayarlıyoruz
      });
      await newMessage.save();
        
        // Mesajı JSON formatında oluşturuyoruz
        const broadcastMessage = {
            _id: new mongoose.Types.ObjectId(),
            text: messageData.text,
            createdAt: messageData.createdAt,
            user: { _id: senderId }
        };

        io.emit('newBroadcastMessage', broadcastMessage); // Tüm kullanıcılara mesaj gönder
        console.log(`Broadcast message from ${senderId}: ${message}`);
    } catch (err) {
        console.error(err);
    }
});


});

app.get("/", (req, res) => {
  // HTTP GET isteklerine yanıt ver
  res.send("Hello World!");
});

server.listen(3000, () => {
  console.log("Socket.io server listening on port 3000");
});
