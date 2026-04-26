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
})();
