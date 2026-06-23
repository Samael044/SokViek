import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_LINKS } from '../config/demoUsers';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">S</span>
          Sokviek
        </Link>

        <div className="nav-links">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}

          {/* เมนู Admin แสดงใน Navbar โดยตรง */}
          {user?.role === 'admin' && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? 'nav-link active nav-link-admin' : 'nav-link nav-link-admin')}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/manage"
                className={({ isActive }) => (isActive ? 'nav-link active nav-link-admin' : 'nav-link nav-link-admin')}
              >
                ຈັດການຂໍ້ມູນພື້ນຖານ
              </NavLink>
            </>
          )}
        </div>

        <div className="nav-actions" ref={menuRef}>
          {user ? (
            <>
              <button
                type="button"
                className="profile-icon-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="ໂປຣໄຟລ໌"
              >
                {user.profile?.avatar || user.profile?.logo ? (
                  <img src={user.profile.avatar || user.profile.logo} alt="" className="profile-icon-img" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="profile-icon-svg">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </button>
              {menuOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <strong>
                      {user.role === 'company'
                        ? user.profile?.companyName
                        : `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.email}
                    </strong>
                    <small>
                      {user.role === 'admin' ? 'ຜູ້ດູແລລະບົບ' : user.role === 'company' ? 'ບໍລິສັດ' : 'ຜູ້ຊອກວຽກ'}
                    </small>
                  </div>
                  <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>ໂປຣໄຟລ໌</Link>
                  <button type="button" className="dropdown-item dropdown-logout" onClick={handleLogout}>ອອກຈາກລະບົບ</button>
                </div>
              )}
            </>
          ) : (
            <div className="nav-auth-buttons">
              <Link to="/login" className="btn btn-primary btn-sm">ເຂົ້າສູ່ລະບົບ</Link>
              <Link to="/register" className="btn btn-outline btn-sm">ລົງທະບຽນ</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
