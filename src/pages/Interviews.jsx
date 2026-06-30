import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import InterviewModal from '../components/InterviewModal';
import { IconInbox, IconUser, IconCompany } from '../components/Icons';
import { formatDateDMY } from '../utils/date';

export default function Interviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      if (user.role === 'company') {
        const data = await api.getInterviews();
        setInterviews(data.interviews || []);
      } else if (user.role === 'employees') {
        const data = await api.getMyInterviews();
        setInterviews(data.interviews || []);
      }
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadInterviews();
  }, [user]);

  const handleCancel = async (id, date) => {
    if (!window.confirm(`ຕ້ອງການຍົກເລີກການນັດສຳພາດຂອງວັນທີ ${formatDateDMY(date)}?`)) return;
    setActionLoadingId(id);
    try {
      await api.cancelInterview(id);
      setInterviews((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'cancelled' } : i))
      );
    } catch (err) {
      alert(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການຍົກເລີກ');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="page page-board">
      <div className="container">
        
        {/* ─── Board Header ─── */}
        <header className="board-header">
          <div>
            <h1>ລາຍການນັດສຳພາດ</h1>
            <p className="page-desc">ລາຍການນັດສຳພາດທັງໝົດຂອງທ່ານໃນລະບົບ</p>
          </div>
          {user?.role === 'company' && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowModal(true)}
            >
              ນັດສຳພາດໃໝ່
            </button>
          )}
        </header>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : interviews.length === 0 ? (
          <div className="empty-state empty-state-board">
            <IconInbox size={48} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
            <p>ຍັງບໍ່ມີລາຍການນັດສຳພາດເທື່ອ</p>
          </div>
        ) : user?.role === 'company' ? (
          /* COMPANY VIEW: Table list */
          <div className="card" style={{ padding: '1rem', overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ຜູ້ຊອກວຽກ</th>
                  <th>ຕຳແໜ່ງງານ</th>
                  <th>ວັນທີ & ເວລາ</th>
                  <th>ຮູບແບບ / ສະຖານທີ່</th>
                  <th>ສະຖານະ</th>
                  <th style={{ textAlign: 'right' }}>ຈັດການ</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((item) => (
                  <tr key={item.id} className="clickable-row">
                    <td>
                      <div className="user-cell">
                        <span className="user-avatar-placeholder" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.employeeAvatar ? (
                            <img src={item.employeeAvatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <IconUser size={16} />
                          )}
                        </span>
                        <span style={{ fontWeight: '600' }}>{item.employeeName}</span>
                      </div>
                    </td>
                    <td>{item.jobTitle}</td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{formatDateDMY(item.date)}</div>
                      <small style={{ color: 'var(--text-muted)' }}>ເວລາ: {item.time.substring(0, 5)}</small>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{item.type === 'online' ? '🟢 Online' : '🏢 Onsite'}</div>
                      <small style={{ color: 'var(--text-muted)' }}>
                        {item.type === 'online' ? (
                          <a href={item.meetingLink} target="_blank" rel="noreferrer" className="link" style={{ fontWeight: 'bold' }}>
                            ເຂົ້າຮ່ວມປະຊຸມ
                          </a>
                        ) : (
                          item.location
                        )}
                      </small>
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'scheduled' ? 'badge-status-pending' : item.status === 'completed' ? 'badge-status-approved' : 'badge-status-rejected'}`}>
                        {item.status === 'scheduled' ? 'ນັດແລ້ວ' : item.status === 'completed' ? 'ສຳເລັດແລ້ວ' : 'ຍົກເລີກແລ້ວ'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.status === 'scheduled' ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                          disabled={actionLoadingId === item.id}
                          onClick={() => handleCancel(item.id, item.date)}
                        >
                          {actionLoadingId === item.id ? '...' : 'ຍົກເລີກ'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* EMPLOYEE VIEW: Grid of Cards */
          <div className="grid-tiles" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {interviews.map((item) => (
              <div
                key={item.id}
                className="card"
                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '260px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="tag tag-job" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <IconCompany size={12} /> ສຳພາດ
                  </span>
                  <span className={`badge ${item.status === 'scheduled' ? 'badge-status-pending' : item.status === 'completed' ? 'badge-status-approved' : 'badge-status-rejected'}`}>
                    {item.status === 'scheduled' ? 'ນັດແລ້ວ' : item.status === 'completed' ? 'ສຳເລັດແລ້ວ' : 'ຍົກເລີກແລ້ວ'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="user-avatar-placeholder" style={{ width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    {item.companyLogo ? (
                      <img src={item.companyLogo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <IconCompany size={20} />
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text)', margin: 0 }}>{item.jobTitle}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{item.companyName}</p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text)' }}>
                  <div>
                    <strong>ວັນທີ:</strong> {formatDateDMY(item.date)} ເວລາ {item.time.substring(0, 5)}
                  </div>
                  <div>
                    <strong>ຮູບແບບ:</strong> {item.type === 'online' ? '🟢 Online' : '🏢 Onsite'}
                  </div>
                  <div>
                    <strong>ສະຖານທີ່/ລິ້ງ:</strong>{' '}
                    {item.type === 'online' ? (
                      <a href={item.meetingLink} target="_blank" rel="noreferrer" className="link" style={{ fontWeight: 'bold' }}>
                        ກົດເພື່ອເຂົ້າປະຊຸມ online
                      </a>
                    ) : (
                      item.location
                    )}
                  </div>
                  {item.notes && (
                    <div style={{ padding: '0.5rem', background: 'var(--surface-muted)', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '0.25rem' }}>
                      <strong>ໝາຍເຫດ:</strong> {item.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <InterviewModal
          onClose={() => setShowModal(false)}
          onSuccess={loadInterviews}
        />
      )}
    </div>
  );
}
