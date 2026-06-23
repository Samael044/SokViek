import { useState, useEffect } from 'react';
import { api } from '../api/client';

const roleLabels = { admin: 'ຜູ້ດູແລລະບົບ', company: 'ບໍລິສັດ', employees: 'ຜູ້ຊອກວຽກ' };

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('reports');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [reportsData, usersData, statsData] = await Promise.all([
          api.getAdminReports(),
          api.getAdminUsers(),
          api.getAdminStats(),
        ]);
        setReports(reportsData.reports);
        setUsers(usersData.users);
        setStats(statsData.stats);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>ລາຍງານຜູ້ດູແລລະບົບ</h1>
            <p className="page-desc">ຕິດຕາມກິດຈະກຳ ແລະ ຜູ້ໃຊ້ງານໃນລະບົບ</p>
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
          <button type="button" className={tab === 'users' ? 'tab active' : 'tab'} onClick={() => setTab('users')}>
            ຜູ້ໃຊ້ທັງໝົດ
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

        {tab === 'users' && (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ຊື່/ບໍລິສັດ</th>
                  <th>ອີເມວ/ເບີ</th>
                  <th>ບົດບາດ</th>
                  <th>ວັນທີສະໝັກ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.profile?.companyName ||
                        `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() ||
                        '-'}
                    </td>
                    <td>{u.email || u.phone || '-'}</td>
                    <td><span className="badge">{roleLabels[u.role] || u.role || 'ລໍຖ້າເລືອກບົດບາດ'}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString('lo-LA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
