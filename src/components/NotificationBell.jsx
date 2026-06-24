import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { IconBell } from './Icons';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || user.role === 'admin') return null;

  return (
    <div
      className="notification-bell-container"
      ref={dropdownRef}
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
    >
      <button
        className="btn-icon"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          fontSize: '1.2rem',
          padding: '0.25rem',
        }}
        aria-label="Notifications"
      >
        <IconBell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-8px',
              background: '#e53e3e',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 'bold',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: '0',
            width: '320px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 2000,
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #e2e8f0',
              position: 'sticky',
              top: 0,
              background: 'white',
            }}
          >
            <strong style={{ color: '#1a202c', fontSize: '0.95rem' }}>ການແຈ້ງເຕືອນ</strong>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3182ce',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                ອ່ານທັງໝົດ
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#a0aec0', fontSize: '0.9rem' }}>
              ບໍ່ມີການແຈ້ງເຕືອນ
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #f0f0f0',
                    background: notification.isRead ? '#fff' : '#ebf8ff',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => {
                    if (!notification.isRead) handleMarkAsRead(notification.id);
                  }}
                >
                  <div
                    style={{
                      fontWeight: notification.isRead ? '400' : '600',
                      color: '#2d3748',
                      marginBottom: '0.2rem',
                      fontSize: '0.9rem',
                    }}
                  >
                    {notification.title}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.2rem' }}>
                    {notification.message}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#a0aec0' }}>
                    {new Date(notification.createdAt).toLocaleString('lo-LA')}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
