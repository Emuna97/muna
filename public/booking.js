let bookingDormId = null;
let bookingDorm = null;

window.onload = async () => {
  const params = new URLSearchParams(window.location.search);
  bookingDormId = parseInt(params.get('dormId'));
  await ensureDormsLoaded();
  bookingDorm = getRoomData(bookingDormId);

  const container = document.getElementById('booking-container');

  if (bookingDorm) {
    const leaseAgreement = getLeaseAgreement();
    
    container.innerHTML = `
<div class="booking-box">
  <div class="booking-info">
    <h2>Accommodation: ${bookingDorm.name}</h2>
    <p>Price: ${bookingDorm.price}</p>
    <p>Address: ${bookingDorm.address}</p>
  </div>

  <form onsubmit="submitBooking(event)">
    <div class="form-group">
      <label for="name">Booking Name *</label>
      <input type="text" id="name" name="name" required/>
    </div>

    <div class="form-group">
      <label for="email">Email *</label>
      <input type="email" id="email" name="email" required/>
    </div>

    <div class="form-group">
      <label for="phone">Phone Number *</label>
      <input type="tel" id="phone" name="phone" required/>
    </div>

    <div class="form-group">
      <label for="moveIn">Desired Move-in Date *</label>
      <input type="month" id="moveIn" name="moveIn" required/>
    </div>

    <div class="form-group">
      <label for="payment">Payment Method *</label>
      <select id="payment" name="payment" required>
        <option value="">Select...</option>
        ${bookingDorm.paymentMethods.map(method=>`<option value="${method}">${method}</option>`).join('')}
      </select>
    </div>

    <div class="form-group">
      <label for="notes">Special Requests</label>
      <textarea id="notes" name="notes" rows="4" placeholder="Enter any special requests"></textarea>
    </div>

    <!-- Lease Agreement Section -->
    <div class="form-group" style="border: 2px solid #3498db; padding: 20px; border-radius: 5px; background: #ecf0f1;">
      <h3 style="margin-top: 0; color: #2c3e50;">Lease Agreement</h3>
      <div style="max-height: 300px; overflow-y: auto; background: white; padding: 15px; border-radius: 5px; border: 1px solid #bdc3c7; white-space: pre-wrap; line-height: 1.6; font-size: 13px; color: #555;">
${leaseAgreement}
      </div>
      
      <div style="margin-top: 15px;">
        <label style="display: flex; align-items: center; font-weight: bold; color: #2c3e50;">
          <input type="checkbox" id="agree-lease" name="agree-lease" required style="width: 20px; height: 20px; margin-right: 10px;">
          I agree to the above lease agreement *
        </label>
        <div class="error" id="lease-error" style="color: #e74c3c; font-size: 13px; margin-top: 5px;"></div>
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" class="btn-submit">Complete Booking</button>
      <button type="button" class="btn-cancel" onclick="history.back()">Cancel</button>
    </div>
  </form>
</div>`;
  } else {
    container.innerHTML = "<h2>Accommodation not found</h2>";
  }
};

function submitBooking(event){
event.preventDefault();

const agreeCheckbox=document.getElementById('agree-lease');
if(!agreeCheckbox.checked){
  document.getElementById('lease-error').textContent='You must agree to the lease agreement';
  return;
}

const booking={
  dormId: bookingDormId,
  name: document.getElementById('name').value,
  email: document.getElementById('email').value,
  phone: document.getElementById('phone').value,
  moveIn: document.getElementById('moveIn').value,
  payment: document.getElementById('payment').value,
  notes: document.getElementById('notes').value,
  dormName: bookingDorm.name,
  bookingDate: new Date().toLocaleString('en-US'),
  leaseAgreed: true,
  leaseAgreementVersion: getLeaseAgreement().substring(0,100)
};

// Send booking to server
fetch(`${API_URL}/booking`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    room_id: bookingDormId,
    customer_name: booking.name,
    email: booking.email,
    phone: booking.phone,
    move_in_date: booking.moveIn,
    message: booking.notes,
    dormName: booking.dormName
  })
})
.then(r => r.json())
.then(result => {
  if (result.success) {
    alert(`Booking completed!\\n\\nName: ${booking.name}\\nAccommodation: ${booking.dormName}\\nDesired Move-in: ${booking.moveIn}\\n\\nYou have agreed to the lease agreement.`);
    window.location.href = 'index.html';
  } else {
    alert('Failed to create booking: ' + (result.message || 'Unknown error'));
  }
})
.catch(err => {
  console.error('Booking submit error:', err);
  alert('Failed to create booking');
});
}
