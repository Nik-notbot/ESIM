import { useState } from "react";
import { useAdmin } from "../context/AdminContext";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const { isAdmin, login, logout } = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate("/");
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (isAdmin) {
    return (
      <div className="admin-page">
        <h1>Админка</h1>
        <p>✅ Ты авторизован. Copy Page теперь доступен на страницах статей.</p>
        <button onClick={logout} className="admin-btn">
          Выйти
        </button>
        <button onClick={() => navigate("/")} className="admin-btn secondary">
          На главную
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1>Вход</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Пароль"
          className="admin-input"
          autoFocus
        />
        <button type="submit" className="admin-btn">
          Войти
        </button>
        {error && <p className="admin-error">Неверный пароль</p>}
      </form>
    </div>
  );
}
