async function handleLogin(event){
  event.preventDefault();

  const email=document.getElementById('email').value.trim();
  const password=document.getElementById('password').value.trim();
  const errorMessage=document.getElementById('error-message');

  // Validation
  if(!email||!password){
    errorMessage.textContent='Please enter login ID and password';
    return;
  }

  try {
    // Ensure dorms are loaded first for room assignment processing
    if (typeof ensureDormsLoaded === 'function') {
      await ensureDormsLoaded();
    }

    const response = await fetch(`${API_URL}/members/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();

    if (!result.success) {
      errorMessage.textContent = result.message || 'Login failed';
      return;
    }

    const member = result.user || result.member;
    const session = {
      memberId: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      bookedRoom: member.booked_room || member.bookedRoom || null,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('currentMember', JSON.stringify(session));

    // Load member profile from server to sync room assignment and rent payments
    if (typeof loadMemberProfileFromServer === 'function') {
      try {
        const serverProfile = await loadMemberProfileFromServer(member.id);
        if (serverProfile) {
          console.log('Loaded profile from server:', serverProfile);
        }
      } catch (err) {
        console.log('Failed to load server profile, using localStorage:', err);
      }
    }

    // If member has a booked room, save the room assignment
    if (member.booked_room || member.bookedRoom) {
      const roomId = member.booked_room || member.bookedRoom;
      if (typeof setMemberRoomAssignment === 'function') {
        setMemberRoomAssignment(member.id, roomId);
      }
    }


    alert('Logged in successfully!');
    location.href='index.html';
  } catch (error) {
    console.error('Login API failure:', error);
    errorMessage.textContent = 'Unable to connect to the server';
  }
}
