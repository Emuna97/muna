const ADMIN_PASSWORD="0185";
let adminIsLoggedIn=false;
let currentBgPosition="center";  // Current selected background position
let bgPositionLocked=false;  // Whether position is locked

function normalizeImageUrl(value){
  return (typeof value==='string' && value.trim()) ? value.trim() : null;
}

function normalizeImageList(value){
  if(Array.isArray(value)){
    return value.map(img => normalizeImageUrl(img)).filter(Boolean);
  }
  return [];
}

function mergeRoomData(room){
  // Rely on server-provided room fields rather than localStorage overrides
  const sourceImages = normalizeImageList(room.rooms?.images || room.images || (room.image ? [room.image] : []));
  const mainImage = normalizeImageUrl(room.image) || sourceImages[0] || null;
  return {
    ...room,
    price: room.price,
    phone: room.phone || '',
    email: room.email || '',
    paymentMethods: room.paymentMethods || room.payment_methods || [],
    occupied: room.isAvailable === false ? true : false,
    images: sourceImages,
    image: mainImage,
    description: room.rooms?.fullDescription || room.fullDescription || room.full_description || room.desc || ''
  };
}

function getAdminFetchHeaders(){
  return {
    'Content-Type': 'application/json',
    'x-admin-password': ADMIN_PASSWORD
  };
}

function adminLogin(){
  const pwd=document.getElementById('admin-password').value;
  if(pwd===ADMIN_PASSWORD){
    adminIsLoggedIn=true;
    showAdminPanel();
  }else{
    alert('Incorrect password');
  }
}

function adminLogout(){
  adminIsLoggedIn=false;
  location.reload();
}

async function showAdminPanel(){
  if(!adminIsLoggedIn){
    document.getElementById('login-section').style.display='block';
    document.getElementById('admin-section').style.display='none';
    return;
  }
  
  document.getElementById('login-section').style.display='none';
  document.getElementById('admin-section').style.display='block';
  
  await ensureDormsLoaded();

  loadAmenitiesUI();
  await loadHomePageUI();
  await loadMembersUI();
  loadRentStatusUI();
  loadBookingUI();
  loadAdminPanel();
  loadRoomOptions();
}

