window.onload = async () => {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  await ensureDormsLoaded();
  const d = getRoomData(id);

  const el = document.getElementById('detail');

  if (d) {
    el.innerHTML = `
<div class="detail-container">
  <div class="detail-header" style="position:relative">
    <img src="${d.image}" alt="${d.name}"/>
    ${d.occupied?'<div style="position:absolute;top:20px;right:20px;background:rgba(231,76,60,0.9);color:white;padding:10px 20px;border-radius:10px;font-weight:bold;font-size:18px">SOLD OUT</div>':''}
    <div class="detail-info">
      <h1>${d.name}</h1>
      <h3>${d.city}</h3>
      <p class="price-big">${d.price}</p>
      <p>${d.desc}</p>
      <p class="address"><strong>📍 Address:</strong> ${d.address}</p>
    </div>
  </div>

  <div class="detail-content">
    <div class="contact-section">
      <h2>Contact</h2>
      <p><strong>📞 Phone:</strong> ${d.phone}</p>
      <p><strong>📧 Email:</strong> <a href="mailto:${d.email}">${d.email}</a></p>
    </div>

    <div class="payment-section">
      <h2>Payment Methods</h2>
      <div class="payment-methods">
        ${d.paymentMethods.map(method=>`<span class="payment-badge">${method}</span>`).join('')}
      </div>
    </div>

    <div class="map-section">
      <h2>Location Map</h2>
      <iframe width="100%" height="400" style="border:0;border-radius:10px;" src="https://maps.google.com/maps?q=136+W+12th+Ave,+Emporia,+KS+66801&output=embed" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>

    <div class="booking-section">
      <div style="display:flex;gap:10px;justify-content:center;">
        <button class="book-btn" onclick="goToRoom(${d.id})" ${d.occupied?'disabled style="opacity:0.6;cursor:not-allowed"':''}>Room Details</button>
        <button class="book-btn" onclick="bookNow(${d.id})" ${d.occupied?'disabled style="opacity:0.6;cursor:not-allowed"':''}>Reserve Now</button>
      </div>
    </div>
  </div>
</div>`;
  } else {
    el.innerHTML = "<h2>Room not found</h2>";
  }
};

function goToRoom(dormId){
  window.location.href = "room.html?dormId=" + dormId;
}

function bookNow(dormId){
  window.location.href = "booking.html?dormId=" + dormId;
}
