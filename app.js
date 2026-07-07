const list=document.getElementById('list');

window.onload=()=>{
  // Check login status
  const member=getCurrentMember();
  const loginLink=document.getElementById('login-link');
  const userInfo=document.getElementById('user-info');
  const mypageLink=document.getElementById('mypage-link');
  const adminLink=document.getElementById('admin-link');

  if(member){
    // User logged in
    // Show my page button
    mypageLink.style.display='inline';
    mypageLink.href='mypage.html';
    mypageLink.textContent='My Page';
    
    // Display member info
    loginLink.textContent='Logout';
    loginLink.href='#';
    loginLink.onclick=(e)=>{
      e.preventDefault();
      logoutMember();
      location.href='index.html';
    };
    userInfo.style.display='inline';
    userInfo.textContent=`${member.name} |`;
    
    // Hide Admin button
    adminLink.style.display='none';
  }else{
    // User not logged in
    loginLink.textContent='Login';
    
    // Show Admin button
    adminLink.style.display='inline';
  }

  // Apply homepage settings
  const settings=getHomePageSettings();
  const heroTitle=document.getElementById('hero-title');
  const hero=document.getElementById('hero');
  
  if(heroTitle) heroTitle.textContent=settings.title;
  if(hero){
    hero.style.backgroundColor=settings.backgroundColor;
    if(settings.backgroundImage){
      hero.style.backgroundImage=`url('${settings.backgroundImage}')`;
      hero.style.backgroundSize='cover';
      hero.style.backgroundPosition=settings.backgroundPosition||'center';
    }
  }
  
  render(getUpdatedDorms());
};

function render(arr){
  list.innerHTML='';
  arr.forEach(d=>{
    list.innerHTML+=`
      <a href="detail.html?id=${d.id}" style="text-decoration:none;color:inherit${d.occupied?';pointer-events:none;opacity:0.6':''}" ${d.occupied?'onclick="return false"':''}>
        <div class="card" style="position:relative">
          <img src="${d.image}"/>
          ${d.occupied?'<div style="position:absolute;top:10px;right:10px;background:rgba(231,76,60,0.9);color:white;padding:8px 16px;border-radius:8px;font-weight:bold;font-size:14px">SOLD OUT</div>':''}
          <div class="card-content">
            <h3>${d.name}</h3>
            <p>${d.city}</p>
            <p class="price">${d.price}</p>
          </div>
        </div>
      </a>`;
  });
}
