/* Bildirişlər: tətbiqdə Capacitor LocalNotifications, brauzerdə Notification API. */
(function (g) {
    'use strict';
    const C = g.CBC;
    const HOUR = 3600 * 1000;
    let webTimers = [];

    function plugin() {
        const cap = g.Capacitor;
        if (cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.LocalNotifications) return cap.Plugins.LocalNotifications;
        return null;
    }
    function isNative() { return !!plugin(); }

    async function requestPermission() {
        const LN = plugin();
        if (LN) {
            let st = await LN.checkPermissions();
            if (st.display !== 'granted') st = await LN.requestPermissions();
            if (st.display !== 'granted') return false;
            try {
                // Android 12+: dəqiq vaxtlı bildirişlər üçün icazə
                if (LN.checkExactNotificationSetting) {
                    const ex = await LN.checkExactNotificationSetting();
                    if (ex && ex.exact_alarm && ex.exact_alarm !== 'granted' && LN.changeExactNotificationSetting) await LN.changeExactNotificationSetting();
                }
            } catch (e) { /* iOS-da yoxdur */ }
            return true;
        }
        if (!('Notification' in g)) return false;
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') return false;
        return (await Notification.requestPermission()) === 'granted';
    }

    /** Siyahıdakı çəkilişlər üçün bildirişləri yenidən planlaşdırır. Növbəti bildirişin vaxtını qaytarır. */
    async function reschedule(shoots, enabled) {
        const now = Date.now();
        const items = [];
        if (enabled) {
            shoots.forEach(s => {
                const gt = C.dateTime(s.date, s.gather);
                if (!s.gather || !gt) return;
                const at = new Date(gt.getTime() - HOUR);
                if (at.getTime() <= now) return;
                const city = C.detectCity(s.venue).name;
                items.push({
                    id: C.hashInt(s.id + '|' + s.date + '|' + s.gather),
                    title: '⏰ Yığışmaya 1 saat qaldı',
                    body: s.match + ' · Yığışma ' + s.gather + (s.gatherNote ? ' ' + s.gatherNote : '') + ' · ' + city + (s.start ? ' · Başlama ' + s.start : ''),
                    at
                });
            });
        }
        items.sort((a, b) => a.at - b.at);

        const LN = plugin();
        if (LN) {
            try {
                const pend = await LN.getPending();
                if (pend && pend.notifications && pend.notifications.length) {
                    await LN.cancel({ notifications: pend.notifications.map(n => ({ id: n.id })) });
                }
                if (items.length) {
                    await LN.schedule({
                        notifications: items.slice(0, 60).map(n => ({
                            id: n.id, title: n.title, body: n.body,
                            schedule: { at: n.at, allowWhileIdle: true },
                            iconColor: '#2563eb'
                        }))
                    });
                }
            } catch (e) { console.warn('Bildiriş xətası', e); }
        } else {
            webTimers.forEach(clearTimeout);
            webTimers = [];
            if (enabled && 'Notification' in g && Notification.permission === 'granted') {
                items.filter(n => n.at - now < 24 * HOUR).forEach(n => {
                    webTimers.push(setTimeout(() => showWeb(n.title, n.body), n.at - now));
                });
            }
        }
        return items.length ? items[0].at : null;
    }

    // iPhone (ana ekrana əlavə edilmiş veb-tətbiq) bildirişi yalnız service worker vasitəsilə göstərir
    function showWeb(title, body) {
        const opts = { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' };
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(r => r.showNotification(title, opts)).catch(() => { try { new Notification(title, opts); } catch (e) { /* */ } });
        } else {
            try { new Notification(title, opts); } catch (e) { /* */ }
        }
    }

    async function sendTest() {
        const LN = plugin();
        if (LN) {
            await LN.schedule({ notifications: [{ id: 999, title: 'CBC Sport Broadcast', body: 'Bildirişlər işləyir ✅', schedule: { at: new Date(Date.now() + 3000) } }] });
        } else if ('Notification' in g && Notification.permission === 'granted') {
            showWeb('CBC Sport Broadcast', 'Bildirişlər işləyir ✅');
        }
    }

    g.CBC = Object.assign(g.CBC || {}, { notify: { isNative, requestPermission, reschedule, sendTest } });
})(window);
