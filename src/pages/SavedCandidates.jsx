import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DetailModal from '../components/DetailModal';
import { IconUser, IconInbox, IconPhone, IconMail } from '../components/Icons';
import { JOB_TYPES } from '../constants/jobTypes';
import { formatDateDMY } from '../utils/date';

export default function SavedCandidates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState(new Set());

  const loadSavedCandidates = async () => {
    setLoading(true);
    try {
      const data = await api.getSavedCandidates();
      setCandidates(data.candidates || []);
    } catch (err) {
      console.error(err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'company') {
      navigate('/');
      return;
    }
    loadSavedCandidates();
  }, [user]);

  const handleUnsave = async (e, employeeId) => {
    e.stopPropagation(); // prevent opening details modal
    if (!window.confirm('ຕ້ອງການເອົາພະນັກງານນີ້ອອກຈາກລາຍການບັນທຶກ?')) return;
    setActionLoading(true);
    try {
      await api.unsaveCandidate(employeeId);
      setCandidates((prev) => prev.filter((c) => c.id !== employeeId));
      if (selected && selected.id === employeeId) {
        setSelected(null);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvite = async (seekerUserId) => {
    try {
      setInviteLoading(true);
      await api.sendHireInvite(seekerUserId);
      setInvitedUserIds((prev) => new Set([...prev, seekerUserId]));
    } catch (err) {
      alert(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const renderResumeDetail = (item) => (
    <>
      <div className="detail-meta">
        <span className="tag tag-resume" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <IconUser size={14} /> ຜູ້ຊອກວຽກ
        </span>
        <span className="tag">{JOB_TYPES[item.resume?.jobType]}</span>
        <span>{item.resume?.desiredPosition}</span>
      </div>
      <p className="detail-desc">{item.resume?.summary}</p>
      <dl className="detail-dl">
        <dt>ອາຍຸ</dt><dd>{item.profile?.age ?? '-'} ປີ</dd>
        {item.resume?.skills && <><dt>ທັກສະ</dt><dd>{item.resume.skills}</dd></>}
        {item.resume?.experience && <><dt>ປະສົບການ</dt><dd>{item.resume.experience}</dd></>}
        {item.resume?.education && <><dt>ການສຶກສາ</dt><dd>{item.resume.education}</dd></>}
      </dl>
      
      {item.resume?.resumeImages && item.resume.resumeImages.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-6 mb-4">
          <strong className="block text-sm font-bold text-gray-800 mb-3">ຮູບພາບ Resume / CV:</strong>
          <div className="grid-tiles" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {item.resume.resumeImages.map((img, idx) => (
              <a
                key={idx}
                href={img}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}
              >
                <img src={img} alt={`Resume / CV ${idx + 1}`} style={{ width: '100%', height: 'auto' }} />
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button
          type="button"
          className="btn btn-outline"
          style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
          disabled={actionLoading}
          onClick={(e) => handleUnsave(e, item.id)}
        >
          ເອົາອອກຈາກລາຍການບັນທຶກ
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {invitedUserIds.has(item.id) ? (
            <>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1, cursor: 'not-allowed', color: 'var(--text-muted)' }}
                disabled
              >
                ສົ່ງຄຳເຊີນແລ້ວ
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                onClick={() => setInvitedUserIds((prev) => {
                  const next = new Set(prev);
                  next.delete(item.id);
                  return next;
                })}
              >
                ຍົກເລີກ
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={inviteLoading}
              onClick={() => handleSendInvite(item.id)}
            >
              {inviteLoading ? 'ກຳລັງສົ່ງ...' : 'ຕ້ອງການຈ້າງ'}
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="page page-board">
      <div className="container">
        
        {/* ─── Board Header ─── */}
        <header className="board-header">
          <div>
            <h1>ພະນັກງານທີ່ບັນທຶກ</h1>
            <p className="page-desc">ລາຍຊື່ຜູ້ຊອກວຽກທີ່ທ່ານບັນທຶກໄວ້ເພື່ອພິຈາລະນາ</p>
          </div>
        </header>

        <section className="grid-board home-grid-board">
          {loading ? (
            <div className="loading-screen"><div className="spinner" /></div>
          ) : candidates.length === 0 ? (
            <div className="empty-state empty-state-board">
              <IconInbox size={48} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
              <p>ຍັງບໍ່ມີພະນັກງານທີ່ບັນທຶກໄວ້</p>
            </div>
          ) : (
            <div className="grid-tiles">
              {candidates.map((c) => {
                const displayName = c.profile?.firstName
                  ? `${c.profile.firstName} ${c.profile.lastName}`
                  : c.contact?.email || 'ຜູ້ຊອກວຽກ';
                
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="grid-tile grid-tile-premium grid-tile-resume"
                    onClick={() => setSelected(c)}
                  >
                    {/* Banner Area */}
                    <div className="tile-banner">
                      <span className="tile-type-badge-premium tile-type-resume">
                        ພະນັກງານ
                      </span>
                    </div>

                    {/* Overlapping Section */}
                    <div className="tile-overlap">
                      <div className="tile-logo-wrapper">
                        {c.profile?.avatar ? (
                          <img src={c.profile.avatar} alt="" className="tile-logo-img" />
                        ) : (
                          <IconUser size={24} className="tile-logo-fallback" />
                        )}
                      </div>
                      <div className="tile-stats">
                        <span className="jobs-badge">
                          {JOB_TYPES[c.resume?.jobType] || 'ເຕັມເວລາ'}
                        </span>
                      </div>
                    </div>

                    {/* Details Section */}
                    <div className="tile-details">
                      <h3 className="tile-title-premium" title={displayName}>{displayName}</h3>
                      <p className="tile-subtitle-premium" title={c.resume?.desiredPosition}>
                        {c.resume?.desiredPosition || 'ບໍ່ໄດ້ລະບຸຕຳແໜ່ງ'}
                      </p>
                      <p className="tile-meta-premium">
                        ທັກສະ: {c.resume?.skills || 'ບໍ່ໄດ້ລະບຸ'}
                      </p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem', textAlign: 'left' }}>
                        ບັນທຶກເມື່ອ: {formatDateDMY(c.savedAt)}
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div style={{ padding: '0 1.25rem 1.25rem', width: '100%', display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(c);
                        }}
                      >
                        ເບິ່ງຂໍ້ມູນ
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: 'var(--error)', color: 'white', padding: '0 0.75rem' }}
                        disabled={actionLoading}
                        onClick={(e) => handleUnsave(e, c.id)}
                      >
                        ເອົາອອກ
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {selected && (
        <DetailModal
          title={selected.profile?.firstName ? `${selected.profile.firstName} ${selected.profile.lastName}` : selected.contact?.email || 'ລາຍລະອຽດ'}
          onClose={() => setSelected(null)}
        >
          {renderResumeDetail(selected)}
        </DetailModal>
      )}
    </div>
  );
}