function loadAdminPanel(){
  const roomsList=document.getElementById('rooms-list');
  roomsList.innerHTML='';
  
  dorms.forEach(room=>{
    const merged=mergeRoomData(room);
    const price=merged.price;
    const phone=merged.phone;
    const email=merged.email;
    const paymentMethods=merged.paymentMethods;
    const images=merged.images;
    const description=merged.description;
    const occupied=merged.occupied;
    const mainImage=merged.image;
    
    const paymentOptions=["Credit Card","Bank Transfer","PayPal","Kakao Pay","Naver Pay","Apple Pay"];
    const paymentCheckboxes=paymentOptions.map(method=>`
      <label>
        <input type="checkbox" value="${method}" ${paymentMethods.includes(method)?'checked':''}/> ${method}
      </label>
    `).join('');
    
    const galleryPreview=images.map((img, idx) => {
      const isMainImage = mainImage === img;
      return `
        <div style="position:relative">
          <img src="${img}" alt="Image ${idx+1}" style="width:60px;height:60px;object-fit:cover;border-radius:5px;border:3px solid ${isMainImage ? '#667eea' : '#ddd'}"/>
          ${isMainImage ? '<div style="position:absolute;top:2px;right:2px;background:#667eea;color:#fff;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold">★</div>' : ''}
          <button onclick="setMainImage(${room.id}, ${idx})" title="Set as main image" style="position:absolute;bottom:-5px;left:-5px;background:#27ae60;color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:12px;padding:0;line-height:1">✓</button>
          <button onclick="removeImage(${room.id}, ${idx})" title="Delete" style="position:absolute;top:-5px;right:-5px;background:#e74c3c;color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:12px;padding:0;line-height:1">×</button>
        </div>
      `;
    }).join('');
    
    const roomCard=document.createElement('div');
    roomCard.className='room-card';
    roomCard.innerHTML=`
      <h3>${room.name} (${room.city})</h3>
      
      <div class="gallery-section">
        <h4>Photo Management</h4>
        <div class="gallery-preview" id="gallery_${room.id}">
          ${galleryPreview}
        </div>
        <input type="file" id="imageInput_${room.id}" accept="image/*" style="display:none" onchange="uploadRoomImage(event, ${room.id})"/>
        <button class="gallery-upload-btn" onclick="document.getElementById('imageInput_${room.id}').click()">+ Add Photos</button>
      </div>
      
      <div class="edit-form">
        <div class="edit-form-group">
          <label>Price</label>
          <input type="text" id="price_${room.id}" value="${price}" placeholder="e.g. $450/month"/>
        </div>
        <div class="edit-form-group">
          <label>Phone Number</label>
          <input type="text" id="phone_${room.id}" value="${phone}"/>
        </div>
        <div class="edit-form-group">
          <label>Email</label>
          <input type="email" id="email_${room.id}" value="${email}"/>
        </div>
        <div class="edit-form-group">
          <label>Payment Methods</label>
          <div class="payment-checkboxes">
            ${paymentCheckboxes}
          </div>
        </div>
        <div class="edit-form-group">
          <label>Description</label>
          <textarea id="description_${room.id}" placeholder="Enter description about the room" style="width:100%;height:100px;padding:8px;border:1px solid #ddd;border-radius:5px;font-family:inherit;font-size:14px">${description}</textarea>
        </div>
        <div class="edit-form-group" style="grid-column:1/3">
          <label>
            <input type="checkbox" id="occupied_${room.id}" ${occupied?'checked':''} style="margin-right:8px"/>
            <span style="font-weight:normal">Room is reserved (Move-in completed)</span>
          </label>
        </div>
        <div class="room-actions">
          <button class="save-btn" onclick="saveRoom(${room.id})">Save</button>
        </div>
      </div>
    `;
    roomsList.appendChild(roomCard);
  });
}

function saveRoom(roomId){
  const price=document.getElementById(`price_${roomId}`).value;
  const phone=document.getElementById(`phone_${roomId}`).value;
  const email=document.getElementById(`email_${roomId}`).value;
  const description=document.getElementById(`description_${roomId}`).value;
  const occupied=document.getElementById(`occupied_${roomId}`).checked;
  
  const priceInput=document.getElementById(`price_${roomId}`);
  const editForm=priceInput.closest('.edit-form');
  const paymentCheckboxes=editForm.querySelectorAll('input[type="checkbox"][value]:checked');
  const paymentMethods=Array.from(paymentCheckboxes).map(cb=>cb.value);
  
  if(!price||!phone||!email||paymentMethods.length===0||!description){
    alert('Please fill in all fields');
    return;
  }
  
  const roomData = {
    price,
    phone,
    email,
    paymentMethods,
    fullDescription: description,
    isAvailable: !occupied
  };

  fetch(`${API_URL}/room/${roomId}`, {
    method: 'PUT',
    headers: getAdminFetchHeaders(),
    body: JSON.stringify(roomData)
  }).then(r=>r.json()).then(result=>{
    if(result.success){
      alert(`Room ${roomId} saved successfully`);
      // reload rooms to reflect changes
      ensureDormsLoaded().then(()=>{ loadRoomOptions(); loadAdminPanel(); });
    } else {
      alert('Failed to save room: ' + (result.message||'Unknown'));
    }
  }).catch(err=>{console.error('Save room error',err);alert('Failed to save room')});
}

function uploadRoomImage(event, roomId){
  const file=event.target.files[0];
  if(file){
    const reader=new FileReader();
    reader.onload=function(e){
      const newImage=e.target.result;
      // Send image (base64) to server by updating the room images array
      fetch(`${API_URL}/room/${roomId}`, {
        method: 'PUT',
        headers: getAdminFetchHeaders(),
        body: JSON.stringify({ images: [newImage], image: newImage })
      }).then(r=>r.json()).then(result=>{
        if(result.success){
          alert('Image added successfully');
          ensureDormsLoaded().then(()=>{ loadAdminPanel(); });
        } else { alert('Failed to upload image: '+(result.message||'Unknown')); }
      }).catch(err=>{console.error('Image upload error',err);alert('Failed to upload image')});
    };
    reader.readAsDataURL(file);
  }
}

