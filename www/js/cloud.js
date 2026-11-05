/* Firebase bağlantısı: SDK-nın yüklənməsi, inisializasiya və anonim giriş.
   Tətbiqin qalan hissəsindən asılı deyil: internet yoxdursa və ya Firebase əlçatan
   deyilsə, tətbiq əvvəlki kimi yerli rejimdə işləməyə davam edir. */
(function (g) {
    'use strict';
    const status = { state: 'idle', uid: null, error: null, admin: false, email: '' };
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
            .then(res => { set('online', { uid: res.user.uid, error: null, admin: false }); refreshAdmin(res.user); return res; })
            .catch(err => {
                const msg = err && err.code ? err.code : (err && err.message) || String(err);
                set('error', { error: msg });
                readyPromise = null; // növbəti cəhddə yenidən yoxla
                throw err;
            });
        return readyPromise;
    }

    // ---------- Admin (e-poçt + şifrə) ----------
    // Admin hüququ serverdə Custom Claim ("admin": true) kimi təyin olunur (admin-tools/set-admin.mjs).
    // Buradakı yoxlama yalnız interfeysi göstərmək üçündür; əsl qoruma Firestore qaydalarındadır.
    let authMod = null;
    function mods() {
        const base = 'https://www.gstatic.com/firebasejs/' + (g.CBC_FIREBASE_SDK || '11.0.2') + '/';
        return import(base + 'firebase-auth.js').then(m => (authMod = m));
    }
    function checkAdmin(user) {
        if (!user || user.isAnonymous || typeof user.getIdTokenResult !== 'function') return Promise.resolve(false);
        return user.getIdTokenResult(true).then(t => !!(t && t.claims && t.claims.admin === true)).catch(() => false);
    }
    function refreshAdmin(user) {
        return checkAdmin(user).then(isAdm => {
            set(status.state, { admin: isAdm, email: isAdm ? (user.email || '') : '' });
            return isAdm;
        });
    }
    function backToAnonymous(auth) {
        return authMod.signOut(auth)
            .then(() => authMod.signInAnonymously(auth))
            .then(c => { set('online', { uid: c.user.uid, admin: false, email: '' }); return c.user; });
    }
    /** Admin girişi. Hüquq yoxdursa, anonim rejimə qayıdır və 'not-admin' xətası atır. */
    function adminSignIn(email, password) {
        return init().then(res => mods().then(() => authMod.signInWithEmailAndPassword(res.auth, email, password))
            .then(cred => checkAdmin(cred.user).then(isAdm => {
                if (!isAdm) {
                    return backToAnonymous(res.auth).then(() => { const e = new Error('not-admin'); e.code = 'cbc/not-admin'; throw e; });
                }
                set('online', { uid: cred.user.uid, admin: true, email: cred.user.email || '' });
                return cred.user;
            })));
    }
    function adminSignOut() {
        return init().then(res => mods().then(() => backToAnonymous(res.auth)));
    }

    // ---------- Firestore: paylaşılan qrafiklər ----------
    let dbPromise = null;
    function db() {
        if (dbPromise) return dbPromise;
        const base = 'https://www.gstatic.com/firebasejs/' + (g.CBC_FIREBASE_SDK || '11.0.2') + '/';
        dbPromise = init().then(res => import(base + 'firebase-firestore.js').then(fs => ({ fs, db: fs.getFirestore(res.app) })))
            .catch(e => { dbPromise = null; throw e; });
        return dbPromise;
    }
    const toMs = t => (t && typeof t.toMillis === 'function') ? t.toMillis() : (typeof t === 'number' ? t : 0);
    /** Bütün paylaşılan qrafikləri izləyir. cb([{id, type, period, fileName, total, uploadedAt, data}]) */
    function watchSchedules(cb, onErr) {
        let unsub = null, stopped = false;
        db().then(({ fs, db: d }) => {
            if (stopped) return;
            unsub = fs.onSnapshot(fs.collection(d, 'schedules'), snap => {
                const list = [];
                snap.forEach(x => { const v = x.data() || {}; list.push(Object.assign({}, v, { id: x.id, uploadedAt: toMs(v.uploadedAt) })); });
                cb(list);
            }, err => onErr && onErr(err));
        }).catch(err => onErr && onErr(err));
        return () => { stopped = true; if (unsub) unsub(); };
    }
    /** Qrafiki dərc edir / yeniləyir (yalnız admin; server qaydaları yoxlayır) */
    function publishSchedule(id, payload) {
        return db().then(({ fs, db: d }) => fs.setDoc(fs.doc(d, 'schedules', id), Object.assign({}, payload, {
            uploadedAt: fs.serverTimestamp(),
            uploadedBy: status.uid
        })));
    }
    function deleteSchedule(id) {
        return db().then(({ fs, db: d }) => fs.deleteDoc(fs.doc(d, 'schedules', id)));
    }


    // ---------- Push: cihaz tokeni (yalnız öz sənədini yaza/silə bilər, oxumaq olmaz) ----------
    function saveDevice(token, platform, team) {
        return db().then(({ fs, db: d }) => {
            if (!status.uid) throw new Error('no-user');
            return fs.setDoc(fs.doc(d, 'devices', status.uid), { token, platform, team: team === 'operator' ? 'operator' : 'sts', updatedAt: fs.serverTimestamp() });
        });
    }
    function deleteDevice() {
        return db().then(({ fs, db: d }) => status.uid ? fs.deleteDoc(fs.doc(d, 'devices', status.uid)) : null);
    }
    function app() { return init().then(r => r.app); }


    // ---------- Admin: ani bildiriş üçün GitHub tokeni (config/github — yalnız admin oxuya/yaza bilər) ----------
    function getGithubToken() {
        return db().then(({ fs, db: d }) => fs.getDoc(fs.doc(d, 'config', 'github'))).then(x => (x && x.exists() ? (x.data() || {}).token || '' : ''));
    }
    function setGithubToken(token) {
        return db().then(({ fs, db: d }) => token
            ? fs.setDoc(fs.doc(d, 'config', 'github'), { token, updatedAt: fs.serverTimestamp() })
            : fs.deleteDoc(fs.doc(d, 'config', 'github')));
    }

    g.CBC = Object.assign(g.CBC || {}, {
        cloud: {
            init,
            status: () => Object.assign({}, status),
            onStatus: fn => { listeners.push(fn); fn(Object.assign({}, status)); },
            adminSignIn, adminSignOut,
            watchSchedules, publishSchedule, deleteSchedule,
            saveDevice, deleteDevice, app,
            getGithubToken, setGithubToken
        }
    });
})(window);
