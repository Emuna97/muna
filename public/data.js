// Use relative API path in production. During local dev, `window.__API_URL__` may be set.
// Protect against cases where `window.__API_URL__` was accidentally left pointing
// to a developer machine (e.g. http://localhost:5001). Prefer the current origin
// so deployed clients always call the deployment domain's `/api`.
let API_URL = null;
if (typeof window !== 'undefined' && window.__API_URL__) {
  try {
    const candidate = String(window.__API_URL__ || '').trim();
    // Ignore local dev hostnames in deployed clients
    if (candidate && !/localhost|127\.0\.0\.1/.test(candidate)) {
      API_URL = candidate;
    }
  } catch (e) {
    API_URL = null;
  }
}
if (!API_URL) {
  // Use a relative, origin-prefixed API path so the browser talks to the same host
  // that served the frontend (works for Render, Vercel, Netlify, etc.).
  API_URL = (typeof window !== 'undefined' && window.location && window.location.origin)
    ? `${window.location.origin}/api`
    : '/api';
}

let dorms = [];

function normalizeRoomOccupancy(room) {
  if (!room || typeof room !== 'object') return room;
  const occupied = room.occupied === true || room.occupied === 'true' || room.isAvailable === false || room.is_available === false || room.available === false || room.available === 'false';
  return {
    ...room,
    occupied,
    isAvailable: typeof room.isAvailable === 'boolean'
      ? room.isAvailable
      : (typeof room.is_available === 'boolean' ? room.is_available : !occupied)
  };
}

// Fetch all room data from API
async function loadDorms() {
  try {
    const response = await fetch(`${API_URL}/room/all`, { redirect: 'follow' });
    // If API responds with non-JSON or redirects (SSO), fallback to static file
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (data && data.success) {
      dorms = (data.rooms || []).map(normalizeRoomOccupancy);
      return dorms;
    }

    // Fallback to static rooms.json bundled in /public
    const fallbackResp = await fetch('/rooms.json');
    const fallback = await fallbackResp.json();
    if (fallback && fallback.success && Array.isArray(fallback.rooms)) {
      dorms = (fallback.rooms || []).map(normalizeRoomOccupancy);
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
  if(!room) return null;
  const savedRoomData = JSON.parse(localStorage.getItem(`room_${roomId}`) || '{}');
  const isReserved = isRoomReserved(roomId);
  const isOccupied = isReserved || room.isAvailable === false || room.is_available === false || room.occupied === true || room.available === false || savedRoomData.occupied === true || savedRoomData.isAvailable === false;
  return {
    ...room,
    ...savedRoomData,
    occupied: isOccupied,
    price: savedRoomData.price || room.price,
    phone: savedRoomData.phone || room.phone,
    email: savedRoomData.email || room.email,
    address: savedRoomData.address || room.address || '136 W 12th Ave, Emporia, Kansas',
    description: savedRoomData.description || savedRoomData.fullDescription || room.description || room.desc || '',
    fullDescription: savedRoomData.fullDescription || savedRoomData.description || room.fullDescription || room.full_description || room.description || room.desc || '',
    desc: savedRoomData.description || savedRoomData.fullDescription || room.description || room.desc || '',
    paymentMethods: savedRoomData.paymentMethods || room.paymentMethods || room.payment_methods || [],
    features: savedRoomData.features || room.features || [],
    images: savedRoomData.images || room.images || (room.image ? [room.image] : []),
    image: savedRoomData.image || room.image || (Array.isArray(savedRoomData.images) ? savedRoomData.images[0] : null) || (Array.isArray(room.images) ? room.images[0] : null)
  };
}

// Get all room information
function getUpdatedDorms(){
  return dorms;
}

function isRoomReserved(roomId){
  try {
    const reserved = JSON.parse(localStorage.getItem('reservedRooms')) || {};
    return Object.prototype.hasOwnProperty.call(reserved, String(roomId));
  } catch (error) {
    console.error('isRoomReserved parse error:', error);
    return false;
  }
}

// Default amenities data for room details and admin UI
function getAmenities(){
  try {
    const saved = localStorage.getItem('buildingAmenities');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 4).map(item => ({
          title: item && item.title ? item.title : '',
          description: item && item.description ? item.description : ''
        })).filter(item => item.title || item.description);
      }
    }
  } catch (error) {
    console.error('getAmenities parse error:', error);
  }

  return [
    { title: '24/7 Security', description: 'Secure property with CCTV and gated access.' },
    { title: 'High-Speed Wi-Fi', description: 'Reliable internet in all rooms and common areas.' },
    { title: 'Shared Kitchen', description: 'Fully equipped kitchen available for residents.' },
    { title: 'Laundry Facilities', description: 'On-site laundry machines for resident use.' }
  ];
}

