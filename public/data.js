const API_URL = '/api';

let dorms = [];
let dormsLoaded = false;
let cachedHomePageSettings = null;

function normalizeImageUrl(value){
  return (typeof value === 'string' && value.trim()) ? value.trim() : null;
}

function normalizeImageList(value){
  if (!Array.isArray(value)) return [];
  return value.map(img => normalizeImageUrl(img)).filter(Boolean);
}

const defaultMembers = [
  { id: 1, name: 'Kim', email: 'kim@example.com', phone: '+82-10-1234-5678', password: 'kim1234', status: 'active' },
  { id: 2, name: 'Park', email: 'park@example.com', phone: '+82-10-9876-5432', password: 'park1234', status: 'active' }
];

function ensureDefaultMembers(){
  const saved = localStorage.getItem('members');
  if(!saved){
    localStorage.setItem('members', JSON.stringify(defaultMembers));
  }
}

ensureDefaultMembers();

async function fetchHomePageSettingsFromServer() {
  try {
    const response = await fetch(`${API_URL}/settings/homepage`);
    const data = await response.json();
    if (data.success && data.settings) {
      return data.settings;
    }
  } catch (error) {
    console.error('Failed to fetch homepage settings from server:', error);
  }
  return null;
}

async function saveHomePageSettingsToServer(settings) {
  try {
    const response = await fetch(`${API_URL}/settings/homepage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Failed to save homepage settings to server:', error);
  }
  return false;
}

async function loadHomePageSettings() {
  const serverSettings = await fetchHomePageSettingsFromServer();
  if (serverSettings) {
    cachedHomePageSettings = serverSettings;
    localStorage.setItem('homePageSettings', JSON.stringify(serverSettings));
    return serverSettings;
  }
  const localSettings = getHomePageSettings();
  cachedHomePageSettings = localSettings;
  return localSettings;
}

function getHomePageSettings(){
  if (cachedHomePageSettings) {
    return cachedHomePageSettings;
  }

  const saved=localStorage.getItem('homePageSettings');
  if(saved){
    try{return JSON.parse(saved);}catch(e){}
  }
  return { title:'Find Your Perfect Dorm', backgroundColor:'#f5f5f5', backgroundImage:'', backgroundPosition:'center' };
}

// Fetch all room data from API
async function loadDorms() {
  try {
    const response = await fetch(`${API_URL}/room/all`);
    const data = await response.json();
    if (data.success) {
      dorms = data.rooms;
      return getUpdatedDorms();
    }
  } catch (error) {
    console.error('Failed to load room information:', error);
  }
  return getUpdatedDorms();
}

async function ensureDormsLoaded() {
  if (!dormsLoaded) {
    await loadDorms();
    dormsLoaded = true;
  }
  return getUpdatedDorms();
}

function getRoomData(roomId){
  const room = dorms.find(x => x.id === roomId || x.id === parseInt(roomId));
  if(!room) return null;
  // Use server-provided room data. Avoid localStorage overrides for room info and reservation state.
  const roomImages = normalizeImageList(room.rooms?.images || room.images || (room.image ? [room.image] : []));
  const mainImage = normalizeImageUrl(room.image) || roomImages[0] || null;

  const mergedRoom = {
    ...room,
    price: room.price,
    phone: room.phone || '',
    email: room.email || '',
    paymentMethods: room.paymentMethods || room.payment_methods || [],
    occupied: room.isAvailable === false ? true : false,
    image: mainImage,
    desc: room.desc || room.description || '',
    rooms: {
      type: room.rooms?.type || room.desc || 'Room',
      priceDescription: room.rooms?.priceDescription || '',
      images: roomImages,
      features: room.rooms?.features || room.features || room.features || [],
      fullDescription: room.rooms?.fullDescription || room.fullDescription || room.full_description || room.desc || ''
    }
  };

  return mergedRoom;
}

function getUpdatedDorms(){
  return dorms.map(room => getRoomData(room.id));
}

function getAllMembers(){
  const saved=localStorage.getItem('members');
  if(saved){
    try{return JSON.parse(saved);}catch(e){return [];}  
  }
  return [];
}

function getBookings(){
  const saved=localStorage.getItem('bookings');
  if(saved){
    try{return JSON.parse(saved);}catch(e){return [];}  
  }
  return [];
}

function deleteMember(memberId){
  let members=getAllMembers();
  members=members.filter(m=>m.id!==memberId);
  localStorage.setItem('members',JSON.stringify(members));
}

function updateMemberStatus(memberId,status){
  const members=getAllMembers();
  const member=members.find(m=>m.id===memberId);
  if(member){
    member.status=status;
    localStorage.setItem('members',JSON.stringify(members));
  }
}

function loginMember(email,password){
  const members=getAllMembers();
  const member=members.find(m=>m.email===email || m.username===email);
  if(member && member.password===password && member.status==='active'){
    const session={
      memberId: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('currentMember', JSON.stringify(session));
    return member;
  }
  return null;
}

function createMemberByAdmin(name,email,phone,username,password,roomId){
  const members=getAllMembers();
  if(members.find(m=>m.email===email || m.username===email || (username && (m.username===username || m.email===username)))){
    return {success:false,message:'ID or email is already in use'};
  }

  const newMember={
    id:Date.now(),
    name:name,
    email:email,
    phone:phone,
    username:username||email,
    password:password,
    registrationDate:new Date().toISOString(),
    status:'active',
    createdByAdmin:true
  };

  members.push(newMember);
  localStorage.setItem('members',JSON.stringify(members));

  if(roomId){
    const room=getRoomData(roomId);
    if(room){
      const monthlyRent=parseInt(String(room.price).replace(/\$/g,'').replace(/\/month/g,'')) || room.price || 0;
      assignRoomToMember(newMember.id,roomId,monthlyRent);
    }
  }

  return {success:true,message:'Member created successfully',member:newMember};
}

function getCurrentMember(){
  const session=localStorage.getItem('currentMember');
  if(!session) return null;
  try{return JSON.parse(session);}catch(e){return null;}
}

function logoutMember(){
  localStorage.removeItem('currentMember');
}

function updatePassword(memberId, newPassword){
  const members=getAllMembers();
  const member=members.find(m=>m.id===memberId);
  if(member){
    member.password=newPassword;
    localStorage.setItem('members', JSON.stringify(members));
    return true;
  }
  return false;
}

function updateMemberInfo(memberId, name, email, phone){
  const members=getAllMembers();
  const member=members.find(m=>m.id===memberId);
  if(!member){
    return {success:false,message:'Member not found'};
  }

  const emailConflict = members.some(m=>m.email===email && m.id!==memberId);
  if(emailConflict){
    return {success:false,message:'Email is already in use'};
  }

  member.name=name;
  member.email=email;
  member.phone=phone;
  localStorage.setItem('members', JSON.stringify(members));

  const session=getCurrentMember();
  if(session && session.memberId===memberId){
    session.name=name;
    session.email=email;
    session.phone=phone;
    localStorage.setItem('currentMember', JSON.stringify(session));
  }

  return {success:true,message:'Member information updated successfully'};
}

function getAmenities(){
  const saved=localStorage.getItem('buildingAmenities');
  if(saved){
    try{return JSON.parse(saved);}catch(e){return [];}  
  }
  return [
    {title:'1st Floor Lobby',description:'Comfortable gathering space for residents'},
    {title:'Shared Bathrooms',description:'Clean and well-maintained facilities'},
    {title:'Wi-Fi Access',description:'High-speed internet throughout the building'},
    {title:'Utilities Included',description:'Gas and electricity costs are included in the rent'}
  ];
}

function getHomePageSettings(){
  const saved=localStorage.getItem('homePageSettings');
  if(saved){
    try{return JSON.parse(saved);}catch(e){}
  }
  return { title:'Find Your Perfect Dorm', backgroundColor:'#f5f5f5', backgroundImage:'', backgroundPosition:'center' };
}

function getLeaseAgreement(){
  const defaultLeaseAgreement=`DORM RENTAL LEASE AGREEMENT\n\nArticle 1 - Lessor and Lessee\nLessor: MUNA Dormitory Management\nLessee: Resident as specified in this agreement\n\nArticle 2 - Purpose of Lease\nThis lease is for the rental of a dormitory room.\n\nArticle 3 - Lease Term\n1. Lease Duration: Month-to-month renewal basis\n2. Move-in Date: Anytime after contract start date\n3. Move-out Date: By 11:59 PM on the last day of the month\n\nArticle 4 - Rent and Utilities\n1. Monthly Rent: Amount specified in room information\n2. Utilities: Gas and electricity included in monthly rent\n3. Payment Methods: Credit card, Bank transfer, PayPal, Apple Pay\n4. Payment Deadline: Last day of each month\n\nArticle 5 - Security Deposit\n1. Security deposit is managed separately and subject to fees.\n2. Upon move-out, deposit will be returned after room inspection.\n\nArticle 6 - Furniture and Fixtures\n1. Provided Furniture: Bed, desk, wardrobe, etc.\n2. Lessee is responsible for proper care and maintenance of all provided items.\n\nArticle 7 - House Rules\n1. Quiet Hours: No noise after 10:00 PM\n2. No Smoking/Drinking: Prohibited inside the building\n3. Guests: Prior notification required\n4. Cleaning: Minimum once per week\n\nArticle 8 - Special Rules\n1. No pets allowed\n2. No unauthorized modifications\n3. Shared facility maintenance responsibility\n\nArticle 9 - Contract Termination\n1. One month advance notice required for termination\n2. Early move-out may result in loss of monthly rent\n\nArticle 10 - Governing Law\nThis agreement is governed by applicable US state law.\n\nPlease read before moving in!`;
  const saved = localStorage.getItem('leaseAgreement');
  return saved||defaultLeaseAgreement;
}

function updateLeaseAgreement(newAgreement){
  if(newAgreement.trim().length < 50){
    return { success: false, message: 'Lease agreement must be at least 50 characters' };
  }
  localStorage.setItem('leaseAgreement', newAgreement);
  return { success: true, message: 'Lease agreement updated successfully' };
}

function getMemberRoomAssignment(memberId){
  const assignments = JSON.parse(localStorage.getItem('roomAssignments')) || {};
  return assignments[memberId] || null;
}

function assignRoomToMember(memberId, roomId, monthlyRent){
  const assignments = JSON.parse(localStorage.getItem('roomAssignments')) || {};
  assignments[memberId] = {
    roomId: roomId,
    monthlyRent: monthlyRent,
    assignmentDate: new Date().toISOString()
  };
  localStorage.setItem('roomAssignments', JSON.stringify(assignments));
  markRoomAsReserved(roomId, memberId);
}

function markRoomAsReserved(roomId, memberId){
  const reserved = JSON.parse(localStorage.getItem('reservedRooms')) || {};
  reserved[roomId] = memberId;
  localStorage.setItem('reservedRooms', JSON.stringify(reserved));
}

function isRoomReserved(roomId){
  const reserved = JSON.parse(localStorage.getItem('reservedRooms')) || {};
  return reserved.hasOwnProperty(roomId);
}

function getRentPayments(memberId){
  const key = `rentPayments_${memberId}`;
  const saved = localStorage.getItem(key);
  if(saved){
    try{return JSON.parse(saved);}catch(e){return [];}  
  }
  return [];
}

function recordRentPayment(memberId, year, month, amount, paymentMethod){
  const key = `rentPayments_${memberId}`;
  const payments = getRentPayments(memberId);
  const newPayment = {
    id: Date.now(),
    year: year,
    month: month,
    amount: amount,
    paymentMethod: paymentMethod,
    paymentDate: new Date().toISOString(),
    status: 'completed'
  };
  payments.push(newPayment);
  localStorage.setItem(key, JSON.stringify(payments));
  return newPayment;
}

function getMonthlyPaymentStatus(memberId, year, month){
  const payments = getRentPayments(memberId);
  return payments.find(p => p.year === year && p.month === month) || null;
}
