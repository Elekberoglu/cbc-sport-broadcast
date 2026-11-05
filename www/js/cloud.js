/* Firebase bağlantısı: SDK-nın yüklənməsi, inisializasiya və anonim giriş.
   Tətbiqin qalan hissəsindən asılı deyil: internet yoxdursa və ya Firebase əlçatan
   deyilsə, tətbiq əvvəlki kimi yerli rejimdə işləməyə davam edir. */
(function (g) {
    'use strict';
    const status = { state: 'idle', uid: null, error: null };
    const listeners = [];
    function set(state, extra) {
        Object.assign(status, { state }, extra || {});
        listeners.forEach(fn => { try { fn(Object.assign({}, status)); } catch (e) { /* */ } });
    }

    let readyPromise = null;
    /** Firebase-i yükləyir və anonim daxil olur. {app, auth, user} qaytarır və ya xəta atır. */
    function init() {
        if (readyPromise) return readyPromise;
        const cfg = g.CBC_FIREBASE_CONFIG;
        const v = g.CBC_FIREBASE_SDK || '11.0.2';
        if (!cfg || !cfg.apiKey || !cfg.projectId) {
            set('disabled', { error: 'Konfiqurasiya yoxdur' });
            return (readyPromise = Promise.reject(new Error('Firebase konfiqurasiyası yoxdur')));
        }
        set('connecting');
        const base = 'https://www.gstatic.com/firebasejs/' + v + '/';
        readyPromise = Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js')])
            .then(([appMod, authMod]) => {
                const conf = Object.assign({}, cfg);
                if (!conf.appId) delete conf.appId;
                const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(conf);
                const auth = authMod.getAuth(app);
                // Əvvəlki anonim sessiya telefonda saxlanılır: əvvəl onun bərpasını gözlə,
                // yoxdursa yeni anonim giriş et (hər açılışda yeni istifadəçi yaranmır)
                return auth.authStateReady()
                    .then(() => auth.currentUser || authMod.signInAnonymously(auth).then(c => c.user))
                    .then(user => ({ app, auth, user }));
            })
            .then(res => { set('online', { uid: res.user.uid, error: null }); return res; })
            .catch(err => {
                const msg = err && err.code ? err.code : (err && err.message) || String(err);
                set('error', { error: msg });
                readyPromise = null; // növbəti cəhddə yenidən yoxla
                throw err;
            });
        return readyPromise;
    }

    g.CBC = Object.assign(g.CBC || {}, {
        cloud: {
            init,
            status: () => Object.assign({}, status),
            onStatus: fn => { listeners.push(fn); fn(Object.assign({}, status)); }
        }
    });
})(window);
