process.env.TURSO_DATABASE_URL = "http://127.0.0.1:8081";
delete process.env.TURSO_AUTH_TOKEN;
process.env.SESSION_SECRET = "test-session-secret-0123456789abcdefghij";
process.env.ADMIN_TOKEN = "test-admin-token";
process.env.CONTACT_ENC_KEY = Buffer.alloc(32, 7).toString("base64");
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-api-secret";
