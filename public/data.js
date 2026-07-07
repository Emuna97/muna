// Use relative API path in production. During local dev, set `window.__API_URL__` if needed.
const API_URL = (typeof window !== 'undefined' && window.__API_URL__) ? window.__API_URL__ : '/api';

let dorms = [];

// Fetch all room data from API
async function loadDorms() {
  try {
    const response = await fetch(`${API_URL}/room/all`);
    const data = await response.json();
    if (data.success) {
      dorms = data.rooms;
      return dorms;
    }
  } catch (error) {
    console.error('Failed to load room information:', error);
  }
  return [];
}

// Ensure dorms are loaded once; many pages call this helper.
async function ensureDormsLoaded() {
  if (!Array.isArray(dorms) || dorms.length === 0) {
    await loadDorms();
  }
  return dorms;
}


// Get room information from localStorage
function getRoomData(roomId){
  const room = dorms.find(x => x.id === roomId || x.id === parseInt(roomId));
  return room || null;
}

// Get all room information
function getUpdatedDorms(){
  return dorms;
}
