import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
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
    },
    plugins: [
        admin()
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
    trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"]
});
