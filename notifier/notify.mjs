// CBC Sport Broadcast — pulsuz push serveri (GitHub Actions, hər ~5 dəqiqə).
//
// Firestore-dakı schedules/* sənədlərini yoxlayır; son 24 saatda dərc olunmuş və hələ bildirişi
// göndərilməmiş hər versiya üçün (id + uploadedAt) işçilərə BİR dəfə FCM bildirişi göndərir.
// Kilid: notifications/{versiya} (Cloud Function variantı ilə eyni — ikisi birlikdə işləsə də təkrar olmur).
//
// Kimlik: GitHub OIDC → Google Workload Identity Federation → xidmət hesabı. Heç bir açar faylı yoxdur.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getAuth } from 'firebase-admin/auth';

const PROJECT_ID = 'cbc-sport-broadcast';
const TITLE = 'CBC Sport Broadcast';
const BODY = '📅 Həftəlik çəkiliş cədvəli yeniləndi';
const WINDOW_MS = 24 * 3600 * 1000;      // yalnız son 24 saatın dərcləri
const STALE_MS = 60 * 24 * 3600 * 1000;  // 60 gün aktiv olmayan cihazlar buraxılır
const APP_URL = 'https://elekberoglu.github.io/cbc-sport-broadcast/www/?view=week';

export async function run({ db, auth, messaging, now = Date.now(), log = console.log }) {
    const snap = await db.collection('schedules').get();
    const docs = [];
    snap.forEach(x => docs.push({ id: x.id, d: x.data() || {} }));
    let sent = 0;
    for (const { id, d } of docs) {
        if (!['main', 'operator'].includes(d.type) || !d.uploadedAt || !d.uploadedBy) continue;
        const ms = d.uploadedAt.toMillis();
        if (now - ms > WINDOW_MS) continue;
        const version = id + '_' + ms;
        const lock = db.collection('notifications').doc(version);

        // Yalnız admin dərci
        const uploader = await auth.getUser(d.uploadedBy).catch(() => null);
        if (!uploader || uploader.disabled || !uploader.customClaims || uploader.customClaims.admin !== true) {
            log('Admin olmayan yazı — keçildi: ' + id);
            continue;
        }
        try {
            await lock.create({ scheduleId: id, type: d.type, createdAt: FieldValue.serverTimestamp(), status: 'sending', via: 'github-actions' });
        } catch (e) {
            if (e.code === 6) continue; // artıq göndərilib (ALREADY_EXISTS)
            throw e;
        }
        const r = await sendToTeam({ db, auth, messaging, team: d.type === 'operator' ? 'operator' : 'sts', id, version, now });
        await lock.update(Object.assign({ status: 'sent', sentAt: FieldValue.serverTimestamp() }, r));
        log('Göndərildi: ' + version + ' → ' + JSON.stringify(r));
        sent++;
    }
    if (!sent) log('Yeni dərc yoxdur.');
    return sent;
}

async function sendToTeam({ db, auth, messaging, team, id, version, now }) {
    const snap = await db.collection('devices').where('team', '==', team).get();
    const rows = [], stale = [];
    snap.forEach(doc => {
        const v = doc.data() || {};
        const t = v.updatedAt && v.updatedAt.toMillis ? v.updatedAt.toMillis() : 0;
        if (!v.token || now - t > STALE_MS) { stale.push(doc.ref); return; }
        rows.push({ ref: doc.ref, uid: doc.id, token: v.token });
    });
    // Silinmiş və ya bloklanmış istifadəçilər bildiriş almasın
    const blocked = new Set();
    const uids = [...new Set(rows.map(r => r.uid))];
    for (let i = 0; i < uids.length; i += 100) {
        const res = await auth.getUsers(uids.slice(i, i + 100).map(uid => ({ uid })));
        res.notFound.forEach(x => blocked.add(x.uid));
        res.users.filter(u => u.disabled).forEach(u => blocked.add(u.uid));
    }
    const byToken = new Map(); // eyni telefon bir dəfə alsın
    rows.forEach(r => {
        if (blocked.has(r.uid)) { stale.push(r.ref); return; }
        if (!byToken.has(r.token)) byToken.set(r.token, []);
        byToken.get(r.token).push(r.ref);
    });
    const tokens = [...byToken.keys()];
    let success = 0, failure = 0;
    for (let i = 0; i < tokens.length; i += 500) {
        const batch = tokens.slice(i, i + 500);
        const res = await messaging.sendEachForMulticast({
            tokens: batch,
            notification: { title: TITLE, body: BODY },
            data: { type: 'schedule', scheduleId: id, version },
            android: { priority: 'high', notification: { channelId: 'schedule', tag: 'schedule-update' } },
            apns: { payload: { aps: { sound: 'default' } } },
            webpush: { headers: { Urgency: 'high' }, fcmOptions: { link: APP_URL } }
        });
        success += res.successCount;
        failure += res.failureCount;
        res.responses.forEach((r, k) => {
            const code = r.error && r.error.code;
            if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token' || code === 'messaging/invalid-argument') {
                (byToken.get(batch[k]) || []).forEach(ref => stale.push(ref));
            }
        });
    }
    for (let i = 0; i < stale.length; i += 400) {
        const w = db.batch();
        stale.slice(i, i + 400).forEach(ref => w.delete(ref));
        await w.commit();
    }
    return { team, devices: tokens.length, success, failure, removed: stale.length };
}

// Birbaşa işlədiləndə (GitHub Actions): node notify.mjs
if (import.meta.url === 'file://' + process.argv[1]) {
    initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
    run({ db: getFirestore(), auth: getAuth(), messaging: getMessaging() })
        .catch(e => { console.error(e); process.exit(1); });
}
