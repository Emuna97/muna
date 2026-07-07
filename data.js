// Building Amenities (shared for all rooms)
const defaultAmenities=[
  {title:"1st Floor Lobby",description:"Comfortable gathering space for residents"},
  {title:"Shared Bathrooms",description:"Clean and well-maintained facilities"},
  {title:"Wi-Fi Access",description:"High-speed internet throughout the building"},
  {title:"Utilities Included",description:"Gas and electricity costs are included in the rent"}
];

// Migrate existing members (add password field)
function migrateMembers(){
  const members=JSON.parse(localStorage.getItem('members'))||[];
  let updated=false;
  
  members.forEach(member=>{
    if(!member.password){
      if(member.email==='kim@example.com'){
        member.password='kim1234';
      }else if(member.email==='park@example.com'){
        member.password='park1234';
      }else{
        member.password='default1234';
      }
      updated=true;
    }
  });
  
  if(updated){
    localStorage.setItem('members',JSON.stringify(members));
  }
}

// Run migration on program startup
migrateMembers();

function getAmenities(){
  const saved=localStorage.getItem('buildingAmenities');
  if(saved){
    try{
      return JSON.parse(saved);
    }catch(e){
      return defaultAmenities;
    }
  }
  return defaultAmenities;
}

// Homepage settings
const defaultHomePage={
  title:"Find Your Perfect Dorm",
  backgroundColor:"#f5f5f5",
  backgroundImage:"",
  backgroundPosition:"center"
};

function getHomePageSettings(){
  const saved=localStorage.getItem('homePageSettings');
  if(saved){
    try{
      return JSON.parse(saved);
    }catch(e){
      return defaultHomePage;
    }
  }
  return defaultHomePage;
}

