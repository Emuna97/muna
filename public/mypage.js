let selectedMonth=new Date().getMonth()+1;
let selectedYear=new Date().getFullYear();
let selectedPaymentMethod='';

function toggleEditMode(){
  const viewMode=document.getElementById('view-mode');
  const editMode=document.getElementById('edit-mode');
  const member=getCurrentMember();
  
  // Fill edit form with current values
  document.getElementById('edit-name').value=member.name;
  document.getElementById('edit-email').value=member.email;
  document.getElementById('edit-phone').value=member.phone;
  
  // Initialize error messages
  document.getElementById('edit-name-error').textContent='';
  document.getElementById('edit-email-error').textContent='';
  document.getElementById('edit-phone-error').textContent='';
  
  // Toggle
  viewMode.style.display='none';
  editMode.style.display='grid';
  editMode.style.gridTemplateColumns='1fr';
}

function cancelEditMode(){
  const viewMode=document.getElementById('view-mode');
  const editMode=document.getElementById('edit-mode');
  
  viewMode.style.display='block';
  editMode.style.display='none';
}

window.onload=async ()=>{
  // Check login
  const member=getCurrentMember();
  if(!member){
    alert('Please log in');
    location.href='login.html';
    return;
  }

  await ensureDormsLoaded();

  // Display member info
  document.getElementById('member-name').textContent=member.name;
  document.getElementById('member-email').textContent=member.email;
  document.getElementById('member-phone').textContent=member.phone;

  // Load server profile for synchronization
  let serverProfile = null;
  if (typeof loadMemberProfileFromServer === 'function') {
    serverProfile = await loadMemberProfileFromServer(member.memberId);
  }

  // Load room assignment info
  loadRoomInfo(member.memberId, serverProfile);

  // Load rent payment history
  loadRentHistory(member.memberId);

  // Initialize payment options
  initializePaymentOptions();
};

function loadRoomInfo(memberId, serverProfile){
  const roomInfo=document.getElementById('room-info');
  let assignment = null;

  if (serverProfile && serverProfile.room_assignment && serverProfile.room_assignment.roomId) {
    assignment = {
      roomId: serverProfile.room_assignment.roomId,
      monthlyRent: serverProfile.room_assignment.monthlyRent || getRoomMonthlyRent(serverProfile.room_assignment.roomId),
      assignmentDate: serverProfile.room_assignment.assignmentDate || new Date().toISOString()
    };
  }

  if (!assignment) {
    assignment = getMemberRoomAssignment(memberId);
  }

  const member=getCurrentMember();
  if(!assignment && member){
    const bookedRoom=member.bookedRoom||member.booked_room;
    if(bookedRoom){
      const roomIdNumber=parseInt(bookedRoom);
      if(roomIdNumber){
        assignment={
          roomId:roomIdNumber,
          monthlyRent:getRoomMonthlyRent(roomIdNumber),
          assignmentDate:new Date().toISOString()
        };
      }
    }
  }

  if(assignment){
    const room=getRoomData(assignment.roomId);
    if(room){
      roomInfo.innerHTML=`
        <div class="info-row">
          <div class="info-label">Room Number</div>
          <div class="info-value room-info-value">${room.name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Monthly Rent</div>
          <div class="info-value room-info-value">$${assignment.monthlyRent}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Move-in Date</div>
          <div class="info-value">${new Date(assignment.assignmentDate).toLocaleDateString('en-US')}</div>
        </div>
      `;

      // Show payment section
      document.getElementById('monthly-rent').textContent=`$${assignment.monthlyRent}`;
      document.getElementById('rent-payment-section').style.display='block';
      return;
    }
  }

  roomInfo.innerHTML='<div class="no-room">No room assigned</div>';
}

function initializePaymentOptions(){
  const member=getCurrentMember();
  const paymentMethods=document.getElementById('payment-methods');

  // Auto select current month (month selection option removed)
  selectedYear=new Date().getFullYear();
  selectedMonth=new Date().getMonth()+1;

  // Payment method options (Kakao Pay, Naver Pay removed)
  const methods=['Credit Card','Bank Transfer','Paypal','Apple Pay'];
  paymentMethods.innerHTML='';
  methods.forEach(method=>{
    const option=document.createElement('div');
    option.className='payment-option';
    option.textContent=method;
    option.onclick=()=>{
      document.querySelectorAll('.payment-option').forEach(el=>el.classList.remove('selected'));
      option.classList.add('selected');
      selectedPaymentMethod=method;
    };
    paymentMethods.appendChild(option);
  });
}

function getRoomMonthlyRent(roomId){
  const room=getRoomData(roomId);
  if(!room) return 0;
  if(typeof room.price==='number') return room.price;
  const parsed=parseFloat(String(room.price).replace(/[^0-9.]/g,''));
  return Number.isNaN(parsed)?0:parsed;
}

