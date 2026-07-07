window.onload = async () => {
  const params = new URLSearchParams(window.location.search);
  const dormId = parseInt(params.get('dormId'));
  await ensureDormsLoaded();
  const dorm = getRoomData(dormId);

  const container = document.getElementById('room-container');

  if (dorm) {
    // Normalize room structure for both API and local object formats
    const roomDetails = dorm.rooms || {
      type: dorm.desc || 'Room',
      priceDescription: dorm.priceDescription || '',
      images: dorm.images ? dorm.images : [dorm.image],
      features: dorm.features || [],
      fullDescription: dorm.fullDescription || dorm.desc || ''
    };

    const savedData = JSON.parse(localStorage.getItem(`room_${dormId}`)) || {};
    const savedImages = Array.isArray(savedData.images) ? savedData.images.filter(img => typeof img === 'string' && img.trim()) : [];
    const images = savedImages.length > 0 ? savedImages : roomDetails.images || [dorm.image];
    const mainImage = (typeof savedData.image === 'string' && savedData.image.trim()) ? savedData.image.trim() : images[0] || dorm.image;

    container.innerHTML = `
<div class="room-container">
  <div class="room-gallery">
    <div class="gallery-main" style="position:relative">
      <img id="mainImage" src="${mainImage}" alt="Main Room Image"/>
      ${dorm.occupied?'<div style="position:absolute;top:20px;right:20px;background:rgba(231,76,60,0.9);color:white;padding:10px 20px;border-radius:10px;font-weight:bold;font-size:18px">SOLD OUT</div>':''}
    </div>
    <div class="gallery-thumbnails">
      ${images.map((img, idx) => `<img src="${img}" alt="Room ${idx+1}" onclick="changeImage('${img}')" class="thumbnail"/>`).join('')}
    </div>
  </div>

  <div class="room-details">
    <h1>${dorm.name}</h1>
    <h2>${roomDetails.type}</h2>
    
    <div class="price-info">
      <h3 class="room-price">${typeof dorm.price === 'number' ? `$${dorm.price}/month` : dorm.price}</h3>
      <p class="price-desc">${roomDetails.priceDescription}</p>
    </div>

    <div class="amenities-section">
      <h3>Building Amenities</h3>
      <div class="amenities-grid">
        ${getAmenities().map(amenity => `
        <div class="amenity-item">
          <p><strong>${amenity.title}</strong><br/>${amenity.description}</p>
        </div>
        `).join('')}
      </div>
    </div>

    <div class="room-features">
      <h3>Room Features</h3>
      <ul class="features-list">
        ${roomDetails.features.map(feature => `<li>✓ ${feature}</li>`).join('')}
      </ul>
    </div>

    <div class="room-description">
      <h3>Description</h3>
      <p>${roomDetails.fullDescription}</p>
    </div>

    <div class="booking-action">
      <button class="book-btn" onclick="goToBooking(${dormId})" ${dorm.occupied?'disabled style="opacity:0.6;cursor:not-allowed"':''}>Reserve This Room</button>
    </div>
  </div>
</div>`;
  } else {
    container.innerHTML = "<h2>Room details not found</h2>";
  }
};

function changeImage(src){
  document.getElementById('mainImage').src = src;
}

function goToBooking(dormId){
window.location.href = "booking.html?dormId=" + dormId;
}
