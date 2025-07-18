import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import './CheckoutForm.css';

const CheckoutForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('start');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/.netlify/functions/create-invoice', {
        email: data.email,
        phone: data.phone,
        plan: selectedPlan
      });

      if (response.data.success && response.data.invoice_url) {
        // Redirect to payment page
        window.location.href = response.data.invoice_url;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Произошла ошибка. Попробуйте позже.');
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <h1>HEY, ESIM!</h1>
        <p className="subtitle">Быстрый интернет по всему миру</p>

        <form onSubmit={handleSubmit(onSubmit)} className="checkout-form">
          {/* Plan Selection */}
          <div className="plan-selection">
            <h3>Выберите тариф:</h3>
            <div className="plan-options">
              <label className={`plan-option ${selectedPlan === 'start' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="start"
                  checked={selectedPlan === 'start'}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                />
                <div className="plan-details">
                  <h4>Старт</h4>
                  <p className="plan-data">8 ГБ</p>
                  <p className="plan-price">₽599</p>
                </div>
              </label>

              <label className={`plan-option ${selectedPlan === 'premium' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="premium"
                  checked={selectedPlan === 'premium'}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                />
                <div className="plan-details">
                  <h4>Премиум</h4>
                  <p className="plan-data">25 ГБ</p>
                  <p className="plan-price">₽1299</p>
                </div>
              </label>
            </div>
          </div>

          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="your@email.com"
              {...register('email', {
                required: 'Email обязателен',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Неверный формат email'
                }
              })}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && (
              <span className="error-message">{errors.email.message}</span>
            )}
          </div>

          {/* Phone Input */}
          <div className="form-group">
            <label htmlFor="phone">Телефон</label>
            <input
              type="tel"
              id="phone"
              placeholder="+7 (999) 123-45-67"
              {...register('phone', {
                required: 'Телефон обязателен',
                pattern: {
                  value: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/,
                  message: 'Неверный формат телефона'
                }
              })}
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && (
              <span className="error-message">{errors.phone.message}</span>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-alert">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Обработка...' : 'Купить'}
          </button>
        </form>

        <div className="info-section">
          <h3>Как это работает?</h3>
          <ol>
            <li>Заполните форму и нажмите "Купить"</li>
            <li>Оплатите заказ удобным способом</li>
            <li>Получите QR-код для активации eSIM</li>
            <li>Отсканируйте код на своем устройстве</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;