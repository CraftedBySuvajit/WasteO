const { mongoose, makeSchemaOptions } = require('./base');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['student', 'collector', 'admin'], default: 'student' },
    name: { type: String, required: true, trim: true },
    dept: { type: String, default: '' },
    block: { type: String, enum: ['A', 'B', 'C', 'D', 'E'] },
    avatar: { type: String, default: '' },
    reward_points: { type: Number, default: 100 },
  },
  makeSchemaOptions()
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
