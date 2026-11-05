/* CBC Sport Broadcast — Cloud Function: cədvəl dərc olunanda push bildirişi.
 *
 * İşləmə qaydası:
 *  - Firestore-da schedules/{id} sənədi yazılanda (yalnız uğurla yadda saxlanmış yazı triggeri işə salır;
 *    təsdiqlənməmiş/uğursuz yükləmələr Firestore-a düşmür, deməli bildiriş də getmir).
 *  - Silinmə bildiriş göndərmir.
 *  - Yazan hesabın serverdə admin claim-i yoxlanılır.
 *  - Eyni versiya üçün (id + uploadedAt) yalnız BİR bildiriş: notifications/{versiya} sənədi create() ilə kilid kimi.
 *  - Göndərilən: yalnız həmin komandanın (STS və ya Operator) cihazları; 60 gündən köhnə, silinmiş və ya
 *    bloklanmış istifadəçilərin tokenləri buraxılır və silinir.
 */
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { getAuth } = require('firebase-admin/auth');

initializeApp();

// Firestore bazasının yerləşdiyi regiona uyğun olmalıdır (Firestore → Database → "Location").
// eur3 (Avropa) → 'europe-west1'; nam5 (ABŞ) → 'us-central1'.
const REGION = 'europe-west1';

const TITLE = 'CBC Sport Broadcast';
const BODY = '📅 Həftəlik çəkiliş cədvəli yeniləndi';
const STALE_MS = 60 * 24 * 3600 * 1000;
const APP_URL = 'https://elekberoglu.github.io/cbc-sport-broadcast/www/?view=week';

exports.notifyScheduleUpdate = onDocumentWritten({ document: 'schedules/{scheduleId}', region: REGION, retry: false }, async event => {
    const after = event.data && event.data.after;
    if (!after || !after.exists) return; // silinmə → bildiriş yoxdur
    const d = after.data() || {};
    const id = event.params.scheduleId;
    if (!['main', 'operator'].includes(d.type) || !d.uploadedAt || !d.uploadedBy) return;

    // Yalnız admin dərci (qaydalar onsuz da yoxlayır; bu ikinci qoruma xəttidir)
    const uploader = await getAuth().getUser(d.uploadedBy).catch(() => null);
    if (!uploader || uploader.disabled || !uploader.customClaims || uploader.customClaims.admin !== true) {
        logger.warn('Admin olmayan yazı, bildiriş göndərilmədi', { id, by: d.uploadedBy });
        return;
    }

    // Təkrarın qarşısı: hər versiya üçün bir dəfə
    const version = id + '_' + d.uploadedAt.toMillis();
    const db = getFirestore();
    const lock = db.collection('notifications').doc(version);
    try {
        await lock.create({ scheduleId: id, type: d.type, createdAt: FieldValue.serverTimestamp(), status: 'sending' });
    } catch (e) {
        if (e.code === 6) { logger.info('Artıq göndərilib', { version }); return; } // ALREADY_EXISTS
        throw e;
    }

    const team = d.type === 'operator' ? 'operator' : 'sts';
    const snap = await db.collection('devices').where('team', '==', team).get();
    const now = Date.now();
    const rows = [];
    const stale = [];
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
        const res = await getAuth().getUsers(uids.slice(i, i + 100).map(uid => ({ uid })));
        res.notFound.forEach(x => blocked.add(x.uid));
        res.users.filter(u => u.disabled).forEach(u => blocked.add(u.uid));
    }
    const byToken = new Map(); // eyni cihaz (məs. anonim → admin) bir dəfə alsın
    rows.forEach(r => {
        if (blocked.has(r.uid)) { stale.push(r.ref); return; }
        if (!byToken.has(r.token)) byToken.set(r.token, []);
        byToken.get(r.token).push(r.ref);
    });

    const tokens = [...byToken.keys()];
    let success = 0, failure = 0;
    for (let i = 0; i < tokens.length; i += 500) {
        const batch = tokens.slice(i, i + 500);
        const res = await getMessaging().sendEachForMulticast({
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
    // Etibarsız / köhnə tokenləri təmizlə
    for (let i = 0; i < stale.length; i += 400) {
        const w = db.batch();
        stale.slice(i, i + 400).forEach(ref => w.delete(ref));
        await w.commit();
    }
    await lock.update({ status: 'sent', devices: tokens.length, success, failure, removed: stale.length, sentAt: FieldValue.serverTimestamp() });
    logger.info('Cədvəl bildirişi göndərildi', { version, team, devices: tokens.length, success, failure });
});
