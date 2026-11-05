// AndroidManifest.xml-ə dəqiq vaxtlı bildiriş icazələrini əlavə edir
import fs from 'node:fs';
const f = 'android/app/src/main/AndroidManifest.xml';
let x = fs.readFileSync(f, 'utf8');
const perms = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.WAKE_LOCK'
];
for (const p of perms) {
  if (!x.includes(p)) x = x.replace('</manifest>', `    <uses-permission android:name="${p}" />\n</manifest>`);
}
fs.writeFileSync(f, x);
console.log('AndroidManifest yeniləndi');

// Firebase: google-services.json faylını android/app/ qovluğuna köçür
// (Capacitor şablonu bu fayl olanda Google Services plaginini avtomatik qoşur)
if (fs.existsSync('google-services.json')) {
  fs.copyFileSync('google-services.json', 'android/app/google-services.json');
  console.log('google-services.json android/app/ qovluğuna köçürüldü');
}
