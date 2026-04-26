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

    // ---- Rent picker (two-column list: services + countries) ----
    const RENT_SERVICES = [
        { id: 'telegram',  name: 'Telegram',    icon: '\u2708\uFE0F',     desc: 'Регистрация и 2FA' },
        { id: 'whatsapp',  name: 'WhatsApp',    icon: '\uD83D\uDCF1',     desc: 'Новый аккаунт' },
        { id: 'google',    name: 'Google',      icon: '\uD83D\uDD0D',     desc: 'Gmail и сервисы' },
        { id: 'instagram', name: 'Instagram',   icon: '\uD83D\uDCF7',     desc: 'Регистрация аккаунта' },
        { id: 'facebook',  name: 'Facebook',    icon: '\uD83D\uDC64',     desc: 'Аккаунт и Messenger' },
        { id: 'tiktok',    name: 'TikTok',      icon: '\uD83C\uDFB5',     desc: 'Новый профиль' },
        { id: 'discord',   name: 'Discord',     icon: '\uD83C\uDFAE',     desc: 'Регистрация' },
        { id: 'twitter',   name: 'Twitter / X', icon: '\uD83D\uDC26',     desc: 'Новый аккаунт' },
        { id: 'amazon',    name: 'Amazon',      icon: '\uD83D\uDCE6',     desc: 'Аккаунт покупателя' },
        { id: 'microsoft', name: 'Microsoft',   icon: '\uD83E\uDE9F',     desc: 'Outlook и Xbox' },
        { id: 'steam',     name: 'Steam',       icon: '\uD83C\uDFAE',     desc: 'Игровой аккаунт' },
        { id: 'snapchat',  name: 'Snapchat',    icon: '\uD83D\uDC7B',     desc: 'Новый профиль' },
        { id: 'linkedin',  name: 'LinkedIn',    icon: '\uD83D\uDCBC',     desc: 'Бизнес-профиль' },
        { id: 'apple',     name: 'Apple ID',    icon: '\uD83C\uDF4E',     desc: 'iCloud и App Store' },
        { id: 'chatgpt',   name: 'ChatGPT',     icon: '\uD83E\uDD16',     desc: 'OpenAI аккаунт' }
    ];
    const RENT_COUNTRIES = [
        { id: 'us', name: 'США',            flag: '\uD83C\uDDFA\uD83C\uDDF8', code: '+1',  desc: 'Высокая проходимость' },
        { id: 'uk', name: 'Великобритания', flag: '\uD83C\uDDEC\uD83C\uDDE7', code: '+44', desc: 'Европейский номер' }
    ];
    const RENT_PRICES = {
        telegram:  { us: 15, uk: 25 },
        whatsapp:  { us: 20, uk: 30 },
        google:    { us: 12, uk: 18 },
        instagram: { us: 15, uk: 22 },
        facebook:  { us: 10, uk: 20 },
        tiktok:    { us: 18, uk: 25 },
        discord:   { us: 12, uk: 18 },
        twitter:   { us: 15, uk: 22 },
        amazon:    { us: 10, uk: 15 },
        microsoft: { us: 12, uk: 18 },
        steam:     { us:  8, uk: 12 },
        snapchat:  { us: 15, uk: 22 },
        linkedin:  { us: 20, uk: 28 },
        apple:     { us: 25, uk: 35 },
        chatgpt:   { us: 18, uk: 25 }
    };

    function fmtPrice(n) { return n + '\u00A0₽'; }

    function initRentPicker(root) {
        const isFull = root.dataset.variant === 'full';
        const svcListEl  = root.querySelector('[data-svc-list]');
        const ctryListEl = root.querySelector('[data-country-list]');
        const searchEl   = root.querySelector('[data-svc-search]');
        const priceEl    = root.querySelector('[data-rent-price]');
        const ctaEl      = root.querySelector('[data-rent-cta]');
        const comboName  = root.querySelector('[data-combo-name]');
        const comboIcon  = root.querySelector('[data-combo-icon]');
        const comboFlag  = root.querySelector('[data-combo-flag]');

        const params = new URLSearchParams(window.location.search);
        const urlSvc = params.get('service');
        const urlCtry = params.get('country');
        const state = {
            service: (urlSvc && RENT_PRICES[urlSvc]) ? urlSvc : 'telegram',
            country: 'us',
            query: ''
        };
        if (urlCtry && RENT_PRICES[state.service][urlCtry] !== undefined) state.country = urlCtry;

        function renderServices() {
            const q = state.query.trim().toLowerCase();
            const filtered = RENT_SERVICES.filter(s =>
                !q || s.name.toLowerCase().indexOf(q) !== -1
                   || s.desc.toLowerCase().indexOf(q) !== -1
                   || s.id.indexOf(q) !== -1
            );
            if (!filtered.length) {
                svcListEl.innerHTML = '<div class="svc-empty">Сервис не найден</div>';
                return;
            }
            svcListEl.innerHTML = filtered.map(s => {
                const price = RENT_PRICES[s.id][state.country];
                const active = s.id === state.service ? ' active' : '';
                const desc = isFull ? '<span class="svc-row-desc">' + escapeHtml(s.desc) + '</span>' : '';
                return '<button class="svc-row' + active + '" type="button" role="option" aria-selected="' + (active ? 'true' : 'false') + '" data-svc="' + s.id + '">' +
                    '<span class="svc-row-icon" aria-hidden="true">' + s.icon + '</span>' +
                    '<span class="svc-row-body"><span class="svc-row-name">' + escapeHtml(s.name) + '</span>' + desc + '</span>' +
                    '<span class="svc-row-price">' + price + '\u00A0₽</span>' +
                '</button>';
            }).join('');
        }

        function renderCountries() {
            ctryListEl.innerHTML = RENT_COUNTRIES.map(c => {
                const active = c.id === state.country ? ' active' : '';
                const desc = isFull ? '<span class="ctry-row-desc">' + escapeHtml(c.desc) + '</span>' : '';
                return '<button class="ctry-row' + active + '" type="button" role="option" aria-selected="' + (active ? 'true' : 'false') + '" data-ctry="' + c.id + '">' +
                    '<span class="ctry-row-flag" aria-hidden="true">' + c.flag + '</span>' +
                    '<span class="ctry-row-body"><span class="ctry-row-name">' + escapeHtml(c.name) + '</span>' + desc + '</span>' +
                    '<span class="ctry-row-code">' + c.code + '</span>' +
                '</button>';
            }).join('');
        }

        function renderResult(animate) {
            const svc = RENT_SERVICES.find(s => s.id === state.service);
            const ctry = RENT_COUNTRIES.find(c => c.id === state.country);
            const price = RENT_PRICES[state.service][state.country];

            if (comboIcon) comboIcon.textContent = svc.icon;
            if (comboFlag) comboFlag.textContent = ctry.flag;
            if (comboName) comboName.textContent = svc.name + ' • ' + ctry.name;

            if (priceEl) {
                const write = () => { priceEl.textContent = fmtPrice(price); };
                if (animate) {
                    priceEl.classList.add('is-fading');
                    setTimeout(() => { write(); priceEl.classList.remove('is-fading'); }, 150);
                } else {
                    write();
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
        }

        if (searchEl) {
            searchEl.addEventListener('input', e => {
                state.query = e.target.value;
                renderServices();
            });
        }

        svcListEl.addEventListener('click', e => {
            const row = e.target.closest('[data-svc]');
            if (!row || state.service === row.dataset.svc) return;
            state.service = row.dataset.svc;
            renderServices();
            renderResult(true);
        });

        ctryListEl.addEventListener('click', e => {
            const row = e.target.closest('[data-ctry]');
            if (!row || state.country === row.dataset.ctry) return;
            state.country = row.dataset.ctry;
            renderCountries();
            renderServices();
            renderResult(true);
        });

        const form = root.querySelector('[data-rent-form]');
        if (form && isFull) {
            form.addEventListener('submit', e => {
                e.preventDefault();
                const input = form.querySelector('input[type="email"]');
                const email = ((input && input.value) || '').trim();
                if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    if (input) {
                        input.focus();
                        input.style.borderColor = '#ef4444';
                        setTimeout(() => { input.style.borderColor = ''; }, 1400);
                    }
                    return;
                }
                const svc = RENT_SERVICES.find(s => s.id === state.service);
                const ctry = RENT_COUNTRIES.find(c => c.id === state.country);
                const price = RENT_PRICES[state.service][state.country];
                const order = 'SO-' + Date.now().toString(36).toUpperCase();
                const qs = new URLSearchParams({
                    country: state.country,
                    type: 'rent',
                    tariff: state.service,
                    tariffName: svc.name + ' (' + ctry.name + ')',
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

        renderServices();
        renderCountries();
        renderResult(false);
    }

    document.querySelectorAll('[data-rent-picker]').forEach(initRentPicker);
})();
