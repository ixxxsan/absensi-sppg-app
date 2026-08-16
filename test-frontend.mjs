

async function testFrontend() {
  console.log("Creating new user...");
  // Use Better Auth API directly
  const createRes = await fetch('http://localhost:3000/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_change@sppg.com', password: 'Password123', name: 'Tester' })
  });
  
  const created = await createRes.json();
  console.log("Created user:", created.user?.email);
  
  const cookie = createRes.headers.get('set-cookie');
  console.log("Auth Cookie:", cookie ? "Present" : "Missing");

  console.log("\nChanging password via frontend API...");
  const changeRes = await fetch('http://localhost:3000/api/auth/change-password', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookie || ''
    },
    body: JSON.stringify({ newPassword: 'NewPassword456', currentPassword: 'Password123', revokeOtherSessions: true })
  });
  
  const changeData = await changeRes.json();
  console.log("Change response:", changeData);

  console.log("\nTesting login with OLD password...");
  const oldLoginRes = await fetch('http://localhost:3000/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_change@sppg.com', password: 'Password123' })
  });
  const oldLoginData = await oldLoginRes.json();
  console.log("Old password login:", oldLoginData.user ? "Success" : oldLoginData.error ? oldLoginData.error.message : "Failed");

  console.log("\nTesting login with NEW password...");
  const newLoginRes = await fetch('http://localhost:3000/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_change@sppg.com', password: 'NewPassword456' })
  });
  const newLoginData = await newLoginRes.json();
  console.log("New password login:", newLoginData.user ? "Success" : newLoginData.error ? newLoginData.error.message : "Failed");
}
testFrontend();
