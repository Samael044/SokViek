import { useState, useEffect } from 'react';
import { api } from '../api/client';
import DetailModal from '../components/DetailModal';

const genderLabels = { male: 'ຊາຍ', female: 'ຍິງ', other: 'ອື່ນໆ' };
const maritalLabels = { single: 'ໂສດ', dating: 'ມີແຟນແລ້ວ', married: 'ແຕ່ງງານແລ້ວ' };

// Mappings for reason and target types
const reasonLabels = {
  spam: 'ສະແປມ (Spam)',
  inappropriate: 'ເນື້ອຫາບໍ່ເໝາະສົມ',
  fraud: 'ສໍ້ໂກງ / ຫຼອກລວງ',
  other: 'ອື່ນໆ',
};
const targetLabels = {
  job: 'ປະກາດງານ',
  resume: 'ເຣຊູເມ / ຜູ້ຊອກວຽກ',
  user: 'ຜູ້ໃຊ້',
};

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('reports');
  const [loading, setLoading] = useState(true);
  const [viewingDetail, setViewingDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = async () => {
    try {
      const [reportsData, statsData, userReportsData] = await Promise.all([
        api.getAdminReports(),
        api.getAdminStats(),
        api.getUserReports().catch(() => ({ reports: [] })),
      ]);
      setReports(reportsData.reports || []);
      setStats(statsData.stats || null);
      setUserReports(userReportsData.reports || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, []);

  const handleWarn = async (reportId) => {
    if (!window.confirm('ຕ້ອງການສົ່ງຄຳເຕືອນຫາຜູ້ໃຊ້ທີ່ຖືກລາຍງານ?')) return;
    try {
      await api.warnUserReport(reportId);
      alert('ສົ່ງຄຳເຕືອນຫາຜູ້ໃຊ້ສຳເລັດແລ້ວ');
      await loadData();
    } catch (err) {
      alert(err.message || 'ເກີດຂໍ້ຜິດພາດ');
    }
  };

  const handleResolve = async (reportId) => {
    if (!window.confirm('ຕ້ອງການໝາຍລາຍງານນີ້ວ່າແກ້ໄຂແລ້ວ?')) return;
    try {
      await api.resolveUserReport(reportId);
      alert('ໝາຍວ່າແກ້ໄຂແລ້ວສຳເລັດ');
      await loadData();
    } catch (err) {
      alert(err.message || 'ເກີດຂໍ້ຜິດພາດ');
    }
  };

  const handleViewTarget = async (type, id) => {
    setDetailLoading(true);
    try {
      if (type === 'job') {
        const job = await api.getJob(id);
        setViewingDetail({ type, data: job });
      } else if (type === 'resume' || type === 'user') {
        const res = await api.getUserProfile(id);
        setViewingDetail({ type, data: res.user });
      }
    } catch (err) {
      alert('ບໍ່ສາມາດດຶງຂໍ້ມູນເປົ້າໝາຍໄດ້: ' + (err.message || 'ເກີດຂໍ້ຜິດພາດ (ອາດຈະຖືກລົບໄປແລ້ວ)'));
    } finally {
      setDetailLoading(false);
    }
  };

  const renderJobDetail = (job) => (
    <>
      <div className="detail-meta">
        <span className="tag tag-job">ປະກາດງານ</span>
        <span className="tag">{job.type}</span>
      </div>
      <p className="detail-desc">{job.description}</p>
      <dl className="detail-dl">
        <dt>ບໍລິສັດ</dt><dd>{job.company?.name || '-'}</dd>
        <dt>ສະຖານທີ່</dt><dd>{job.location || '-'}</dd>
        <dt>ເງິນເດືອນ</dt><dd>{job.salary || '-'}</dd>
        {job.requirements && <><dt>ຄຸນສົມບັດ</dt><dd>{job.requirements}</dd></>}
        <dt>ວັນທີປະກາດ</dt>
        <dd>{new Date(job.createdAt).toLocaleDateString('lo-LA')}</dd>
        {job.company?.about && <><dt>ກ່ຽວກັບບໍລິສັດ</dt><dd>{job.company.about}</dd></>}
      </dl>
    </>
  );

  const renderCompanyDetail = (u) => {
    const profile = u.profile || {};
    return (
      <>
        <div className="detail-meta">
          <span className="tag tag-job">ບໍລິສັດ</span>
          <span>{profile.companyName || '-'}</span>
        </div>
        {profile.about && <p className="detail-desc">{profile.about}</p>}
        <dl className="detail-dl">
          <dt>ອີເມວບໍລິສັດ</dt><dd>{profile.companyEmail || '-'}</dd>
          <dt>ທີ່ຢູ່</dt><dd>{profile.address || '-'}</dd>
          <dt>ເບີໂທ</dt><dd>{profile.phone || '-'}</dd>
        </dl>
      </>
    );
  };

  const renderResumeDetail = (u) => {
    const item = {
      profile: u.profile,
      resume: u.resume,
    };
    return (
      <>
        <div className="detail-meta">
          <span className="tag tag-resume">ຜູ້ຊອກວຽກ</span>
          {item.resume?.jobType && <span className="tag">{item.resume.jobType}</span>}
          <span>{item.resume?.desiredPosition || '-'}</span>
        </div>
        <p className="detail-desc">{item.resume?.summary || 'ບໍ່ມີບົດສະຫຼຸບ'}</p>
        <dl className="detail-dl">
          <dt>ເພດ</dt><dd>{genderLabels[item.profile?.gender] || '-'}</dd>
          <dt>ອາຍຸ</dt><dd>{item.profile?.age ?? '-'} ປີ</dd>
          <dt>ສະຖານະພາບ</dt><dd>{maritalLabels[item.profile?.maritalStatus] || '-'}</dd>
          <dt>ທີ່ຢູ່ປັດຈຸບັນ</dt><dd>{item.profile?.location || '-'}</dd>
          {item.resume?.skills && <><dt>ທັກສະ</dt><dd>{item.resume.skills}</dd></>}
          {item.resume?.experience && <><dt>ປະສົບການ</dt><dd>{item.resume.experience}</dd></>}
          {item.resume?.education && <><dt>ການສຶກສາ</dt><dd>{item.resume.education}</dd></>}
        </dl>
      </>
    );
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>ລາຍງານລະບົບ</h1>
            <p className="page-desc">ຕິດຕາມກິດຈະກຳ ແລະ ການລາຍງານການລະເມີດໃນລະບົບ</p>
          </div>
        </div>

        {stats && (
          <div className="stats-grid">
            <div className="stat-box"><span>{stats.totalUsers}</span><label>ຜູ້ໃຊ້ທັງໝົດ</label></div>
            <div className="stat-box"><span>{stats.employees}</span><label>ຜູ້ຊອກວຽກ</label></div>
            <div className="stat-box"><span>{stats.companies}</span><label>ບໍລິສັດ</label></div>
            <div className="stat-box"><span>{stats.totalJobs}</span><label>ວຽກທັງໝົດ</label></div>
            <div className="stat-box"><span>{stats.activeJobs}</span><label>ວຽກທີ່ເປີດຮັບ</label></div>
          </div>
        )}

        <div className="tabs">
          <button type="button" className={tab === 'reports' ? 'tab active' : 'tab'} onClick={() => setTab('reports')}>
            ລາຍງານກິດຈະກຳ
          </button>
          <button type="button" className={tab === 'userReports' ? 'tab active' : 'tab'} onClick={() => setTab('userReports')}>
            ລາຍງານການລະເມີດ
          </button>
        </div>

        {tab === 'reports' && (
          <div className="card">
            {reports.length === 0 ? (
              <p className="empty-text">ຍັງບໍ່ມີລາຍງານ</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ວັນທີ</th>
                    <th>ປະເພດ</th>
                    <th>ລາຍລະອຽດ</th>
                    <th>ຜູ້ໃຊ້</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.createdAt).toLocaleString('lo-LA')}</td>
                      <td><span className="badge">{r.type}</span></td>
                      <td>{r.message}</td>
                      <td>
                        {r.user?.profile?.companyName ||
                          `${r.user?.profile?.firstName || ''} ${r.user?.profile?.lastName || ''}`.trim() ||
                          r.user?.email ||
                          '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'userReports' && (
          <div className="card">
            {userReports.length === 0 ? (
              <p className="empty-text">ຍັງບໍ່ມີລາຍງານການລະເມີດ</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ວັນທີ</th>
                    <th>ຜູ້ລາຍງານ</th>
                    <th>ເປົ້າໝາຍ</th>
                    <th>ເຫດຜົນ</th>
                    <th>ລາຍລະອຽດ</th>
                    <th>ສະຖານະ</th>
                    <th style={{ textAlign: 'right' }}>ຈັດການ</th>
                  </tr>
                </thead>
                <tbody>
                  {userReports.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.createdAt).toLocaleString('lo-LA')}</td>
                      <td>{r.reporterName || '-'}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleViewTarget(r.targetType, r.targetId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title="ກົດເພື່ອເບິ່ງລາຍລະອຽດ"
                        >
                          <span className="badge" style={{ marginRight: '4px', cursor: 'pointer' }}>
                            {targetLabels[r.targetType] || r.targetType}
                          </span>
                          <code style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer' }}>
                            {r.targetId?.slice(0, 8)}...
                          </code>
                        </button>
                      </td>
                      <td>{reasonLabels[r.reason] || r.reason}</td>
                      <td>{r.description}</td>
                      <td>
                        <span className={`badge badge-status-${r.status === 'resolved' ? 'approved' : 'pending'}`}>
                          {r.status === 'resolved' ? 'ແກ້ໄຂແລ້ວ' : 'ລໍຖ້າກວດສອບ'}
                        </span>
                        {r.isWarned && (
                          <span className="badge" style={{ background: 'var(--warning)', color: 'black', marginLeft: '4px' }}>
                            ເຕືອນແລ້ວ
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          {r.status !== 'resolved' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{ background: 'var(--warning)', color: 'black' }}
                                disabled={r.isWarned}
                                onClick={() => handleWarn(r.id)}
                              >
                                {r.isWarned ? 'ເຕືອນແລ້ວ' : 'ເຕືອນຜູ້ໃຊ້'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{ background: 'var(--success)', color: 'white' }}
                                onClick={() => handleResolve(r.id)}
                              >
                                ແກ້ໄຂແລ້ວ
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {detailLoading && (
        <div className="loading-screen" style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="spinner" />
        </div>
      )}

      {viewingDetail && (
        <DetailModal
          title={viewingDetail.type === 'job' ? viewingDetail.data.title : viewingDetail.data.profile?.companyName || `${viewingDetail.data.profile?.firstName || ''} ${viewingDetail.data.profile?.lastName || ''}`.trim() || 'ລາຍລະອຽດ'}
          onClose={() => setViewingDetail(null)}
        >
          {viewingDetail.type === 'job'
            ? renderJobDetail(viewingDetail.data)
            : viewingDetail.data.role === 'company'
            ? renderCompanyDetail(viewingDetail.data)
            : renderResumeDetail(viewingDetail.data)}
        </DetailModal>
      )}
    </div>
  );
}
