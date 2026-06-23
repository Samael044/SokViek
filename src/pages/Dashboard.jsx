import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { IconGroup, IconUser, IconCompany, IconDoc } from '../components/Icons';

const reportTypeLabels = {
  job_posted: 'ປະກາດງານ',
  resume_posted: 'ໂພສເຣຊູເມ',
  user_complaint: 'ແຈ້ງບັນຫາການໃຊ້ງານ',
  misuse: 'ການໃຊ້ງານຜິດຈຸດປະສົງ',
};

function reportTypeLabel(type) {
  return reportTypeLabels[type] || type;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getAdminReports()])
      .then(([dashboardData, reportsData]) => {
        setData(dashboardData);
        setReports(reportsData.reports || []);
      })
      .catch(() => {
        setData(null);
        setReports([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p className="page-desc">ຍິນດີຕ້ອນຮັບ, ຜູ້ດູແລລະບົບ</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard label="ຜູ້ໃຊ້ທັງໝົດ" value={stats.totalUsers} icon={<IconGroup size={24} />} />
          <StatCard label="ຜູ້ຊອກວຽກ" value={stats.employees} icon={<IconUser size={24} />} />
          <StatCard label="ບໍລິສັດ" value={stats.companies} icon={<IconCompany size={24} />} />
          <StatCard label="ວຽກທັງໝົດ" value={stats.totalJobs} icon={<IconDoc size={24} />} />
        </div>

        {/* <div className="card dashboard-reports-card">
          <div className="dashboard-reports-header">
            <h2>ລາຍງານລະບົບ</h2>
            <p className="page-desc dashboard-reports-desc"></p>
          </div>

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
                    <td>
                      <span className="badge">{reportTypeLabel(r.type)}</span>
                    </td>
                    <td>{r.message}</td>
                    <td>
                      {r.user?.profile?.companyName ||
                        `${r.user?.profile?.firstName || ''} ${r.user?.profile?.lastName || ''}`.trim() ||
                        r.user?.email ||
                        r.user?.phone ||
                        '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div> */}

        {data?.recentJobs?.length > 0 && (
          <div className="card">
            <h2>ວຽກຫຼ້າສຸດ</h2>
            <ul className="recent-list">
              {data.recentJobs.map((job) => (
                <li key={job.id}>
                  <strong>{job.title}</strong>
                  <span>
                    {job.location} · {job.salary}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-box dashboard-stat">
      <span className="stat-icon">{icon}</span>
      <span className="stat-value">{value ?? 0}</span>
      <label>{label}</label>
    </div>
  );
}
