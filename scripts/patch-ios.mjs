// Info.plist: Azərbaycan dili, şəkil seçimi üçün izah mətnləri
import fs from 'node:fs';
const f = 'ios/App/App/Info.plist';
let x = fs.readFileSync(f, 'utf8');
const add = {
  NSPhotoLibraryUsageDescription: 'Profil şəkli və qrafik şəkli seçmək üçün',
  NSCameraUsageDescription: 'Qrafikin şəklini çəkmək üçün',
  CFBundleDevelopmentRegion: 'az'
};
for (const [k, v] of Object.entries(add)) {
  if (x.includes(`<key>${k}</key>`)) continue;
  x = x.replace(/<dict>\s*/, m => `${m}<key>${k}</key>\n\t<string>${v}</string>\n\t`);
}
fs.writeFileSync(f, x);
console.log('Info.plist yeniləndi');