const defaultLeaseAgreement = `DORM RENTAL LEASE AGREEMENT

Article 1 - Lessor and Lessee
Lessor: MUNA Dormitory Management
Lessee: Resident as specified in this agreement

Article 2 - Purpose of Lease
This lease is for the rental of a dormitory room.

Article 3 - Lease Term
1. Lease Duration: Month-to-month renewal basis
2. Move-in Date: Anytime after contract start date
3. Move-out Date: By 11:59 PM on the last day of the month

Article 4 - Rent and Utilities
1. Monthly Rent: Amount specified in room information
2. Utilities: Gas and electricity included in monthly rent
3. Payment Methods: Credit card, Bank transfer, PayPal, Apple Pay
4. Payment Deadline: Last day of each month

Article 5 - Security Deposit
1. Security deposit is managed separately and subject to fees.
2. Upon move-out, deposit will be returned after room inspection.

Article 6 - Furniture and Fixtures
1. Provided Furniture: Bed, desk, wardrobe, etc.
2. Lessee is responsible for proper care and maintenance of all provided items.

Article 7 - House Rules
1. Quiet Hours: No noise after 10:00 PM
2. No Smoking/Drinking: Prohibited inside the building
3. Guests: Prior notification required
4. Cleaning: Minimum once per week

Article 8 - Special Rules
1. No pets allowed
2. No unauthorized modifications
3. Shared facility maintenance responsibility

Article 9 - Contract Termination
1. One month advance notice required for termination
2. Early move-out may result in loss of monthly rent

Article 10 - Governing Law
This agreement is governed by applicable US state law.

Please read before moving in!`;

function getLeaseAgreement(){
  const saved = localStorage.getItem('leaseAgreement');
  return saved || defaultLeaseAgreement;
}

function updateLeaseAgreement(newAgreement){
  if (!newAgreement || newAgreement.trim().length < 50) {
    return { success: false, message: 'Lease agreement must be at least 50 characters.' };
  }
  localStorage.setItem('leaseAgreement', newAgreement);
  return { success: true, message: 'Lease agreement updated successfully.' };
}

function getHomePageSettings(){
  try {
    const saved = localStorage.getItem('homePageSettings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('getHomePageSettings parse error:', error);
  }
  return {
    title: '우리 방에 오신 것을 환영합니다',
    backgroundColor: '#ffffff',
    backgroundImage: '',
    backgroundPosition: 'center'
  };
}

async function loadHomePageSettings(){
  try {
    const saved = localStorage.getItem('homePageSettings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('loadHomePageSettings parse error:', error);
  }

  try {
    const response = await fetch(`${API_URL}/settings/homepage`);
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.settings) {
        return result.settings;
      }
    }
  } catch (error) {
    console.warn('loadHomePageSettings API fetch failed:', error);
  }

  return getHomePageSettings();
}

