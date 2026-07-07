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

  const id = req.query.id || req.query.slug || (req.url || '').split('/').pop();
  if (!id) return res.status(400).json({ success: false, message: 'Missing id' });

  try {
    if (supabase && supabase.isConfigured) {
      const { data, error } = await supabase.from('rooms').select('*').eq('id', id).maybeSingle();
      if (!error && data) return res.json({ success: true, source: 'supabase', room: normalizeRoom(data) });
    }

    const fallback = db.findById('rooms', id);
    if (fallback) return res.json({ success: true, source: 'fallback', room: normalizeRoom(fallback) });

    return res.status(404).json({ success: false, message: 'Room not found' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
