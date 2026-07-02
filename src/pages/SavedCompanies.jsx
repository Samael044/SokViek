import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DetailModal from '../components/DetailModal';
import { IconCompany, IconInbox } from '../components/Icons';
import { formatDateDMY } from '../utils/date';

export default function SavedCompanies() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadSavedCompanies = async () => {
    setLoading(true);
    try {
      const data = await api.getSavedCompanies();
      setCompanies(data.companies || []);
    } catch (err) {
      console.error(err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'employees') {
      navigate('/');
      return;
    }
    loadSavedCompanies();
  }, [user]);

  const handleUnsave = async (e, companyId) => {
    e.stopPropagation(); // prevent opening details modal
    if (!window.confirm('ต้องการເອົາບໍລິສັດນີ້ອອກຈາກລາຍການບັນທຶກ?')) return;
    setActionLoading(true);
    try {
      await api.unsaveCompany(companyId);
      setCompanies((prev) => prev.filter((c) => c.id !== companyId));
      if (selected && selected.id === companyId) {
        setSelected(null);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const renderCompanyDetail = (item) => (
    <>
      <div className="detail-meta">
        <span className="tag tag-job" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <IconCompany size={14} /> ບໍລິສັດ
        </span>
        <span className="tag">{item.profile?.companyName}</span>
      </div>
      <p className="detail-desc">{item.profile?.about || 'ບໍ່ມີຂໍ້ມູນອະທິບາຍກ່ຽວກັບບໍລິສັດ'}</p>
      
      <dl className="detail-dl">
        <dt>ອີເມລຕິດຕໍ່</dt><dd>{item.profile?.companyEmail || item.email || '-'}</dd>
        <dt>ເບີໂທລະສັບ</dt><dd>{item.profile?.phone || item.phone || '-'}</dd>
        <dt>ທີ່ຢູ່</dt><dd>{item.profile?.address || '-'}</dd>
      </dl>

      <div style={{ marginTop: '1.5rem' }}>
        <button
          type="button"
          className="btn btn-outline"
          style={{ width: '100%', color: 'var(--error)', borderColor: 'var(--error)' }}
          disabled={actionLoading}
          onClick={(e) => handleUnsave(e, item.id)}
        >
          ເອົາອອກຈາກລາຍການບັນທຶກ
        </button>
      </div>
    </>
  );

  return (
    <div className="page page-board">
      <div className="container">
        
        {/* ─── Board Header ─── */}
        <header className="board-header">
          <div>
            <h1>ບໍລິສັດທີ່ບັນທຶກ</h1>
            <p className="page-desc">ລາຍຊື່ບໍລິສັດທີ່ທ່ານບັນທຶກໄວ້ເພື່ອຕິດຕາມ</p>
          </div>
        </header>

        <section className="grid-board home-grid-board">
          {loading ? (
            <div className="loading-screen"><div className="spinner" /></div>
          ) : companies.length === 0 ? (
            <div className="empty-state empty-state-board">
              <IconInbox size={48} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
              <p>ຍັງບໍ່ມີບໍລິສັດທີ່ບັນທຶກໄວ້</p>
            </div>
          ) : (
            <div className="grid-tiles">
              {companies.map((c) => {
                const displayName = c.profile?.companyName || c.email || 'ບໍລິສັດ';
                
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="grid-tile grid-tile-premium grid-tile-job"
                    onClick={() => setSelected(c)}
                  >
                    {/* Banner Area */}
                    <div className="tile-banner">
                      <span className="tile-type-badge-premium tile-type-job">
                        ບໍລິສັດ
                      </span>
                    </div>

                    {/* Overlapping Section */}
                    <div className="tile-overlap">
                      <div className="tile-logo-wrapper">
                        {c.profile?.logo ? (
                          <img src={c.profile.logo} alt="" className="tile-logo-img" style={{ objectFit: 'contain' }} />
                        ) : (
                          <IconCompany size={24} className="tile-logo-fallback" />
                        )}
                      </div>
                    </div>

                    {/* Details Section */}
                    <div className="tile-details">
                      <h3 className="tile-title-premium" title={displayName}>{displayName}</h3>
                      <p className="tile-subtitle-premium" title={c.profile?.address}>
                        {c.profile?.address || 'ບໍ່ໄດ້ລະບຸທີ່ຢູ່'}
                      </p>
                      <p className="tile-meta-premium">
                        ອີເມວ: {c.profile?.companyEmail || c.email || 'ບໍ່ມີຂໍ້ມູນ'}
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
          title={selected.profile?.companyName || 'ລາຍລະອຽດບໍລິສັດ'}
          onClose={() => setSelected(null)}
        >
          {renderCompanyDetail(selected)}
        </DetailModal>
      )}
    </div>
  );
}
