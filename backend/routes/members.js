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
    role: row.role || 'user'
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
    if (!supabase.isConfigured) {
      return res.json({ success: true, members: readMembersFromStore() });
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase members fetch error:', error.message || error);
      return res.status(500).json({ success: false, message: 'Failed to fetch members' });
    }

    res.json({ success: true, members: (data || []).map(normalizeMember) });
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

module.exports = router;
