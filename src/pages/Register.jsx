import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, calculateAge, fileToBase64 } from '../api/client';
import PasswordField from '../components/PasswordField';
import BirthDateInput from '../components/BirthDateInput';
import { IconSuccess, IconMail, IconUser, IconCompany, IconCamera } from '../components/Icons';

export default function Register() {
  const [searchParams] = useSearchParams();
  const finishMode = searchParams.get('finish') === '1';
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(finishMode ? 2 : 1);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingDone, setPendingDone] = useState(false);
  const navigate = useNavigate();

  const [jobseekerForm, setJobseekerForm] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    birthDate: '',
    location: '',
    province: '',
    district: '',
    village: '',
    maritalStatus: '',
    phone: '',
    avatar: null,
  });

  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    companyEmail: '',
    address: '',
    phone: '',
    logo: null,
  });

  useEffect(() => {
    if (!finishMode || !user) return;
    if (user.phone) {
      setJobseekerForm((f) => ({ ...f, phone: user.phone }));
      setCompanyForm((f) => ({ ...f, phone: user.phone }));
    }
    if (user.email) {
      setCompanyForm((f) => ({ ...f, companyEmail: user.email }));
    }
  }, [finishMode, user]);

  if (finishMode && !user) {
    navigate('/login', { replace: true });
    return null;
  }

  if (user?.profileComplete || user?.role === 'admin') {
    navigate('/');
    return null;
  }

  if (user && !finishMode) {
    navigate('/register?finish=1', { replace: true });
    return null;
  }

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('ລະຫັດຜ່ານບໍ່ກົງກັນ');
      return;
    }
    if (password.length < 6) {
      setError('ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ');
      return;
    }

    setStep(2);
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'company' && login.includes('@')) {
      setCompanyForm((f) => ({ ...f, companyEmail: login.trim() }));
    }
    if (selectedRole === 'employees' && !login.includes('@')) {
      setJobseekerForm((f) => ({ ...f, phone: login.trim() }));
    }
    setStep(3);
  };

  const handleAvatarChange = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    if (type === 'employees') {
      setJobseekerForm((f) => ({ ...f, avatar: base64 }));
    } else {
      setCompanyForm((f) => ({ ...f, logo: base64 }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let profile = role === 'employees' ? jobseekerForm : companyForm;
      if (role === 'employees') {
        profile = {
          ...profile,
          location: [profile.village, profile.district, profile.province].filter(Boolean).join(', '),
        };
      }

      if (finishMode && user) {
        const data = await api.completeProfile(role, profile);
        updateUser(data.user);
        navigate('/');
        return;
      }

      const data = await api.register(login, password, role, profile);
      if (data.pending) {
        setPendingDone(true);
        return;
      }
      navigate('/login', {
        state: { message: data.message || 'ລົງທະບຽນສຳເລັດ ກະລຸນາເຂົ້າສູ່ລະບົບ' },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const age = jobseekerForm.birthDate ? calculateAge(jobseekerForm.birthDate) : null;
  const wideCard = step > 1;

  // หลังสมัครสำเร็จ — แสดงหน้ารอการอนุมัติ
  if (pendingDone) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-brand-mark">S</span>
            <span className="auth-brand-name">Sokviek</span>
          </div>
          <div className="pending-success">
            <IconSuccess size={48} className="pending-success-icon" style={{ color: 'var(--success)', display: 'block', margin: '0 auto 1rem' }} />
            <h2>ລົງທະບຽນສຳເລັດ!</h2>
            <p className="pending-success-msg">
              ບັນຊີຂອງທ່ານກຳລັງລໍຖ້າການອະນຸມັດຈາກຜູ້ດູແລລະບົບ<br />
              ເມື່ອອະນຸມັດແລ້ວ ທ່ານຈະສາມາດເຂົ້າສູ່ລະບົບໄດ້
            </p>
            <div className="pending-info-box">
              <IconMail size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>ອີເມວ / ເບີ: <strong>{login}</strong></span>
            </div>
            <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: '1.5rem' }}>
              ໄປໜ້າເຂົ້າສູ່ລະບົບ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className={`auth-card ${wideCard ? 'auth-card-wide' : ''}`}>
        <div className="auth-brand">
          <span className="auth-brand-mark">S</span>
          <span className="auth-brand-name">Sokviek</span>
        </div>
        {finishMode && (
          <p className="auth-subtitle">ກອກຂໍ້ມູນໂປຣໄຟລ໌ໃຫ້ຄົບຖ້ວນເພື່ອໃຊ້ງານຕໍ່</p>
        )}

        {step === 1 && !finishMode && (
          <>
            <h1>ລົງທະບຽນ</h1>
            <p className="auth-subtitle">ສ້າງບັນຊີດ້ວຍ Gmail ຫຼື ເບີໂທລະສັບ</p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleCredentialsSubmit}>
              <div className="form-group">
                <label htmlFor="login">Gmail</label>
                <input
                  id="login"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder=""
                  required
                />
              </div>
              <PasswordField
                id="password"
                label="ລະຫັດຜ່ານ"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ"
                required
              />
              <PasswordField
                id="confirmPassword"
                label="ຢືນຢັນລະหັດຜ່ານ"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="ປ້ອນລະຫັດຜ່ານອີກຄັ້ງ"
                required
              />
              <button type="submit" className="btn btn-primary btn-full">
                ລົງທະບຽນ
              </button>
            </form>

            <p className="auth-footer">
              ມີບັນຊີແລ້ວ? <Link to="/login">ເຂົ້າສູ່ລະບົບ</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <div className="role-select">
            <h1>ປ້ອນຂໍ້ມູນໂປຣໄຟລ໌</h1>
            <p className="auth-subtitle">ເລືອກບົດບາດຂອງທ່ານ</p>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="role-cards">
              <button type="button" className="role-card" onClick={() => handleRoleSelect('employees')}>
                <span className="role-icon"><IconUser size={40} style={{ color: 'var(--primary)' }} /></span>
                <h3>ຜູ້ຊອກວຽກ</h3>
                <p>ຄົ້ນຫາວຽກ ແລະ ສ້າງໂປຣໄຟລ໌ສ່ວນຕົວ</p>
              </button>
              <button type="button" className="role-card" onClick={() => handleRoleSelect('company')}>
                <span className="role-icon"><IconCompany size={40} style={{ color: 'var(--primary)' }} /></span>
                <h3>ບໍລິສັດ</h3>
                <p>ປະກາດງານ ແລະ ຄົ້ນຫາພະນັກງານ</p>
              </button>
            </div>
            {!finishMode && (
              <button type="button" className="btn-back" onClick={() => setStep(1)}>← ຍ້ອນກັບ</button>
            )}
          </div>
        )}

        {step === 3 && role === 'employees' && (
          <>
            <h1>ກອກຂໍ້ມູນໂປຣໄຟລ໌</h1>
            <p className="auth-subtitle">ບົດບາດ: ຜູ້ຊອກວຽກ</p>
            <form onSubmit={handleProfileSubmit}>
              <button type="button" className="btn-back" onClick={() => setStep(2)}>← ປ່ຽນບົດບາດ</button>
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-group">
                <label>ຮູບໂປຣໄຟລ໌</label>
                <div className="avatar-upload">
                  <label htmlFor="avatar" className="avatar-preview">
                    {jobseekerForm.avatar ? (
                      <img src={jobseekerForm.avatar} alt="avatar" />
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}><IconCamera size={18} /> ອັບໂຫຼດຮູບໂປຣໄຟລ໌</span>
                    )}
                  </label>
                  <input id="avatar" type="file" accept="image/*" hidden onChange={(e) => handleAvatarChange(e, 'employees')} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ຊື່</label>
                  <input value={jobseekerForm.firstName} onChange={(e) => setJobseekerForm({ ...jobseekerForm, firstName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>ນາມສະກຸນ</label>
                  <input value={jobseekerForm.lastName} onChange={(e) => setJobseekerForm({ ...jobseekerForm, lastName: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label>ເພດ</label>
                <select value={jobseekerForm.gender} onChange={(e) => setJobseekerForm({ ...jobseekerForm, gender: e.target.value })} required>
                  <option value="">ເລືອກເພດ</option>
                  <option value="male">ຊາຍ</option>
                  <option value="female">ຍິງ</option>
                  <option value="other">ອື່ນໆ</option>
                </select>
              </div>
              <BirthDateInput
                value={jobseekerForm.birthDate}
                onChange={(birthDate) => setJobseekerForm({ ...jobseekerForm, birthDate })}
                required
                ageBadge={age !== null ? <span className="age-badge">ອາຍຸ {age} ປີ</span> : null}
              />

              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>ບ້ານ</label>
                  <input value={jobseekerForm.village || ''} onChange={(e) => setJobseekerForm({ ...jobseekerForm, village: e.target.value })} placeholder="ບ້ານ" required />
                </div>
                <div className="form-group">
                  <label>ເມືອງ</label>
                  <input value={jobseekerForm.district || ''} onChange={(e) => setJobseekerForm({ ...jobseekerForm, district: e.target.value })} placeholder="ເມືອງ" required />
                </div>
                <div className="form-group">
                  <label>ແຂວງ</label>
                  <input value={jobseekerForm.province || ''} onChange={(e) => setJobseekerForm({ ...jobseekerForm, province: e.target.value })} placeholder="ແຂວງ" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ສະຖານະ</label>
                  <select value={jobseekerForm.maritalStatus} onChange={(e) => setJobseekerForm({ ...jobseekerForm, maritalStatus: e.target.value })} required>
                    <option value="">ເລືອກສະຖານະ</option>
                    <option value="single">ໂສດ</option>
                    <option value="dating">ມີແຟນແລ້ວ</option>
                    <option value="married">ແຕ່ງງານແລ້ວ</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ເບີໂທລະສັບ</label>
                  <input value={jobseekerForm.phone} onChange={(e) => setJobseekerForm({ ...jobseekerForm, phone: e.target.value })} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading
                  ? 'ກຳລັງບັນທຶກ...'
                  : finishMode
                    ? 'ບັນທຶກ ແລະ ເລີ່ມໃຊ້ງານ'
                    : 'ບັນທຶກ ແລະ ໄປເຂົ້າສູ່ລະບົບ'}
              </button>
            </form>
          </>
        )}

        {step === 3 && role === 'company' && (
          <>
            <h1>ກອກຂໍ້ມູນໂປຣໄຟລ໌</h1>
            <p className="auth-subtitle">ບົດບາດ: ບໍລິສັດ</p>
            <form onSubmit={handleProfileSubmit}>
              <button type="button" className="btn-back" onClick={() => setStep(2)}>← ປ່ຽນບົດບາດ</button>
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-group">
                <label>ຮູບໂປຣໄຟລ໌ / ໂລໂກ້ບໍລິສັດ</label>
                <div className="avatar-upload">
                  <label htmlFor="logo" className="avatar-preview company-logo">
                    {companyForm.logo ? (
                      <img src={companyForm.logo} alt="logo" />
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}><IconCompany size={18} /> ອັບໂຫຼດໂລໂກ້</span>
                    )}
                  </label>
                  <input id="logo" type="file" accept="image/*" hidden onChange={(e) => handleAvatarChange(e, 'company')} />
                </div>
              </div>

              <div className="form-group">
                <label>ຊື່ບໍລິສັດ</label>
                <input value={companyForm.companyName} onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Gmail ຂອງບໍລິສັດ</label>
                <input type="email" value={companyForm.companyEmail} onChange={(e) => setCompanyForm({ ...companyForm, companyEmail: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>ທີ່ຢູ່ບໍລິສັດ</label>
                <textarea value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} rows={3} required />
              </div>
              <div className="form-group">
                <label>ເບີໂທບໍລິສັດ</label>
                <input value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} required />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading
                  ? 'ກຳລັງບັນທຶກ...'
                  : finishMode
                    ? 'ບັນທຶກ ແລະ ເລີ່ມໃຊ້ງານ'
                    : 'ບັນທຶກ ແລະ ໄປເຂົ້າສູ່ລະບົບ'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