function removeImage(roomId, imageIdx){
  // Request server to remove image at index
  fetch(`${API_URL}/room/${roomId}`).then(r=>r.json()).then(res=>{
    if(!res.success) return alert('Failed to fetch room');
    const room = res.room || res;
    const images = Array.isArray(room.images) ? room.images.slice() : (room.image ? [room.image] : []);
    if(imageIdx<0||imageIdx>=images.length) return;
    images.splice(imageIdx,1);
    const newMain = images[0] || null;
    fetch(`${API_URL}/room/${roomId}`,{
      method:'PUT',headers:getAdminFetchHeaders(),
      body:JSON.stringify({ images, image: newMain })
    }).then(r=>r.json()).then(result=>{
      if(result.success){ alert('Image deleted successfully'); ensureDormsLoaded().then(()=>loadAdminPanel()); }
      else alert('Failed to remove image');
    });
  });
}

function setMainImage(roomId, imageIdx){
  // Update main image on server
  fetch(`${API_URL}/room/${roomId}`).then(r=>r.json()).then(res=>{
    if(!res.success) return alert('Failed to fetch room');
    const room = res.room || res;
    const images = Array.isArray(room.images) ? room.images : (room.image ? [room.image] : []);
    if(!images[imageIdx]) return alert('Image not found');
    const newMain = images[imageIdx];
    fetch(`${API_URL}/room/${roomId}`,{method:'PUT',headers:getAdminFetchHeaders(),body:JSON.stringify({ image: newMain })})
      .then(r=>r.json()).then(result=>{ if(result.success){ alert('Main image set successfully'); ensureDormsLoaded().then(()=>loadAdminPanel()); } else alert('Failed to set main image'); });
  });
}

function loadAmenitiesUI(){
  const amenitiesList=document.getElementById('amenities-list');
  const amenities=getAmenities();
  
  amenitiesList.innerHTML='';
  amenities.forEach((amenity, idx)=>{
    const amenityCard=document.createElement('div');
    amenityCard.style.cssText='background:#f8f9fa;padding:15px;margin-bottom:15px;border-radius:8px;border-left:3px solid #f39c12';
    amenityCard.innerHTML=`
      <div style="margin-bottom:10px">
        <label style="display:block;margin-bottom:5px;color:#1e272e;font-weight:bold;font-size:14px">Title</label>
        <input type="text" id="amenity_title_${idx}" value="${amenity.title}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:5px;font-size:14px;box-sizing:border-box"/>
      </div>
      <div>
        <label style="display:block;margin-bottom:5px;color:#1e272e;font-weight:bold;font-size:14px">Description</label>
        <input type="text" id="amenity_desc_${idx}" value="${amenity.description}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:5px;font-size:14px;box-sizing:border-box"/>
      </div>
    `;
    amenitiesList.appendChild(amenityCard);
  });
}

function saveAmenities(){
  const amenities=getAmenities();
  
  amenities.forEach((amenity, idx)=>{
    const title=document.getElementById(`amenity_title_${idx}`).value;
    const description=document.getElementById(`amenity_desc_${idx}`).value;
    
    if(!title||!description){
      alert('Please fill in all fields');
      return;
    }
    
    amenity.title=title;
    amenity.description=description;
  });
  
  localStorage.setItem('buildingAmenities',JSON.stringify(amenities));
  alert('Building Amenities saved successfully');
  loadAdminPanel();
}

async function loadHomePageUI(){
  const settings=await loadHomePageSettings();
  
  const titleInput=document.getElementById('homepage_title');
  const bgColorInput=document.getElementById('homepage_bgColor');
  const previewSection=document.getElementById('bg-preview-section');
  
  if(titleInput) {
    titleInput.value=settings.title;
    titleInput.oninput = updateHomePagePreview;
  }
  if(bgColorInput) {
    bgColorInput.value=settings.backgroundColor;
    bgColorInput.oninput = updateHomePagePreview;
  }
  
  // Set current background position
  currentBgPosition=settings.backgroundPosition||'center';
  bgPositionLocked=false;

  if(previewSection){
    previewSection.style.display='block';
  }

  updateHomePagePreview();
}

