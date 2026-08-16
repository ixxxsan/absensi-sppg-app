import { auth } from './lib/auth';
import { db } from './lib/db';
import { eq } from 'drizzle-orm';
import { user } from './lib/db/schema';

async function test() {
  console.log("Testing password change...");
  try {
    const email = "testrelawan1@sppg.com";
    const password = "OldPassword1!";
    
    // Cleanup
    const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
    if (existing) {
        // Just bypass proper FK cleanup for a quick test
        await db.execute(`DELETE FROM "session" WHERE "userId" = '${existing.id}'`);
        await db.execute(`DELETE FROM "account" WHERE "userId" = '${existing.id}'`);
        await db.delete(user).where(eq(user.id, existing.id));
    }
    
    const headers = new Headers();
    const result = await auth.api.signUpEmail({
      body: { email, password, name: "Test Relawan" },
      headers: headers as any
    });
    
    console.log("Created:", result.user.id);
    
    // Find the session token from headers (if better auth sets cookie)
    const setCookie = headers.get('set-cookie');
    console.log("Cookie created during sign up:", setCookie);
    
    // Try change password using session headers
    const changeHeaders = new Headers();
    if (setCookie) changeHeaders.set('cookie', setCookie);

    const changeRes = await auth.api.changePassword({
      body: { newPassword: "NewPassword1!", currentPassword: password },
      headers: changeHeaders as any
    });
    
    console.log("Change password result:", changeRes);
    
    // Try sign in
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
