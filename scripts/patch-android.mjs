// AndroidManifest.xml-ə dəqiq vaxtlı bildiriş icazələrini əlavə edir
import fs from 'node:fs';
const f = 'android/app/src/main/AndroidManifest.xml';
let x = fs.readFileSync(f, 'utf8');
const perms = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.SCHEDULE_EXACT_ALARM',
  // Android 13+: dəqiq vaxtlı xatırlatma icazəsi avtomatik verilir (Android 14-də SCHEDULE_EXACT_ALARM standart olaraq bağlıdır)
  'android.permission.USE_EXACT_ALARM',
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

// Versiya: hər yığımın versionCode-u əvvəlkindən böyük olmalıdır, yoxsa bəzi telefonlar (məs. Honor)
// "artıq quraşdırılıb" deyib yeniləməni quraşdırmır. versionName = package.json versiyası.
{
  const g = 'android/app/build.gradle';
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const [ma, mi, pa] = String(pkg.version).split('.').map(n => parseInt(n, 10) || 0);
  const run = parseInt(process.env.GITHUB_RUN_NUMBER || '0', 10);
  // məs. 2.4.3 + 75-ci yığım → 2040375 (versiya artanda və hər yeni yığımda böyüyür)
  const code = (ma * 10000 + mi * 100 + pa) * 1000 + (run % 1000);
  let b = fs.readFileSync(g, 'utf8');
  b = b.replace(/versionCode\s+\d+/, 'versionCode ' + code).replace(/versionName\s+"[^"]*"/, 'versionName "' + pkg.version + '"');
  fs.writeFileSync(g, b);
  console.log('Android versiyası: ' + pkg.version + ' (' + code + ')');
}
