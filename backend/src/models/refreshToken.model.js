const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    tokenHash: {
        type: String,
        required: true,
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
}, { timestamps: true });

// Tự xóa document khi hết hạn (optional, có thể dùng TTL index)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

const RefreshTokenModel = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshTokenModel;
module.exports.hashToken = hashToken;
