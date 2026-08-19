import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { Resend } from "resend";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || process.env.FRONTEND_URL || "https://absensi-sppg-teluknaga03.id",
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification
        }
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        resetPasswordTokenExpiresIn: 1800, // 30 menit
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: async ({ user, url }) => {
            if (!process.env.RESEND_API_KEY) {
                console.warn("[AUTH] RESEND_API_KEY tidak ditemukan, email reset di-skip.");
                return;
            }
            const resend = new Resend(process.env.RESEND_API_KEY);
            const userName = user.name || "Relawan";

            try {
                await resend.emails.send({
                    from: "SPPG Teluknaga 03 <no-reply@absensi-sppg-teluknaga03.id>",
                    to: user.email,
                    subject: "Reset Kata Sandi — SPPG Teluknaga 03",
                    html: `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#071e49 0%,#0c2860 100%);padding:32px 24px;text-align:center;">
      <img src="https://absensi-sppg-teluknaga03.id/logo-bgn.png" alt="Logo SPPG" style="width:64px;height:auto;margin-bottom:12px;" />
      <h1 style="color:#ffffff;font-size:20px;margin:0;">Reset Kata Sandi</h1>
      <p style="color:#b5e0ea;font-size:14px;margin:8px 0 0;">SPPG Tangerang Teluknaga 03</p>
    </div>
    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="color:#333;font-size:15px;line-height:1.6;">Halo <strong>${userName}</strong>,</p>
      <p style="color:#555;font-size:14px;line-height:1.6;">Kami menerima permintaan untuk mereset kata sandi akun Anda. Klik tombol di bawah ini untuk membuat kata sandi baru:</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${url}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#0c2860,#1a3a70);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.3px;">Reset Kata Sandi</a>
      </div>
      <p style="color:#888;font-size:13px;line-height:1.5;">Tautan ini hanya berlaku selama <strong>30 menit</strong> dan hanya dapat digunakan satu kali. Jika Anda tidak meminta reset password, abaikan email ini.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#aaa;font-size:12px;text-align:center;">© 2026 SPPG Tangerang Teluknaga 03<br/>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
    </div>
  </div>
</body>
</html>`,
                });
                console.log(`[AUTH] Email reset password terkirim ke: ${user.email}`);
            } catch (error) {
                console.error(`[AUTH] Gagal mengirim email reset ke: ${user.email}`, error);
            }
        },
    },
    plugins: [
        admin({
            adminRoles: ["admin", "super_admin", "SuperAdmin"]
        })
    ],
    // Extending user session to include custom fields
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: "relawan",
            },
            idRelawan: {
                type: "string",
                required: false,
            },
            noTelepon: {
                type: "string",
                required: false,
            },
            statusAktif: {
                type: "boolean",
                required: false,
                defaultValue: true,
            },
            nik: {
                type: "string",
                required: false,
            },
            divisi: {
                type: "string",
                required: false,
            },
            status: {
                type: "string",
                required: false,
                defaultValue: "Aktif",
            }
        }
    },
    trustedOrigins: [
        process.env.FRONTEND_URL || "https://absensi-sppg-teluknaga03.id",
        "https://absensi-sppg-teluknaga03.id",
        "http://absensi-sppg-teluknaga03.id"
    ]
});
