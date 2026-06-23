import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { JOB_TYPES } from '../constants/jobTypes';
import DetailModal from '../components/DetailModal';
import { IconCompany, IconUser, IconPhone, IconMail, IconInbox } from '../components/Icons';

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

  const handleTileClick = (item) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelected(item);
  };

  const renderJobDetail = (job) => (
    <>
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
        <dt>ເງินເດືອນ</dt><dd>{job.salary}</dd>
        {job.requirements && <><dt>ຄຸນສົມບັດ</dt><dd>{job.requirements}</dd></>}
        <dt>ວັນທີປະກາດ</dt>
        <dd>{new Date(job.createdAt).toLocaleDateString('lo-LA')}</dd>
        {job.company?.about && <><dt>ກ່ຽວກັບບໍລິສັດ</dt><dd>{job.company.about}</dd></>}
      </dl>
    </>
  );

  const renderResumeDetail = (item) => (
    <>
      <div className="detail-meta">
        <span className="tag tag-resume" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <IconUser size={14} /> ພະນັກງານ
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
      {canContact && item.contact ? (
        <div className="contact-box">
          <strong>ຕິດຕໍ່</strong>
          {item.contact.phone && (
            <a href={`tel:${item.contact.phone}`} className="contact-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <IconPhone size={14} /> {item.contact.phone}
            </a>
          )}
          {item.contact.email && (
            <a href={`mailto:${item.contact.email}`} className="contact-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <IconMail size={14} /> {item.contact.email}
            </a>
          )}
        </div>
      ) : user?.role === 'employees' ? (
        <p className="board-hint"></p>
      ) : null}
    </>
  );

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero-box">
            <div className="hero-actions">
              <Link to="/jobs" className="btn btn-primary btn-lg">ເບິ່ງປະກາດງານ</Link>
              <Link to="/employees" className="btn btn-outline btn-lg">ເບິ່ງພະນັກງານ</Link>
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
        <DetailModal title={selected.title} onClose={() => setSelected(null)}>
          {selected.type === 'job'
            ? renderJobDetail(selected.data)
            : renderResumeDetail(selected.data)}
        </DetailModal>
      )}
    </div>
  );
}