const dorms=[
{id:1,name:"Room 201",city:"2nd Floor",price:"$450/month",image:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","PayPal"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"],features:["Private bedroom","Shared bathroom","High-speed Wi-Fi","Furnished with bed and desk","Access to common kitchen","24/7 security"],fullDescription:"Experience comfort in Room 201. Each room is equipped with essential furniture and comes with shared bathroom access. The building features a welcoming 1st floor lobby, high-speed Wi-Fi access throughout, and all utility costs (gas and electricity) are included in the rent. Perfect for students seeking privacy with community amenities."}},
{id:2,name:"Room 202",city:"2nd Floor",price:"$400/month",image:"https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","Kakao Pay"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600"],features:["Spacious bedroom for two","Shared bathroom facilities","Premium Wi-Fi connection","Modern furniture set","Kitchenette access","Laundry room available"],fullDescription:"Room 202 is perfect for two roommates. Our building offers excellent amenities including a comfortable 1st floor lobby. Shared bathrooms are well-maintained. All gas and electricity costs are covered in your monthly rent."}},
{id:3,name:"Room 203",city:"2nd Floor",price:"$420/month",image:"https://images.unsplash.com/photo-1501183638710-841dd1904471?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","PayPal"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1501183638710-841dd1904471?w=600","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"],features:["Large bedroom for three","Shared bathroom facilities","High-speed Wi-Fi","Multiple beds and desks","Shared common area access","Convenient location on 2nd floor"],fullDescription:"Room 203 offers great value for three roommates. Enjoy spacious accommodations with modern conveniences. The building features a welcoming 1st floor lobby and all utilities are included in the rent."}},
{id:4,name:"Room 204",city:"2nd Floor",price:"$320/month",image:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","Naver Pay"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600"],features:["Shared bedroom","Access to common bathroom","Free Wi-Fi connection","Basic furnished setup","Common kitchen facilities","Study lounge access"],fullDescription:"Room 204 provides affordable housing. Share a room with compatible roommates and enjoy the vibrant community atmosphere. Our building features a lively 1st floor lobby where students gather."}},
{id:5,name:"Room 205",city:"2nd Floor",price:"$450/month",image:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","PayPal"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"],features:["Private bedroom","Shared bathroom","High-speed Wi-Fi","Furnished with bed and desk","Access to common kitchen","24/7 security"],fullDescription:"Room 205 offers a comfortable private space. Each room is equipped with essential furniture and comes with shared bathroom access. All utilities are included in the rent."}},
{id:6,name:"Room 206",city:"2nd Floor",price:"$380/month",image:"https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","Kakao Pay"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600"],features:["Spacious bedroom for two","Shared bathroom facilities","Premium Wi-Fi connection","Modern furniture set","Kitchenette access","Laundry room available"],fullDescription:"Room 206 is perfect for two roommates seeking comfort and affordability. All gas and electricity costs are covered in your monthly rent."}},
{id:7,name:"Room 207",city:"2nd Floor",price:"$420/month",image:"https://images.unsplash.com/photo-1501183638710-841dd1904471?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","PayPal"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1501183638710-841dd1904471?w=600","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"],features:["Large bedroom for three","Shared bathroom facilities","High-speed Wi-Fi","Multiple beds and desks","Shared common area access","Convenient location on 2nd floor"],fullDescription:"Room 207 is ideal for three students looking for comfort and value. Spacious accommodations with all modern conveniences and excellent facilities."}},
{id:8,name:"Room 301",city:"3rd Floor",price:"$500/month",image:"https://images.unsplash.com/photo-1501183638710-841dd1904471?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","Apple Pay"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1501183638710-841dd1904471?w=600","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"],features:["Large private bedroom","Ensuite bathroom","Ultra-fast Wi-Fi","Premium bedding","Mini refrigerator","Personal study area"],fullDescription:"Indulge in luxury living at Room 301. Premium accommodations with ensuite bathroom for ultimate privacy. Comprehensive amenities include full Wi-Fi coverage and all utilities are included."}},
{id:9,name:"Room 302",city:"3rd Floor",price:"$320/month",image:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","Naver Pay"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600"],features:["Shared bedroom","Access to common bathroom","Free Wi-Fi connection","Basic furnished setup","Common kitchen facilities","Study lounge access"],fullDescription:"Room 302 provides affordable housing on the 3rd floor. Share a room with compatible roommates and enjoy the vibrant community atmosphere."}},
{id:10,name:"Room 303",city:"3rd Floor",price:"$450/month",image:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","PayPal"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"],features:["Private bedroom","Shared bathroom","High-speed Wi-Fi","Furnished with bed and desk","Access to common kitchen","24/7 security"],fullDescription:"Room 303 offers a comfortable private space on the 3rd floor. All utilities are included in the rent and high-speed Wi-Fi is available throughout."}},
{id:11,name:"Room 304",city:"3rd Floor",price:"$380/month",image:"https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","Kakao Pay"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600"],features:["Spacious bedroom for two","Shared bathroom facilities","Premium Wi-Fi connection","Modern furniture set","Kitchenette access","Laundry room available"],fullDescription:"Room 304 is perfect for two roommates. Excellent amenities and comfortable 1st floor lobby. All gas and electricity costs are covered."}},
{id:12,name:"Room 305",city:"3rd Floor",price:"$420/month",image:"https://images.unsplash.com/photo-1501183638710-841dd1904471?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","PayPal"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1501183638710-841dd1904471?w=600","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"],features:["Large bedroom for three","Shared bathroom facilities","High-speed Wi-Fi","Multiple beds and desks","Shared common area access","Convenient location on 3rd floor"],fullDescription:"Room 305 is ideal for three students. Spacious accommodations with modern conveniences and excellent facilities."}},
{id:13,name:"Room 306",city:"3rd Floor",price:"$450/month",image:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","PayPal"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"],features:["Private bedroom","Shared bathroom","High-speed Wi-Fi","Furnished with bed and desk","Access to common kitchen","24/7 security"],fullDescription:"Room 306 offers a comfortable private space on the 3rd floor. High-speed Wi-Fi and all utilities are included in the rent."}},
{id:14,name:"Room 307",city:"3rd Floor",price:"$480/month",image:"https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400",desc:"Private Room",lat:38.3972,lng:-95.6659,phone:"+82-2-1234-5678",email:"info@muna.kr",address:"136 W 12th Ave, Emporia, Kansas",paymentMethods:["Credit Card","Bank Transfer","PayPal"],rooms:{type:"Private Room",priceDescription:"Gas and electricity included",images:["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600"],features:["Spacious premium bedroom for two","Ensuite bathroom","Ultra-fast Wi-Fi","Premium bedding","Mini refrigerator","Personal study area"],fullDescription:"Room 307 is the premium option on the 3rd floor. Perfect for two students seeking the best amenities with ensuite bathroom. All utilities are included."}}
];