function updateHomePagePreview(){
  const settings = getHomePageSettings();
  const titleInput = document.getElementById('homepage_title');
  const bgColorInput = document.getElementById('homepage_bgColor');
  const previewSection = document.getElementById('bg-preview-section');
  const previewImage = document.getElementById('bg-preview-image');
  const titleOverlay = document.getElementById('bg-preview-title');
  const previewContainer = document.getElementById('bg-preview-container');

  const titleText = titleInput ? titleInput.value || settings.title : settings.title;
  const bgColor = bgColorInput ? bgColorInput.value || settings.backgroundColor : settings.backgroundColor;
  const imageSource = settings.backgroundImage || previewImage?.src || '';
  const position = currentBgPosition || settings.backgroundPosition || 'center';

  if(previewContainer){
    if(imageSource){
      previewContainer.style.background = 'transparent';
      if(previewImage){
        previewImage.src = imageSource;
        previewImage.style.objectPosition = position;
        previewImage.style.display = 'block';
      }
    } else {
      previewContainer.style.background = bgColor || '#f5f5f5';
      if(previewImage){
        previewImage.style.display = 'none';
      }
    }
  }

  if(titleOverlay){
    titleOverlay.textContent = titleText || 'Homepage Preview';
  }

  if(previewImage && imageSource){
    previewImage.style.objectPosition = position;
  }
}

function parseBgPosition(position){
  let x=50;
  let y=50;
  if(!position) return {x,y};

  const parts=position.trim().split(/\s+/);
  const map={left:0,center:50,right:100,top:0,bottom:100};

  if(parts.length===1){
    const token=parts[0];
    if(token.includes('%')){
      x=parseFloat(token) || 50;
      y=50;
    } else if(map[token] !== undefined){
      if(token==='top' || token==='bottom'){
        y=map[token];
      } else {
        x=map[token];
      }
    }
  } else {
    const [first, second] = parts;
    if(first.includes('%')) x=parseFloat(first)||50;
    else if(map[first] !== undefined) x=map[first];
    if(second.includes('%')) y=parseFloat(second)||50;
    else if(map[second] !== undefined) y=map[second];
  }

  return {x,y};
}

async function saveHomePageSettings(){
  const title=document.getElementById('homepage_title').value;
  const bgColor=document.getElementById('homepage_bgColor').value;
  const bgImageFile=document.getElementById('homepage_bgImage').files[0];
  const currentSettings=getHomePageSettings();
  
  if(!title){
    alert('Please enter a title');
    return;
  }
  
  const settings={
    title,
    backgroundColor:bgColor,
    backgroundImage: currentSettings.backgroundImage || "",
    backgroundPosition: currentSettings.backgroundPosition || currentBgPosition
  };
  
  if(bgImageFile){
    const reader=new FileReader();
    reader.onload=async function(e){
      settings.backgroundImage=e.target.result;
      settings.backgroundPosition=currentBgPosition;
      const saved = await saveHomePageSettingsToServer(settings);
      if(!saved){
        console.warn('Saving homepage settings to server failed, saving locally only');
      }
      localStorage.setItem('homePageSettings',JSON.stringify(settings));
      alert('Homepage settings saved successfully');
      document.getElementById('homepage_bgImage').value='';
      bgPositionLocked=false;  // Unlock position after saving
      loadHomePageUI();
    };
    reader.readAsDataURL(bgImageFile);
  }else{
    settings.backgroundImage = currentSettings.backgroundImage || '';
    settings.backgroundPosition = currentSettings.backgroundPosition || currentBgPosition;
    const saved = await saveHomePageSettingsToServer(settings);
    if(!saved){
      console.warn('Saving homepage settings to server failed, saving locally only');
    }
    localStorage.setItem('homePageSettings',JSON.stringify(settings));
    alert('Homepage settings saved successfully');
    bgPositionLocked=false;  // Unlock position after saving
    loadHomePageUI();
  }
}

