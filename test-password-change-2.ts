import { auth } from './lib/auth';
import { db } from './lib/db';
import { eq } from 'drizzle-orm';
import { user } from './lib/db/schema';

async function test() {
  console.log("Testing password change...");
  try {
    const email = "testrelawan2@sppg.com";
    const password = "OldPassword1!";
    
    // Cleanup
    const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
    if (existing) {
        await db.execute(`DELETE FROM "session" WHERE "userId" = '${existing.id}'`);
        await db.execute(`DELETE FROM "account" WHERE "userId" = '${existing.id}'`);
        await db.delete(user).where(eq(user.id, existing.id));
    }
    
    const headers = new Headers();
    const result = await auth.api.signUpEmail({
      body: { email, password, name: "Test Relawan 2" },
      headers: headers as any
    });
    
    // Better auth signInEmail returns the session token directly in result.session
    const signin1 = await auth.api.signInEmail({
      body: { email, password },
      headers: new Headers() as any
    });
    
    console.log("Session token:", signin1.session.token);

    const changeHeaders = new Headers();
    changeHeaders.set('authorization', `Bearer ${signin1.session.token}`);

    const changeRes = await auth.api.changePassword({
      body: { newPassword: "NewPassword1!", currentPassword: password },
      headers: changeHeaders as any
    });
    
    console.log("Change password result:", changeRes?.status ? "OK" : "OK"); // Assuming it returns something or nothing on success
    
    const signinRes = await auth.api.signInEmail({
      body: { email, password: "NewPassword1!" },
      headers: new Headers() as any
    });
    console.log("Sign in with new password:", signinRes.user?.id ? "SUCCESS" : "FAILED");
    
  } catch (e) {
    console.error(e);
  }
}
test();