function loadRentHistory(memberId){
  const history=document.getElementById('rent-history');
  const payments=getRentPayments(memberId);

  if(payments.length===0){
    history.innerHTML='<div class="no-payments">No payment records yet</div>';
    return;
  }

  let html=`
    <table class="rent-table">
      <thead>
        <tr>
          <th>Year/Month</th>
          <th>Amount</th>
          <th>Payment Method</th>
          <th>Payment Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  payments.sort((a,b)=>new Date(b.paymentDate)-new Date(a.paymentDate)).forEach(payment=>{
    const statusText=payment.status==='completed'?'Paid':'Pending';
    const statusClass=payment.status==='completed'?'status-paid':'status-pending';
    html+=`
      <tr>
        <td>${payment.year}/${payment.month}</td>
        <td>$${payment.amount}</td>
        <td>${payment.paymentMethod}</td>
        <td>${new Date(payment.paymentDate).toLocaleDateString('en-US')}</td>
        <td class="${statusClass}">${statusText}</td>
      </tr>
    `;
  });

  html+='</tbody></table>';
  history.innerHTML=html;
}

function processPayment(){
  const member=getCurrentMember();
  if(!selectedPaymentMethod){
    alert('Please select a payment method');
    return;
  }

  const assignment=getMemberRoomAssignment(member.memberId);
  if(!assignment){
    alert('No room assigned');
    return;
  }

  // Check for duplicate payments
  const existingPayment=getMonthlyPaymentStatus(member.memberId,selectedYear,selectedMonth);
  if(existingPayment){
    alert(`${selectedMonth}/${selectedYear} rent has already been paid.`);
    return;
  }

  // Save payment record
  recordRentPayment(member.memberId,selectedYear,selectedMonth,assignment.monthlyRent,selectedPaymentMethod,assignment.roomId);

  alert(`${selectedMonth}/${selectedYear} rent $${assignment.monthlyRent} paid successfully!\nMethod: ${selectedPaymentMethod}`);

  // Refresh payment history
  loadRentHistory(member.memberId);

  // Clear selection
  selectedPaymentMethod='';
  document.querySelectorAll('.payment-option').forEach(el=>el.classList.remove('selected'));
}

function handleLogout(){
  if(confirm('Are you sure you want to log out?')){
    logoutMember();
    alert('Logged out successfully');
    location.href='index.html';
  }
}

function changePassword(){
  // Initialize error messages
  document.getElementById('current-password-error').textContent='';
  document.getElementById('new-password-error').textContent='';
  document.getElementById('new-password-confirm-error').textContent='';

  const member=getCurrentMember();
  if(!member){
    alert('Please log in');
    return;
  }

  const currentPassword=document.getElementById('current-password').value;
  const newPassword=document.getElementById('new-password').value;
  const newPasswordConfirm=document.getElementById('new-password-confirm').value;

  let hasError=false;

  // Validate current password
  if(!currentPassword){
    document.getElementById('current-password-error').textContent='Please enter current password';
    hasError=true;
  }

  // Validate new password
  if(newPassword.length<6){
    document.getElementById('new-password-error').textContent='New password must be at least 6 characters';
    hasError=true;
  }

  if(newPassword!==newPasswordConfirm){
    document.getElementById('new-password-confirm-error').textContent='New passwords do not match';
    hasError=true;
  }

  if(currentPassword===newPassword){
    document.getElementById('new-password-error').textContent='New password must be different from current password';
    hasError=true;
  }

  if(hasError) return;

  // Send to API to change password
  fetch(`${API_URL}/members/${member.memberId}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, password: newPassword })
  })
  .then(res => res.json())
  .then(result => {
    if(result.success){
      alert('Password changed successfully!');
      
      // Clear input fields
      document.getElementById('current-password').value='';
      document.getElementById('new-password').value='';
      document.getElementById('new-password-confirm').value='';
    }else{
      document.getElementById('current-password-error').textContent=result.message||'Password change failed';
    }
  })
  .catch(error => {
    console.error('Password change error:', error);
    document.getElementById('current-password-error').textContent='Unable to connect to the server';
  });
}

function submitUpdateMemberInfo(){
  // Initialize error messages
  document.getElementById('edit-name-error').textContent='';
  document.getElementById('edit-email-error').textContent='';
  document.getElementById('edit-phone-error').textContent='';

  const member=getCurrentMember();
  const name=document.getElementById('edit-name').value.trim();
  const email=document.getElementById('edit-email').value.trim();
  const phone=document.getElementById('edit-phone').value.trim();

  let hasError=false;

  // Validate data
  if(name.length<2){
    document.getElementById('edit-name-error').textContent='Name must be at least 2 characters';
    hasError=true;
  }

  const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!emailRegex.test(email)){
    document.getElementById('edit-email-error').textContent='Please enter a valid email';
    hasError=true;
  }

  const phoneRegex=/^[0-9\-]{10,}$/;
  if(!phoneRegex.test(phone)){
    document.getElementById('edit-phone-error').textContent='Please enter a valid phone number';
    hasError=true;
  }

  if(hasError) return;

  // Call updateMemberInfo function from data.js
  const result=window.parent.updateMemberInfo ? updateMemberInfo(member.memberId,name,email,phone) : {success:false};
  
  if(!result||!result.success){
    // Retry with alternative method
    const allMembers=getAllMembers();
    const memberData=allMembers.find(m=>m.id===member.memberId);
    if(memberData){
      // Check for duplicate email
      if(email!==memberData.email && allMembers.some(m=>m.email===email)){
        document.getElementById('edit-email-error').textContent='Email is already in use';
        return;
      }
      
      memberData.name=name;
      memberData.email=email;
      memberData.phone=phone;
      localStorage.setItem('members',JSON.stringify(allMembers));
      
      // Update session
      const session=getCurrentMember();
      session.name=name;
      session.email=email;
      session.phone=phone;
      localStorage.setItem('currentMember',JSON.stringify(session));
      
      // Update member info on screen
      document.getElementById('member-name').textContent=name;
      document.getElementById('member-email').textContent=email;
      document.getElementById('member-phone').textContent=phone;
      
      alert('Personal information updated successfully!');
      cancelEditMode();
    }
  }else if(result.success){
    // Update member info on screen
    document.getElementById('member-name').textContent=name;
    document.getElementById('member-email').textContent=email;
    document.getElementById('member-phone').textContent=phone;
    
    alert('Personal information updated successfully!');
    cancelEditMode();
  }else{
    document.getElementById('edit-email-error').textContent=result.message;
  }
}
