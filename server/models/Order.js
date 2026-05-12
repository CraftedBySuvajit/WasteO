const { mongoose, makeSchemaOptions } = require('./base');

const orderSchema = new mongoose.Schema(
  {
    order_id: { type: String, required: true, unique: true, index: true },
    user_name: { type: String, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    block: { type: String },
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreItem', required: true },
    item_name: { type: String, required: true },
    points_used: { type: Number, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'approved', 'ready_for_pickup', 'delivered'] },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assigned_collector_name: { type: String, default: '' },
    pickup_location: { type: String, default: 'Admin Office / College Store Room' },
    pickup_time: { type: String, default: '10 AM – 5 PM' },
    pickup_code: { type: String, unique: true, sparse: true },
    failed_attempts: { type: Number, default: 0 },
    expires_at: { type: Date },
    delivered_at: { type: Date },
    reward_given: { type: Boolean, default: false },
  },
  makeSchemaOptions()
);

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
