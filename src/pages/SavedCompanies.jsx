import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DetailModal from '../components/DetailModal';
import { IconCompany, IconInbox, IconFlag } from '../components/Icons';
import { JOB_TYPES } from '../constants/jobTypes';
import { formatDateDMY } from '../utils/date';
import ReportModal from '../components/ReportModal';

export default function SavedCompanies() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const loadSavedData = async () => {
    setLoading(true);
    try {
      const resJobs = await api.getSavedJobs();
      setSavedJobs(resJobs.jobs || []);
    } catch (err) {
      console.error(err);
      setSavedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'employees') {
      navigate('/');
      return;
    }
    loadSavedData();
  }, [user]);

  const handleJobClick = async (job) => {
    setSelectedJob(job);
    try {
      const appliedRes = await api.checkApplied(job.id);
      setApplied(appliedRes.applied);
    } catch (err) {
      setApplied(false);
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

  const handleUnsaveJob = async (e, jobId, companyId) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      await api.unsaveJob(jobId);
      if (companyId) {
        await api.unsaveCompany(companyId).catch(() => {});
      }
      setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(null);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReport = (type, id) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setReportTarget({ type, id });
  };

  const renderJobDetail = (job) => {
    const isClosed = job.status === 'closed';
    const postDate = (job.createdAt || job.created_at) ? new Date(job.createdAt || job.created_at).toLocaleDateString('lo-LA') : '-';
    const compName = job.company?.name || job.companyName || '-';

    return (
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
          {job.type ? job.type.split(',').map((t, idx) => (
            <span key={idx} className="tag">{JOB_TYPES[t.trim()] || t.trim()}</span>
          )) : (
            <span className="tag">ເຕັມເວລາ</span>
          )}
          {isClosed && (
            <span className="tag" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
              ປິດຮັບສະໝັກ
            </span>
          )}
        </div>

        {isClosed && (
          <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginTop: '0.75rem', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center', border: '1px solid #fca5a5' }}>
            ງານນີ້ຍັງບໍ່ເປີດຮັບສະໝັກ
          </div>
        )}

        <p className="detail-desc">{job.description}</p>
        <dl className="detail-dl">
          <dt>ບໍລິສັດ</dt><dd>{compName}</dd>
          <dt>ສະຖານທີ່</dt><dd>{job.location}</dd>
          <dt>ເງິນເດືອນ</dt><dd>{job.salary}</dd>
          {job.requirements && <><dt>ຄຸນສົມບັດ</dt><dd>{job.requirements}</dd></>}
          <dt>ວັນທີປະກາດ</dt>
          <dd>{postDate}</dd>
          {job.company?.about && <><dt>ກ່ຽວກັບບໍລິສັດ</dt><dd>{job.company.about}</dd></>}
        </dl>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
          {isClosed ? (
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', color: '#991b1b', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
              disabled
            >
              ງານນີ້ຍັງບໍ່ເປີດຮັບສະໝັກ
            </button>
          ) : applied ? (
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
                {applyLoading ? 'ກຳລັງຍົກເລີກ...' : 'ຍົກເລີກສະໝັກ'}
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
            style={{ padding: '0.75rem 1.25rem', fontSize: '1rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--error)', borderColor: 'var(--error)' }}
            disabled={actionLoading}
            onClick={(e) => handleUnsaveJob(e, job.id, job.companyId || job.company?.id)}
          >
            {actionLoading ? '...' : 'ລົບການບັນທຶກ'}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="page page-board">
      <div className="container">

        {/* ─── Board Header ─── */}
        <header className="board-header">
          <div>
            <h1>ວຽກທີ່ບັນທຶກ</h1>
            <p className="page-desc">ລາຍຊື່ວຽກທີ່ທ່ານບັນທຶກໄວ້ເພື່ອຕິດຕາມ</p>
          </div>
        </header>

        <section className="grid-board home-grid-board">
          {loading ? (
            <div className="loading-screen"><div className="spinner" /></div>
          ) : savedJobs.length === 0 ? (
            <div className="empty-state empty-state-board">
              <IconInbox size={48} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
              <p>ຍັງບໍ່ມີວຽກທີ່ບັນທຶກໄວ້</p>
            </div>
          ) : (
            <div className="grid-tiles">
              {savedJobs.map((job) => {
                const companyName = job.company?.name || 'ບໍລິສັດ';

                return (
                  <button
                    key={job.id}
                    type="button"
                    className="grid-tile grid-tile-premium grid-tile-job"
                    onClick={() => handleJobClick(job)}
                  >
                    {/* Banner Area */}
                    <div className="tile-banner">
                      <span className="tile-type-badge-premium tile-type-job">
                        ປະກາດງານ
                      </span>
                    </div>

                    {/* Overlapping Section */}
                    <div className="tile-overlap">
                      <div className="tile-logo-wrapper">
                        {job.company?.logo ? (
                          <img src={job.company.logo} alt="" className="tile-logo-img" style={{ objectFit: 'contain' }} />
                        ) : (
                          <IconCompany size={24} className="tile-logo-fallback" />
                        )}
                      </div>
                    </div>

                    {/* Details Section */}
                    <div className="tile-details">
                      <h3 className="tile-title-premium" title={job.title}>{job.title}</h3>
                      <p className="tile-subtitle-premium" title={companyName}>
                        {companyName}
                      </p>
                      <p className="tile-meta-premium">
                        {job.location} · {job.salary}
                      </p>
                      {job.savedAt && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem', textAlign: 'left' }}>
                          ບັນທຶກເມື່ອ: {formatDateDMY(job.savedAt)}
                        </div>
                      )}
                    </div>

                    {/* Actions Section */}
                    <div style={{ padding: '0 1.25rem 1.25rem', width: '100%', display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJobClick(job);
                        }}
                      >
                        ເບິ່ງຂໍ້ມູນວຽກ
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: 'var(--error)', color: 'white', padding: '0 0.75rem' }}
                        disabled={actionLoading}
                        onClick={(e) => handleUnsaveJob(e, job.id, job.companyId || job.company?.id)}
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

      {selectedJob && (
        <DetailModal
          title={selectedJob.title}
          onClose={() => {
            setSelectedJob(null);
            setApplied(false);
          }}
        >
          {renderJobDetail(selectedJob)}
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
