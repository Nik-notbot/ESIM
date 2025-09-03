// Плавная прокрутка для навигационных ссылок
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Анимация элементов при скролле
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Добавляем анимацию появления для элементов
document.addEventListener('DOMContentLoaded', () => {
    // Анимация для карточек преимуществ
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Анимация для карточек тарифов
    const planCards = document.querySelectorAll('.plan-card');
    planCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease ${index * 0.2}s`;
        observer.observe(card);
    });

    // Анимация для шагов
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.style.opacity = '0';
        step.style.transform = 'translateY(30px)';
        step.style.transition = `all 0.6s ease ${index * 0.15}s`;
        observer.observe(step);
    });
    
    // Анимация для контейнера отзывов
    const reviewsContainer = document.querySelector('.reviews-container');
    if (reviewsContainer) {
        reviewsContainer.style.opacity = '0';
        reviewsContainer.style.transform = 'translateY(30px)';
        reviewsContainer.style.transition = 'all 0.6s ease';
        observer.observe(reviewsContainer);
    }
});

// Добавляем класс при скролле для навбара
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
    }
    
    lastScroll = currentScroll;
});

// Эффект параллакса для hero секции (только для hero, не для features)
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    const heroRect = hero ? hero.getBoundingClientRect() : null;
    
    // Применяем параллакс только если hero секция видна
    if (hero && heroContent && heroRect && heroRect.bottom > 0) {
        const heroScrolled = Math.max(0, scrolled);
        hero.style.transform = `translateY(${heroScrolled * 0.5}px)`;
        heroContent.style.transform = `translateY(${heroScrolled * 0.2}px)`;
        heroContent.style.opacity = Math.max(0.3, 1 - (heroScrolled * 0.001));
    }
});

// Анимация счетчика для данных
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Запускаем анимацию счетчика при появлении в viewport
const dataAmounts = document.querySelectorAll('.data-amount');
dataAmounts.forEach(amount => {
    const value = parseInt(amount.textContent);
    amount.textContent = '0';
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.textContent === '0') {
                animateValue(entry.target, 0, value, 1000);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counterObserver.observe(amount);
});

// Добавляем эффект при наведении на кнопки
document.querySelectorAll('.buy-button, .cta-button').forEach(button => {
    button.addEventListener('mouseenter', function(e) {
        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.5)';
        ripple.style.width = '0';
        ripple.style.height = '0';
        ripple.style.opacity = '1';
        ripple.style.transition = 'all 0.5s ease-out';
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.style.width = size * 2 + 'px';
            ripple.style.height = size * 2 + 'px';
            ripple.style.marginLeft = -size + 'px';
            ripple.style.marginTop = -size + 'px';
            ripple.style.opacity = '0';
        }, 10);
        
        setTimeout(() => {
            ripple.remove();
        }, 500);
    });
});

// Слайдер отзывов
let currentReview = 1;
const totalReviews = 5;

function showReview(reviewNumber) {
    // Скрываем все отзывы
    document.querySelectorAll('.review-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Убираем активный класс у всех точек
    document.querySelectorAll('.dot').forEach(dot => {
        dot.classList.remove('active');
    });
    
    // Показываем выбранный отзыв
    const selectedReview = document.querySelector(`[data-review="${reviewNumber}"]`);
    if (selectedReview) {
        selectedReview.classList.add('active');
    }
    
    // Активируем соответствующую точку
    const dots = document.querySelectorAll('.dot');
    if (dots[reviewNumber - 1]) {
        dots[reviewNumber - 1].classList.add('active');
    }
    
    currentReview = reviewNumber;
}

function changeReview(direction) {
    let newReview = currentReview + direction;
    
    // Циклический переход
    if (newReview > totalReviews) {
        newReview = 1;
    } else if (newReview < 1) {
        newReview = totalReviews;
    }
    
    showReview(newReview);
}

function goToReview(reviewNumber) {
    showReview(reviewNumber);
}

// Автоматическая смена отзывов каждые 5 секунд
let autoplayInterval = setInterval(() => {
    changeReview(1);
}, 5000);

// Останавливаем автопрокрутку при взаимодействии
document.querySelector('.reviews-container').addEventListener('mouseenter', () => {
    clearInterval(autoplayInterval);
});

// Возобновляем автопрокрутку после ухода курсора
document.querySelector('.reviews-container').addEventListener('mouseleave', () => {
    autoplayInterval = setInterval(() => {
        changeReview(1);
    }, 5000);
});

// Поддержка свайпов на мобильных устройствах
let touchStartX = 0;
let touchEndX = 0;

document.querySelector('.reviews-slider').addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.querySelector('.reviews-slider').addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
        changeReview(1); // Свайп влево - следующий отзыв
    }
    if (touchEndX > touchStartX + 50) {
        changeReview(-1); // Свайп вправо - предыдущий отзыв
    }
}

// ========== ИНТЕГРАЦИЯ С ПЛАТЕЖНОЙ СИСТЕМОЙ ==========

// Инициализация Supabase (если доступен)
let supabase = null;
if (typeof window.supabase !== 'undefined' && typeof config !== 'undefined') {
    try {
        supabase = window.supabase.createClient(config.supabase.url, config.supabase.anonKey);
    } catch (error) {
        console.warn('Supabase initialization failed:', error);
    }
}

// Загрузка и настройка тарифов
async function setupPlans() {
    if (!supabase) {
        console.warn('Supabase not initialized. Using demo mode.');
        setupBuyButtonsDemo();
        return;
    }
    
    try {
        const { data: plans, error } = await supabase
            .from('plans')
            .select('*')
            .order('data_amount', { ascending: true });
            
        if (error) throw error;
        
        const planCards = document.querySelectorAll('.plan-card');
        planCards.forEach((card, index) => {
            if (plans[index]) {
                const buyButton = card.querySelector('.buy-button');
                if (buyButton) {
                    buyButton.setAttribute('data-plan-id', plans[index].id);
                    buyButton.setAttribute('data-plan-name', plans[index].name);
                    buyButton.setAttribute('data-plan-amount', plans[index].data_amount);
                    buyButton.setAttribute('data-plan-price', plans[index].price_rub);
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading plans:', error);
        setupBuyButtonsDemo();
        return;
    }
    
    setupBuyButtons();
}

// Настройка кнопок покупки в демо-режиме
function setupBuyButtonsDemo() {
    const planCards = document.querySelectorAll('.plan-card');
    planCards.forEach((card, index) => {
        const buyButton = card.querySelector('.buy-button');
        if (buyButton) {
            const planName = card.querySelector('.plan-name')?.textContent || 'План';
            const dataAmount = card.querySelector('.data-amount')?.textContent || '0';
            buyButton.setAttribute('data-plan-id', `demo-${index + 1}`);
            buyButton.setAttribute('data-plan-name', planName);
            buyButton.setAttribute('data-plan-amount', dataAmount);
        }
    });
    setupBuyButtons();
}

// Настройка обработчиков кнопок покупки
function setupBuyButtons() {
    document.querySelectorAll('.buy-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const planId = this.getAttribute('data-plan-id');
            const planName = this.getAttribute('data-plan-name');
            const planAmount = this.getAttribute('data-plan-amount');
            const planPrice = this.getAttribute('data-plan-price');
            
            if (planId) {
                // Переходим на страницу оплаты с параметрами
                const params = new URLSearchParams({
                    plan: planId,
                    name: planName || '',
                    amount: planAmount || '',
                    price: planPrice || ''
                });
                window.location.href = `/payment.html?${params.toString()}`;
            }
        });
    });
    
    // Обработка кнопки CTA в hero секции
    document.querySelectorAll('.cta-button[href="#plans"]').forEach(button => {
        // Кнопка уже имеет плавную прокрутку, дополнительная логика не нужна
    });
}

// Запускаем настройку планов при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPlans);
} else {
    setupPlans();
}

// Добавляем загрузку Supabase SDK, если его еще нет
if (typeof window.supabase === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = function() {
        // Перезапускаем настройку после загрузки SDK
        if (typeof config !== 'undefined') {
            supabase = window.supabase.createClient(config.supabase.url, config.supabase.anonKey);
            setupPlans();
        }
    };
    document.head.appendChild(script);
}