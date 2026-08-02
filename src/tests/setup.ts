process.env.SESSION_SECRET = "test-session-secret-0123456789abcdefghij";
process.env.ADMIN_TOKEN = "test-admin-token";
process.env.CONTACT_ENC_KEY = Buffer.alloc(32, 7).toString("base64");