function resetAllData(){
  if(confirm('Are you sure you want to reset all data?')){
    for(let i=1;i<=14;i++){
      localStorage.removeItem(`room_${i}`);
    }
    localStorage.removeItem('buildingAmenities');
    localStorage.removeItem('homePageSettings');
    loadAdminPanel();
    alert('All data has been reset');
  }
}

// Check login status on page load
document.addEventListener('DOMContentLoaded',()=>{
  showAdminPanel();
  
  // Set up background image preview events
  const bgImageInput=document.getElementById('homepage_bgImage');
  if(bgImageInput){
    bgImageInput.addEventListener('change',initBgImagePreview);
  }
});

// Initialize background image preview
function initBgImagePreview(event){
  const file=event.target.files[0];
  const previewSection=document.getElementById('bg-preview-section');
  const previewImage=document.getElementById('bg-preview-image');
  
  if(file){
    const reader=new FileReader();
    reader.onload=function(e){
      previewImage.src=e.target.result;
      previewSection.style.display='block';
      currentBgPosition = currentBgPosition || 'center';
      previewImage.style.objectPosition = currentBgPosition;
      updateHomePagePreview();
      setupBgPositionEvents();
    };
    reader.readAsDataURL(file);
  }else{
    updateHomePagePreview();
  }
}

// Set up background position selection events
function setupBgPositionEvents(){
  const previewContainer=document.getElementById('bg-preview-container');
  if(!previewContainer) return;
  
  // Remove existing listeners (prevent duplicates)
  const newContainer=previewContainer.cloneNode(true);
  previewContainer.parentNode.replaceChild(newContainer, previewContainer);
  
  const updatedContainer=document.getElementById('bg-preview-container');
  updatedContainer.addEventListener('mousemove',updateBgPositionFromMouse);
  updatedContainer.addEventListener('click',setBgPositionFromClick);
}

// Update background position in real-time as mouse moves (only when position is not locked)
function updateBgPositionFromMouse(e){
  if(bgPositionLocked) return;  // Don't update if position is locked
  
  const container=e.currentTarget;
  const rect=container.getBoundingClientRect();
  const x=(e.clientX-rect.left)/rect.width*100;
  const y=(e.clientY-rect.top)/rect.height*100;
  
  // Update crosshair position
  const crosshair=document.getElementById('bg-preview-crosshair');
  crosshair.style.left=x+'%';
  crosshair.style.top=y+'%';
  
  // Update preview image background position
  const previewImage=document.getElementById('bg-preview-image');
  previewImage.style.objectPosition=x+'% '+y+'%';
}

// Lock background position to clicked location
function setBgPositionFromClick(e){
  const container=e.currentTarget;
  const rect=container.getBoundingClientRect();
  const x=(e.clientX-rect.left)/rect.width*100;
  const y=(e.clientY-rect.top)/rect.height*100;
  
  currentBgPosition=`${x.toFixed(1)}% ${y.toFixed(1)}%`;
  
  // Lock position
  bgPositionLocked=true;
  
  // Confirm crosshair position
  const crosshair=document.getElementById('bg-preview-crosshair');
  if(crosshair){
    crosshair.style.left=`${x}%`;
    crosshair.style.top=`${y}%`;
  }

  const previewImage=document.getElementById('bg-preview-image');
  if(previewImage){
    previewImage.style.objectPosition=currentBgPosition;
  }
}

// Member management functions
async function fetchMembersFromApi(){
  try {
    const response = await fetch(`${API_URL}/members`, {
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': '0185'
      }
    });
    const data = await response.json();
    if (data.success) {
      return data.members || [];
    }
  } catch (error) {
    console.error('Failed to load members from API:', error);
  }
  return getAllMembers();
}

