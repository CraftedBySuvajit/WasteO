const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { uploadToCloudinary } = require('../middleware/upload');

const mapComplaint = (c) => ({
  id: c._id,
  complaintId: c.complaint_id,
  user: c.user_id,
  location: c.location,
  locationData: c.location_data,
  wasteType: c.waste_type,
  description: c.description,
  block: c.block,
  assignedTo: c.assigned_to,
  status: c.status,
  rejectionReason: c.rejection_reason,
  type: c.type,
  binId: c.bin_id,
  statusHistory: c.status_history,
  image: c.image,
  aiResults: c.ai_results || null,
  completionImage: c.completion_image,
  rewardGiven: c.reward_given,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
});

const getComplaints = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (req.user.role === 'student') filter.user_id = req.user.id;
    if (req.user.role === 'collector') filter.block = req.user.block;

    const complaints = await Complaint.find(filter)
      .populate('user_id', 'name email')
      .populate('assigned_to', 'name')
      .sort({ created_at: -1 });

    res.json(complaints.map(mapComplaint));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaint_id: req.params.id.toUpperCase() })
      .populate('user_id', 'name email')
      .populate('assigned_to', 'name');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (req.user.role === 'student' && String(complaint.user_id._id || complaint.user_id) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'collector' && complaint.block !== req.user.block) {
      return res.status(403).json({ message: 'Not authorized to view other blocks' });
    }

    res.json(mapComplaint(complaint));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const submitComplaint = async (req, res) => {
  try {
    const { location, wasteType, description, block, type } = req.body;
    if (!location || !wasteType || !description || !block) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    let imageUrl = null;
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file, 'wasteo/complaints');
      } catch (uploadErr) {
        console.error('❌ [SUBMIT] Cloudinary upload failed:', uploadErr.message);
      }
    }

    const complaintId = 'COMP-' + Date.now();
    const complaint = await Complaint.create({
      complaint_id: complaintId,
      user_id: req.user.id,
      location,
      waste_type: wasteType,
      description,
      block: block.toUpperCase(),
      image: imageUrl,
      type: type || 'complaint',
      status: 'pending',
      status_history: [{ status: 'pending', note: 'Complaint submitted', updatedBy: req.user.id, timestamp: new Date() }],
    });

    const { createNotification } = require('./notificationController');
    await createNotification(req.user.id, `📢 Your complaint ${complaintId} has been registered successfully!`, 'complaint');

    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await createNotification(admin._id, `📋 New complaint ${complaintId} filed in Block ${block.toUpperCase()}`, 'complaint');
    }

    res.status(201).json(mapComplaint(complaint));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const complaint = await Complaint.findOne({ complaint_id: req.params.id.toUpperCase() });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    if (req.user.role === 'collector' && complaint.block !== req.user.block) {
      return res.status(403).json({ message: 'Not authorized to update other blocks' });
    }

    complaint.status = status;
    if (req.user.role === 'collector' && !complaint.assigned_to) complaint.assigned_to = req.user.id;
    complaint.status_history = [
      ...(complaint.status_history || []),
      { status, note: note || `Status updated to ${status}`, updatedBy: req.user.id, timestamp: new Date() },
    ];
    await complaint.save();

    const { createNotification } = require('./notificationController');
    await createNotification(complaint.user_id, `🔍 Complaint ${complaint.complaint_id} status updated to: ${status}`, 'complaint');

    res.json(mapComplaint(complaint));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const completeComplaint = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Proof image is required.' });
    const complaint = await Complaint.findOne({ complaint_id: req.params.id.toUpperCase() });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.assigned_to && String(complaint.assigned_to) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the assigned collector can complete this.' });
    }

    let imageUrl;
    try {
      imageUrl = await uploadToCloudinary(req.file, 'wasteo/completions');
    } catch (uploadErr) {
      return res.status(500).json({ message: 'Image upload to Cloudinary failed', error: uploadErr.message });
    }

    complaint.status = 'completed';
    complaint.completion_image = imageUrl;
    complaint.status_history = [
      ...(complaint.status_history || []),
      { status: 'completed', note: 'Completed with image proof', updatedBy: req.user.id, timestamp: new Date() },
    ];
    await complaint.save();

    const { createNotification } = require('./notificationController');
    await createNotification(complaint.user_id, `✅ Your complaint ${complaint.complaint_id} has been completed!`, 'complaint');

    return res.json({ success: true, message: 'Complaint completed successfully', complaintId: complaint.complaint_id, completionImage: imageUrl });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}`, error: err.message });
  }
};

module.exports = { getComplaints, getComplaintById, submitComplaint, updateComplaintStatus, completeComplaint };
