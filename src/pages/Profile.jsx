import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, calculateAge, fileToBase64 } from '../api/client';
import BirthDateInput from '../components/BirthDateInput';
import { formatDateLao, formatDateDMY } from '../utils/date';
import { JOB_TYPES, JOB_TYPE_OPTIONS } from '../constants/jobTypes';
import PostJobFab from '../components/PostJobFab';
import { IconUser, IconCompany, IconGear, IconPhone, IconMail, IconDoc, IconMapPin, IconSearch } from '../components/Icons';
import DetailModal from '../components/DetailModal';

const maritalLabels = { single: 'ໂສດ', dating: 'ມີແຟນແລ້ວ', married: 'ແຕ່ງງານແລ້ວ' };
const genderLabels = { male: 'ຊາຍ', female: 'ຍິງ', other: 'ອື່นໆ' };

export default function Profile() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const [editing, setEditing] = useState(false);
  const [editingResume, setEditingResume] = useState(false);
  const [form, setForm] = useState({});
  const [resumeForm, setResumeForm] = useState({
    desiredPosition: '',
    jobType: 'full-time',
    summary: '',
    skills: '',
    experience: '',
    education: '',
    published: false,
    resumeImages: [],
  });
  const [message, setMessage] = useState('');
  const [resumeMessage, setResumeMessage] = useState('');
  const [error, setError] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [myJobs, setMyJobs] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '', description: '', salary: '', location: '', requirements: '', type: 'full-time',
  });
  const [jobMessage, setJobMessage] = useState('');
  const [jobError, setJobError] = useState('');
  const [jobLoading, setJobLoading] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [selectedApplicantForDetail, setSelectedApplicantForDetail] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const [activeDropdownJobId, setActiveDropdownJobId] = useState(null);
  const [hireLoading, setHireLoading] = useState(false);
  const [hiredApplicationIds, setHiredApplicationIds] = useState(new Set());

  useEffect(() => {
    const handleClose = () => setActiveDropdownJobId(null);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, []);

  useEffect(() => {
    if (user?.profile) {
      // Normalize birthDate: strip time portion if MySQL returns full ISO timestamp
      const profile = { ...user.profile };
      if (profile.birthDate && typeof profile.birthDate === 'string' && profile.birthDate.includes('T')) {
        profile.birthDate = profile.birthDate.split('T')[0];
      }
      setForm(profile);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'employees') {
      api.getMyResume()
        .then((data) => {
          if (data.resume) {
            setResumeForm({
              desiredPosition: data.resume.desiredPosition || '',
              jobType: data.resume.jobType || 'full-time',
              summary: data.resume.summary || '',
              skills: data.resume.skills || '',
              experience: data.resume.experience || '',
              education: data.resume.education || '',
              published: data.resume.published || false,
              resumeImages: data.resume.resumeImages || (data.resume.resumeImage ? [data.resume.resumeImage] : []),
            });
          }
        })
        .catch(() => { });
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'company' || user?.role === 'admin') {
      api.getJobs()
        .then((data) => {
          const mine = user.role === 'admin'
            ? data.jobs
            : data.jobs.filter((j) => j.companyId === user.id);
          setMyJobs(mine);
        })
        .catch(() => setMyJobs([]));
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.openJobForm && user?.role === 'company') {
      setShowJobForm(true);
      setTimeout(() => {
        document.getElementById('company-jobs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, user]);

  const openJobForm = () => {
    setEditingJobId(null);
    setJobForm({ title: '', description: '', salary: '', location: '', requirements: '', type: 'full-time' });
    setShowJobForm(true);
    document.getElementById('company-jobs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleHire = async (applicant) => {
    if (!selectedJobForApplicants) return;
    try {
      setHireLoading(true);
      await api.hireApplicant(selectedJobForApplicants.id, applicant.id);
      setHiredApplicationIds((prev) => new Set([...prev, applicant.id]));
      alert(`ສົ່ງການສະເໜີຈ້າງໃຫ້ ${applicant.user.profile ? `${applicant.user.profile.firstName} ${applicant.user.profile.lastName}` : applicant.user.email} ສຳເລັດ!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setHireLoading(false);
    }
  };

  const handleEditClick = (job) => {
    setEditingJobId(job.id);
    setJobForm({
      title: job.title || '',
      description: job.description || '',
      salary: job.salary || '',
      location: job.location || '',
      requirements: job.requirements || '',
      type: job.type || 'full-time',
    });
    setShowJobForm(true);
    document.getElementById('company-jobs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setJobError('');
    setJobLoading(true);
    try {
      if (editingJobId) {
        await api.updateJob(editingJobId, jobForm);
        setJobMessage('ແກ້ໄຂປະກາດງານສຳເລັດ');
      } else {
        await api.postJob(jobForm);
        setJobMessage('ປະກາດງານສຳເລັດ');
      }
      setJobForm({ title: '', description: '', salary: '', location: '', requirements: '', type: 'full-time' });
      setEditingJobId(null);
      setShowJobForm(false);
      const data = await api.getJobs();
      const mine = user.role === 'admin' ? data.jobs : data.jobs.filter((j) => j.companyId === user.id);
      setMyJobs(mine);
      setTimeout(() => setJobMessage(''), 3000);
    } catch (err) {
      setJobError(err.message);
    } finally {
      setJobLoading(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('ລຶບປະກາດງານນີ້?')) return;
    try {
      await api.deleteJob(id);
      setMyJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      setJobError(err.message);
    }
  };

  const handleViewApplicants = async (job) => {
    setSelectedJobForApplicants(job);
    setLoadingApplicants(true);
    setApplicants([]);
    try {
      const data = await api.getJobApplications(job.id);
      setApplicants(data.applications || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleViewResumeImage = (img) => {
    const newTab = window.open();
    if (newTab) {
      newTab.document.body.style.margin = '0';
      newTab.document.body.style.background = '#0e1111';
      newTab.document.body.style.display = 'flex';
      newTab.document.body.style.justifyContent = 'center';
      newTab.document.body.style.alignItems = 'center';
      newTab.document.body.style.height = '100vh';
      const image = newTab.document.createElement('img');
      image.src = img;
      image.style.maxWidth = '100%';
      image.style.maxHeight = '100%';
      image.style.objectFit = 'contain';
      newTab.document.body.appendChild(image);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    if (user.role === 'company') {
      setForm((f) => ({ ...f, logo: base64 }));
    } else {
      setForm((f) => ({ ...f, avatar: base64 }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // ລຶບ field ທີ່ server inject ເຊັ່ນ age ອອກກ່ອນສົ່ງ
      const { age: _age, ...profileToSave } = form;
      if (user.role === 'employees') {
        profileToSave.location = [profileToSave.village, profileToSave.district, profileToSave.province].filter(Boolean).join(', ');
      }
      const data = await api.updateProfile(profileToSave);
      updateUser(data.user);
      setMessage('ບັນທຶກຂໍ້ມູນສຳເລັດ');
      setEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResume = async (e) => {
    e.preventDefault();
    setResumeError('');
    setResumeLoading(true);
    try {
      const data = await api.saveResume(resumeForm);
      updateUser(data.user);
      setResumeMessage(data.message);
      setEditingResume(false);
      setTimeout(() => setResumeMessage(''), 3000);
    } catch (err) {
      setResumeError(err.message);
    } finally {
      setResumeLoading(false);
    }
  };

  const handleResumeImageChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newImages = [];
    for (let i = 0; i < files.length; i++) {
      const base64 = await fileToBase64(files[i]);
      newImages.push(base64);
    }
    setResumeForm((f) => ({
      ...f,
      resumeImages: [...(f.resumeImages || []), ...newImages],
    }));
  };

  const age = form.birthDate ? calculateAge(form.birthDate) : user?.profile?.age;

  const renderJobseekerProfile = () => (
    <>
      <div className="profile-avatar-section">
        <div className="profile-avatar">
          {form.avatar ? <img src={form.avatar} alt="profile" /> : <IconUser size={48} style={{ color: 'var(--text-muted)' }} />}
        </div>
        {editing && (
          <label className="btn btn-outline btn-sm avatar-edit-btn">
            ປ່ຽນຮູບ
            <input type="file" accept="image/*" hidden onChange={handleImageChange} />
          </label>
        )}
      </div>
      {editing ? (
        <form onSubmit={handleSave} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>ຊື່</label>
              <input value={form.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>ນາມສະກຸນ</label>
              <input value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>ເພດ</label>
            <select value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="male">ຊາຍ</option>
              <option value="female">ຍິງ</option>
              <option value="other">ອື່ນໆ</option>
            </select>
          </div>
          <BirthDateInput
            value={form.birthDate || ''}
            onChange={(birthDate) => setForm({ ...form, birthDate })}
            ageBadge={age !== null ? <span className="age-badge">ອາຍຸ {age} ປີ</span> : null}
            required
          />
          <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="form-group">
              <label>ບ້ານ</label>
              <input value={form.village || ''} onChange={(e) => setForm({ ...form, village: e.target.value })} placeholder="ບ້ານ" />
            </div>
            <div className="form-group">
              <label>ເມືອງ</label>
              <input value={form.district || ''} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="ເມືອງ" />
            </div>
            <div className="form-group">
              <label>ແຂວງ</label>
              <input value={form.province || ''} onChange={(e) => setForm({ ...form, province: e.target.value })} placeholder="ແຂວງ" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>ສະຖານະ</label>
              <select value={form.maritalStatus || ''} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}>
                <option value="single">ໂສດ</option>
                <option value="dating">ມີແຟນແລ້ວ</option>
                <option value="married">ແຕ່ງງານແລ້ວ</option>
              </select>
            </div>
            <div className="form-group">
              <label>ເບີໂທ</label>
              <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="profile-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>ບັນທຶກ</button>
            <button type="button" className="btn btn-outline" onClick={() => { setEditing(false); setForm({ ...user.profile }); }}>ຍົກເລີກ</button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <h2>{user.profile?.firstName} {user.profile?.lastName}</h2>
          <dl>
            <dt>ເພດ</dt><dd>{genderLabels[user.profile?.gender] || '-'}</dd>
            <dt>ວັນເກີດ</dt><dd>{formatDateDMY(user.profile?.birthDate)} (ອາຍຸ {age ?? '-'} ປີ)</dd>
            <dt>ສະຖານທີ່ຢູ່</dt><dd>{[user.profile?.village, user.profile?.district, user.profile?.province].filter(Boolean).join(', ') || user.profile?.location || '-'}</dd>
            <dt>ສະຖານະ</dt><dd>{maritalLabels[user.profile?.maritalStatus] || '-'}</dd>
            <dt>ເບີໂທ</dt><dd>{user.profile?.phone || '-'}</dd>
            <dt>ອີເມว/ເບີ</dt><dd>{user.email || user.phone || '-'}</dd>
          </dl>
        </div>
      )}
    </>
  );

  const renderCompanyProfile = () => (
    <>
      <div className="profile-avatar-section">
        <div className="profile-avatar company-logo">
          {form.logo ? <img src={form.logo} alt="logo" /> : <IconCompany size={48} style={{ color: 'var(--text-muted)' }} />}
        </div>
        {editing && (
          <label className="btn btn-outline btn-sm avatar-edit-btn">
            ປ່ຽນໂລໂກ້
            <input type="file" accept="image/*" hidden onChange={handleImageChange} />
          </label>
        )}
      </div>
      {editing ? (
        <form onSubmit={handleSave} className="profile-form">
          <div className="form-group">
            <label>ຊື່ບໍລິສັດ</label>
            <input value={form.companyName || ''} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Gmail ບໍລິສັດ</label>
            <input type="email" value={form.companyEmail || ''} onChange={(e) => setForm({ ...form, companyEmail: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>ທີ່ຢູ່</label>
            <textarea value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} />
          </div>
          <div className="form-group">
            <label>ເບີໂທ</label>
            <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>ກ່ຽວກັບບໍລິສັດ</label>
            <textarea value={form.about || ''} onChange={(e) => setForm({ ...form, about: e.target.value })} rows={3} placeholder="ບອກເລົ່າກ່ຽວກັບບໍລິສັດຂອງທ່ານ..." />
          </div>
          <div className="profile-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>ບັນທຶກ</button>
            <button type="button" className="btn btn-outline" onClick={() => { setEditing(false); setForm({ ...user.profile }); }}>ຍົກເລີກ</button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <h2>{user.profile?.companyName}</h2>
          <dl>
            <dt>Gmail</dt><dd>{user.profile?.companyEmail || '-'}</dd>
            <dt>ທີ່ຢູ່</dt><dd>{user.profile?.address || '-'}</dd>
            <dt>ເບີໂທ</dt><dd>{user.profile?.phone || '-'}</dd>
            <dt>ກ່ຽວກັບບໍລິສັດ</dt><dd>{user.profile?.about || '-'}</dd>
          </dl>
        </div>
      )}
    </>
  );

  const renderAdminProfile = () => (
    <>
      <div className="profile-avatar-section">
        <div className="profile-avatar">
          {form.avatar ? <img src={form.avatar} alt="admin" /> : <IconGear size={48} style={{ color: 'var(--text-muted)' }} />}
        </div>
        {editing && (
          <label className="btn btn-outline btn-sm avatar-edit-btn">
            ປ່ຽນຮູບ
            <input type="file" accept="image/*" hidden onChange={handleImageChange} />
          </label>
        )}
      </div>
      {editing ? (
        <form onSubmit={handleSave} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>ຊື່</label>
              <input value={form.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>ນາມສະກຸນ</label>
              <input value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="profile-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>ບັນທຶກ</button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>ຍົກເລີກ</button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <h2>{user.profile?.firstName} {user.profile?.lastName}</h2>
          <dl>
            <dt>ບົດບາດ</dt><dd>ຜູ້ດູແລລະບົບ</dd>
            <dt>ອີເມວ</dt><dd>{user.email}</dd>
          </dl>
        </div>
      )}
    </>
  );

  return (
    <div className="page">
      <div className="container container-sm">
        <div className="page-header">
          <h1>ໂປຣໄຟລ໌</h1>
          {!editing && (
            <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
              ແກ້ໄຂຂໍ້ມູນ
            </button>
          )}
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="box profile-card">
          {user.role === 'employees' && renderJobseekerProfile()}
          {user.role === 'company' && renderCompanyProfile()}
          {user.role === 'admin' && renderAdminProfile()}
        </div>

        {user.role === 'employees' && (
          <div className="box resume-profile-card">
            <div className="box-results-header">
              <h2 className="box-title">Resume ຂອງຂ້ອຍ</h2>
              {!editingResume && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditingResume(true)}>
                  {resumeForm.published ? 'ແກ້ໄຂ Resume' : 'ໂພສ Resume'}
                </button>
              )}
            </div>

            {resumeMessage && <div className="alert alert-success">{resumeMessage}</div>}
            {resumeError && <div className="alert alert-error">{resumeError}</div>}
            <div className="form-group">
              <label>ແນະນຳຕົວ *</label>
              <textarea
                value={resumeForm.summary}
                onChange={(e) => setResumeForm({ ...resumeForm, summary: e.target.value })}
                rows={3}
                required
              />
            </div>
            {editingResume ? (
              <form onSubmit={handleSaveResume}>
                <div className="form-row">
                  <div className="form-group">
                    <label>ຕຳແໜ່ງທີ່ຕ້ອງການ *</label>
                    <input
                      value={resumeForm.desiredPosition}
                      onChange={(e) => setResumeForm({ ...resumeForm, desiredPosition: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>ປະເພດວຽກ *</label>
                    <select
                      value={resumeForm.jobType}
                      onChange={(e) => setResumeForm({ ...resumeForm, jobType: e.target.value })}
                    >
                      {JOB_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>ທັກສະ</label>
                  <input
                    value={resumeForm.skills || ''}
                    onChange={(e) => setResumeForm({ ...resumeForm, skills: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>ປະສົບການເຮັດວຽກ</label>
                  <textarea
                    value={resumeForm.experience || ''}
                    onChange={(e) => setResumeForm({ ...resumeForm, experience: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>ການສຶກສາ</label>
                  <input
                    value={resumeForm.education || ''}
                    onChange={(e) => setResumeForm({ ...resumeForm, education: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Resume / CV </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                    {(resumeForm.resumeImages || []).map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '120px', height: '120px', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ position: 'absolute', top: '2px', right: '2px', padding: '2px 6px', fontSize: '10px' }}
                          onClick={() => {
                            const updated = [...resumeForm.resumeImages];
                            updated.splice(idx, 1);
                            setResumeForm({ ...resumeForm, resumeImages: updated });
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <label className="btn btn-outline" style={{ cursor: 'pointer', width: '120px', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: '12px', gap: '4px', border: '2px dashed var(--border-strong)', margin: 0 }}>
                      <span>+ ອັບໂຫລດ</span>
                      <input type="file" accept="image/*" multiple hidden onChange={handleResumeImageChange} />
                    </label>
                  </div>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={resumeForm.published}
                    onChange={(e) => setResumeForm({ ...resumeForm, published: e.target.checked })}
                  />
                  ເຜີຍແຜ່ Resume
                </label>
                <div className="profile-actions">
                  <button type="submit" className="btn btn-primary" disabled={resumeLoading}>
                    {resumeLoading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ Resume'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setEditingResume(false)}>
                    ຍົກເລີກ
                  </button>
                </div>
              </form>
            ) : resumeForm.published ? (
              <dl className="resume-view">
                <dt>ຕຳແໜ່ງທີ່ຕ້ອງການ</dt><dd>{resumeForm.desiredPosition}</dd>
                <dt>ປະເພດວຽກ</dt><dd>{JOB_TYPES[resumeForm.jobType]}</dd>
                <dt>ແນະນຳຕົວ</dt><dd>{resumeForm.summary}</dd>
                {resumeForm.skills && <><dt>ທັກສະ</dt><dd>{resumeForm.skills}</dd></>}
                {resumeForm.experience && <><dt>ປະສົບການ</dt><dd>{resumeForm.experience}</dd></>}
                {resumeForm.education && <><dt>ການສຶກສາ</dt><dd>{resumeForm.education}</dd></>}
                {resumeForm.resumeImages && resumeForm.resumeImages.length > 0 && (
                  <>
                    <dt style={{ gridColumn: '1 / -1', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>ຮູບພາບ Resume / CV</dt>
                    <dd style={{ gridColumn: '1 / -1', margin: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.75rem' }}>
                        {resumeForm.resumeImages.map((img, idx) => (
                          <a
                            key={idx}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleViewResumeImage(img);
                            }}
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
                    </dd>
                  </>
                )}
                <dt>ສະຖານະ</dt><dd><span className="badge">ເຜີຍແຜ່ແລ້ວ</span></dd>
              </dl>
            ) : (
              <p className="empty-text">ຍັງບໍ່ທັນໄດ້ໂພສ Resume — ກົດປຸ່ມ "ໂພສ Resume" ເພື່ອເລີ່ມຕົ້ນ</p>
            )}
          </div>
        )}

        {user.role === 'company' && (
          <div className="box resume-profile-card" id="company-jobs">
            <div className="box-results-header">
              <h2 className="box-title">ວຽກທີ່ປະກາດ</h2>
            </div>

            {jobMessage && <div className="alert alert-success">{jobMessage}</div>}
            {jobError && <div className="alert alert-error">{jobError}</div>}

            {showJobForm && (
              <form onSubmit={handlePostJob} className="profile-job-form">
                <h3 className="form-title" style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.125rem' }}>
                  {editingJobId ? 'ແກ້ໄຂປະກາດງານ' : 'ປະກາດງານໃໝ່'}
                </h3>
                <div className="form-group">
                  <label>ຊື່ວຽກ *</label>
                  <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>ລາຍລະອຽດ *</label>
                  <textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} rows={3} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>ເງິນເດືອນ</label>
                    <input value={jobForm.salary} onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>ສະຖານທີ່ *</label>
                    <input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>ປະເພດວຽກ</label>
                  <select value={jobForm.type} onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}>
                    {JOB_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>ຄຸນສົມບັດ</label>
                  <textarea value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} rows={2} />
                </div>
                <div className="profile-actions">
                  <button type="submit" className="btn btn-primary" disabled={jobLoading}>
                    {editingJobId ? 'ບັນທຶກການແກ້ໄຂ' : 'ປະກາດງານ'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setShowJobForm(false);
                      setEditingJobId(null);
                      setJobForm({ title: '', description: '', salary: '', location: '', requirements: '', type: 'full-time' });
                    }}
                  >
                    ຍົກເລີກ
                  </button>
                </div>
              </form>
            )}

            {myJobs.length === 0 ? (
              <p className="empty-text"></p>
            ) : (
              <ul className="my-posts-list">
                {myJobs.map((job) => (
                  <li key={job.id} className="my-post-item">
                    <div>
                      <strong>{job.title}</strong>
                      <span>{JOB_TYPES[job.type]} · {job.location}</span>
                    </div>
                    <div className="job-actions-dropdown">
                      <button
                        type="button"
                        className="dots-toggle-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownJobId(activeDropdownJobId === job.id ? null : job.id);
                        }}
                        aria-label="Actions"
                      >
                        ⋮
                      </button>
                      {activeDropdownJobId === job.id && (
                        <div className="actions-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="dropdown-menu-item"
                            onClick={() => {
                              handleViewApplicants(job);
                              setActiveDropdownJobId(null);
                            }}
                          >
                            ເບິ່ງຜູ້ສະໝັກ
                          </button>
                          <button
                            type="button"
                            className="dropdown-menu-item"
                            onClick={() => {
                              handleEditClick(job);
                              setActiveDropdownJobId(null);
                            }}
                          >
                            ແກ້ໄຂ
                          </button>
                          <button
                            type="button"
                            className="dropdown-menu-item delete-item"
                            onClick={() => {
                              handleDeleteJob(job.id);
                              setActiveDropdownJobId(null);
                            }}
                          >
                            ລຶບ
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {user.role === 'company' && (
          <PostJobFab onClick={openJobForm} />
        )}

        {user.role === 'admin' && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>ເມນູຜູ້ດູແລລະບົບ</h3>
            <Link to="/admin/reports" className="btn btn-outline">ໄປທີ່ ລາຍງານລະບົບ</Link>
          </div>
        )}

        {selectedJobForApplicants && (
          <DetailModal
            title={`ຜູ້ສະໝັກ - ${selectedJobForApplicants.title}`}
            onClose={() => setSelectedJobForApplicants(null)}
          >
            {loadingApplicants ? (
              <div className="loading-screen" style={{ minHeight: '150px' }}><div className="spinner" /></div>
            ) : applicants.length === 0 ? (
              <p className="empty-text" style={{ textAlign: 'center', padding: '2rem 0' }}>ຍັງບໍ່ມີຜູ້ສະໝັກເທື່ອ</p>
            ) : (
              <div className="applicants-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                {applicants.map((app) => (
                  <div
                    key={app.id}
                    className="applicant-item card box-interactive"
                    style={{
                      padding: '1.25rem',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      marginBottom: 0,
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedApplicantForDetail(app)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="tile-thumb" style={{ width: '45px', height: '45px', flexShrink: 0 }}>
                        {app.user.profile?.avatar ? (
                          <img src={app.user.profile.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <IconUser size={22} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{app.user.profile ? `${app.user.profile.firstName} ${app.user.profile.lastName}` : app.user.email}</h4>
                        {app.user.resume?.desiredPosition && (
                          <span className="tag tag-sm" style={{ marginTop: '0.25rem', display: 'inline-block' }}>{app.user.resume.desiredPosition}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                      {app.user.resume?.summary && (
                        <div>
                          <strong style={{ color: 'var(--text)' }}>ແນະນຳຕົວ: </strong>
                          <span style={{ color: 'var(--text-muted)' }}>{app.user.resume.summary}</span>
                        </div>
                      )}
                      {app.user.resume?.skills && (
                        <div>
                          <strong style={{ color: 'var(--text)' }}>ທັກສະ: </strong>
                          <span style={{ color: 'var(--text-muted)' }}>{app.user.resume.skills}</span>
                        </div>
                      )}
                      {app.user.resume?.experience && (
                        <div>
                          <strong style={{ color: 'var(--text)' }}>ປະສົບການ: </strong>
                          <span style={{ color: 'var(--text-muted)' }}>{app.user.resume.experience}</span>
                        </div>
                      )}
                      {app.user.resume?.education && (
                        <div>
                          <strong style={{ color: 'var(--text)' }}>ການສຶกສາ: </strong>
                          <span style={{ color: 'var(--text-muted)' }}>{app.user.resume.education}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600 }}>
                        ເບິ່ງຂໍ້ມູນທັງໝົດ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DetailModal>
        )}

        {selectedApplicantForDetail && (
          <DetailModal
            title={`ຂໍ້ມູນຜູ້ສະໝັກ - ${selectedApplicantForDetail.user.profile
              ? `${selectedApplicantForDetail.user.profile.firstName} ${selectedApplicantForDetail.user.profile.lastName}`
              : selectedApplicantForDetail.user.email}`}
            onClose={() => setSelectedApplicantForDetail(null)}
          >
            <div className="applicant-detail-modal">

              {/* ── Hero ── */}
              <div className="applicant-hero">
                <div className="applicant-hero-avatar">
                  {selectedApplicantForDetail.user.profile?.avatar ? (
                    <img src={selectedApplicantForDetail.user.profile.avatar} alt="" />
                  ) : (
                    <IconUser size={36} style={{ color: '#fff' }} />
                  )}
                </div>
                <div className="applicant-hero-info">
                  <h3 className="applicant-hero-name">
                    {selectedApplicantForDetail.user.profile
                      ? `${selectedApplicantForDetail.user.profile.firstName} ${selectedApplicantForDetail.user.profile.lastName}`
                      : selectedApplicantForDetail.user.email}
                  </h3>
                  {selectedApplicantForDetail.user.resume?.desiredPosition && (
                    <span className="applicant-position-badge">
                      {selectedApplicantForDetail.user.resume.desiredPosition}
                    </span>
                  )}
                  <div className="applicant-hero-meta">
                    {selectedApplicantForDetail.user.profile?.gender && (
                      <span className="applicant-meta-chip">
                        {genderLabels[selectedApplicantForDetail.user.profile.gender]}
                      </span>
                    )}
                    {selectedApplicantForDetail.user.profile?.birthDate && (
                      <span className="applicant-meta-chip">
                        ອາຍຸ {calculateAge(selectedApplicantForDetail.user.profile.birthDate)} ປີ
                      </span>
                    )}
                    {([selectedApplicantForDetail.user.profile?.village, selectedApplicantForDetail.user.profile?.district, selectedApplicantForDetail.user.profile?.province].filter(Boolean).join(', ') || selectedApplicantForDetail.user.profile?.location) && (
                      <span className="applicant-meta-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <IconMapPin size={12} />
                        {[selectedApplicantForDetail.user.profile?.village, selectedApplicantForDetail.user.profile?.district, selectedApplicantForDetail.user.profile?.province].filter(Boolean).join(', ') || selectedApplicantForDetail.user.profile.location}
                      </span>
                    )}
                    {selectedApplicantForDetail.user.resume?.jobType && (
                      <span className="applicant-meta-chip applicant-meta-chip--accent">
                        {JOB_TYPES[selectedApplicantForDetail.user.resume.jobType]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── ຂໍ້ມູນສ່ວນຕົວ ── */}
              <div className="applicant-section">
                <div className="applicant-section-title">ຂໍ້ມູນສ່ວນຕົວ</div>
                <table className="applicant-info-table">
                  <tbody>
                    {selectedApplicantForDetail.user.profile?.gender && (
                      <tr>
                        <td className="applicant-info-label">ເພດ</td>
                        <td className="applicant-info-value">{genderLabels[selectedApplicantForDetail.user.profile.gender]}</td>
                      </tr>
                    )}
                    {selectedApplicantForDetail.user.profile?.birthDate && (
                      <tr>
                        <td className="applicant-info-label">ວັນເກີດ</td>
                        <td className="applicant-info-value">
                          {formatDateDMY(selectedApplicantForDetail.user.profile.birthDate)}
                          <span className="applicant-age-badge">
                            ອາຍຸ {calculateAge(selectedApplicantForDetail.user.profile.birthDate)} ປີ
                          </span>
                        </td>
                      </tr>
                    )}
                    {([selectedApplicantForDetail.user.profile?.village, selectedApplicantForDetail.user.profile?.district, selectedApplicantForDetail.user.profile?.province].filter(Boolean).join(', ') || selectedApplicantForDetail.user.profile?.location) && (
                      <tr>
                        <td className="applicant-info-label">ສະຖານທີ່ຢູ່</td>
                        <td className="applicant-info-value">{[selectedApplicantForDetail.user.profile?.village, selectedApplicantForDetail.user.profile?.district, selectedApplicantForDetail.user.profile?.province].filter(Boolean).join(', ') || selectedApplicantForDetail.user.profile.location}</td>
                      </tr>
                    )}
                    {selectedApplicantForDetail.user.profile?.maritalStatus && (
                      <tr>
                        <td className="applicant-info-label">ສະຖານະ</td>
                        <td className="applicant-info-value">{maritalLabels[selectedApplicantForDetail.user.profile.maritalStatus] || '-'}</td>
                      </tr>
                    )}
                    {selectedApplicantForDetail.user.profile?.phone && (
                      <tr>
                        <td className="applicant-info-label">ເບີໂທ</td>
                        <td className="applicant-info-value">{selectedApplicantForDetail.user.profile.phone}</td>
                      </tr>
                    )}
                    {/* {(selectedApplicantForDetail.user.email || selectedApplicantForDetail.user.phone) && (
                      <tr>
                        <td className="applicant-info-label">ອີເມວ/ເບີ</td>
                        <td className="applicant-info-value">{selectedApplicantForDetail.user.email || selectedApplicantForDetail.user.phone}</td>
                      </tr>
                    )} */}
                  </tbody>
                </table>
              </div>

              {/* ── Resume ── */}
              {selectedApplicantForDetail.user.resume && (
                <div className="applicant-section">
                  <div className="applicant-section-title">ຂໍ້ມູນ</div>
                  <table className="applicant-info-table">
                    <tbody>
                      {selectedApplicantForDetail.user.resume.summary && (
                        <tr>
                          <td className="applicant-info-label">ແນະນຳຕົວ</td>
                          <td className="applicant-info-value">{selectedApplicantForDetail.user.resume.summary}</td>
                        </tr>
                      )}
                      {selectedApplicantForDetail.user.resume.desiredPosition && (
                        <tr>
                          <td className="applicant-info-label">ຕຳແໜ່ງ</td>
                          <td className="applicant-info-value">{selectedApplicantForDetail.user.resume.desiredPosition}</td>
                        </tr>
                      )}
                      {selectedApplicantForDetail.user.resume.jobType && (
                        <tr>
                          <td className="applicant-info-label">ປະເພດວຽກ</td>
                          <td className="applicant-info-value">{JOB_TYPES[selectedApplicantForDetail.user.resume.jobType]}</td>
                        </tr>
                      )}
                      {selectedApplicantForDetail.user.resume.skills && (
                        <tr>
                          <td className="applicant-info-label">ທັກສະ</td>
                          <td className="applicant-info-value">{selectedApplicantForDetail.user.resume.skills}</td>
                        </tr>
                      )}
                      {selectedApplicantForDetail.user.resume.experience && (
                        <tr>
                          <td className="applicant-info-label">ປະສົບການ</td>
                          <td className="applicant-info-value">{selectedApplicantForDetail.user.resume.experience}</td>
                        </tr>
                      )}
                      {selectedApplicantForDetail.user.resume.education && (
                        <tr>
                          <td className="applicant-info-label">ການສຶກສາ</td>
                          <td className="applicant-info-value">{selectedApplicantForDetail.user.resume.education}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── ຮູບພາບ Resume / CV ── */}
              {selectedApplicantForDetail.user.resume?.resumeImages?.length > 0 && (
                <div className="applicant-section">
                  <div className="applicant-section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                    <IconDoc size={14} />
                    ຮູບພາບ Resume / CV
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
                    {selectedApplicantForDetail.user.resume.resumeImages.map((img, idx) => (
                      <a
                        key={idx}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewResumeImage(img);
                        }}
                        className="resume-img-link"
                      >
                        <img src={img} alt={`Resume ${idx + 1}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                        <div className="resume-img-overlay" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', justifyContent: 'center' }}>
                          <IconSearch size={14} />
                          ກົດເພື່ອເປີດ
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {/* ── ຕ້ອງການຈ້າງ ── */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                {hiredApplicationIds.has(selectedApplicantForDetail.id) ? (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
                    disabled
                  >
                    ສົ່ງການສະເໜີຈ້າງແລ້ວ
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
                    disabled={hireLoading}
                    onClick={() => handleHire(selectedApplicantForDetail)}
                  >
                    {hireLoading ? 'ກຳລັງສົ່ງ...' : 'ຕ້ອງການຈ້າງ'}
                  </button>
                )}
              </div>

              {/* ── ຕິດຕໍ່ຈ້າງງານ ── */}
              {(selectedApplicantForDetail.user.profile?.phone || selectedApplicantForDetail.user.email) && (
                <div className="contact-box" style={{ marginTop: '1rem' }}>
                  <strong>ຕິດຕໍ່ຈ້າງງານ</strong>
                  {selectedApplicantForDetail.user.profile?.phone && (
                    <a
                      href={`tel:${selectedApplicantForDetail.user.profile.phone}`}
                      className="contact-link"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      <IconPhone size={14} /> {selectedApplicantForDetail.user.profile.phone}
                    </a>
                  )}
                  {selectedApplicantForDetail.user.email && (
                    <a
                      href={`mailto:${selectedApplicantForDetail.user.email}`}
                      className="contact-link"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      <IconMail size={14} /> {selectedApplicantForDetail.user.email}
                    </a>
                  )}
                </div>
              )}

            </div>
          </DetailModal>
        )}

      </div>
    </div>
  );
}
