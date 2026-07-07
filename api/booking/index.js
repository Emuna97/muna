const supabase = require('../../backend/supabase');

function normalizeBooking(row) {
  return {
    id: row.id,
    room_id: row.room_id,
    customer_name: row.customer_name,
    email: row.email,
    phone: row.phone || '',
    move_in_date: row.move_in_date || '',
    message: row.message || '',
    status: row.status || 'pending',
    created_at: row.created_at || null
  };
}

function normalizeMoveInDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return value;
}

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { room_id, customer_name, email, phone, move_in_date, message } = req.body || {};
      const normalizedMoveIn = normalizeMoveInDate(move_in_date);
      if (!room_id || !customer_name || !email) return res.status(400).json({ success: false, message: 'Missing required fields' });

      if (!supabase || !supabase.isConfigured) return res.status(500).json({ success: false, message: 'Supabase not configured' });

      const { data, error } = await supabase.from('bookings').insert([{ room_id, customer_name, email, phone: phone || '', move_in_date: normalizedMoveIn, message: message || '', status: 'pending' }]).select().single();
      if (error) return res.status(500).json({ success: false, message: 'Failed to create booking' });
      return res.json({ success: true, message: 'Booking completed successfully', booking: normalizeBooking(data) });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};
