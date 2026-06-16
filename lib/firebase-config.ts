// Firebase web config. These values are public by design (they ship in the
// client bundle) — safe to commit. Override per-environment with NEXT_PUBLIC_*
// vars if you ever point at a different Firebase project.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyDa50wGTzKpFptiMiC0jjyHSGJBLUxFpJw',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'hotrod-7a59d.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'hotrod-7a59d',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'hotrod-7a59d.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '996416487698',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:996416487698:web:1e3d8afaf6141cd02d33cb'
};

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
