const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
const db = require('../db');

function normalizeMember(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    password: row.password || '',
    status: row.status || 'active',
    created_at: row.created_at || row.registration_date || null,
    registration_date: row.registration_date || row.created_at || null,
    booked_room: row.booked_room || null,
    username: row.username || row.email,
    created_by_admin: row.created_by_admin || false,
    role: row.role || 'user',
    room_assignment: row.room_assignment || null,
    rent_payments: row.rent_payments || []
  };
}

function readMembersFromStore() {
  return db.getAll('members').map(normalizeMember);
}

function writeMembersToStore(members) {
  db.write('members', members.map(member => ({
    ...member,
    id: member.id,
    created_at: member.created_at || member.registration_date || new Date().toISOString(),
    registration_date: member.registration_date || member.created_at || new Date().toISOString()
  })));
}

function getMemberRows() {
  if (!supabase.isConfigured) {
    return readMembersFromStore();
  }
  return null;
}

function isAdminRequest(req) {
  return req.headers['x-admin-password'] === '0185';
}

// Get all members
router.get('/', async (req, res) => {
  try {
    // Try JSON first (contains room_assignment and rent_payments)
    let members = readMembersFromStore();
    if (members && members.length > 0) {
      return res.json({ success: true, members });
    }

    // Fall back to Supabase if JSON is empty
    if (supabase.isConfigured) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Supabase members fetch error:', error.message || error);
        return res.status(500).json({ success: false, message: 'Failed to fetch members' });
      }

      return res.json({ success: true, members: (data || []).map(normalizeMember) });
    }

    res.json({ success: true, members: [] });
  } catch (error) {
    console.error('Members GET error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create member
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, password, booked_room, role, username } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (!supabase.isConfigured) {
      const members = readMembersFromStore();
      const existing = members.find(member => member.email === email || member.username === username || member.email === username);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }

      const member = {
        id: Date.now(),
        name,
        email,
        phone: phone || '',
        password: hashedPassword,
        status: 'active',
        booked_room: booked_room || null,
        username: username || email,
        created_by_admin: isAdminRequest(req),
        role: role || 'user',
        created_at: new Date().toISOString(),
        registration_date: new Date().toISOString()
      };
      members.push(member);
      writeMembersToStore(members);
      return res.status(201).json({ success: true, message: 'Member created successfully', member: normalizeMember(member) });
    }

    const { data, error } = await supabase
      .from('members')
      .insert([{ name, email, phone, password: hashedPassword, booked_room, role: role || 'user', username: username || email, created_by_admin: isAdminRequest(req), status: 'active' }])
      .select()
      .single();

    if (error) {
      console.error('Supabase member create error:', error.message || error);
      return res.status(400).json({ success: false, message: 'Failed to create member' });
    }

    res.status(201).json({ success: true, message: 'Member created successfully', member: normalizeMember(data) });
  } catch (error) {
    console.error('Members POST error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update member
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updates = {};
    const allowed = ['name', 'email', 'phone', 'status', 'booked_room', 'role', 'username'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(req.body.password, salt);
    }

    if (!supabase.isConfigured) {
      const members = readMembersFromStore();
      const target = members.find(member => String(member.id) === String(id));
      if (!target) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }
      Object.assign(target, updates);
      target.updated_at = new Date().toISOString();
      writeMembersToStore(members);
      return res.json({ success: true, message: 'Member updated successfully', member: normalizeMember(target) });
    }

    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase member update error:', error.message || error);
      return res.status(400).json({ success: false, message: 'Failed to update member' });
    }

    res.json({ success: true, message: 'Member updated successfully', member: normalizeMember(data) });
  } catch (error) {
    console.error('Members PUT error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete member
router.delete('/:id', async (req, res) => {
  try {
    if (!supabase.isConfigured) {
      const members = readMembersFromStore();
      const remaining = members.filter(member => String(member.id) !== String(req.params.id));
      if (remaining.length === members.length) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }
      writeMembersToStore(remaining);
      return res.json({ success: true, message: 'Member deleted successfully' });
    }

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Supabase member delete error:', error.message || error);
      return res.status(400).json({ success: false, message: 'Failed to delete member' });
    }

    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Members DELETE error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login check / auth
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    if (!supabase.isConfigured) {
      const members = readMembersFromStore();
      const data = members.find(member => member.email === email);
      if (!data) {
        return res.status(400).json({ success: false, message: 'Email does not exist' });
      }

      const isMatch = await bcrypt.compare(password, data.password || '');
      if (!isMatch || data.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Incorrect password or inactive account' });
      }

      const token = jwt.sign({ userId: data.id, role: data.role || 'user' }, process.env.JWT_SECRET || 'your_jwt_secret_key', { expiresIn: '30d' });
      return res.json({ success: true, message: '로그인 완료', token, user: normalizeMember(data) });
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !data) {
      return res.status(400).json({ success: false, message: 'Email does not exist' });
    }

    const isMatch = await bcrypt.compare(password, data.password);
    if (!isMatch || data.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Incorrect password or inactive account' });
    }

    const token = jwt.sign({ userId: data.id, role: data.role || 'user' }, process.env.JWT_SECRET || 'your_jwt_secret_key', { expiresIn: '30d' });

    res.json({ success: true, message: '로그인 완료', token, user: normalizeMember(data) });
  } catch (error) {
    console.error('Members login error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change password
router.put('/:id/password', async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const { currentPassword, password } = req.body;

    if (!currentPassword || !password) {
      return res.status(400).json({ success: false, message: 'Current password and new password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    // Get member
    let member = null;
    
    if (supabase.isConfigured) {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', memberId)
          .single();
        if (!error && data) {
          member = normalizeMember(data);
        }
      } catch (err) {
        console.log('Supabase member lookup failed, trying JSON fallback');
      }
    }

    if (!member) {
      const members = readMembersFromStore();
      member = members.find(m => m.id === memberId);
    }

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, member.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password in database
    if (supabase.isConfigured) {
      try {
        await supabase
          .from('members')
          .update({ password: hashedPassword })
          .eq('id', memberId);
      } catch (err) {
        console.log('Supabase update failed, trying JSON fallback');
      }
    }

    // Update in JSON fallback
    const members = readMembersFromStore();
    const memberIndex = members.findIndex(m => m.id === memberId);
    if (memberIndex !== -1) {
      members[memberIndex].password = hashedPassword;
      writeMembersToStore(members);
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Save room assignment
router.post('/:id/room-assignment', async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const { roomId, monthlyRent } = req.body;

    if (!roomId) {
      return res.status(400).json({ success: false, message: 'Room ID required' });
    }

    const members = readMembersFromStore();
    const memberIndex = members.findIndex(m => m.id === memberId);
    
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    members[memberIndex].room_assignment = {
      roomId,
      monthlyRent: monthlyRent || 0,
      assignmentDate: new Date().toISOString()
    };

    writeMembersToStore(members);

    // Try to update in Supabase
    if (supabase.isConfigured) {
      try {
        await supabase
          .from('members')
          .update({ room_assignment: members[memberIndex].room_assignment })
          .eq('id', memberId);
      } catch (err) {
        console.log('Supabase room assignment update failed');
      }
    }

    res.json({ success: true, message: 'Room assignment saved', data: members[memberIndex].room_assignment });
  } catch (error) {
    console.error('Save room assignment error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Save rent payment
router.post('/:id/rent-payment', async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const { roomId, year, month, amount, paymentMethod, paymentDate } = req.body;

    if (!roomId || !year || !month || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const members = readMembersFromStore();
    const memberIndex = members.findIndex(m => m.id === memberId);
    
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (!members[memberIndex].rent_payments) {
      members[memberIndex].rent_payments = [];
    }

    const payment = {
      id: Date.now(),
      roomId,
      year,
      month,
      amount,
      paymentMethod: paymentMethod || 'credit_card',
      paymentDate: paymentDate || new Date().toISOString(),
      status: 'completed'
    };

    members[memberIndex].rent_payments.push(payment);

    writeMembersToStore(members);

    // Try to update in Supabase
    if (supabase.isConfigured) {
      try {
        await supabase
          .from('members')
          .update({ rent_payments: members[memberIndex].rent_payments })
          .eq('id', memberId);
      } catch (err) {
        console.log('Supabase rent payment update failed');
      }
    }

    res.json({ success: true, message: 'Rent payment recorded', data: payment });
  } catch (error) {
    console.error('Save rent payment error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get member profile with room assignment and rent payments
router.get('/:id/profile', async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);

    // Try JSON first (contains room_assignment and rent_payments)
    const members = readMembersFromStore();
    let member = members.find(m => m.id === memberId);
    if (member) {
      return res.json({ success: true, data: normalizeMember(member) });
    }

    // Fall back to Supabase if not found in JSON
    if (supabase.isConfigured) {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', memberId)
          .single();
        if (!error && data) {
          member = normalizeMember(data);
          return res.json({ success: true, data: member });
        }
      } catch (err) {
        console.log('Supabase profile fetch failed');
      }
    }

    res.status(404).json({ success: false, message: 'Member not found' });
  } catch (error) {
    console.error('Get profile error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
