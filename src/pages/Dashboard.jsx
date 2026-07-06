import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { IconGroup, IconUser, IconCompany, IconDoc, IconInbox } from '../components/Icons';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const promises = [api.getDashboard()];
    if (user.role === 'admin') {
      promises.push(api.getAdminReports());
    }

    Promise.all(promises)
      .then(([dashboardData, reportsData]) => {
        setData(dashboardData);
        if (reportsData) {
          setReports(reportsData.reports || []);
        }
      })
      .catch((err) => {
        console.error('Error fetching dashboard data:', err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentJobs = data?.recentJobs || [];

  return (
    <div className="page">
      <div className="container">
        
        {/* Dashboard Header */}
        <div className="page-header">
          <div>
            <h1>ແດຊບອດ (Dashboard)</h1>
            <p className="page-desc">
              {user?.role === 'admin' && 'ຍິນດີຕ້ອນຮັບ, ຜູ້ດູແລລະບົບ'}
              {user?.role === 'company' && `ຍິນດີຕ້ອນຮັບ, ${user.profile?.companyName || 'ບໍລິສັດ'}`}
              {user?.role === 'employees' && `ຍິນດີຕ້ອນຮັບ, ${user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'ຜູ້ຊອກວຽກ'}`}
            </p>
          </div>
        </div>

        {/* ─── ADMIN DASHBOARD VIEW ─── */}
        {user?.role === 'admin' && (
          <>
            <div className="stats-grid">
              <StatCard label="ຜູ້ໃຊ້ທັງໝົດ" value={stats.totalUsers} icon={<IconGroup size={24} />} />
              <StatCard label="ຜູ້ຊອກວຽກ" value={stats.employees} icon={<IconUser size={24} />} />
              <StatCard label="ບໍລິສັດ" value={stats.companies} icon={<IconCompany size={24} />} />
              <StatCard label="ວຽກທັງໝົດ" value={stats.totalJobs} icon={<IconDoc size={24} />} />
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2>ລາຍງານລະບົບຫຼ້າສຸດ</h2>
                <Link to="/admin/reports" className="link" style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>ເບິ່ງທັງໝົດ</Link>
              </div>

              {reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <IconInbox size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <p className="empty-text">ຍັງບໍ່ມີລາຍງານບັນຫາ</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ວັນທີ</th>
                        <th>ປະເພດ</th>
                        <th>ລາຍລະອຽด</th>
                        <th>ຜູ້ແຈ້ງ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.slice(0, 5).map((r) => (
                        <tr key={r.id}>
                          <td>{new Date(r.createdAt).toLocaleDateString('lo-LA')}</td>
                          <td>
                            <span className="badge badge-status-rejected" style={{ textTransform: 'capitalize' }}>
                              {r.targetType}
                            </span>
                          </td>
                          <td>{r.description}</td>
                          <td>
                            {r.reporter?.profile
                              ? `${r.reporter.profile.firstName} ${r.reporter.profile.lastName}`
                              : r.reporter?.email || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── COMPANY DASHBOARD VIEW ─── */}
        {user?.role === 'company' && (
          <>
            <div className="stats-grid">
              <StatCard label="ວຽກທີ່ປະກາດທັງໝົດ" value={stats.postedJobs} icon={<IconDoc size={24} />} />
              <StatCard label="ປະກາດວຽກທີ່ເປີດຢູ່" value={stats.activeJobs} icon={<IconDoc size={24} style={{ color: 'var(--success)' }} />} />
              <StatCard label="ໃບສະໝັກທີ່ໄດ້ຮັບ" value={stats.totalApplications} icon={<IconUser size={24} />} />
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2>ປະກາດວຽກຫຼ້າສຸດ</h2>
                <Link to="/profile" className="btn btn-outline btn-sm">ຈັດການປະກາດວຽກ</Link>
              </div>

              {recentJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <IconInbox size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <p className="empty-text">ຍັງບໍ່ມີວຽກທີ່ປະກາດເທື່ອ</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ຊື່ວຽກ</th>
                        <th>ສະຖານທີ່</th>
                        <th>ເງິນເດືອນ</th>
                        <th>ສະຖານະ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentJobs.map((job) => (
                        <tr key={job.id}>
                          <td style={{ fontWeight: '600' }}>{job.title}</td>
                          <td>{job.location}</td>
                          <td>{job.salary}</td>
                          <td>
                            <span className={`badge ${job.status === 'active' ? 'badge-status-approved' : 'badge-status-rejected'}`}>
                              {job.status === 'active' ? 'ເປີດຮັບສະໝັກ' : 'ປິດຮັບສະໝັກ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── EMPLOYEES / SEEKER DASHBOARD VIEW ─── */}
        {user?.role === 'employees' && (
          <>
            <div className="stats-grid">
              <StatCard label="ວຽກທີ່ເປີດຮັບສະໝັກ" value={stats.availableJobs} icon={<IconDoc size={24} />} />
              <StatCard label="ບໍລິສັດທັງໝົດໃນລະບົບ" value={stats.totalCompanies} icon={<IconCompany size={24} />} />
              <StatCard label="ວຽກທີ່ສະໝັກແລ້ວ" value={stats.totalApplications} icon={<IconUser size={24} />} />
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2>ວຽກຫຼ້າສຸດທີ່ແນະນຳ</h2>
                <Link to="/jobs" className="btn btn-primary btn-sm">ຄົ້ນຫາວຽກທັງໝົດ</Link>
              </div>

              {recentJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <IconInbox size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <p className="empty-text">ຍັງບໍ່ມີວຽກທີ່ປະກາດເທື່ອ</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="card box-interactive"
                      style={{ padding: '1.25rem', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}
                    >
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{job.title}</h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {job.companyName} · {job.location} · {job.salary}
                        </p>
                      </div>
                      <Link to="/jobs" className="btn btn-outline btn-sm">ເບິ່ງລາຍລະອຽດ</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-box dashboard-stat" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)' }}>
      <span className="stat-icon" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</span>
      <span className="stat-value" style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{value ?? 0}</span>
      <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</label>
    </div>
  );
}
