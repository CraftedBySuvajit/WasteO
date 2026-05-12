const supabase = require('../config/supabase');
const { uploadToCloudinary } = require('../middleware/upload');

// Helper to map DB complaint to frontend camelCase
const mapComplaint = (c) => {
  if (!c) return null;
  return {
    id: c.id,
    complaintId: c.complaint_id,
    user: c.user || c.user_id, // Might be populated object or just ID
    location: c.location,
    locationData: c.location_data,
    wasteType: c.waste_type,
    description: c.description,
    block: c.block,
    assignedTo: c.assignedTo || c.assigned_to, // Might be populated object or just ID
    status: c.status,
    rejectionReason: c.rejection_reason,
    type: c.type,
    binId: c.bin_id,
    statusHistory: c.status_history,
    image: c.image,
    completionImage: c.completion_image,
    rewardGiven: c.reward_given,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  };
};

// @desc    Get all complaints (with role-based filtering)
// @route   GET /api/complaints
const getComplaints = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Start with selecting complaints and joining users for population
    let query = supabase
      .from('complaints')
      .select('*, user:users!complaints_user_id_fkey(name, email), assignedTo:users!complaints_assigned_to_fkey(name)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    // Role-based filtering
    if (req.user.role === 'student') {
      query = query.eq('user_id', req.user.id);
    } else if (req.user.role === 'collector') {
      // Collectors only see complaints in their assigned block
      query = query.eq('block', req.user.block);
    }

    const { data: complaints, error } = await query;
    if (error) throw error;

    const mappedComplaints = complaints.map(c => mapComplaint(c));
    res.json(mappedComplaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
const getComplaintById = async (req, res) => {
  try {
    const { data: complaint, error } = await supabase
      .from('complaints')
      .select('*, user:users!complaints_user_id_fkey(name, email), assignedTo:users!complaints_assigned_to_fkey(name)')
      .eq('complaint_id', req.params.id.toUpperCase())
      .single();

    if (error || !complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Security check
    const complaintUserId = complaint.user_id;

    if (req.user.role === 'student' && complaintUserId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'collector' && complaint.block !== req.user.block) {
      return res.status(403).json({ message: 'Not authorized to view other blocks' });
    }

    res.json(mapComplaint(complaint));
  } catch (err) {
    console.error("❌ [GET COMPLAINT]:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// @desc    Submit a new complaint
// @route   POST /api/complaints
const submitComplaint = async (req, res) => {
  try {
    const { location, wasteType, description, block, type } = req.body;

    if (!location || !wasteType || !description || !block) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file, 'wasteo/complaints');
      } catch (uploadErr) {
        console.error("❌ [SUBMIT] Cloudinary upload failed:", uploadErr.message);
      }
    }

    const complaintId = 'COMP-' + Date.now();

    const { data: complaint, error } = await supabase
      .from('complaints')
      .insert([{
        complaint_id: complaintId,
        user_id: req.user.id,
        location,
        waste_type: wasteType,
        description,
        block: block.toUpperCase(),
        image: imageUrl,
        type: type || 'complaint',
        status: 'pending',
        status_history: [
          {
            status: 'pending',
            note: 'Complaint submitted',
            updatedBy: req.user.id,
            timestamp: new Date(),
          },
        ],
      }])
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ [SUBMIT] Saved ${complaintId}`);

    // ✅ Notify Student
    await supabase.from('notifications').insert([{
      user_id: req.user.id,
      message: `📢 Your complaint ${complaintId} has been registered successfully!`,
      type: 'complaint'
    }]);

    // ✅ Notify Admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (admins) {
      for (const admin of admins) {
        await supabase.from('notifications').insert([{
          user_id: admin.id,
          message: `📋 New complaint ${complaintId} filed in Block ${block.toUpperCase()}`,
          type: 'complaint'
        }]);
      }
    }

    res.status(201).json(mapComplaint(complaint));
  } catch (err) {
    console.error("🔥 [SUBMIT] ERROR:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update complaint status (General)
// @route   PUT /api/complaints/:id/status
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const { id } = req.params;

    const { data: complaint, error: fetchError } = await supabase
      .from('complaints')
      .select('*')
      .eq('complaint_id', id.toUpperCase())
      .single();

    if (fetchError || !complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Security
    if (req.user.role === 'collector' && complaint.block !== req.user.block) {
      return res.status(403).json({ message: 'Not authorized to update other blocks' });
    }

    const updateData = { status };
    
    // If status is moving to in-progress, assign to the current collector
    if (req.user.role === 'collector' && !complaint.assigned_to) {
      updateData.assigned_to = req.user.id;
    }

    const newHistory = [
      ...complaint.status_history,
      {
        status,
        note: note || `Status updated to ${status}`,
        updatedBy: req.user.id,
        timestamp: new Date(),
      }
    ];
    updateData.status_history = newHistory;

    const { data: updatedComplaint, error: updateError } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('complaint_id', id.toUpperCase())
      .select()
      .single();

    if (updateError) throw updateError;

    // ✅ Notify Student
    await supabase.from('notifications').insert([{
      user_id: complaint.user_id,
      message: `🔍 Complaint ${complaint.complaint_id} status updated to: ${status}`,
      type: 'complaint'
    }]);

    res.json(mapComplaint(updatedComplaint));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Complete complaint with image proof
// @route   POST /api/complaints/complete/:id
const completeComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'Proof image is required.' });
    }

    const { data: complaint, error: fetchError } = await supabase
      .from('complaints')
      .select('*')
      .eq('complaint_id', id.toUpperCase())
      .single();

    if (fetchError || !complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Auth check
    const userId = req.user.id;
    const assignedId = complaint.assigned_to;
    if (assignedId && assignedId !== userId) {
      return res.status(403).json({ message: 'Only the assigned collector can complete this.' });
    }

    // Upload to Cloudinary
    let imageUrl;
    try {
      imageUrl = await uploadToCloudinary(req.file, 'wasteo/completions');
    } catch (uploadErr) {
      return res.status(500).json({
        message: 'Image upload to Cloudinary failed',
        error: uploadErr.message,
      });
    }

    const newHistory = [
      ...complaint.status_history,
      {
        status: 'completed',
        note: 'Completed with image proof',
        updatedBy: req.user.id,
        timestamp: new Date(),
      }
    ];

    const { data: updatedComplaint, error: updateError } = await supabase
      .from('complaints')
      .update({
        status: 'completed',
        completion_image: imageUrl,
        status_history: newHistory
      })
      .eq('complaint_id', id.toUpperCase())
      .select()
      .single();

    if (updateError) throw updateError;

    // Notify Student
    await supabase.from('notifications').insert([{
      user_id: complaint.user_id,
      message: `✅ Your complaint ${complaint.complaint_id} has been completed!`,
      type: 'complaint'
    }]);

    return res.json({
      success: true,
      message: 'Complaint completed successfully',
      complaintId: complaint.complaint_id,
      completionImage: imageUrl,
    });

  } catch (err) {
    return res.status(500).json({
      message: `Server error: ${err.message}`,
      error: err.message,
    });
  }
};

module.exports = {
  getComplaints,
  getComplaintById,
  submitComplaint,
  updateComplaintStatus,
  completeComplaint,
};