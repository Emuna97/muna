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

function isAdminRequest(req) {
  return req.headers['x-admin-password'] === '0185';
}

async function parseBody(req) {
  if (req.body) return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

module.exports = async (req, res) => {
  const id = req.query.id || req.query.slug || (req.url || '').split('/').pop();
  if (!id) return res.status(400).json({ success: false, message: 'Missing id' });

  if (req.method === 'GET') {
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
  }

  if (req.method === 'PUT') {
    if (!isAdminRequest(req)) {
      return res.status(401).json({ success: false, message: 'Admin authorization required' });
    }

    try {
      const body = await parseBody(req);
      const updates = {};
      const allowed = ['name', 'city', 'price', 'image', 'description', 'phone', 'email', 'address', 'paymentMethods', 'features', 'fullDescription', 'isAvailable', 'images'];

      for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key];
      }

      const dbUpdates = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.image !== undefined) dbUpdates.image = updates.image;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.paymentMethods !== undefined) dbUpdates.payment_methods = Array.isArray(updates.paymentMethods) ? updates.paymentMethods : parseArray(updates.paymentMethods);
      if (updates.features !== undefined) dbUpdates.features = Array.isArray(updates.features) ? updates.features : parseArray(updates.features);
      if (updates.fullDescription !== undefined) dbUpdates.full_description = updates.fullDescription;
      if (updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;
      if (updates.images !== undefined) dbUpdates.images = Array.isArray(updates.images) ? updates.images : parseArray(updates.images);

      if (supabase && supabase.isConfigured) {
        const { data, error } = await supabase.from('rooms').update(dbUpdates).eq('id', id).select().maybeSingle();
        if (!error && data) {
          return res.json({ success: true, message: 'Room updated successfully', room: normalizeRoom(data) });
        }
        console.error('Supabase room update error:', error?.message || error);
        return res.status(500).json({ success: false, message: 'Failed to update room' });
      }

      const fallbackRoom = db.updateById('rooms', id, {
        ...dbUpdates,
        paymentMethods: dbUpdates.payment_methods,
        fullDescription: dbUpdates.full_description,
        description: dbUpdates.description
      });

      if (!fallbackRoom) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      return res.json({ success: true, message: 'Room updated successfully', room: normalizeRoom(fallbackRoom) });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};