// Get room info from localStorage
function getRoomData(roomId){
  const room=dorms.find(x=>x.id===roomId);
  if(!room)return null;
  const saved=JSON.parse(localStorage.getItem(`room_${roomId}`));
  const isReserved=isRoomReserved(roomId);
  
  // Copy rooms object and update fullDescription
  const roomsCopy = {...room.rooms};
  if(saved?.description) roomsCopy.fullDescription = saved.description;
  
  // Use room object as base, override with saved values
  return {
    ...room,
    price:saved?.price||room.price,
    phone:saved?.phone||room.phone,
    email:saved?.email||room.email,
    paymentMethods:saved?.paymentMethods||room.paymentMethods,
    image:saved?.image||room.image,
    occupied:isReserved||saved?.occupied||false,
    rooms:roomsCopy
  };
}

// Get all room info (reflected from localStorage)
function getUpdatedDorms(){
  return dorms.map(r=>getRoomData(r.id));
}

// Member management functions
function getAllMembers(){
  const saved=localStorage.getItem('members');
  if(saved){
    try{
      return JSON.parse(saved);
    }catch(e){
      return [];
    }
  }
  return [];
}

function saveMember(member){
  const members=getAllMembers();
  const newMember={
    id:Date.now(),
    name:member.name,
    email:member.email,
    phone:member.phone,
    password:member.password||'',
    registrationDate:new Date().toISOString(),
    status:'active'
  };
  members.push(newMember);
  localStorage.setItem('members',JSON.stringify(members));
  return newMember;
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

// Login/Session management
function loginMember(email,password){
  const members=getAllMembers();
  const member=members.find(m=>m.email===email);
  if(member && member.password===password){
    const session={
      memberId:member.id,
      name:member.name,
      email:member.email,
      phone:member.phone,
      loginTime:new Date().toISOString()
    };
    localStorage.setItem('currentMember',JSON.stringify(session));
    return member;
  }
  return null;
}

function logoutMember(){
  localStorage.removeItem('currentMember');
}

function getCurrentMember(){
  const session=localStorage.getItem('currentMember');
  if(session){
    try{
      return JSON.parse(session);
    }catch(e){
      return null;
    }
  }
  return null;
}

function isLoggedIn(){
  return getCurrentMember()!==null;
}

// Update password
function updatePassword(memberId,newPassword){
  const members=getAllMembers();
  const member=members.find(m=>m.id===memberId);
  if(member){
    member.password=newPassword;
    localStorage.setItem('members',JSON.stringify(members));
    return true;
  }
  return false;
}

// Update member info (name, email, phone)
function updateMemberInfo(memberId,name,email,phone){
  const members=getAllMembers();
  const member=members.find(m=>m.id===memberId);
  if(member){
    // Check for duplicate email (exclude own email)
    if(email!==member.email && members.some(m=>m.email===email)){
      return {success:false, message:'Email is already in use'};
    }
    
    member.name=name;
    member.email=email;
    member.phone=phone;
    localStorage.setItem('members',JSON.stringify(members));
    
    // Update current login session
    const session=getCurrentMember();
    if(session && session.memberId===memberId){
      session.name=name;
      session.email=email;
      session.phone=phone;
      localStorage.setItem('currentMember',JSON.stringify(session));
    }
    
    return {success:true, message:'Member information updated successfully'};
  }
  return {success:false, message:'Member not found'};
}

// Generate verification code (simulation)
function generateVerificationCode(){
  return Math.floor(100000+Math.random()*900000).toString();
}

// Save verification code (test - backend will handle in production)
function saveVerificationCode(email,code){
  const codes=JSON.parse(localStorage.getItem('verificationCodes'))||{};
  codes[email]=code;
  localStorage.setItem('verificationCodes',JSON.stringify(codes));
}

// Verify code
function verifyCode(email,code){
  const codes=JSON.parse(localStorage.getItem('verificationCodes'))||{};
  return codes[email]===code;
}

// Delete verification code
function deleteVerificationCode(email){
  const codes=JSON.parse(localStorage.getItem('verificationCodes'))||{};
  delete codes[email];
  localStorage.setItem('verificationCodes',JSON.stringify(codes));
}

// Manage member room assignment info
function getMemberRoomAssignment(memberId){
  const assignments=JSON.parse(localStorage.getItem('roomAssignments'))||{};
  return assignments[memberId]||null;
}

function assignRoomToMember(memberId,roomId,monthlyRent){
  const assignments=JSON.parse(localStorage.getItem('roomAssignments'))||{};
  assignments[memberId]={
    roomId:roomId,
    monthlyRent:monthlyRent,
    assignmentDate:new Date().toISOString()
  };
  localStorage.setItem('roomAssignments',JSON.stringify(assignments));
  
  // Mark room as reserved
  markRoomAsReserved(roomId,memberId);
}

// Manage room reservation status
function markRoomAsReserved(roomId,memberId){
  const reserved=JSON.parse(localStorage.getItem('reservedRooms'))||{};
  reserved[roomId]=memberId;
  localStorage.setItem('reservedRooms',JSON.stringify(reserved));
}

function isRoomReserved(roomId){
  const reserved=JSON.parse(localStorage.getItem('reservedRooms'))||{};
  return reserved.hasOwnProperty(roomId);
}

function getRoomReservation(roomId){
  const reserved=JSON.parse(localStorage.getItem('reservedRooms'))||{};
  return reserved[roomId]||null;
}

function unreserveRoom(roomId){
  const reserved=JSON.parse(localStorage.getItem('reservedRooms'))||{};
  delete reserved[roomId];
  localStorage.setItem('reservedRooms',JSON.stringify(reserved));
}

// Manage rent payment records
function getRentPayments(memberId){
  const key=`rentPayments_${memberId}`;
  const saved=localStorage.getItem(key);
  if(saved){
    try{
      return JSON.parse(saved);
    }catch(e){
      return [];
    }
  }
  return [];
}

function recordRentPayment(memberId,year,month,amount,paymentMethod){
  const key=`rentPayments_${memberId}`;
  const payments=getRentPayments(memberId);
  
  const newPayment={
    id:Date.now(),
    year:year,
    month:month,
    amount:amount,
    paymentMethod:paymentMethod,
    paymentDate:new Date().toISOString(),
    status:'completed'
  };
  
  payments.push(newPayment);
  localStorage.setItem(key,JSON.stringify(payments));
  return newPayment;
}

function getMonthlyPaymentStatus(memberId,year,month){
  const payments=getRentPayments(memberId);
  return payments.find(p=>p.year===year&&p.month===month)||null;
}

function getAllRentPayments(){
  const result={};
  const members=getAllMembers();
  members.forEach(member=>{
    const payments=getRentPayments(member.id);
    if(payments.length>0){
      result[member.id]={
        memberName:member.name,
        email:member.email,
        payments:payments
      };
    }
  });
  return result;
}

// Default Lease Agreement
const defaultLeaseAgreement=`DORM RENTAL LEASE AGREEMENT

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

// Get lease agreement
function getLeaseAgreement(){
  const saved=localStorage.getItem('leaseAgreement');
  return saved||defaultLeaseAgreement;
}

// Update lease agreement
function updateLeaseAgreement(newAgreement){
  if(newAgreement.trim().length<50){
    return {success:false,message:'Lease agreement must be at least 50 characters'};
  }
  localStorage.setItem('leaseAgreement',newAgreement);
  return {success:true,message:'Lease agreement updated successfully'};
}

// Admin member creation function
function createMemberByAdmin(name,email,phone,username,password,roomId){
  // Check for duplicate email
  const members=getAllMembers();
  if(members.find(m=>m.email===email)){
    return {success:false,message:'Email is already in use'};
  }
  
  // Check for duplicate username (not used if empty, login by email)
  if(username && members.find(m=>m.username===username)){
    return {success:false,message:'Username is already in use'};
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
  
  // Assign room (if roomId is provided)
  if(roomId){
    const room=getRoomData(roomId);
    if(room){
      const monthlyRent=parseInt(room.price.replace(/\$/g,'').replace(/\/month/g,''));
      assignRoomToMember(newMember.id,roomId,monthlyRent);
    }
  }
  
  return {success:true,message:'Member created successfully',member:newMember};
}

// Generate random temporary password
function generateTemporaryPassword(){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password='';
  for(let i=0;i<8;i++){
    password+=chars.charAt(Math.floor(Math.random()*chars.length));
  }
  return password;
}

