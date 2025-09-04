// Временное хранилище QR-кодов для тестирования
// В продакшене это должно быть в базе данных

const QR_CODES = {
  // QR-коды для тарифа "Стандарт" (plan_id: 1)
  "1": [
    // Добавьте сюда ваши реальные QR-коды для тарифа Стандарт
    // Пример:
    // {
    //   id: "qr_std_001",
    //   url: "https://i.ibb.co/TxNLKx3x/qr-esim-standard.png",
    //   used: false
    // }
  ],
  // QR-коды для тарифа "Премиум" (plan_id: 2)
  "2": [
    // Добавьте сюда ваши реальные QR-коды для тарифа Премиум
    // Пример:
    // {
    //   id: "qr_prm_001",
    //   url: "https://i.ibb.co/ABC123/qr-esim-premium.png",
    //   used: false
    // }
  ]
};

// Функция для получения свободного QR-кода
function getAvailableQRCode(planId) {
  const planCodes = QR_CODES[planId] || [];
  const availableCode = planCodes.find(code => !code.used);
  
  if (availableCode) {
    // Помечаем как использованный
    availableCode.used = true;
    // В localStorage сохраняем состояние
    localStorage.setItem('qr_codes_state', JSON.stringify(QR_CODES));
    return availableCode;
  }
  
  return null;
}

// Загружаем сохраненное состояние при инициализации
if (typeof window !== 'undefined') {
  const savedState = localStorage.getItem('qr_codes_state');
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      Object.assign(QR_CODES, state);
    } catch (e) {
      console.error('Error loading QR codes state:', e);
    }
  }
}