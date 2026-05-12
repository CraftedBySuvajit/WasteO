const { mongoose, makeSchemaOptions } = require('./base');

const complaintHistorySchema = new mongoose.Schema(
  {
    status: String,
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaint_id: { type: String, required: true, unique: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: String, required: true },
    location_data: { type: mongoose.Schema.Types.Mixed, default: {} },
    waste_type: { type: String, required: true },
    description: { type: String, required: true },
    block: { type: String, required: true, enum: ['A', 'B', 'C', 'D', 'E'] },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'pending', enum: ['pending', 'in-progress', 'in_progress', 'completed', 'rejected'] },
    rejection_reason: { type: String, default: '' },
    type: { type: String, default: 'complaint', enum: ['complaint', 'scan', 'iot'] },
    bin_id: { type: String, default: '' },
    status_history: { type: [complaintHistorySchema], default: [] },
    image: { type: String, default: '' },
    completion_image: { type: String, default: '' },
    reward_given: { type: Boolean, default: false },
  },
  makeSchemaOptions()
);

module.exports = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
