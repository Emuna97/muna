const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const db = require('../db');
const supabase = require('../supabase');

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return [];
    }
  }
  return [];
}

function normalizePriceValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const cleaned = trimmed.replace(/[^0-9.]/g, '');
    if (cleaned) {
      const parsed = parseFloat(cleaned);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return value;
}

function normalizeRoom(row) {
  const room = row || {};
  const images = Array.isArray(room.images)
    ? room.images
    : (room.image ? [room.image] : []);
  const isAvailable = typeof room.is_available === 'boolean'
    ? room.is_available
    : (typeof room.isAvailable === 'boolean' ? room.isAvailable : true);
  const occupied = typeof room.occupied === 'boolean'
    ? room.occupied
    : (room.occupied === 'true' || room.occupied === 1 || isAvailable === false || room.available === false || room.available === 'false');

  return {
    id: typeof room.id === 'string' ? parseInt(room.id, 10) : room.id,
    name: room.name || '',
    city: room.city || '',
    price: normalizePriceValue(room.price),
    image: room.image || '',
    images,
    description: room.description || room.desc || '',
    fullDescription: room.fullDescription || room.full_description || room.description || room.desc || '',
    features: parseArray(room.features),
    paymentMethods: parseArray(room.paymentMethods || room.payment_methods),
    isAvailable,
    occupied
  };
}

async function fetchRoomsFromSupabase() {
  if (!supabase || !supabase.isConfigured) {
    return { data: null, error: { message: 'Supabase is not configured or the secret key is invalid' } };
  }

  try {
    return await supabase.from('rooms').select('*').order('id', { ascending: true });
  } catch (error) {
    return { data: null, error };
  }
}

async function fetchRoomFromSupabase(id) {
  if (!supabase || !supabase.isConfigured) {
    return { data: null, error: { message: 'Supabase is not configured or the secret key is invalid' } };
  }

  try {
    return await supabase.from('rooms').select('*').eq('id', id).maybeSingle();
  } catch (error) {
    return { data: null, error };
  }
}

function getFallbackRooms() {
  return (db.getAll('rooms') || []).map(room => ({ ...room, paymentMethods: room.paymentMethods || room.payment_methods || [], isAvailable: room.isAvailable ?? room.is_available ?? true }));
}

function getFallbackRoom(id) {
  const room = db.findById('rooms', id);
  if (!room) return null;
  return { ...room, paymentMethods: room.paymentMethods || room.payment_methods || [], isAvailable: room.isAvailable ?? room.is_available ?? true };
}