function saveHomePageSettingsToServer(settings){
  return new Promise(async (resolve) => {
    if (!settings || typeof settings !== 'object') {
      return resolve(false);
    }

    try {
      const response = await fetch(`${API_URL}/settings/homepage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        return resolve(false);
      }

      const result = await response.json();
      resolve(result.success === true);
    } catch (error) {
      console.error('saveHomePageSettingsToServer error:', error);
      resolve(false);
    }
  });
}

function getAllMembers(){
  try {
    const saved = localStorage.getItem('members');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('getAllMembers parse error:', error);
  }
  return [];
}

function generateTemporaryPassword(){
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < 10; i += 1) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function getCurrentMember(){
  const session = localStorage.getItem('currentMember');
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch (error) {
    console.error('getCurrentMember parse error:', error);
    return null;
  }
}

function logoutMember(){
  localStorage.removeItem('currentMember');
}

function isLoggedIn(){
  return getCurrentMember() !== null;
}

// Room assignment management
function getMemberRoomAssignment(memberId){
  try {
    const assignments = JSON.parse(localStorage.getItem('memberRoomAssignments') || '{}');
    const roomId = assignments[String(memberId)];
    if (roomId) {
      return {
        roomId,
        monthlyRent: getRoomMonthlyRent(roomId),
        assignmentDate: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('getMemberRoomAssignment error:', error);
  }
  return null;
}

function setMemberRoomAssignment(memberId, roomId){
  try {
    // Save to localStorage first (backup)
    const assignments = JSON.parse(localStorage.getItem('memberRoomAssignments') || '{}');
    assignments[String(memberId)] = roomId;
    localStorage.setItem('memberRoomAssignments', JSON.stringify(assignments));

    // Save to server
    const monthlyRent = getRoomMonthlyRent(roomId);
    fetch(`${API_URL}/members/${memberId}/room-assignment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, monthlyRent })
    }).catch(err => console.log('Server room assignment save failed:', err));
  } catch (error) {
    console.error('setMemberRoomAssignment error:', error);
  }
}

// Load member profile from server (with room assignment and rent payments)
async function loadMemberProfileFromServer(memberId){
  try {
    const response = await fetch(`${API_URL}/members/${memberId}/profile`);
    const result = await response.json();
    
    if (result.success && result.data) {
      const member = result.data;
      
      // Save room assignment to localStorage if available
      if (member.room_assignment && member.room_assignment.roomId) {
        const assignments = JSON.parse(localStorage.getItem('memberRoomAssignments') || '{}');
        assignments[String(memberId)] = member.room_assignment.roomId;
        localStorage.setItem('memberRoomAssignments', JSON.stringify(assignments));
      }
      
      // Save rent payments to localStorage if available
      if (member.rent_payments && Array.isArray(member.rent_payments)) {
        const payments = JSON.parse(localStorage.getItem('rentPayments') || '{}');
        payments[String(memberId)] = member.rent_payments;
        localStorage.setItem('rentPayments', JSON.stringify(payments));
      }
      
      return member;
    }
  } catch (error) {
    console.error('loadMemberProfileFromServer error:', error);
  }
  return null;
}

function getRoomMonthlyRent(roomId){
  const room = getRoomData(roomId);
  if (!room) return 0;
  if (typeof room.price === 'number') return room.price;
  const parsed = parseFloat(String(room.price).replace(/[^0-9.]/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

// Rent payment management
function getRentPayments(memberId){
  try {
    const payments = JSON.parse(localStorage.getItem('rentPayments') || '{}');
    return payments[String(memberId)] || [];
  } catch (error) {
    console.error('getRentPayments error:', error);
    return [];
  }
}

function recordRentPayment(memberId, year, month, amount, paymentMethod, roomId){
  try {
    const payments = JSON.parse(localStorage.getItem('rentPayments') || '{}');
    const memberPayments = payments[String(memberId)] || [];
    
    const payment = {
      year,
      month,
      amount,
      paymentMethod,
      paymentDate: new Date().toISOString(),
      status: 'completed'
    };
    
    memberPayments.push(payment);
    payments[String(memberId)] = memberPayments;
    localStorage.setItem('rentPayments', JSON.stringify(payments));
    
    // Save to server
    if (roomId) {
      fetch(`${API_URL}/members/${memberId}/rent-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, year, month, amount, paymentMethod, paymentDate: payment.paymentDate })
      }).catch(err => console.log('Server rent payment save failed:', err));
    }
  } catch (error) {
    console.error('recordRentPayment error:', error);
  }
}

function getMonthlyPaymentStatus(memberId, year, month){
  try {
    const payments = getRentPayments(memberId);
    return payments.find(p => p.year === year && p.month === month);
  } catch (error) {
    console.error('getMonthlyPaymentStatus error:', error);
    return null;
  }
}

async function updatePassword(memberId, newPassword){
  try {
    const response = await fetch(`${API_URL}/members/${memberId}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    });
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('updatePassword error:', error);
    return false;
  }
}
