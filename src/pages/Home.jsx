import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { JOB_TYPES } from '../constants/jobTypes';
import DetailModal from '../components/DetailModal';
import ReportModal from '../components/ReportModal';
import { IconCompany, IconUser, IconPhone, IconMail, IconInbox, IconFlag, IconStar } from '../components/Icons';
import { openImageInNewTab } from '../utils/image';

const genderLabels = { male: 'ຊາຍ', female: 'ຍິງ', other: 'ອື່ນໆ' };
const maritalLabels = { single: 'ໂສດ', dating: 'ມີແຟນແລ້ວ', married: 'ແຕ່ງງານແລ້ວ' };

const TYPE_LABELS = {
  job: 'ບໍລິສັດ',
  resume: 'ພະນັກງານ',
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [applied, setApplied] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState(new Set());
  const [isSavedState, setIsSavedState] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const canContact = user?.role === 'company' || user?.role === 'admin';

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getFeed();
        setItems(data.items.slice(0, 8));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleTileClick = async (item) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelected(item);
    if (item.type === 'job' && user.role === 'employees') {
      try {
        const res = await api.checkApplied(item.data.id);
        setApplied(res.applied);

        setSavedLoading(true);
        const resCompanySaved = await api.getSavedCompanyStatus(item.data.companyId);
        setIsSavedState(resCompanySaved.saved);
      } catch (err) {
        console.error(err);
      } finally {
        setSavedLoading(false);
      }
    } else if (item.type === 'resume' && user.role === 'company') {
      try {
        setSavedLoading(true);
        const res = await api.getSavedStatus(item.id);
        setIsSavedState(res.saved);
      } catch (err) {
        console.error(err);
      } finally {
        setSavedLoading(false);
      }
    }
  };

  const handleToggleSave = async (id, type) => {
    try {
      setSavedLoading(true);
      if (type === 'company') {
        if (isSavedState) {
          await api.unsaveCompany(id);
          setIsSavedState(false);
        } else {
          await api.saveCompany(id);
          setIsSavedState(true);
        }
      } else if (type === 'resume') {
        if (isSavedState) {
          await api.unsaveCandidate(id);
          setIsSavedState(false);
        } else {
          await api.saveCandidate(id);
          setIsSavedState(true);
        }
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSavedLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    try {
      setApplyLoading(true);
      await api.applyJob(jobId);
      setApplied(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setApplyLoading(false);
    }
  };

  const handleCancelApply = async (jobId) => {
    try {
      setApplyLoading(true);
      await api.cancelApplyJob(jobId);
      setApplied(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setApplyLoading(false);
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

  const handleOpenReport = (type, id) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setReportTarget({ type, id });
  };

  const renderJobDetail = (job) => (
    <>
      {user && user.id !== job.companyId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--error)', borderColor: 'var(--error)', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
            onClick={() => handleOpenReport('job', job.id)}
          >
            <IconFlag size={12} /> ລາຍງານປະກາດນີ້
          </button>
        </div>
      )}
      <div className="detail-meta">
        <span className="tag tag-job" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <IconCompany size={14} /> ປະກາດງານ
        </span>
        <span className="tag">{JOB_TYPES[job.type]}</span>
      </div>
      <p className="detail-desc">{job.description}</p>
      <dl className="detail-dl">
        <dt>ບໍລິສັດ</dt><dd>{job.company?.name || '-'}</dd>
        <dt>ສະຖານທີ່</dt><dd>{job.location}</dd>
        <dt>ເງິນເດືອນ</dt><dd>{job.salary}</dd>
        {job.requirements && <><dt>ຄຸນສົມບັດ</dt><dd>{job.requirements}</dd></>}
        <dt>ວັນທີປະກາດ</dt>
        <dd>{new Date(job.createdAt).toLocaleDateString('lo-LA')}</dd>
        {job.company?.about && <><dt>ກ່ຽວກັບບໍລິສັດ</dt><dd>{job.company.about}</dd></>}
      </dl>
      {user?.role === 'employees' && (
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
          {applied ? (
            <>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}
                disabled
              >
                ສະໝັກແລ້ວ
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                disabled={applyLoading}
                onClick={() => handleCancelApply(job.id)}
              >
                {applyLoading ? 'ກຳລັງຍົກເລີກ...' : 'ຍົກເລີກ'}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}
              disabled={applyLoading}
              onClick={() => handleApply(job.id)}
            >
              {applyLoading ? 'ກຳລັງສະໝັກ...' : 'ສະໝັກງານ'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '0.75rem 1.25rem', fontSize: '1rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
            disabled={savedLoading}
            onClick={() => handleToggleSave(job.companyId, 'company')}
          >
            <IconStar size={16} fill={isSavedState ? 'currentColor' : 'none'} />
            {isSavedState ? 'ບັນທຶກແລ້ວ' : 'ບັນທຶກບໍລິສັດ'}
          </button>
        </div>
      )}
    </>
  );

  const renderResumeDetail = (item) => (
    <>
      {user && user.id !== item.id && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--error)', borderColor: 'var(--error)', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
            onClick={() => handleOpenReport('resume', item.id)}
          >
            <IconFlag size={12} /> ລາຍງານຜູ້ຊອກວຽກນີ້
          </button>
        </div>
      )}
      <div className="detail-meta">
        <span className="tag tag-resume" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <IconUser size={14} /> ພະນັກງານ
        </span>
        <span className="tag">{JOB_TYPES[item.resume?.jobType]}</span>
        <span>{item.resume?.desiredPosition}</span>
      </div>
      <p className="detail-desc">{item.resume?.summary}</p>
      <dl className="detail-dl">
        <dt>ເພດ</dt><dd>{genderLabels[item.profile?.gender] || '-'}</dd>
        <dt>ອາຍຸ</dt><dd>{item.profile?.age ?? '-'} ປີ</dd>
        <dt>ສະຖານະພາບ</dt><dd>{maritalLabels[item.profile?.maritalStatus] || '-'}</dd>
        <dt>ທີ່ຢູ່ປັດຈຸບັນ</dt><dd>{item.profile?.location || '-'}</dd>
        {item.resume?.skills && <><dt>ທັກສະ</dt><dd>{item.resume.skills}</dd></>}
        {item.resume?.experience && <><dt>ປະສົບການ</dt><dd>{item.resume.experience}</dd></>}
        {item.resume?.education && <><dt>ການສຶກສາ</dt><dd>{item.resume.education}</dd></>}
      </dl>
      {item.resume?.resumeImages && item.resume.resumeImages.length > 0 && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '1rem' }}>
          <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '0.5rem', color: 'var(--text)' }}>ຮູບພາບ Resume / CV:</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {item.resume.resumeImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => openImageInNewTab(img)}
                style={{
                  display: 'block',
                  width: '100%',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-strong)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                  padding: 0,
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                }}
              >
                <img
                  src={img}
                  alt={`Resume / CV ${idx + 1}`}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {canContact && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
          {invitedUserIds.has(item.id) ? (
            <>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}
                disabled
              >
                ສົ່ງຄຳເຊີນແລ້ວ
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
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
              style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}
              disabled={inviteLoading}
              onClick={() => handleSendInvite(item.id)}
            >
              {inviteLoading ? 'ກຳລັງສົ່ງ...' : 'ຕ້ອງການຈ້າງ'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '0.75rem 1.25rem', fontSize: '1rem', whiteSpace: 'nowrap' }}
            disabled={savedLoading}
            onClick={() => handleToggleSave(item.id, 'resume')}
          >
            {savedLoading ? '...' : isSavedState ? '⭐ ບັນທຶກແລ້ວ' : '☆ ບັນທຶກຜູ້ຊອກວຽກ'}
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero-box">
            <div className="hero-actions">

            </div>
          </div>
        </div>
      </section>

      <section className="home-board">
        <div className="container">
          <div className="section-head">
            <h2>ລາຍການທັງໝົດ</h2>
            <p>ວຽກ ແລະ ຜູ້ຊອກວຽກທີ່ຫາກໍລົງປະກາດ</p>
          </div>
          <div className="grid-board home-grid-board">
            {loading ? (
              <div className="loading-screen loading-screen-board"><div className="spinner" /></div>
            ) : items.length === 0 ? (
              <div className="empty-state empty-state-board">
                <IconInbox size={48} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                <p>ຍັງບໍ່ມີລາຍການ</p>
              </div>
            ) : (
              <div className="grid-tiles">
                {items.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    className={`grid-tile grid-tile-premium grid-tile-${item.type}`}
                    onClick={() => handleTileClick(item)}
                  >
                    {/* Banner Area */}
                    <div className="tile-banner">
                      <span className={`tile-type-badge-premium tile-type-${item.type}`}>
                        {TYPE_LABELS[item.type]}
                      </span>
                    </div>

                    {/* Overlapping Section */}
                    <div className="tile-overlap">
                      <div className="tile-logo-wrapper">
                        {item.thumb ? (
                          <img src={item.thumb} alt="" className="tile-logo-img" />
                        ) : item.type === 'job' ? (
                          <IconCompany size={24} className="tile-logo-fallback" />
                        ) : (
                          <IconUser size={24} className="tile-logo-fallback" />
                        )}
                      </div>
                      <div className="tile-stats">
                        <span className="jobs-badge">{JOB_TYPES[item.jobType] || 'ເຕັມເວລາ'}</span>
                      </div>
                    </div>

                    {/* Details Section */}
                    <div className="tile-details">
                      <h3 className="tile-title-premium" title={item.title}>{item.title}</h3>
                      <p className="tile-subtitle-premium" title={item.subtitle}>{item.subtitle}</p>
                      <p className="tile-meta-premium">
                        {item.type === 'job'
                          ? item.data?.location || 'ລາວ'
                          : `${item.data?.profile?.age ?? '-'} ປີ`
                        }
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="tile-action">
                      <div className="tile-btn-premium">
                        <span>{item.type === 'job' ? 'ເບິ່ງຂໍ້ມູນວຽກ' : 'ເບິ່ງລາຍລະອຽດ'}</span>
                        <span className="btn-arrow">&rarr;</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {selected && (
        <DetailModal
          title={selected.title}
          onClose={() => {
            setSelected(null);
            setApplied(false);
            setApplyLoading(false);
          }}
        >
          {selected.type === 'job'
            ? renderJobDetail(selected.data)
            : renderResumeDetail(selected.data)}
        </DetailModal>
      )}

      {reportTarget && (
        <ReportModal
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
