/* Push bildirişləri (Firebase Cloud Messaging).
   - Android tətbiqi: @capacitor/push-notifications plagini (FCM tokeni).
   - iPhone (ana ekrana əlavə edilmiş veb-tətbiq, iOS 16.4+) və brauzer: FCM Web Push (VAPID açarı lazımdır).
   Token Firestore-da devices/{uid} sənədində saxlanılır; bildirişi yalnız server (Cloud Function) göndərir.
   Mövcud yığışma xatırlatmaları (notify.js) bu moduldan asılı deyil. */
(function (g) {
    'use strict';
    const C = g.CBC;
    const CHANNEL = 'schedule';
    let opts = { team: () => 'sts', onOpen: () => {}, onForeground: () => {} };
    let token = null, platform = null, savedFor = '';
    let nativeReady = false;

    function PN() {
        const cap = g.Capacitor;
        return cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.PushNotifications || null;
    }
    function LN() {
        const cap = g.Capacitor;
        return cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.LocalNotifications || null;
    }

    /** Tokeni cari istifadəçi (uid) və komanda ilə Firestore-a yazır; dəyişməyibsə təkrar yazmır */
    function save(force) {
        if (!token || !C.cloud) return Promise.resolve();
        const st = C.cloud.status();
        if (st.state !== 'online' || !st.uid) return Promise.resolve();
        const key = st.uid + '|' + token + '|' + opts.team();
        if (!force && key === savedFor) return Promise.resolve();
        return C.cloud.saveDevice(token, platform, opts.team())
            .then(() => { savedFor = key; })
            .catch(e => console.warn('Push token:', e && (e.code || e.message)));
    }

    function isScheduleData(d) { return d && d.type === 'schedule'; }

    // ---------- Android (Capacitor) ----------
    async function initNative(ask) {
        const P = PN();
        if (!P) return false;
        if (!nativeReady) {
            nativeReady = true;
            P.addListener('registration', t => { token = t.value; platform = 'android'; save(true); });
            P.addListener('registrationError', e => console.warn('FCM qeydiyyatı alınmadı', e));
            // Tətbiq açıq olanda Android bildirişi özü göstərmir — yerli bildiriş kimi göstəririk
            P.addListener('pushNotificationReceived', n => {
                const data = n.data || {};
                if (!isScheduleData(data)) return;
                opts.onForeground(data);
                const L = LN();
                if (L) L.schedule({ notifications: [{ id: 880000 + (Date.now() % 10000), title: n.title || 'CBC Sport Broadcast', body: n.body || '📅 Həftəlik çəkiliş cədvəli yeniləndi', channelId: CHANNEL, extra: data }] }).catch(() => {});
            });
            // Bildirişə toxunanda (tətbiq fonda və ya bağlı olsa da) həftəlik cədvəl açılır
            P.addListener('pushNotificationActionPerformed', a => { const d = (a && a.notification && a.notification.data) || {}; if (isScheduleData(d)) opts.onOpen(d); });
            const L = LN();
            if (L && L.addListener) L.addListener('localNotificationActionPerformed', a => { const d = (a && a.notification && a.notification.extra) || {}; if (isScheduleData(d)) opts.onOpen(d); });
            try { await P.createChannel({ id: CHANNEL, name: 'Cədvəl yenilənməsi', description: 'Admin həftəlik cədvəli yeniləyəndə', importance: 4, visibility: 1 }); } catch (e) { /* Android 8-dən köhnə */ }
        }
        let st = await P.checkPermissions();
        if (st.receive === 'prompt' || st.receive === 'prompt-with-rationale') {
            if (!ask) return false;
            st = await P.requestPermissions();
        }
        if (st.receive !== 'granted') return false;
        await P.register();
        return true;
    }

    // ---------- Veb / iPhone (FCM Web Push) ----------
    async function initWeb() {
        const vapidKey = g.CBC_FCM_VAPID_KEY;
        if (!vapidKey || !('serviceWorker' in navigator) || !('PushManager' in g) || !('Notification' in g)) return false;
        if (Notification.permission !== 'granted') return false; // icazə yalnız istifadəçi düyməyə toxunanda soruşulur (notify.js)
        const reg = await navigator.serviceWorker.ready;
        const base = 'https://www.gstatic.com/firebasejs/' + (g.CBC_FIREBASE_SDK || '11.0.2') + '/';
        const m = await import(base + 'firebase-messaging.js');
        if (m.isSupported && !(await m.isSupported())) return false;
        const messaging = m.getMessaging(await C.cloud.app());
        token = await m.getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });
        platform = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 'web';
        if (!initWeb.bound) {
            initWeb.bound = true;
            m.onMessage(messaging, p => { const d = p.data || {}; if (isScheduleData(d)) opts.onForeground(d); });
        }
        await save(true);
        return true;
    }

    /**
     * o.team: () => 'sts' | 'operator'
     * o.onOpen(data): bildirişə toxunanda
     * o.onForeground(data): tətbiq açıq ikən bildiriş gələndə
     * o.ask: Android-də icazəni soruşmaq olarmı
     */
    async function init(o) {
        opts = Object.assign(opts, o || {});
        try {
            if (PN()) return await initNative(!!opts.ask);
            if (C.cloud) { await C.cloud.init(); return await initWeb(); }
        } catch (e) { console.warn('Push:', e && (e.code || e.message)); }
        return false;
    }

    /** İstifadəçi çıxanda: bu cihaz artıq bildiriş almasın */
    async function unregister() {
        try { if (C.cloud && C.cloud.status().state === 'online') await C.cloud.deleteDevice(); } catch (e) { /* */ }
        savedFor = '';
        try {
            const P = PN();
            if (P && P.unregister) await P.unregister();
        } catch (e) { /* */ }
        token = null;
    }

    // Giriş dəyişəndə (anonim ↔ admin) tokeni yeni istifadəçiyə yaz
    if (C.cloud) C.cloud.onStatus(st => { if (st.state === 'online') save(); });

    g.CBC = Object.assign(g.CBC || {}, { push: { init, save: () => save(true), unregister, enableWeb: initWeb } });
})(window);
