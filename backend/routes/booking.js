const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const supabase = require('../supabase');

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
  if (/^\d{4}-\d{2}$/.test(value)) {
    return `${value}-01`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return value;
}

async function createBookingRecord(req, res) {
  try {
    const { room_id, customer_name, email, phone, move_in_date, message } = req.body;
    const normalizedMoveIn = normalizeMoveInDate(move_in_date);

    if (!room_id || !customer_name || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        room_id,
        customer_name,
        email,
        phone: phone || '',
        move_in_date: normalizedMoveIn,
        message: message || '',
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase booking insert error:', error.message || error);
      return res.status(500).json({ success: false, message: 'Failed to create booking' });
    }

    return res.json({ success: true, message: 'Booking completed successfully', booking: normalizeBooking(data) });
  } catch (error) {
    console.error('Booking POST error:', error.message || error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Create booking
router.post('/book', createBookingRecord);
router.post('/', createBookingRecord);

// Admin: Get all bookings
router.get('/all', auth, adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase bookings fetch error:', error.message || error);
      return res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }

    const { data: roomsData } = await supabase.from('rooms').select('id,name');
    const roomNameMap = new Map((roomsData || []).map(room => [String(room.id), room.name]));

    const bookings = (data || []).map(row => ({
      ...normalizeBooking(row),
      dormName: roomNameMap.get(String(row.room_id)) || ''
    }));

    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Bookings GET error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Update booking status
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase booking update error:', error.message || error);
      return res.status(500).json({ success: false, message: 'Failed to update booking' });
    }

    res.json({ success: true, booking: normalizeBooking(data) });
  } catch (error) {
    console.error('Booking PUT error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Delete booking
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Supabase booking delete error:', error.message || error);
      return res.status(500).json({ success: false, message: 'Failed to delete booking' });
    }

    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Booking DELETE error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
