const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin
const serviceAccount = require("./service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "householdexpenses-796f4.firebasestorage.app",
});

const bucket = admin
  .storage()
  .bucket("householdexpenses-796f4.firebasestorage.app");

async function setCorsConfiguration() {
  try {
    // First check if bucket exists
    const [exists] = await bucket.exists();
    if (!exists) {
      console.error("Bucket does not exist. Please check the bucket name.");
      process.exit(1);
    }

    const corsConfig = JSON.parse(fs.readFileSync("./cors.json", "utf8"));
    await bucket.setCorsConfiguration(corsConfig);
    console.log("CORS configuration set successfully");
  } catch (error) {
    console.error("Error setting CORS configuration:", error);
    if (error.code === 404) {
      console.error(
        "Bucket not found. Please verify the bucket name in your Firebase project settings."
      );
    }
  } finally {
    process.exit();
  }
}

setCorsConfiguration();
