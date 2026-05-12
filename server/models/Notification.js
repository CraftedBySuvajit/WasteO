const { mongoose, makeSchemaOptions } = require('./base');

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['complaint', 'reward', 'user', 'iot', 'info'], default: 'info' },
    is_read: { type: Boolean, default: false },
  },
  makeSchemaOptions()
);

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
