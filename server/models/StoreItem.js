const { mongoose, makeSchemaOptions } = require('./base');

const storeItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    points_required: { type: Number, required: true, min: 1 },
    stock: { type: Number, default: 0, min: 0 },
    category: { type: String, default: 'other', enum: ['stationery', 'accessories', 'home', 'garden', 'other', 'electronics', 'kitchen'] },
    is_active: { type: Boolean, default: true },
  },
  makeSchemaOptions()
);

module.exports = mongoose.models.StoreItem || mongoose.model('StoreItem', storeItemSchema);
