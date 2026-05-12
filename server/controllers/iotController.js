const supabase = require('../config/supabase');
const { createNotification } = require('./notificationController');

// @desc    Receive IoT data from ESP32 smart dustbin
// @route   POST /api/iot/data
// @access  Public (no authentication required — ESP32 devices send data directly)
const processIotData = async (req, res) => {
  try {
    console.log("📡 [IOT] BODY:", req.body);
    const { block, level, binId } = req.body;

    // 1. Validate required fields
    if (!block || level === undefined) {
      return res.status(400).json({ message: 'Missing required fields: block, level' });
    }

    const normalizedBlock = block.toUpperCase();
    const binLabel = binId || 'UNKNOWN';
    const numericLevel = Number(level);

    console.log(`📡 [IOT] Data received | Block: ${normalizedBlock} | Bin: ${binLabel} | Level: ${numericLevel}%`);

    // 2. Always save raw sensor reading to bin_data
    const { error: insertError } = await supabase
      .from('bin_data')
      .insert([{
        bin_id: binLabel,
        block: normalizedBlock,
        level: numericLevel,
      }]);

    if (insertError) throw insertError;
    console.log(`💾 [IOT] Sensor reading saved: ${binLabel} → ${numericLevel}%`);

    // 3. Threshold Check — only create alert if level >= 80
    if (numericLevel < 80) {
      return res.json({
        message: 'Level below threshold, no alert created',
        level: numericLevel,
        block: normalizedBlock,
        binId: binLabel
      });
    }

    // 4. Prevent Duplicate Alerts (same block + same binId if provided)
    let dupeQuery = supabase
      .from('complaints')
      .select('id, complaint_id')
      .eq('block', normalizedBlock)
      .eq('type', 'iot')
      .in('status', ['pending', 'in-progress', 'in_progress']);

    if (binId) {
      dupeQuery = dupeQuery.eq('bin_id', binLabel);
    }

    const { data: existing, error: fetchError } = await dupeQuery;
    
    if (fetchError) throw fetchError;

    if (existing && existing.length > 0) {
      console.log(`⚠️ [IOT] Active alert already exists for Block ${normalizedBlock} Bin ${binLabel} (${existing[0].complaint_id})`);
      return res.json({ message: 'Alert already active', complaintId: existing[0].complaint_id });
    }

    // 5. Find Collector for the block
    const { data: collector } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'collector')
      .eq('block', normalizedBlock)
      .single();

    // 5b. Find Admin to own the system complaint
    let { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!adminUser) {
      // Fallback if no admin exists (should not happen in prod)
      const { data: anyUser } = await supabase.from('users').select('id').limit(1).single();
      adminUser = anyUser;
    }

    // 6. Create Auto-Complaint
    const complaintId = 'IOT-' + Date.now();
    
    const { data: complaint, error: createError } = await supabase
      .from('complaints')
      .insert([{
        complaint_id: complaintId,
        user_id: adminUser ? adminUser.id : null,
        location: `Block ${normalizedBlock} - Smart Dustbin ${binLabel}`,
        waste_type: 'Mixed Waste',
        description: `🚨 AUTOMATED IoT ALERT: Dustbin "${binLabel}" in Block ${normalizedBlock} is ${numericLevel}% FULL. Immediate collection required.`,
        block: normalizedBlock,
        status: 'pending',
        type: 'iot',
        bin_id: binLabel,
        assigned_to: collector ? collector.id : null,
        status_history: [
          {
            status: 'pending',
            note: collector
              ? `IoT Alert triggered by Bin ${binLabel}. Auto-assigned to collector (Block ${normalizedBlock})`
              : `IoT Alert triggered by Bin ${binLabel}. No collector assigned for this block.`,
            updatedBy: adminUser ? adminUser.id : null,
            timestamp: new Date()
          }
        ]
      }])
      .select()
      .single();

    if (createError) throw createError;

    // ✅ Notify Assigned Collector
    if (collector) {
      await createNotification(
        collector.id,
        `🚨 New IoT Alert! Bin ${binLabel} in your block (${normalizedBlock}) is full!`,
        'iot'
      );
    }

    // ✅ Notify Admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (admins) {
      for (const admin of admins) {
        await createNotification(
          admin.id,
          `🚨 IoT Alert: Bin ${binLabel} (Block ${normalizedBlock}) reached ${numericLevel}%!`,
          'iot'
        );
      }
    }

    console.log(`🚨 [IOT] Auto-complaint created: ${complaintId} | Bin: ${binLabel} | Assigned to: ${collector ? collector.id : 'NONE'}`);

    res.status(201).json({
      message: 'Complaint created successfully',
      complaintId: complaint.complaint_id,
      binId: binLabel,
      level: numericLevel,
      block: normalizedBlock,
      assignedTo: complaint.assigned_to
    });

  } catch (err) {
    console.error('❌ [IOT] Error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get latest bin data (most recent reading per bin)
// @route   GET /api/iot/data
// @access  Public
const getIotData = async (req, res) => {
  try {
    // Get all data ordered by created_at desc
    const { data: allData, error } = await supabase
      .from('bin_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group in memory to get the latest per bin
    const map = new Map();
    allData.forEach(row => {
      if (!map.has(row.bin_id)) {
        map.set(row.bin_id, {
          _id: row.bin_id,
          binId: row.bin_id,
          block: row.block,
          level: row.level,
          lastUpdated: row.created_at,
        });
      }
    });

    const latestBins = Array.from(map.values()).sort((a, b) => {
      if (a.block !== b.block) return a.block.localeCompare(b.block);
      return a.binId.localeCompare(b.binId);
    });

    console.log(`📡 [IOT] GET /data → returning ${latestBins.length} bin(s)`);
    res.json(latestBins);
  } catch (err) {
    console.error('❌ [IOT] GET Error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { processIotData, getIotData };
