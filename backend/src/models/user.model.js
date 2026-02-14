const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['ADMIN', 'USER'],
        default: 'USER'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'BANNED'],
        default: 'ACTIVE'
    },
    avatar: {
        type: String,
        default: null
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }],
    savedCollections: [{
        nameid: { type: String, required: true },
        name: { type: String, required: true },
        questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
    }],
    lastNotificationReadAt: { type: Date }
}, { timestamps: true });

// Database = MONGO_DB_NAME (.env.local), collection = MONGO_USER_COLLECTION (cả đăng nhập + danh sách user)
const collectionName = process.env.MONGO_USER_COLLECTION || 'users';
module.exports = mongoose.model('User', userSchema, collectionName);