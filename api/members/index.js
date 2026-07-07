const supabase = require('../../backend/supabase');
const db = require('../../backend/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function normalizeMember(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    status: row.status || 'active',
    created_at: row.created_at || row.registration_date || null,
    username: row.username || row.email,
    role: row.role || 'user'
  };
}

function readMembersFromStore() {
  return (db.getAll('members') || []).map(normalizeMember);
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      if (!supabase.isConfigured) return res.json({ success: true, members: readMembersFromStore() });
      const { data, error } = await supabase.from('members').select('*').order('id', { ascending: true });
      if (error) return res.status(500).json({ success: false, message: 'Failed to fetch members' });
      return res.json({ success: true, members: (data || []).map(normalizeMember) });
    } catch (error) { return res.status(500).json({ success: false, message: 'Server error' }); }
  }

  if (req.method === 'POST') {
    try {
      const { name, email, phone, password, booked_room, role, username } = req.body || {};
      if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Missing required fields' });
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      if (!supabase.isConfigured) {
        const members = readMembersFromStore();
        const existing = members.find(m => m.email === email || m.username === username);
        if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });
        const member = { id: Date.now(), name, email, phone: phone || '', password: hashedPassword, status: 'active', booked_room: booked_room || null, username: username || email, role: role || 'user', created_at: new Date().toISOString() };
        members.push(member);
        db.write('members', members);
        return res.status(201).json({ success: true, message: 'Member created successfully', member: normalizeMember(member) });
      }

      const { data, error } = await supabase.from('members').insert([{ name, email, phone, password: hashedPassword, booked_room, role: role || 'user', username: username || email, status: 'active' }]).select().single();
      if (error) return res.status(400).json({ success: false, message: 'Failed to create member' });
      return res.status(201).json({ success: true, message: 'Member created successfully', member: normalizeMember(data) });
    } catch (error) { return res.status(500).json({ success: false, message: 'Server error' }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};
