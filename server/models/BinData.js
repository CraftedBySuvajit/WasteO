const { mongoose, makeSchemaOptions } = require('./base');

const binDataSchema = new mongoose.Schema(
  {
    bin_id: { type: String, required: true },
    block: { type: String, required: true, enum: ['A', 'B', 'C', 'D', 'E'] },
    level: { type: Number, required: true, min: 0, max: 100 },
  },
  makeSchemaOptions()
);

module.exports = mongoose.models.BinData || mongoose.model('BinData', binDataSchema);
