const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: String, // İsteğe bağlı grup açıklaması
    createdAt: {
        type: Date,
        default: Date.now,
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Kullanıcı modeliyle ilişkilendirilir
        },
    }],
});

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
