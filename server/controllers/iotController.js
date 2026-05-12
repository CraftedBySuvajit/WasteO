const BinData = require('../models/BinData');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const processIotData = async (req, res) => {
  try {
    const { block, level, binId } = req.body;
    if (!block || level === undefined) return res.status(400).json({ message: 'Missing required fields: block, level' });

    const normalizedBlock = block.toUpperCase();
    const binLabel = binId || 'UNKNOWN';
    const numericLevel = Number(level);

    await BinData.create({ bin_id: binLabel, block: normalizedBlock, level: numericLevel });

    if (numericLevel < 80) {
      return res.json({ message: 'Level below threshold, no alert created', level: numericLevel, block: normalizedBlock, binId: binLabel });
    }

    const existing = await Complaint.find({ block: normalizedBlock, type: 'iot', status: { $in: ['pending', 'in-progress', 'in_progress'] }, ...(binId ? { bin_id: binLabel } : {}) }).select('complaint_id');
    if (existing.length > 0) {
      return res.json({ message: 'Alert already active', complaintId: existing[0].complaint_id });
    }

    const collector = await User.findOne({ role: 'collector', block: normalizedBlock }).select('_id');
    let adminUser = await User.findOne({ role: 'admin' }).select('_id');
    if (!adminUser) adminUser = await User.findOne().select('_id');

    const complaintId = 'IOT-' + Date.now();
    const complaint = await Complaint.create({
      complaint_id: complaintId,
      user_id: adminUser ? adminUser._id : null,
      location: `Block ${normalizedBlock} - Smart Dustbin ${binLabel}`,
      waste_type: 'Mixed Waste',
      description: `🚨 AUTOMATED IoT ALERT: Dustbin "${binLabel}" in Block ${normalizedBlock} is ${numericLevel}% FULL. Immediate collection required.`,
      block: normalizedBlock,
      status: 'pending',
      type: 'iot',
      bin_id: binLabel,
      assigned_to: collector ? collector._id : null,
      status_history: [{ status: 'pending', note: collector ? `IoT Alert triggered by Bin ${binLabel}. Auto-assigned to collector (Block ${normalizedBlock})` : `IoT Alert triggered by Bin ${binLabel}. No collector assigned for this block.`, updatedBy: adminUser ? adminUser._id : null, timestamp: new Date() }],
    });

    if (collector) await createNotification(collector._id, `🚨 New IoT Alert! Bin ${binLabel} in your block (${normalizedBlock}) is full!`, 'iot');
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) await createNotification(admin._id, `🚨 IoT Alert: Bin ${binLabel} (Block ${normalizedBlock}) reached ${numericLevel}%!`, 'iot');

    res.status(201).json({ message: 'Complaint created successfully', complaintId: complaint.complaint_id, binId: binLabel, level: numericLevel, block: normalizedBlock, assignedTo: complaint.assigned_to });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getIotData = async (req, res) => {
  try {
    const allData = await BinData.find().sort({ created_at: -1 });
    const map = new Map();
    allData.forEach((row) => {
      if (!map.has(row.bin_id)) {
        map.set(row.bin_id, { _id: row.bin_id, binId: row.bin_id, block: row.block, level: row.level, lastUpdated: row.created_at });
      }
    });
    const latestBins = Array.from(map.values()).sort((a, b) => (a.block !== b.block ? a.block.localeCompare(b.block) : a.binId.localeCompare(b.binId)));
    res.json(latestBins);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { processIotData, getIotData };
