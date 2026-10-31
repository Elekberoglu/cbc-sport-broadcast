/* Təkər tipli (wheel) saat seçici — 24 saat formatı (00–23 : 00–59).
   Siçan (təkərcik, sürüşdürmə, klik), toxunma və klaviatura ilə işləyir. */
(function (g) {
    'use strict';
    const ITEM = 40; // bir elementin hündürlüyü (px) — CSS ilə eyni olmalıdır
    const pad = n => String(n).padStart(2, '0');
    const VALID = /^([01]\d|2[0-3]):([0-5]\d)$/;

    function Wheel(el, values, onChange) {
        this.el = el; this.values = values; this.onChange = onChange;
        el.innerHTML = '<div class="tp-spacer"></div>' +
            values.map((v, i) => '<div class="tp-item" data-i="' + i + '">' + pad(v) + '</div>').join('') +
            '<div class="tp-spacer"></div>';
        this.items = Array.from(el.querySelectorAll('.tp-item'));
        this.index = 0; this.target = 0;
        let t = null;
        el.addEventListener('scroll', () => {
            this.mark(Math.round(el.scrollTop / ITEM));
            clearTimeout(t);
            t = setTimeout(() => this.snap(), 120);
        }, { passive: true });
        el.addEventListener('click', e => {
            const it = e.target.closest('.tp-item');
            if (it && !this.dragged) this.set(+it.dataset.i, true);
        });
        // Siçan təkərciyi: bir "notch" = bir addım; trackpad-in kiçik hərəkətləri toplanır
        let acc = 0;
        el.addEventListener('wheel', e => {
            e.preventDefault();
            const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
            let steps = 0;
            if (Math.abs(dy) >= 50) { steps = Math.sign(dy); acc = 0; }
            else { acc += dy; if (Math.abs(acc) >= 40) { steps = Math.sign(acc); acc = 0; } }
            if (steps) this.set(Math.max(0, Math.min(values.length - 1, this.target + steps)), false);
        }, { passive: false });
        el.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); this.set(Math.min(values.length - 1, this.target + 1), true); }
            if (e.key === 'ArrowUp') { e.preventDefault(); this.set(Math.max(0, this.target - 1), true); }
        });
        // Siçanla sürüşdürmə (toxunmada brauzerin öz sürüşdürməsi işləyir)
        let startY = 0, startTop = 0, down = false;
        el.addEventListener('pointerdown', e => {
            if (e.pointerType !== 'mouse') return;
            down = true; this.dragged = false; startY = e.clientY; startTop = el.scrollTop;
            el.setPointerCapture(e.pointerId);
            el.classList.add('dragging');
        });
        el.addEventListener('pointermove', e => {
            if (!down) return;
            const dy = e.clientY - startY;
            if (Math.abs(dy) > 3) this.dragged = true;
            el.scrollTop = startTop - dy;
        });
        const up = () => { if (!down) return; down = false; el.classList.remove('dragging'); this.snap(); setTimeout(() => { this.dragged = false; }, 0); };
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
    }
    Wheel.prototype.mark = function (i) {
        i = Math.max(0, Math.min(this.values.length - 1, i));
        if (i === this.index && this.items[i].classList.contains('on')) return;
        this.items.forEach((it, k) => it.classList.toggle('on', k === i));
        this.index = i;
        if (this.onChange) this.onChange();
    };
    Wheel.prototype.snap = function () {
        const i = Math.max(0, Math.min(this.values.length - 1, Math.round(this.el.scrollTop / ITEM)));
        if (Math.abs(this.el.scrollTop - i * ITEM) > 1) this.el.scrollTo({ top: i * ITEM, behavior: 'smooth' });
        this.target = i;
        this.mark(i);
    };
    Wheel.prototype.set = function (i, smooth) {
        this.target = i;
        this.el.scrollTo({ top: i * ITEM, behavior: smooth ? 'smooth' : 'auto' });
        this.mark(i);
    };
    Wheel.prototype.value = function () { return this.values[this.index]; };

    let wheels = null, current = null;
    const $ = id => document.getElementById(id);

    function ensure() {
        if (wheels) return;
        wheels = {
            h: new Wheel($('tp-h'), Array.from({ length: 24 }, (_, i) => i)),
            m: new Wheel($('tp-m'), Array.from({ length: 60 }, (_, i) => i))
        };
        $('tp-close').addEventListener('click', () => close());
        $('tp-ok').addEventListener('click', () => {
            const v = pad(wheels.h.value()) + ':' + pad(wheels.m.value());
            if (current) current.resolve(v);
            close(true);
        });
        $('tp-modal').addEventListener('click', e => { if (e.target.id === 'tp-modal') close(); });
    }
    function close(done) {
        const m = $('tp-modal');
        m.classList.add('hidden'); m.classList.remove('flex');
        if (current && done !== true) current.resolve(null);
        current = null;
    }
    /** Seçicini açır. Təsdiq edilsə "HH:MM", X ilə bağlansa null qaytarır. */
    function open(title, value) {
        ensure();
        $('tp-title').textContent = title || 'Saat';
        const m = $('tp-modal');
        m.classList.remove('hidden'); m.classList.add('flex');
        const mm = VALID.exec(value || '') || [null, '12', '00'];
        requestAnimationFrame(() => {
            wheels.h.set(+mm[1], false);
            wheels.m.set(+mm[2], false);
        });
        return new Promise(res => { current = { resolve: res }; });
    }
    /** Yazılmış mətni "HH:MM" formatına salır (məs. "1530" → "15:30", "930" → "09:30") */
    function mask(raw) {
        let d = String(raw || '').replace(/\D/g, '');
        if (d.length && +d[0] > 2) d = '0' + d;
        d = d.slice(0, 4);
        return d.length > 2 ? d.slice(0, 2) + ':' + d.slice(2) : d;
    }

    g.CBC = Object.assign(g.CBC || {}, { timePicker: { open, close, mask, isValid: v => VALID.test(v || ''), isOpen: () => !!current } });
})(window);
