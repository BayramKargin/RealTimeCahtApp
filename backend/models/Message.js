const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: String,
  receiverId: String,
  text: String // Bu alan şifreli mesaj metnini tutacak
});

module.exports = mongoose.model('Message', messageSchema);
