const supabase = require('../../backend/supabase');
const db = require('../../backend/db');

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try { return JSON.parse(value); } catch (e) { return []; }
  }
  return [];
}

function normalizeRoom(row) {
  const room = row || {};
  const images = Array.isArray(room.images) ? room.images : (room.image ? [room.image] : []);
  return {
    id: typeof room.id === 'string' ? parseInt(room.id, 10) : room.id,
    name: room.name || '',
    city: room.city || '',
    price: room.price,
    image: room.image || '',
    images,
    description: room.description || room.desc || '',
    fullDescription: room.fullDescription || room.full_description || room.description || room.desc || '',
    features: parseArray(room.features),
    paymentMethods: parseArray(room.paymentMethods || room.payment_methods),
    isAvailable: typeof room.is_available === 'boolean' ? room.is_available : (typeof room.isAvailable === 'boolean' ? room.isAvailable : true)
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    if (supabase && supabase.isConfigured) {
      const { data, error } = await supabase.from('rooms').select('*').order('id', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json({ success: true, source: 'supabase', count: data.length, rooms: data.map(normalizeRoom) });
      }
    }

    const fallback = (db.getAll('rooms') || []).map(normalizeRoom);
    if (fallback.length > 0) return res.json({ success: true, source: 'fallback', count: fallback.length, rooms: fallback });

    return res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
