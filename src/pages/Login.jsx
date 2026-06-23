import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordField from '../components/PasswordField';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  if (user?.profileComplete || user?.role === 'admin') {
    navigate('/');
    return null;
  }
  if (user && !user.profileComplete) {
    navigate('/register?finish=1');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authLogin(login, password);
      if (data.user.role === 'admin' || data.user.profileComplete) {
        navigate('/');
      } else {
        navigate('/register?finish=1');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">S</span>
          <span className="auth-brand-name">Sokviek</span>
        </div>
        <h1>ເຂົ້າສູ່ລະບົບ</h1>
        <p className="auth-subtitle">ໃຊ້ Gmail ຫຼື ເບີໂທລະສັບ</p>

        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login">Gmail / ເບີໂທລະສັບ</label>
            <input
              id="login"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="example@gmail.com ຫຼື 0812345678"
              required
            />
          </div>
          <PasswordField
            id="password"
            label="ລະຫັດຜ່ານ"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ລະຫັດຜ່ານ"
            required
          />
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'ກຳລັງເຂົ້າສູ່ລະບົບ...' : 'ເຂົ້າສູ່ລະບົບ'}
          </button>
        </form>

        <p className="auth-footer">
          ຍັງບໍ່ມີບັນຊີ? <Link to="/register">ລົງທະບຽນ</Link>
        </p>
      </div>
    </div>
  );
}
