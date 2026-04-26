/* ==========================================================================
   SimOn — общий скрипт
   Меню, FAQ, карусель, табы, формы, success
   ========================================================================== */

(function () {
    'use strict';

    // ---- Mobile menu ----
    const burger = document.querySelector('.burger');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeBtn = document.querySelector('.mobile-menu-close');

    function openMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
    }
    if (burger) burger.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    }

    // ---- FAQ accordion ----
    document.querySelectorAll('.faq-item').forEach(item => {
        const q = item.querySelector('.faq-q');
        if (!q) return;
        q.addEventListener('click', () => {
            const wasOpen = item.classList.contains('open');
            // Закрываем все в той же группе
            const siblings = item.parentElement
                ? item.parentElement.querySelectorAll('.faq-item')
                : [];
            siblings.forEach(s => s.classList.remove('open'));
            if (!wasOpen) item.classList.add('open');
        });
    });

    // ---- Tabs ----
    document.querySelectorAll('[data-tabs]').forEach(group => {
        const tabs = group.querySelectorAll('.tab');
        const groupName = group.getAttribute('data-tabs');
        const panels = document.querySelectorAll(`[data-tab-panel="${groupName}"]`);

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.toggle('active', t === tab));
                panels.forEach(p => p.classList.toggle('active', p.getAttribute('data-tab') === target));
            });
        });
    });

    // ---- Reviews carousel ----
    const reviewsTrack = document.querySelector('.reviews-track');
    if (reviewsTrack) {
        const prev = document.querySelector('[data-reviews="prev"]');
        const next = document.querySelector('[data-reviews="next"]');
        const scrollByCard = (dir) => {
            const card = reviewsTrack.querySelector('.review');
            const step = card ? card.offsetWidth + 20 : 380;
            reviewsTrack.scrollBy({ left: dir * step, behavior: 'smooth' });
        };
        if (prev) prev.addEventListener('click', () => scrollByCard(-1));
        if (next) next.addEventListener('click', () => scrollByCard(1));

        let auto = setInterval(() => {
            const max = reviewsTrack.scrollWidth - reviewsTrack.clientWidth;
            if (reviewsTrack.scrollLeft >= max - 10) {
                reviewsTrack.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                scrollByCard(1);
            }
        }, 5000);
        reviewsTrack.addEventListener('mouseenter', () => clearInterval(auto));
    }

    // ---- Order form (rent / eSIM) ----
    document.querySelectorAll('[data-order-form]').forEach(form => {
        const country = form.getAttribute('data-country') || '';
        const type = form.getAttribute('data-type') || 'esim';

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const checked = form.querySelector('input[name="tariff"]:checked, input[name="service"]:checked');
            if (!checked) {
                alert('Выберите тариф или сервис');
                return;
            }
            const emailInput = form.querySelector('input[type="email"]');
            const email = emailInput ? emailInput.value.trim() : '';
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                if (emailInput) emailInput.focus();
                alert('Введите корректный email');
                return;
            }

            const tariff = checked.value;
            const tariffName = checked.getAttribute('data-name') || tariff;
            const price = checked.getAttribute('data-price') || '';
            const order = 'SO-' + Date.now().toString(36).toUpperCase();

            // В реальной системе здесь должен быть запрос к платёжному API.
            // Сейчас имитируем переход на success.html с query.
            const params = new URLSearchParams({
                country: country,
                type: type,
                tariff: tariff,
                tariffName: tariffName,
                price: price,
                email: email,
                order: order,
                paid: '1'
            });

            const btn = form.querySelector('button[type="submit"]');
            if (btn) { btn.disabled = true; btn.textContent = 'Перенаправляем на оплату…'; }

            setTimeout(() => {
                window.location.href = 'success.html?' + params.toString();
            }, 600);
        });
    });

    // ---- Success page ----
    if (document.body.classList.contains('page-success')) {
        renderSuccess();
    }

    function renderSuccess() {
        const params = new URLSearchParams(window.location.search);
        const paid = params.get('paid');
        const root = document.getElementById('successRoot');
        if (!root) return;

        const country = params.get('country') || '';
        const type = params.get('type') || 'esim';
        const tariff = params.get('tariff') || '';
        const tariffName = params.get('tariffName') || tariff;
        const price = params.get('price') || '';
        const email = params.get('email') || '';
        const order = params.get('order') || '';

        if (paid !== '1') {
            root.innerHTML = `
                <div class="success-card">
                    <div class="success-icon error">
                        <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                    <h1>Оплата не прошла</h1>
                    <p class="lead">Не удалось подтвердить оплату. Попробуйте ещё раз или напишите в поддержку — поможем.</p>
                    <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                        <a href="index.html" class="btn btn-primary">На главную</a>
                        <a href="https://t.me/simon_support" target="_blank" rel="noopener" class="btn btn-tg">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/></svg>
                            Поддержка
                        </a>
                    </div>
                </div>`;
            return;
        }

        const isRent = type === 'rent';
        const titleHtml = isRent ? 'Номер выдан' : 'Оплата успешна';
        const leadHtml = isRent
            ? 'Ваш виртуальный номер активен. Используйте его для регистрации в выбранном сервисе.'
            : 'Спасибо за заказ! QR-код для активации eSIM отправлен на email и доступен ниже.';

        const orderRows = [
            ['Номер заказа', order],
            ['Email', email],
            ['Тариф', tariffName],
            ['Сумма', price ? price + ' ₽' : '—'],
            country ? ['Страна', countryLabel(country)] : null
        ].filter(Boolean).map(r => `
            <div class="order-info-row">
                <span>${r[0]}</span>
                <span>${escapeHtml(String(r[1]))}</span>
            </div>`).join('');

        const middleHtml = isRent ? renderNumberBlock(country) : renderQrBlock(email);

        const instrHtml = isRent ? rentInstructions() : esimInstructions();

        root.innerHTML = `
            <div class="success-card">
                <div class="success-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h1>${titleHtml}</h1>
                <p class="lead">${leadHtml}</p>

                <div class="order-info">${orderRows}</div>

                ${middleHtml}

                ${instrHtml}

                <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                    <a href="index.html" class="btn btn-ghost">На главную</a>
                    <a href="https://t.me/simon_support" target="_blank" rel="noopener" class="btn btn-tg">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/></svg>
                        Поддержка
                    </a>
                </div>
            </div>`;

        // Copy number button
        const copyBtn = root.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const num = copyBtn.getAttribute('data-num');
                if (!num) return;
                navigator.clipboard.writeText(num).then(() => {
                    copyBtn.classList.add('copied');
                    copyBtn.querySelector('.copy-label').textContent = 'Скопировано';
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        copyBtn.querySelector('.copy-label').textContent = 'Скопировать';
                    }, 1800);
                });
            });
        }
    }

    function renderNumberBlock(country) {
        const code = country === 'us' ? '+1 415 ' : country === 'uk' ? '+44 7700 ' : '+1 ';
        const num = code + Math.floor(100000 + Math.random() * 899999);
        return `
            <div class="number-block">
                <div class="label">Ваш номер</div>
                <div class="num">${num}</div>
                <button class="copy-btn" data-num="${num.replace(/\s/g, '')}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span class="copy-label">Скопировать</span>
                </button>
            </div>`;
    }

    function renderQrBlock(email) {
        // Demo QR (placeholder data)
        const data = encodeURIComponent('LPA:1$rsp.simon-esim.com$' + (email || 'demo').slice(0, 20));
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${data}`;
        return `
            <div class="qr-block"><img src="${qrUrl}" alt="QR-код активации eSIM" width="220" height="220"></div>
            <p class="qr-caption">Сканируйте код камерой телефона или отсканируйте из настроек eSIM</p>`;
    }

    function rentInstructions() {
        return `
            <div class="instr-block">
                <h3>Как использовать номер</h3>
                <ol>
                    <li>Откройте приложение или сайт сервиса (Telegram, WhatsApp и т.д.)</li>
                    <li>Введите выданный номер на этапе регистрации или входа</li>
                    <li>Запросите SMS-код — он придёт на этот номер в личном кабинете SimOn</li>
                    <li>Введите полученный код в приложении сервиса</li>
                </ol>
            </div>`;
    }

    function esimInstructions() {
        return `
            <div class="instr-block">
                <h3>Как активировать eSIM</h3>
                <ol>
                    <li>Откройте Настройки → Сотовая связь → Добавить тариф (Add eSIM)</li>
                    <li>Выберите «Использовать QR-код» и наведите камеру на код выше</li>
                    <li>Дайте eSIM имя и подтвердите установку</li>
                    <li>Включите передачу данных по новому профилю — готово</li>
                </ol>
            </div>`;
    }

    function countryLabel(c) {
        const map = { us: 'США', uk: 'Великобритания', fi: 'Финляндия', eu: 'Евросоюз' };
        return map[c] || c.toUpperCase();
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    }

    // ---- Rent matrix selector (mini on index, full builder on rent.html) ----
    const RENT_PRICES = {
        telegram: { us: 15, uk: 25 },
        whatsapp: { us: 20, uk: 30 },
        facebook: { us: 10, uk: 20 }
    };
    const RENT_SERVICE_NAMES = { telegram: 'Telegram', whatsapp: 'WhatsApp', facebook: 'Facebook' };
    const RENT_COUNTRY_NAMES = { us: 'США', uk: 'Великобритания' };
    const RENT_FLAGS = {
        us: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" fill="#B22234"/><g fill="#fff"><rect y="5" width="60" height="4"/><rect y="14" width="60" height="4"/><rect y="23" width="60" height="4"/><rect y="32" width="60" height="4"/><rect y="41" width="60" height="4"/><rect y="50" width="60" height="4"/></g><rect width="26" height="32" fill="#3C3B6E"/></svg>',
        uk: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" fill="#012169"/><path d="M0,0 L60,60 M60,0 L0,60" stroke="#fff" stroke-width="12"/><path d="M30,0 v60 M0,30 h60" stroke="#fff" stroke-width="20"/><path d="M30,0 v60 M0,30 h60" stroke="#C8102E" stroke-width="12"/></svg>'
    };
    const RENT_SERVICE_ICONS = {
        telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.04 14.68 8.7 19.4c.5 0 .72-.21.98-.47l2.36-2.25 4.88 3.57c.9.5 1.55.24 1.78-.83l3.22-15.1c.32-1.39-.5-1.93-1.38-1.6L1.27 9.46c-1.34.52-1.32 1.27-.23 1.6l4.95 1.55 11.5-7.25c.54-.36 1.03-.16.63.2"/></svg>',
        whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.36-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>',
        facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>'
    };
    const RENT_SERVICE_COLORS = { telegram: '#229ED9', whatsapp: '#25D366', facebook: '#1877F2' };

    function fmtPrice(n) { return n + '\u00A0₽'; }

    function initRentSelector(root, opts) {
        const isMini = opts.mini === true;
        const params = new URLSearchParams(window.location.search);
        const initialService = (params.get('service') && RENT_PRICES[params.get('service')]) ? params.get('service') : 'telegram';
        const initialCountry = (params.get('country') && RENT_PRICES[initialService][params.get('country')] !== undefined) ? params.get('country') : 'us';
        const state = { service: initialService, country: initialCountry };

        const priceEl  = root.querySelector(isMini ? '[data-rent-price]'        : '[data-builder-price]');
        const ctaEl    = root.querySelector(isMini ? '[data-rent-cta]'          : '[data-builder-cta]');
        const comboEl  = root.querySelector(isMini ? '[data-rent-combo-name]'   : '[data-builder-combo-name]');
        const flagEl   = root.querySelector(isMini ? '[data-rent-flag]'         : '[data-builder-flag]');
        const svcIconEl= root.querySelector(isMini ? '[data-rent-service-icon]' : '[data-builder-service-icon]');
        const stickyEl = document.querySelector('[data-rent-sticky]');

        function renderActive() {
            root.querySelectorAll('[data-service]').forEach(b => b.classList.toggle('active', b.dataset.service === state.service));
            root.querySelectorAll('[data-country]').forEach(b => b.classList.toggle('active', b.dataset.country === state.country));
        }

        function renderResult(animate) {
            const price = RENT_PRICES[state.service][state.country];

            if (svcIconEl) {
                svcIconEl.innerHTML = RENT_SERVICE_ICONS[state.service];
                svcIconEl.style.color = RENT_SERVICE_COLORS[state.service];
            }
            if (flagEl) flagEl.innerHTML = RENT_FLAGS[state.country];
            if (comboEl) comboEl.textContent = RENT_SERVICE_NAMES[state.service] + ' • ' + RENT_COUNTRY_NAMES[state.country];

            if (priceEl) {
                const writePrice = () => { priceEl.textContent = fmtPrice(price); };
                if (animate) {
                    priceEl.classList.add('is-fading');
                    setTimeout(() => {
                        writePrice();
                        priceEl.classList.remove('is-fading');
                    }, 150);
                } else {
                    writePrice();
                }
            }

            if (ctaEl) {
                if (ctaEl.tagName === 'A') {
                    ctaEl.setAttribute('href', 'rent.html?service=' + state.service + '&country=' + state.country);
                    ctaEl.textContent = 'Получить номер — ' + fmtPrice(price);
                } else {
                    ctaEl.textContent = 'Оплатить ' + fmtPrice(price);
                }
            }

            if (stickyEl && !isMini) stickyEl.textContent = 'Оплатить ' + fmtPrice(price);
        }

        root.querySelectorAll('[data-service]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (state.service === btn.dataset.service) return;
                state.service = btn.dataset.service;
                renderActive();
                renderResult(true);
            });
        });
        root.querySelectorAll('[data-country]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (state.country === btn.dataset.country) return;
                state.country = btn.dataset.country;
                renderActive();
                renderResult(true);
            });
        });

        if (stickyEl && !isMini) {
            stickyEl.addEventListener('click', (e) => {
                e.preventDefault();
                const form = root.querySelector('[data-rent-builder-form]');
                if (!form) return;
                const input = form.querySelector('input[type="email"]');
                form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (input) setTimeout(() => input.focus(), 400);
            });
        }

        const form = root.querySelector('[data-rent-builder-form]');
        if (form && !isMini) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = form.querySelector('input[type="email"]');
                const email = (input && input.value || '').trim();
                if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    if (input) {
                        input.focus();
                        input.style.borderColor = '#ef4444';
                        setTimeout(() => { input.style.borderColor = ''; }, 1400);
                    }
                    return;
                }
                const price = RENT_PRICES[state.service][state.country];
                const order = 'SO-' + Date.now().toString(36).toUpperCase();
                const qs = new URLSearchParams({
                    country: state.country,
                    type: 'rent',
                    tariff: state.service,
                    tariffName: RENT_SERVICE_NAMES[state.service] + ' (' + RENT_COUNTRY_NAMES[state.country] + ')',
                    price: String(price),
                    email: email,
                    order: order,
                    paid: '1'
                });
                const btn = form.querySelector('button[type="submit"]');
                if (btn) { btn.disabled = true; btn.textContent = 'Перенаправляем на оплату…'; }
                setTimeout(() => { window.location.href = 'success.html?' + qs.toString(); }, 600);
            });
        }

        renderActive();
        renderResult(false);
    }

    document.querySelectorAll('[data-rent-mini]').forEach(root => initRentSelector(root, { mini: true }));
    document.querySelectorAll('[data-rent-builder]').forEach(root => initRentSelector(root, { mini: false }));
})();
