const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase already initialized');
      return admin.app();
    }

    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    console.log('✅ Firebase Admin initialized successfully');
    return admin.app();
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    throw error;
  }
};

// Get Firebase Storage bucket
const getBucket = () => {
  if (admin.apps.length === 0) {
    initializeFirebase();
  }
  return admin.storage().bucket();
};

module.exports = {
  initializeFirebase,
  getBucket,
  admin
};