// Get all rooms
router.get('/all', async (req, res) => {
  try {
    const { data, error } = await fetchRoomsFromSupabase();

    if (!error && Array.isArray(data) && data.length > 0) {
      return res.json({ success: true, source: 'supabase', count: data.length, rooms: data.map(normalizeRoom) });
    }

    const fallbackRooms = getFallbackRooms();
    if (fallbackRooms.length > 0) {
      return res.json({ success: true, source: 'fallback', count: fallbackRooms.length, rooms: fallbackRooms.map(normalizeRoom) });
    }

    console.error('Supabase rooms fetch error:', error?.message || error);
    return res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Room details
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { data, error } = await fetchRoomFromSupabase(id);

    if (!error && data) {
      return res.json({ success: true, source: 'supabase', room: normalizeRoom(data) });
    }

    const fallbackRoom = getFallbackRoom(id);
    if (fallbackRoom) {
      return res.json({ success: true, source: 'fallback', room: normalizeRoom(fallbackRoom) });
    }

    if (error?.code === 'PGRST116') {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    console.error('Supabase room fetch error:', error?.message || error);
    return res.status(500).json({ success: false, message: 'Failed to fetch room' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Update room info
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const updates = {};
    const allowed = ['name', 'city', 'price', 'image', 'images', 'description', 'phone', 'email', 'address', 'paymentMethods', 'features', 'fullDescription', 'isAvailable'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.price !== undefined) {
      updates.price = normalizePriceValue(updates.price);
    }

    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.image !== undefined) dbUpdates.image = updates.image;
    if (updates.images !== undefined) dbUpdates.images = Array.isArray(updates.images) ? updates.images : parseArray(updates.images);
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.paymentMethods !== undefined) dbUpdates.payment_methods = Array.isArray(updates.paymentMethods) ? updates.paymentMethods : parseArray(updates.paymentMethods);
    if (updates.features !== undefined) dbUpdates.features = Array.isArray(updates.features) ? updates.features : parseArray(updates.features);
    if (updates.fullDescription !== undefined) dbUpdates.full_description = updates.fullDescription;
    if (updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;

    if (supabase && supabase.isConfigured) {
      try {
        const { data, error } = await supabase.from('rooms').update(dbUpdates).eq('id', id).select().maybeSingle();
        if (!error && data) {
          return res.json({ success: true, message: 'Room information updated successfully', room: normalizeRoom(data) });
        }
        if (error) {
          console.error('Supabase room update error:', error.message || error);
        }
      } catch (error) {
        console.error('Supabase room update exception:', error.message || error);
      }
    }

    const fallbackRoom = db.updateById('rooms', id, {
      ...updates,
      paymentMethods: updates.paymentMethods,
      isAvailable: updates.isAvailable,
      fullDescription: updates.fullDescription,
      description: updates.description
    });

    if (!fallbackRoom) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    return res.json({ success: true, message: 'Room information updated successfully', room: normalizeRoom(fallbackRoom) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Initialize all rooms (first time only)
router.post('/init/setup', auth, adminAuth, async (req, res) => {
  try {
    if (!supabase || !supabase.isConfigured) {
      return res.status(500).json({ success: false, message: 'Supabase is not configured' });
    }

    const { data: existingRooms, error: selectError } = await supabase.from('rooms').select('id').limit(1);
    if (selectError) {
      return res.status(500).json({ success: false, message: selectError.message || 'Failed to inspect rooms' });
    }

    if (Array.isArray(existingRooms) && existingRooms.length > 0) {
      return res.status(400).json({ success: false, message: 'Room information already exists' });
    }

    const dorms = [
      {
        id: 1,
        name: 'Room 201',
        city: '2nd Floor',
        price: 450,
        image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
        description: 'Private Room',
        phone: '+82-2-1234-5678',
        email: 'info@muna.kr',
        address: '136 W 12th Ave, Emporia, Kansas',
        payment_methods: ['Credit Card', 'Bank Transfer', 'PayPal'],
        features: ['Private bedroom', 'Shared bathroom', 'High-speed Wi-Fi', 'Furnished with bed and desk', 'Access to common kitchen', '24/7 security'],
        full_description: 'Experience comfort in Room 201. Each room is equipped with essential furniture and comes with shared bathroom access.',
        is_available: true,
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400']
      },
      {
        id: 2,
        name: 'Room 202',
        city: '2nd Floor',
        price: 400,
        image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400',
        description: 'Double Room',
        phone: '+82-2-1234-5678',
        email: 'info@muna.kr',
        address: '136 W 12th Ave, Emporia, Kansas',
        payment_methods: ['Credit Card', 'Bank Transfer', 'Kakao Pay'],
        features: ['Spacious bedroom for two', 'Shared bathroom facilities', 'Premium Wi-Fi connection', 'Modern furniture set', 'Kitchenette access', 'Laundry room available'],
        full_description: 'Room 202 is perfect for two roommates. Our building offers excellent amenities.',
        is_available: true,
        images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400']
      },
      {
        id: 3,
        name: 'Room 203',
        city: '2nd Floor',
        price: 420,
        image: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?w=400',
        description: 'Triple Room',
        phone: '+82-2-1234-5678',
        email: 'info@muna.kr',
        address: '136 W 12th Ave, Emporia, Kansas',
        payment_methods: ['Credit Card', 'Bank Transfer', 'PayPal'],
        features: ['Large bedroom for three', 'Shared bathroom facilities', 'High-speed Wi-Fi', 'Multiple beds and desks', 'Shared common area access'],
        full_description: 'Room 203 offers great value for three roommates. Enjoy spacious accommodations with modern conveniences.',
        is_available: true,
        images: ['https://images.unsplash.com/photo-1501183638710-841dd1904471?w=400']
      }
    ];

    const { data, error } = await supabase.from('rooms').insert(dorms).select();
    if (error) {
      return res.status(500).json({ success: false, message: error.message || 'Failed to initialize rooms' });
    }

    return res.json({
      success: true,
      message: `${data.length} rooms have been initialized`,
      rooms: data.map(normalizeRoom)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