function syncMemberRoomAssignment(memberId, roomId){
  if (!memberId || !roomId) return;
  const assignments = JSON.parse(localStorage.getItem('roomAssignments')) || {};
  assignments[memberId] = {
    roomId,
    monthlyRent: 0,
    assignmentDate: new Date().toISOString()
  };
  localStorage.setItem('roomAssignments', JSON.stringify(assignments));

  const reserved = JSON.parse(localStorage.getItem('reservedRooms')) || {};
  reserved[roomId] = memberId;
  localStorage.setItem('reservedRooms', JSON.stringify(reserved));
}

async function loadMembersUI(){
  const members = await fetchMembersFromApi();
  const tableBody=document.getElementById('members-table-body');
  
  if(!tableBody) return;
  
  tableBody.innerHTML='';
  
  if(members.length===0){
    tableBody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:20px;color:#999">No registered members</td></tr>';
    return;
  }
  
  members.forEach(member=>{
    const registrationDate = member.registration_date || member.created_at || member.registrationDate || '';
    const formattedDate = registrationDate ? new Date(registrationDate).toLocaleDateString('en-US') : '-';
    const statusColor=member.status==='active'?'#27ae60':'#e74c3c';
    const statusText=member.status==='active'?'Active':'Inactive';
    
    const row=document.createElement('tr');
    row.style.borderBottom='1px solid #ecf0f1';
    row.innerHTML=`
      <td style="padding:12px;color:#1e272e">${member.name}</td>
      <td style="padding:12px;color:#1e272e">${member.email}</td>
      <td style="padding:12px;color:#1e272e">${member.phone || '-'}</td>
      <td style="padding:12px;color:#999;font-size:12px">${formattedDate}</td>
      <td style="padding:12px">
        <span style="background:${statusColor};color:white;padding:5px 10px;border-radius:3px;font-size:12px;font-weight:bold">${statusText}</span>
      </td>
      <td style="padding:12px;text-align:center">
        <button onclick="toggleMemberStatus(${member.id})" style="background:#3498db;color:white;border:none;padding:6px 12px;border-radius:3px;cursor:pointer;font-size:12px;margin-right:5px">
          ${member.status==='active'?'Deactivate':'Activate'}
        </button>
        <button onclick="removeMember(${member.id})" style="background:#e74c3c;color:white;border:none;padding:6px 12px;border-radius:3px;cursor:pointer;font-size:12px">
          Delete
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

async function toggleMemberStatus(memberId){
  const members = await fetchMembersFromApi();
  const member=members.find(m=>String(m.id)===String(memberId));
  if(member){
    const newStatus=member.status==='active'?'inactive':'active';
    const response = await fetch(`${API_URL}/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': '0185' },
      body: JSON.stringify({ status: newStatus })
    });
    const result = await response.json();
    if(result.success){
      await loadMembersUI();
      alert('Member status updated successfully');
    } else {
      alert(result.message || 'Failed to update member status');
    }
  }
}

