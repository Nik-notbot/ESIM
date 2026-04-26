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
    // Brand SVG paths — sourced from Simple Icons (simpleicons.org), all viewBox="0 0 24 24"
    const RENT_ICONS = {
        telegram:  'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zM17.18 7.46c.16-.01.51.04.74.22.16.13.2.3.22.42.02.12.04.4.02.62-.22 2.31-1.17 7.92-1.66 10.51-.2 1.1-.6 1.46-.99 1.5-.85.07-1.49-.56-2.31-1.1-1.29-.84-2.02-1.36-3.27-2.18-1.45-.95-.51-1.47.32-2.32.21-.22 3.96-3.63 4.03-3.94.01-.04.02-.18-.07-.26-.09-.07-.21-.05-.31-.03-.13.03-2.18 1.39-6.17 4.07-.58.4-1.11.6-1.59.59-.52-.01-1.53-.3-2.27-.55-.92-.3-1.65-.46-1.59-.97.03-.27.4-.54 1.1-.82 4.32-1.88 7.21-3.13 8.65-3.74 4.12-1.71 4.97-2.01 5.53-2.02z',
        whatsapp:  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.36-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z',
        google:    'M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z',
        instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
        facebook:  'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647z',
        tiktok:    'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
        discord:   'M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z',
        twitter:   'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
        amazon:    'M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-.99.654-1.184.708-2.51 1.26-3.99 1.65-1.48.39-2.92.59-4.32.59-2.16 0-4.21-.37-6.14-1.13-1.93-.76-3.66-1.83-5.18-3.2-.09-.075-.15-.15-.18-.22 0-.04.01-.08.04-.13zm6.215-6.71c0-1.13.27-2.1.84-2.91.56-.81 1.34-1.42 2.34-1.85.91-.39 2.02-.66 3.34-.83.45-.06 1.18-.13 2.19-.22v-.42c0-1.06-.12-1.78-.35-2.14-.36-.5-.92-.74-1.68-.74h-.21c-.55.05-1.03.23-1.43.53-.4.32-.66.74-.76 1.3-.06.35-.24.55-.51.6L7.1 5.4c-.34-.07-.5-.27-.5-.6 0-.06 0-.13.03-.21.27-1.46 1-2.55 2.18-3.25 1.18-.7 2.55-1.07 4.1-1.13h.65c1.99 0 3.55.51 4.66 1.55.17.18.32.36.45.55l.39.66.18.42c.15.42.24.86.27 1.32l.04 1.46v4.16l.06.84c.04.27.13.46.26.6.13.13.32.21.5.21.07 0 .14-.01.21-.03l.36-.13c.16-.06.31-.1.46-.1.45 0 .67.31.67.92 0 .27-.07.55-.21.84-.13.27-.31.55-.55.85-.85 1.04-1.95 1.55-3.32 1.55-.79 0-1.48-.21-2.07-.62-.59-.42-1.04-.97-1.34-1.66-.71.7-1.46 1.21-2.27 1.55-.81.34-1.79.51-2.93.51-1.21 0-2.21-.34-2.99-1.04-.78-.7-1.18-1.7-1.18-3.01zm3.85-.45c0 .61.15 1.1.46 1.46.31.36.74.55 1.27.55l.21-.01c.14 0 .25-.01.34-.02.62-.21 1.1-.59 1.43-1.13.16-.27.27-.55.34-.86.07-.31.11-.69.11-1.16v-.55c-.94 0-1.66.06-2.16.21-1.34.35-2 1.18-2 2.51zm10.755 7.65c.06-.09.17-.18.31-.27.93-.62 1.83-1.05 2.7-1.27.43-.11.86-.18 1.27-.21l.25-.01c.65-.04 1.27.04 1.81.24.18.04.34.13.46.21.06.05.09.13.09.21v.31c0 .69-.07 1.42-.21 2.18-.13.78-.34 1.51-.63 2.21-.06.18-.18.34-.36.45-.06.04-.12.06-.18.06-.04 0-.09 0-.13-.03-.13-.06-.16-.18-.09-.36.83-1.95 1.24-3.31 1.24-4.07 0-.24-.04-.42-.13-.51-.21-.27-.81-.39-1.79-.39-.36 0-.79.04-1.27.07-.55.06-1.04.13-1.51.21-.13.05-.21.05-.27.05-.07 0-.12-.05-.13-.07-.04-.06-.04-.13.04-.21z',
        microsoft: 'M11.4 24H0V12.6h11.4zM24 24H12.6V12.6H24zM11.4 11.4H0V0h11.4zM24 11.4H12.6V0H24z',
        steam:     'M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.122-1.377-1.383c-.624-.26-1.29-.249-1.878-.06l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z',
        snapchat:  'M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.39-1.333.854-.09.24-.061.55.12.939l.015.014c.06.135 1.526 3.39 4.71 3.917.255.044.435.27.42.526 0 .074-.015.149-.045.225-.24.569-1.273.988-3.156 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.12-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.255.165-.485.42-.526 3.187-.524 4.65-3.78 4.71-3.918l.016-.029c.18-.39.224-.71.119-.94-.195-.464-.884-.72-1.332-.853-.121-.029-.24-.075-.345-.12-1.107-.434-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.226-3.642.303-4.84C7.794 1.1 11.009.792 11.96.792l.421-.015h.029z',
        linkedin:  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
        apple:     'M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z',
        chatgpt:   'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997z'
    };

    function svcIconSvg(id) {
        const path = RENT_ICONS[id];
        if (!path) return '';
        return '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="' + path + '"/></svg>';
    }

    const RENT_SERVICES = [
        { id: 'telegram',  name: 'Telegram',    desc: 'Регистрация и 2FA' },
        { id: 'whatsapp',  name: 'WhatsApp',    desc: 'Новый аккаунт' },
        { id: 'google',    name: 'Google',      desc: 'Gmail и сервисы' },
        { id: 'instagram', name: 'Instagram',   desc: 'Регистрация аккаунта' },
        { id: 'facebook',  name: 'Facebook',    desc: 'Аккаунт и Messenger' },
        { id: 'tiktok',    name: 'TikTok',      desc: 'Новый профиль' },
        { id: 'discord',   name: 'Discord',     desc: 'Регистрация' },
        { id: 'twitter',   name: 'Twitter / X', desc: 'Новый аккаунт' },
        { id: 'amazon',    name: 'Amazon',      desc: 'Аккаунт покупателя' },
        { id: 'microsoft', name: 'Microsoft',   desc: 'Outlook и Xbox' },
        { id: 'steam',     name: 'Steam',       desc: 'Игровой аккаунт' },
        { id: 'snapchat',  name: 'Snapchat',    desc: 'Новый профиль' },
        { id: 'linkedin',  name: 'LinkedIn',    desc: 'Бизнес-профиль' },
        { id: 'apple',     name: 'Apple ID',    desc: 'iCloud и App Store' },
        { id: 'chatgpt',   name: 'ChatGPT',     desc: 'OpenAI аккаунт' }
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
                    '<span class="svc-row-icon" aria-hidden="true">' + svcIconSvg(s.id) + '</span>' +
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

            if (comboIcon) comboIcon.innerHTML = svcIconSvg(svc.id);
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
                    ctaEl.setAttribute('href', '/rent?service=' + state.service + '&country=' + state.country);
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
