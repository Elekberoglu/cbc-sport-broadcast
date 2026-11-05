/* Firebase konfiqurasiyası — layihə: cbc-sport-broadcast
   Mənbə: Firebase Console → Project settings → Your apps → Web app (CBC Sport Broadcast).
   Android üçün ayrıca google-services.json istifadə olunur (android/app/). */
window.CBC_FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBWZU76ARV6phKT2V-yLlnzjQPdEq0boFs',
    authDomain: 'cbc-sport-broadcast.firebaseapp.com',
    projectId: 'cbc-sport-broadcast',
    storageBucket: 'cbc-sport-broadcast.firebasestorage.app',
    messagingSenderId: '722958292611',
    appId: '1:722958292611:web:4e00921124d6aaef0d2db6',
    measurementId: 'G-6JTH5FNTKC'
};

/* Firebase JS SDK versiyası (gstatic CDN, modul formatı) */
window.CBC_FIREBASE_SDK = '11.0.2';

// iPhone/brauzer üçün Web Push açarı (VAPID). Firebase Console → Project settings → Cloud Messaging →
// Web Push certificates → Generate key pair → "Key pair" dəyərini bura yazın. Boşdursa, veb push söndürülüdür.
window.CBC_FCM_VAPID_KEY = '';