async function removeMember(memberId){
  if(confirm('Are you sure you want to delete this member?')){
    const response = await fetch(`${API_URL}/members/${memberId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': '0185' }
    });
    const result = await response.json();
    if(result.success){
      await loadMembersUI();
      alert('Member deleted successfully');
    } else {
      alert(result.message || 'Failed to delete member');
    }
  }
}

// Rent management functions
function loadRentStatusUI(){
  // Initialize with current month
  const today=new Date();
  document.getElementById('rent-year').value=today.getFullYear();
  document.getElementById('rent-month').value=today.getMonth()+1;
}

function loadRentStatus(){
  const year=parseInt(document.getElementById('rent-year').value);
  const month=parseInt(document.getElementById('rent-month').value);

  const tbody=document.getElementById('rent-status-body');
  tbody.innerHTML='';

  const members=getAllMembers();
  const roomAssignments=JSON.parse(localStorage.getItem('roomAssignments'))||{};
  
  let hasData=false;

  members.forEach(member=>{
    const assignment=roomAssignments[member.id];
    if(!assignment) return;

    const room=dorms.find(r=>r.id===assignment.roomId);
    if(!room) return;

    hasData=true;

    const payment=getMonthlyPaymentStatus(member.id,year,month);
    const statusText=payment?'Paid':'Unpaid';
    const statusColor=payment?'#27ae60':'#e74c3c';
    const paymentMethod=payment?payment.paymentMethod:'-';

    const row=document.createElement('tr');
    row.style.borderBottom='1px solid #ecf0f1';
    row.innerHTML=`
      <td style="padding:12px;color:#1e272e">${member.name}</td>
      <td style="padding:12px;color:#1e272e">${member.email}</td>
      <td style="padding:12px;color:#1e272e;font-weight:bold">${room.name}</td>
      <td style="padding:12px;color:#1e272e">$${assignment.monthlyRent}</td>
      <td style="padding:12px">
        <span style="background:${statusColor};color:white;padding:5px 10px;border-radius:3px;font-size:12px;font-weight:bold">${statusText}</span>
      </td>
      <td style="padding:12px;color:#1e272e">${paymentMethod}</td>
      <td style="padding:12px;text-align:center">
        ${!payment?`<button onclick="recordPaymentFromAdmin(${member.id},${year},${month},${assignment.monthlyRent})" style="background:#27ae60;color:white;border:none;padding:6px 12px;border-radius:3px;cursor:pointer;font-size:12px">
          Record Payment
        </button>`:'<span style="color:#999;font-size:12px">Paid</span>'}
      </td>
    `;
    tbody.appendChild(row);
  });

  if(!hasData){
    tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:20px;color:#999">No assigned room</td></tr>';
  }
}

function recordPaymentFromAdmin(memberId,year,month,amount){
  const paymentMethod=prompt('Enter payment method (Example: Credit Card, Bank Transfer):');
  if(!paymentMethod) return;

  recordRentPayment(memberId,year,month,amount,paymentMethod);
  alert(`Payment of $${amount} for ${month}/${year} recorded successfully`);
  loadRentStatus();
}

function loadBookingUI(){
  const tbody=document.getElementById('booking-status-body');
  if(!tbody) return;
  tbody.innerHTML='';

  fetch(`${API_URL}/booking/all`, {
    headers: { 'x-admin-password': '0185' }
  }).then(r=>r.json()).then(result=>{
    if(!result.success){ tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:20px;color:#999">No bookings found</td></tr>'; return; }
    const bookings=result.bookings||[];
    if(bookings.length===0){ tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:20px;color:#999">No bookings found</td></tr>'; return; }

    bookings.forEach(booking=>{
      const row=document.createElement('tr');
      row.style.borderBottom='1px solid #ecf0f1';
      const notes = booking.message ? booking.message.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '—';
      row.innerHTML=`
        <td style="padding:12px;color:#1e272e">${booking.customer_name}</td>
        <td style="padding:12px;color:#1e272e">${booking.email}</td>
        <td style="padding:12px;color:#1e272e">${booking.phone}</td>
        <td style="padding:12px;color:#1e272e">${booking.dormName || ''}</td>
        <td style="padding:12px;color:#1e272e">${booking.move_in_date || ''}</td>
        <td style="padding:12px;color:#1e272e">${booking.status}</td>
        <td style="padding:12px;color:#1e272e;max-width:260px;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;line-height:1.4;" title="${notes}">${notes}</td>
      `;
      tbody.appendChild(row);
    });
  }).catch(err=>{console.error('Failed to load bookings',err); tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:20px;color:#999">No bookings found</td></tr>';});
}


// Save lease agreement
function saveLeaseAgreement(){
  const text=document.getElementById('lease-agreement-text').value.trim();
  
  if(text.length<50){
    const errorDiv=document.getElementById('lease-save-error');
    errorDiv.textContent='Lease agreement must be at least 50 characters';
    errorDiv.style.display='block';
    document.getElementById('lease-save-success').style.display='none';
    return;
  }
  
  const result=updateLeaseAgreement(text);
  if(result.success){
    const successDiv=document.getElementById('lease-save-success');
    successDiv.textContent='✓ Lease agreement saved successfully';
    successDiv.style.display='block';
    document.getElementById('lease-save-error').style.display='none';
    setTimeout(()=>{
      successDiv.style.display='none';
    },3000);
  }else{
    const errorDiv=document.getElementById('lease-save-error');
    errorDiv.textContent=result.message;
    errorDiv.style.display='block';
    document.getElementById('lease-save-success').style.display='none';
  }
}

// Reset lease agreement
function resetLeaseAgreement(){
  if(confirm('Reset lease agreement to default?')){
    localStorage.removeItem('leaseAgreement');
    document.getElementById('lease-agreement-text').value=getLeaseAgreement();
    alert('Lease agreement reset to default');
  }
}

// Load lease agreement content on page load
window.addEventListener('load',()=>{
  const textarea=document.getElementById('lease-agreement-text');
  if(textarea){
    textarea.value=getLeaseAgreement();
  }
});

// Member creation functions
function generatePassword(){
  const password=generateTemporaryPassword();
  document.getElementById('create-member-password').value=password;
}

async function createMemberAccount(){
  const name=document.getElementById('create-member-name').value.trim();
  const email=document.getElementById('create-member-email').value.trim();
  const phone=document.getElementById('create-member-phone').value.trim();
  let password=document.getElementById('create-member-password').value.trim();
  const roomId=parseInt(document.getElementById('create-member-room').value);
  
  // 유효성 검사
  if(!name || name.length<2){
    showMemberCreateError('이름을 2자 이상 입력하세요');
    return;
  }
  
  if(!email){
    showMemberCreateError('로그인 ID 또는 이메일을 입력하세요');
    return;
  }
  
  if(!phone || phone.length<10){
    showMemberCreateError('유효한 전화번호를 입력하세요');
    return;
  }
  
  if(!roomId || roomId<1){
    showMemberCreateError('입주 방을 선택해주세요');
    return;
  }
  
  // 비밀번호가 없으면 자동 생성
  if(!password){
    password=generateTemporaryPassword();
  }
  
  const response = await fetch(`${API_URL}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-password': '0185' },
    body: JSON.stringify({ name, email, phone, password, booked_room: roomId, role: 'user', username: email })
  });
  const result = await response.json();
  
  if(result.success){
    syncMemberRoomAssignment(result.member.id, roomId);
    showMemberCreateSuccess(email,password);
    clearMemberCreateForm();
    await loadMembersUI();
  }else{
    showMemberCreateError(result.message);
  }
}

