const { mongoose, makeSchemaOptions } = require('./base');

const orderLogSchema = new mongoose.Schema(
  {
    order_id: { type: String, required: true },
    action: { type: String, required: true, enum: ['viewed', 'delivered', 'failed_verification', 'locked'] },
    performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    details: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  makeSchemaOptions()
);

module.exports = mongoose.models.OrderLog || mongoose.model('OrderLog', orderLogSchema);
