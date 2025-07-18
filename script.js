// Smooth scrolling for navigation links
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

// Modal functionality
const modal = document.getElementById('checkoutModal');
const selectedPlanInfo = document.getElementById('selectedPlanInfo');
let selectedPlan = null;

function selectPlan(planType) {
    selectedPlan = planType;
    
    // Plan details
    const plans = {
        start: {
            name: 'Старт',
            price: '₽599',
            data: '8 ГБ',
            period: '30 дней'
        },
        premium: {
            name: 'Премиум',
            price: '₽1299',
            data: '25 ГБ',
            period: '30 дней'
        }
    };
    
    const plan = plans[planType];
    
    // Update modal with selected plan info
    selectedPlanInfo.innerHTML = `
        <h3>Выбранный тариф: ${plan.name}</h3>
        <p><strong>Объем трафика:</strong> ${plan.data}</p>
        <p><strong>Срок действия:</strong> ${plan.period}</p>
        <p><strong>Стоимость:</strong> ${plan.price}</p>
    `;
    
    // Show modal
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Handle form submission
document.getElementById('checkoutForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    
    // Here you would normally send the data to your server
    // For demo purposes, we'll just show an alert
    alert(`Спасибо за заказ!\n\nМы отправим eSIM на email: ${email}\nТариф: ${selectedPlan === 'start' ? 'Старт (8 ГБ)' : 'Премиум (25 ГБ)'}\n\nВ ближайшее время с вами свяжется наш менеджер.`);
    
    // Close modal and reset form
    closeModal();
    this.reset();
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.plan-card, .step, .feature').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Add navbar background on scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
        navbar.style.backdropFilter = 'blur(10px)';
    } else {
        navbar.style.backgroundColor = 'var(--white)';
        navbar.style.backdropFilter = 'none';
    }
});