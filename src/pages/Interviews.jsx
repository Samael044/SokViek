import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import InterviewModal from '../components/InterviewModal';
import DetailModal from '../components/DetailModal';
import { IconInbox, IconUser, IconCompany } from '../components/Icons';
import { formatDateDMY } from '../utils/date';

export default function Interviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    date: '',
    time: '09:00',
    type: 'onsite',
    location: '',
    meetingLink: '',
    notes: '',
  });

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

  const handleOpenDetail = (item) => {
    setSelectedInterview(item);
    setEditForm({
      date: item.date || '',
      time: item.time ? item.time.substring(0, 5) : '09:00',
      type: item.type || 'onsite',
      location: item.location || '',
      meetingLink: item.meetingLink || '',
      notes: item.notes || '',
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedInterview) return;
    try {
      setActionLoading(true);
      await api.updateInterview(selectedInterview.id, editForm);
      setSelectedInterview(null);
      setIsEditing(false);
      loadInterviews();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptInterview = async () => {
    if (!selectedInterview) return;
    try {
      setActionLoading(true);
      await api.updateInterviewStatus(selectedInterview.id, 'accepted');
      setSelectedInterview(null);
      loadInterviews();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInterview = async () => {
    if (!selectedInterview) return;
    try {
      setActionLoading(true);
      await api.cancelInterview(selectedInterview.id);
      setSelectedInterview(null);
      loadInterviews();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
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
              onClick={() => setShowCreateModal(true)}
            >
              + ນັດສຳພາດໃໝ່
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
        ) : (
          /* Cards Grid List for BOTH roles */
          <div
            className="grid-tiles"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {interviews.map((item) => (
              <div
                key={item.id}
                className="card box-interactive"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card-bg, #fff)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
                onClick={() => handleOpenDetail(item)}
              >
                {/* Top Badge Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.625rem',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: '600',
                    }}
                  >
                    ສຳພາດ
                  </span>
                  <span
                    style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      ...(item.status === 'scheduled'
                        ? { backgroundColor: '#fef3c7', color: '#d97706' }
                        : item.status === 'accepted' || item.status === 'completed'
                          ? { backgroundColor: '#d1fae5', color: '#059669' }
                          : { backgroundColor: '#fee2e2', color: '#dc2626' }),
                    }}
                  >
                    {item.status === 'scheduled'
                      ? 'ນັດແລ້ວ'
                      : item.status === 'accepted' || item.status === 'completed'
                        ? 'ຕອບຮັບແລ້ວ'
                        : 'ຍົກເລີກແລ້ວ'}
                  </span>
                </div>

                {/* Header User/Company Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      flexShrink: 0,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      backgroundColor: '#f3f4f6',
                    }}
                  >
                    {user?.role === 'company' ? (
                      item.employeeAvatar ? (
                        <img src={item.employeeAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <IconUser size={24} style={{ color: 'var(--text-muted)' }} />
                      )
                    ) : item.companyLogo ? (
                      <img src={item.companyLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <IconCompany size={24} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
                      {item.jobTitle || 'ຕຳແໜ່ງງານ'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                      {user?.role === 'company' ? (item.employeeName || 'ຜູ້ສະໝັກ') : (item.companyName || 'ບໍລິສັດ')}
                    </p>
                  </div>
                </div>

                {/* Divider Line */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div>
                    <strong>ວັນທີ:</strong> {formatDateDMY(item.date)} ເວລາ {item.time ? item.time.substring(0, 5) : '09:00'}
                  </div>
                  <div>
                    <strong>ຮູບແບບ:</strong> {item.type === 'online' ? 'Online' : 'Onsite'}
                  </div>
                  <div>
                    <strong>ສະຖານທີ່/ລິ້ງ:</strong>{' '}
                    {item.type === 'online' ? (
                      <a href={item.meetingLink} target="_blank" rel="noreferrer" className="link" onClick={(e) => e.stopPropagation()} style={{ fontWeight: 'bold' }}>
                        ກົດເພື່ອເຂົ້າປະຊຸມ online
                      </a>
                    ) : (
                      item.location || 'ບໍລິສັດ'
                    )}
                  </div>

                  {item.notes && (
                    <div style={{ padding: '0.625rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.25rem', fontSize: '0.8125rem', color: '#334155', lineHeight: 1.4 }}>
                      <strong>ໝາຍເຫດ:</strong> {item.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Detail / Actions Modal for Selected Interview ─── */}
      {selectedInterview && (
        <DetailModal
          title={`ລາຍລະອຽດການນັດສຳພາດ - ${selectedInterview.jobTitle}`}
          onClose={() => {
            setSelectedInterview(null);
            setIsEditing(false);
          }}
        >
          {user?.role === 'company' ? (
            /* COMPANY MODAL: View / Edit / Cancel */
            isEditing ? (
              <form onSubmit={handleSaveEdit} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>ວັນທີສຳພາດ</label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>ເວລາສຳພາດ</label>
                    <input
                      type="time"
                      value={editForm.time}
                      onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>ຮູບແບບການສຳພາດ</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  >
                    <option value="onsite">ຢູ່ບໍລິສັດ (Onsite)</option>
                    <option value="online">ອອນລາຍ (Online Meeting)</option>
                  </select>
                </div>

                {editForm.type === 'online' ? (
                  <div className="form-group">
                    <label>ລິ້ງປະຊຸມອອນລາຍ (Google Meet / Zoom)</label>
                    <input
                      type="url"
                      value={editForm.meetingLink}
                      onChange={(e) => setEditForm({ ...editForm, meetingLink: e.target.value })}
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>ສະຖານທີ່ສຳພາດ</label>
                    <input
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="ສະຖານທີ່ / ຫ້ອງປະຊຸມ..."
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>ໝາຍເຫດ / ເອກະສານທີ່ຕ້ອງກຽມມາ</label>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="ໝາຍເຫດເພີ່ມເຕີມ..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => setIsEditing(false)}
                  >
                    ຍົກເລີກການແກ້ໄຂ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກການແກ້ໄຂ'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '700', fontSize: '1.05rem' }}>
                    ຜູ້ສະໝັກ: {selectedInterview.employeeName}
                  </p>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
                    <strong>ວັນທີ:</strong> {formatDateDMY(selectedInterview.date)} ເວລາ {selectedInterview.time ? selectedInterview.time.substring(0, 5) : '09:00'}
                  </p>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
                    <strong>ຮູບແບບ:</strong> {selectedInterview.type === 'online' ? 'Online' : 'Onsite'}
                  </p>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
                    <strong>ສະຖານທີ່/ລິ້ງ:</strong> {selectedInterview.type === 'online' ? selectedInterview.meetingLink : selectedInterview.location}
                  </p>
                  {selectedInterview.notes && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#475569', whiteSpace: 'pre-line' }}>
                      <strong>ໝາຍເຫດ:</strong> {selectedInterview.notes}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {selectedInterview.status !== 'cancelled' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => setIsEditing(true)}
                    >
                      ແກ້ໄຂຂໍ້ມູນ
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1, color: 'var(--error)', borderColor: 'var(--error)' }}
                    disabled={actionLoading}
                    onClick={handleCancelInterview}
                  >
                    ຍົກເລີກການນັດສຳພາດ
                  </button>
                </div>
              </div>
            )
          ) : (
            /* EMPLOYEE MODAL: View / Accept / Decline / Delete */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: '700', fontSize: '1.05rem', color: 'var(--primary)' }}>
                  ບໍລິສັດ: {selectedInterview.companyName}
                </p>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>ຕຳແໜ່ງ:</strong>{' '}
                  <span
                    style={{ color: '#2563eb', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => {
                      setSelectedInterview(null);
                      navigate(`/jobs?jobId=${selectedInterview.jobId}`);
                    }}
                    title="ກົດເພື່ອເບິ່ງປະກາດງານນີ້"
                  >
                    {selectedInterview.jobTitle} ↗
                  </span>
                </p>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>ວັນທີ:</strong> {formatDateDMY(selectedInterview.date)} ເວລາ {selectedInterview.time ? selectedInterview.time.substring(0, 5) : '09:00'}
                </p>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>ຮູບແບບ:</strong> {selectedInterview.type === 'online' ? 'Online Meeting' : 'ຢູ່ບໍລິສັດ (Onsite)'}
                </p>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                  <strong>ສະຖານທີ່/ລິ້ງ:</strong>{' '}
                  {selectedInterview.type === 'online' ? (
                    <a href={selectedInterview.meetingLink} target="_blank" rel="noreferrer" className="link" style={{ fontWeight: 'bold' }}>
                      {selectedInterview.meetingLink || 'ກົດເພື່ອເຂົ້າປະຊຸມ'}
                    </a>
                  ) : (
                    selectedInterview.location || 'ບໍລິສັດ'
                  )}
                </p>

                {selectedInterview.notes && (
                  <div style={{ padding: '0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '0.5rem', fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-line' }}>
                    <strong>ໝາຍເຫດຈາກບໍລິສັດ:</strong>
                    <br />
                    {selectedInterview.notes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                {selectedInterview.status === 'scheduled' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, backgroundColor: '#10b981', borderColor: '#10b981' }}
                    disabled={actionLoading}
                    onClick={handleAcceptInterview}
                  >
                    ຕອບຮັບການນັດສຳພາດ
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, color: 'var(--error)', borderColor: 'var(--error)' }}
                  disabled={actionLoading}
                  onClick={handleCancelInterview}
                >
                  ປະຕິເສດການນັດສຳພາດ
                </button>
              </div>
            </div>
          )}
        </DetailModal>
      )}

      {/* ─── Company New Interview Modal ─── */}
      {showCreateModal && (
        <InterviewModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadInterviews}
        />
      )}
    </div>
  );
}
