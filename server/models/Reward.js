const { mongoose, makeSchemaOptions } = require('./base');

const rewardSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activity: { type: String, required: true },
    points: { type: Number, required: true, min: 1 },
    date: { type: Date, default: Date.now },
  },
  makeSchemaOptions()
);

module.exports = mongoose.models.Reward || mongoose.model('Reward', rewardSchema);
