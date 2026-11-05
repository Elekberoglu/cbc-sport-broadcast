// Firestore qaydalarının testi (Firebase Emulator ilə, real layihəyə toxunmur).
// İşlətmək: cd admin-tools && npm install && npm run test:rules
// Tələb: firebase-tools (npm i -g firebase-tools) və Java 11+.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const ID = 'main_2026-11-02_2026-11-08';
let env;

const valid = uid => ({
    type: 'main', period: ['2026-11-02', '2026-11-08'], fileName: 'Qrafik.xlsx', total: 3,
    data: JSON.stringify({ shoots: [{ date: '2026-11-02' }], people: {} }),
    uploadedAt: serverTimestamp(), uploadedBy: uid
});

before(async () => {
    env = await initializeTestEnvironment({
        projectId: 'demo-cbc',
        firestore: { rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') }
    });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async ctx => {
        await setDoc(doc(ctx.firestore(), 'schedules', ID), Object.assign(valid('seed'), { uploadedAt: new Date() }));
    });
});

const admin = () => env.authenticatedContext('adminUid', { admin: true, firebase: { sign_in_provider: 'password' } }).firestore();
const worker = () => env.authenticatedContext('anonUid', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const guest = () => env.unauthenticatedContext().firestore();

test('işçi (anonim) qrafikləri oxuya bilir', async () => {
    await assertSucceeds(getDoc(doc(worker(), 'schedules', ID)));
    await assertSucceeds(getDocs(collection(worker(), 'schedules')));
});
test('giriş etməmiş oxuya bilmir', async () => {
    await assertFails(getDoc(doc(guest(), 'schedules', ID)));
});
test('işçi yaza, yeniləyə, silə bilmir', async () => {
    await assertFails(setDoc(doc(worker(), 'schedules', 'main_2026-11-09_2026-11-15'), valid('anonUid')));
    await assertFails(setDoc(doc(worker(), 'schedules', ID), valid('anonUid')));
    await assertFails(deleteDoc(doc(worker(), 'schedules', ID)));
});
test('admin claim-i olmayan e-poçt hesabı yaza bilmir', async () => {
    const db = env.authenticatedContext('XnDKUJBTdvZN2lW5lnAD3cvDy7q1', { firebase: { sign_in_provider: 'password' } }).firestore();
    await assertFails(setDoc(doc(db, 'schedules', ID), valid('XnDKUJBTdvZN2lW5lnAD3cvDy7q1')));
});
test('admin yükləyə, yeniləyə, silə bilir', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'schedules', 'main_2026-11-09_2026-11-15'), valid('adminUid')));
    await assertSucceeds(setDoc(doc(admin(), 'schedules', ID), valid('adminUid')));
    await assertSucceeds(deleteDoc(doc(admin(), 'schedules', ID)));
});
test('admin də yanlış formatda yaza bilmir', async () => {
    await assertFails(setDoc(doc(admin(), 'schedules', 'istenilen-ad'), valid('adminUid')));
    await assertFails(setDoc(doc(admin(), 'schedules', ID), Object.assign(valid('adminUid'), { uploadedBy: 'baskasi' })));
    await assertFails(setDoc(doc(admin(), 'schedules', ID), Object.assign(valid('adminUid'), { extra: 1 })));
    await assertFails(setDoc(doc(admin(), 'schedules', ID), Object.assign(valid('adminUid'), { type: 'diger' })));
    await assertFails(setDoc(doc(admin(), 'schedules', ID), Object.assign(valid('adminUid'), { uploadedAt: new Date(0) })));
});
test('başqa kolleksiyalar bağlıdır', async () => {
    await assertFails(setDoc(doc(admin(), 'users', 'x'), { a: 1 }));
    await assertFails(getDoc(doc(worker(), 'users', 'x')));
    assert.ok(true);
});

const dev = { token: 'fcm-token-ABCDEFGHIJKLMNOPQRSTUVWXYZ', platform: 'android', team: 'sts', updatedAt: serverTimestamp() };
test('işçi yalnız öz cihaz tokenini yaza/silə bilir', async () => {
    await assertSucceeds(setDoc(doc(worker(), 'devices', 'anonUid'), dev));
    await assertSucceeds(deleteDoc(doc(worker(), 'devices', 'anonUid')));
    await assertFails(setDoc(doc(worker(), 'devices', 'baskaUid'), dev));
    await assertFails(setDoc(doc(worker(), 'devices', 'anonUid'), Object.assign({}, dev, { team: 'admin' })));
    await assertFails(setDoc(doc(worker(), 'devices', 'anonUid'), Object.assign({}, dev, { extra: 1 })));
    await assertFails(setDoc(doc(guest(), 'devices', 'anonUid'), dev));
});
test('cihaz tokenlərini heç kim oxuya bilmir (admin də)', async () => {
    await assertFails(getDoc(doc(worker(), 'devices', 'anonUid')));
    await assertFails(getDocs(collection(admin(), 'devices')));
});
test('notifications kolleksiyası bağlıdır', async () => {
    await assertFails(getDoc(doc(admin(), 'notifications', 'x')));
    await assertFails(setDoc(doc(admin(), 'notifications', 'x'), { a: 1 }));
});
