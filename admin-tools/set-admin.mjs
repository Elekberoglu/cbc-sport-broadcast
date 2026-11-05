#!/usr/bin/env node
// CBC Sport Broadcast — admin hüququnu (Custom Claim "admin": true) SERVER tərəfdə təyin edir.
//
// Yalnız etibarlı mühitdə işlədin (öz kompüteriniz və ya Google Cloud Shell).
// Bu fayl tətbiqə (www/) və APK-ya daxil deyil. Xidmət hesabı açarı (JSON) heç vaxt
// layihə qovluğuna, GitHub-a və ya tətbiqə qoyulmamalıdır.
//
// İstifadə:
//   node set-admin.mjs show   <UID>    # istifadəçini və mövcud claim-ləri göstər
//   node set-admin.mjs grant  <UID>    # admin hüququ ver
//   node set-admin.mjs revoke <UID>    # admin hüququnu geri al (sessiyalar da bağlanır)
//
// Kimlik məlumatı (biri kifayətdir):
//   a) Google Cloud Shell: heç nə lazım deyil (layihə sahibinin hesabı istifadə olunur)
//   b) Kompüter: GOOGLE_APPLICATION_CREDENTIALS=<layihədən KƏNARDA saxlanan açar.json>

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import path from 'node:path';
import fs from 'node:fs';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const PROJECT_ID = 'cbc-sport-broadcast';
const [cmd, uid] = process.argv.slice(2);

function die(msg) { console.error('✖ ' + msg); process.exit(1); }

if (!['show', 'grant', 'revoke'].includes(cmd) || !uid) {
    die('İstifadə: node set-admin.mjs <show|grant|revoke> <UID>');
}
if (!/^[A-Za-z0-9]{20,128}$/.test(uid)) die('UID formatı düzgün deyil: ' + uid);

// Təhlükəsizlik: açar faylı layihə qovluğunun içindədirsə, işləmə (təsadüfən GitHub-a yüklənə bilər)
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (keyPath) {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const abs = path.resolve(keyPath);
    const norm = p => process.platform === 'win32' ? p.toLowerCase() : p;
    if (norm(abs) === norm(repoRoot) || norm(abs).startsWith(norm(repoRoot) + path.sep)) {
        die('Açar faylı layihə qovluğundadır: ' + abs + '\n  Onu layihədən kənara köçürün (məs. Sənədlər qovluğuna) və yenidən işlədin.');
    }
    if (!fs.existsSync(abs)) die('Açar faylı tapılmadı: ' + abs);
}

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const auth = getAuth();

let user;
try {
    user = await auth.getUser(uid);
} catch (e) {
    die('İstifadəçi tapılmadı (' + (e.code || e.message) + '). UID-i Firebase Console → Authentication → Users bölməsindən yoxlayın.');
}

const claims = user.customClaims || {};
const providers = user.providerData.map(p => p.providerId).join(', ') || 'anonim';
console.log('Layihə   : ' + PROJECT_ID);
console.log('UID      : ' + user.uid);
console.log('E-poçt   : ' + (user.email || '—') + (user.emailVerified ? ' (təsdiqlənib)' : ''));
console.log('Giriş    : ' + providers + (user.disabled ? ' · BLOKLANIB' : ''));
console.log('Claim-lər: ' + JSON.stringify(claims));

if (cmd === 'show') process.exit(0);

if (cmd === 'grant') {
    if (!user.email || !user.providerData.some(p => p.providerId === 'password')) {
        die('Bu hesab e-poçt/şifrə hesabı deyil. Admin yalnız e-poçt/şifrə hesabı ola bilər.');
    }
    if (claims.admin === true) { console.log('✔ Artıq admindir — dəyişiklik edilmədi.'); process.exit(0); }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question('\n' + (cmd === 'grant' ? 'ADMIN HÜQUQU VERİLSİN' : 'ADMIN HÜQUQU GERİ ALINSIN') + ' → ' + (user.email || uid) + ' ? Təsdiq üçün "bəli" yazın: ');
rl.close();
if (!/^(bəli|beli|yes)$/i.test(answer.trim())) die('Ləğv edildi.');

const next = Object.assign({}, claims);
if (cmd === 'grant') next.admin = true; else delete next.admin;
await auth.setCustomUserClaims(uid, Object.keys(next).length ? next : null);
if (cmd === 'revoke') await auth.revokeRefreshTokens(uid); // köhnə tokenlər dərhal etibarsız olsun

const after = (await auth.getUser(uid)).customClaims || {};
console.log('✔ Yeniləndi. Claim-lər: ' + JSON.stringify(after));
console.log(cmd === 'grant'
    ? '  Tətbiqdə "Admin girişi" ilə yenidən daxil olun (köhnə sessiya varsa, çıxıb yenidən girin).'
    : '  Admin bütün cihazlarda yenidən daxil olmağa məcbur olacaq və hüququ olmayacaq.');
