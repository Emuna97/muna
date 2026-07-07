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
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('currentMember', JSON.stringify(session));

    alert('Logged in successfully!');
    location.href='index.html';
  } catch (error) {
    console.error('Login API failure:', error);
    errorMessage.textContent = 'Unable to connect to the server';
  }
}
