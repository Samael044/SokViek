import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { JOB_TYPES } from '../constants/jobTypes';
import DetailModal from '../components/DetailModal';
import PostJobFab from '../components/PostJobFab';
import { IconCompany, IconUser, IconPhone, IconMail, IconInbox } from '../components/Icons';

export default function Feed({ mode, title, desc, empty }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ position: '' });
    const [selected, setSelected] = useState(null);
    const [applied, setApplied] = useState(false);
    const [applyLoading, setApplyLoading] = useState(false);

    const canContact = user?.role === 'company' || user?.role === 'admin';

    const loadFeed = async (params = filters) => {
        setLoading(true);
        try {
            const query = { type: mode };
            if (params.position) query.position = params.position;
            const data = await api.getFeed(query);
            setItems(data.items);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeed();
    }, [mode]);

    const handleSearch = (e) => {
        e.preventDefault();
        loadFeed(filters);
    };

    const handleReset = () => {
        const empty = { position: '' };
        setFilters(empty);
        loadFeed(empty);
    };

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
            } catch (err) {
                console.error(err);
            }
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
                            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                            disabled={applyLoading}
                            onClick={() => handleApply(job.id)}
                        >
                            {applyLoading ? 'ກຳລັງສະໝັກ...' : 'ສະໝັກງານ'}
                        </button>
                    )}
                </div>
            )}
        </>
    );

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
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '1rem' }}>
                    <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '0.5rem', color: 'var(--text)' }}>ຮູບພາບ Resume / CV:</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {item.resume.resumeImages.map((img, idx) => (
                            <a
                                key={idx}
                                href={img}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-strong)',
                                    overflow: 'hidden',
                                    boxShadow: 'var(--shadow-sm)',
                                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                                    cursor: 'pointer',
                                    backgroundColor: '#fff'
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
                            </a>
                        ))}
                    </div>
                </div>
            )}
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
        <div className="page page-board">
            <div className="container">
                <header className="board-header">
                    <div>
                        <h1>{title}</h1>
                        <p className="page-desc">{desc}</p>
                    </div>
                    {!user && (
                        <Link to="/login" className="btn btn-primary btn-sm">ເຂົ້າສູ່ລະບົບເພື່ອເບິ່ງລາຍລະອຽດ</Link>
                    )}
                </header>

                <div className="box box-search board-search">
                    <form className="search-form" onSubmit={handleSearch}>
                        <label className="search-inline-label">ຕຳແໜ່ງງານ</label>
                        <div className="search-inline">
                            <input
                                className="search-inline-input"
                                placeholder="ຕົວຢ່າງ: Frontend Developer"
                                value={filters.position}
                                onChange={(e) => setFilters({ position: e.target.value })}
                            />
                            <div className="search-inline-actions">
                                <button type="submit" className="btn btn-primary btn-sm">ຄົ້ນຫາ</button>
                                <button type="button" className="btn btn-outline btn-sm" onClick={handleReset}>ລ້າງ</button>
                            </div>
                        </div>
                    </form>
                </div>

                <section className="grid-board">
                    {loading ? (
                        <div className="loading-screen"><div className="spinner" /></div>
                    ) : items.length === 0 ? (
                        <div className="empty-state empty-state-board">
                            <IconInbox size={48} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                            <p>{empty || 'ຍັງບໍ່ມີລາຍການ'}</p>
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
                                            {item.type === 'job' ? 'ປະກາດງານ' : 'ພະນັກງານ'}
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
                </section>

            </div>

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

            {mode === 'job' && user?.role === 'company' && (
                <PostJobFab to="/profile" state={{ openJobForm: true }} />
            )}
        </div>
    );
}
