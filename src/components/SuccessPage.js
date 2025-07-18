import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SuccessPage.css';

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const email = searchParams.get('email');
  const phone = searchParams.get('phone');

  useEffect(() => {
    if (!email || !phone) {
      navigate('/');
      return;
    }

    const fetchQRCode = async () => {
      try {
        const response = await axios.get('/.netlify/functions/get-qr', {
          params: { email, phone }
        });

        if (response.data.success) {
          setQrCode(response.data);
          setLoading(false);
        }
      } catch (err) {
        if (err.response?.status === 404 && retryCount < 10) {
          // QR code not ready yet, retry in 3 seconds
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 3000);
        } else {
          setError('Не удалось получить QR-код. Проверьте email.');
          setLoading(false);
        }
      }
    };

    fetchQRCode();
  }, [email, phone, navigate, retryCount]);

  const handleDownload = () => {
    if (qrCode?.qr_url) {
      const link = document.createElement('a');
      link.href = qrCode.qr_url;
      link.download = `esim-qr-${qrCode.id}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleNewPurchase = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="success-container">
        <div className="loading-card">
          <div className="spinner"></div>
          <h2>Обработка платежа...</h2>
          <p>Пожалуйста, подождите. Это может занять несколько секунд.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="success-container">
        <div className="error-card">
          <div className="error-icon">❌</div>
          <h2>Ошибка</h2>
          <p>{error}</p>
          <button onClick={handleNewPurchase} className="action-button">
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">✅</div>
        <h1>Спасибо за покупку!</h1>
        <p className="success-subtitle">
          Ваш eSIM готов к использованию
        </p>

        {qrCode && (
          <>
            <div className="qr-code-section">
              <img 
                src={qrCode.qr_url} 
                alt="eSIM QR Code" 
                className="qr-code-image"
              />
              <p className="qr-instruction">
                Отсканируйте этот QR-код на вашем устройстве для активации eSIM
              </p>
            </div>

            <div className="button-group">
              <button onClick={handleDownload} className="action-button primary">
                Скачать QR-код
              </button>
              <button onClick={handleNewPurchase} className="action-button secondary">
                Купить еще
              </button>
            </div>

            <div className="activation-steps">
              <h3>Как активировать eSIM:</h3>
              <ol>
                <li>
                  <strong>iPhone:</strong> Настройки → Сотовая связь → Добавить тарифный план → Использовать QR-код
                </li>
                <li>
                  <strong>Android:</strong> Настройки → Сеть и интернет → SIM-карты → Добавить → Сканировать QR-код
                </li>
                <li>
                  Убедитесь, что у вас есть стабильное подключение к Wi-Fi
                </li>
                <li>
                  После активации выберите eSIM для мобильных данных
                </li>
              </ol>
            </div>

            <div className="email-notice">
              <p>📧 QR-код также отправлен на email: <strong>{email}</strong></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SuccessPage;