function showMemberCreateError(message){
  const errorDiv=document.getElementById('member-create-error');
  const successDiv=document.getElementById('member-create-success');
  const infoDiv=document.getElementById('created-member-info');
  
  errorDiv.textContent=message;
  errorDiv.style.display='block';
  successDiv.style.display='none';
  infoDiv.style.display='none';
}

function showMemberCreateSuccess(email,password){
  const successDiv=document.getElementById('member-create-success');
  const errorDiv=document.getElementById('member-create-error');
  const infoDiv=document.getElementById('created-member-info');
  
  document.getElementById('created-email').textContent=email;
  document.getElementById('created-password').textContent=password;
  
  infoDiv.style.display='block';
  successDiv.style.display='block';
  errorDiv.style.display='none';
  
  // 3초 후 성공 메시지 숨김
  setTimeout(()=>{
    successDiv.style.display='none';
  },3000);
}

function clearMemberCreateForm(){
  document.getElementById('create-member-name').value='';
  document.getElementById('create-member-email').value='';
  document.getElementById('create-member-phone').value='';
  document.getElementById('create-member-password').value='';
  document.getElementById('create-member-room').value='';
}

// 방 선택 드롭다운 초기화
function loadRoomOptions(){
  const roomSelect=document.getElementById('create-member-room');
  if(!roomSelect) return;
  
  // 기존 옵션 제거 (선택 안됨 옵션은 유지)
  while(roomSelect.options.length>1){
    roomSelect.remove(1);
  }
  
  // dorms 배열에서 방 목록 추가
  dorms.forEach(room=>{
    const option=document.createElement('option');
    option.value=room.id;
    option.textContent=`${room.name} (${room.price})`;
    roomSelect.appendChild(option);
  });
}
