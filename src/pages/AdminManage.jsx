import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import DetailModal from '../components/DetailModal';
import { IconAlert, IconUser, IconCompany, IconGear, IconBell, IconSuccess, IconGroup, IconEye, IconEyeOff } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  admin: 'ຜູ້ດູແລລະບົບ',
  company: 'ບໍລິສັດ',
  employees: 'ຜູ້ຊອກວຽກ',
};

const statusLabels = {
  pending: 'ລໍຖ້າອະນຸມັດ',
  approved: 'ອະນຸມັດແລ້ວ',
  rejected: 'ຖືກປະຕິເສດ',
};

export default function AdminManage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [roleEdits, setRoleEdits] = useState({});
  const [toast, setToast] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [adminFormError, setAdminFormError] = useState('');
  const [adminFormLoading, setAdminFormLoading] = useState(false);

  // Password confirmation modal
  const [pwModal, setPwModal] = useState(null); // { userId }
  const [pwValue, setPwValue] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwVisible, setPwVisible] = useState(false);
  const pwInputRef = useRef(null);

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminFormError('');
    if (!adminForm.firstName || !adminForm.lastName || !adminForm.password || (!adminForm.email && !adminForm.phone)) {
      setAdminFormError('ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບຖ້ວນ (ຊື່, ນາມສະກຸນ, ອີເມວ/ເບີ, ແລະລະຫັດຜ່ານ)');
      return;
    }
    if (adminForm.password.length < 6) {
      setAdminFormError('ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ');
      return;
    }
    setAdminFormLoading(true);
    try {
      await api.createAdmin(adminForm);
      showToast('ສ້າງບັນຊີ Admin ສຳເລັດແລ້ວ');
      setShowCreateAdmin(false);
      setAdminForm({ firstName: '', lastName: '', email: '', phone: '', password: '' });
      await loadData();
    } catch (err) {
      setAdminFormError(err.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setAdminFormLoading(false);
    }
  };

  const renderUserDetail = (u) => {
    if (!u) return null;
    const isEmployee = u.role === 'employees';
    const isCompany = u.role === 'company';
    const isProfileComplete = u.profileComplete;

    if (!isProfileComplete) {
      return (
        <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)' }}>
          <IconAlert size={48} style={{ color: 'var(--warning)', display: 'block', margin: '0 auto 1rem' }} />
          <h3>ຍັງບໍ່ທັນໄດ້ກອກຂໍ້ມູນໂປຣໄຟລ໌</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9375rem' }}>ຜູ້ໃຊ້ນີ້ສະໝັກສະມາຊິກແລ້ວ ແຕ່ຍັງບໍ່ທັນໄດ້ກອກລາຍລະອຽดໂປຣໄຟລ໌</p>
          <dl className="detail-dl" style={{ marginTop: '1.5rem', textAlign: 'left' }}>
            <dt>ອີເມວ / ເບີ</dt>
            <dd>{u.email || u.phone || '-'}</dd>
            <dt>ສະຖານະບັນຊີ</dt>
            <dd>
              <span className={`badge badge-status-${u.status || 'approved'}`}>
                {statusLabels[u.status] || 'ອະນຸມັດແລ້ວ'}
              </span>
            </dd>
            <dt>ວັນທີສະໝັກ</dt>
            <dd>{new Date(u.createdAt).toLocaleDateString('lo-LA')}</dd>
          </dl>
        </div>
      );
    }

    if (isEmployee) {
      const p = u.profile || {};
      const genderLabels = { male: 'ຊາຍ', female: 'ຍິງ', other: 'ອື່ນໆ' };
      const maritalLabels = { single: 'ໂສດ', dating: 'ມີແຟນແລ້ວ', married: 'ແຕ່ງງານແລ້ວ' };

      return (
        <div className="profile-detail-view">
          <div className="profile-avatar-section" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div className="profile-avatar" style={{ margin: '0 auto 0.75rem' }}>
              {p.avatar ? (
                <img src={p.avatar} alt="Avatar" />
              ) : (
                <IconUser size={48} style={{ color: 'var(--text-muted)' }} />
              )}
            </div>
            <h3>{p.firstName} {p.lastName}</h3>
            <span className="badge badge-role-employees" style={{ marginTop: '0.25rem' }}>...</span>
          </div>

          <dl className="detail-dl">
            <dt>ຊື່-นามສະກຸນ</dt>
            <dd>{p.firstName} {p.lastName}</dd>
            <dt>ເພດ</dt>
            <dd>{genderLabels[p.gender] || p.gender || '-'}</dd>
            <dt>ວັນເກີດ</dt>
            <dd>{p.birthDate ? new Date(p.birthDate).toLocaleDateString('lo-LA') : '-'}</dd>
            <dt>ອາຍຸ</dt>
            <dd>{p.age ? `${p.age} ປີ` : '-'}</dd>
            <dt>ທີ່ຢູ່ປັດຈຸບັນ</dt>
            <dd>{[p.village, p.district, p.province].filter(Boolean).join(', ') || p.location || '-'}</dd>
            <dt>ສະຖານະສົມລົດ</dt>
            <dd>{maritalLabels[p.maritalStatus] || p.maritalStatus || '-'}</dd>
            <dt>ເບີໂທຕິດຕໍ່</dt>
            <dd>{p.phone || '-'}</dd>
            <dt>ອີເມວບັນຊີ</dt>
            <dd>{u.email || '-'}</dd>
            <dt>ສະຖານະບັນชี</dt>
            <dd>
              <span className={`badge badge-status-${u.status || 'approved'}`}>
                {statusLabels[u.status] || 'ອະນຸມັດແລ້ว'}
              </span>
            </dd>
            <dt>ວັນທີສະໝັກ</dt>
            <dd>{new Date(u.createdAt).toLocaleDateString('lo-LA')}</dd>
          </dl>
        </div>
      );
    }

    if (isCompany) {
      const p = u.profile || {};

      return (
        <div className="profile-detail-view">
          <div className="profile-avatar-section" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div className="profile-avatar company-logo" style={{ margin: '0 auto 0.75rem' }}>
              {p.logo ? (
                <img src={p.logo} alt="Logo" />
              ) : (
                <IconCompany size={48} style={{ color: 'var(--text-muted)' }} />
              )}
            </div>
            <h3>{p.companyName}</h3>
            <span className="badge badge-role-company" style={{ marginTop: '0.25rem' }}>ບໍລິສັດ</span>
          </div>

          <dl className="detail-dl">
            <dt>ຊື່ບໍລິສັດ</dt>
            <dd>{p.companyName}</dd>
            <dt>ອີເມວບໍລິສັດ</dt>
            <dd>{p.companyEmail || '-'}</dd>
            <dt>ເບີໂทຕິດຕໍ່</dt>
            <dd>{p.phone || '-'}</dd>
            <dt>ທີ່ຢູ່ບໍລິສັດ</dt>
            <dd style={{ whiteSpace: 'pre-line' }}>{p.address || '-'}</dd>
            <dt>อีເມວບັນຊີ</dt>
            <dd>{u.email || '-'}</dd>
            <dt>ເບີໂທບັນຊີ</dt>
            <dd>{u.phone || '-'}</dd>
            <dt>ສະຖານະບັນຊີ</dt>
            <dd>
              <span className={`badge badge-status-${u.status || 'approved'}`}>
                {statusLabels[u.status] || 'ອະນຸມັດແລ້ວ'}
              </span>
            </dd>
            <dt>ວັນທີສະໝັກ</dt>
            <dd>{new Date(u.createdAt).toLocaleDateString('lo-LA')}</dd>
          </dl>
        </div>
      );
    }

    return (
      <dl className="detail-dl">
        <dt>ບັນຊີ</dt>
        <dd>{getUserDisplayName(u)}</dd>
        <dt>ອີເມວ / ເບີ</dt>
        <dd>{u.email || u.phone || '-'}</dd>
        <dt>ບົດບາດ</dt>
        <dd>{roleLabels[u.role] || u.role}</dd>
        <dt>ສະຖານะບັນຊີ</dt>
        <dd>
          <span className={`badge badge-status-${u.status || 'approved'}`}>
            {statusLabels[u.status] || 'ອະນຸມັດແລ້ວ'}
          </span>
        </dd>
        <dt>ວັນທີສະໝັກ</dt>
        <dd>{new Date(u.createdAt).toLocaleDateString('lo-LA')}</dd>
      </dl>
    );
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, usersRes] = await Promise.all([
        api.getPendingUsers(),
        api.getAdminUsers(),
      ]);
      setPendingUsers(pendingRes.users || []);
      setAllUsers(usersRes.users || []);
    } catch {
      showToast('ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id) => {
    setActionLoading((p) => ({ ...p, [id]: 'approve' }));
    try {
      await api.approveUser(id);
      showToast('ອະນຸມັດຜູ້ໃຊ້ສຳເລັດ');
      await loadData();
    } catch {
      showToast('ເກີດຂໍ້ຜິດພາດ', 'error');
    } finally {
      setActionLoading((p) => ({ ...p, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('ຢືນຢັນການປະຕິເສດຜູ້ໃຊ້ນີ້?')) return;
    setActionLoading((p) => ({ ...p, [id]: 'reject' }));
    try {
      await api.rejectUser(id);
      showToast('ປະຕິເສດຜູ້ໃຊ້ສຳເລັດ', 'error');
      await loadData();
    } catch {
      showToast('ເກີດຂໍ້ຜິດພາດ', 'error');
    } finally {
      setActionLoading((p) => ({ ...p, [id]: null }));
    }
  };

  const handleRoleChange = (id, role) => {
    setRoleEdits((p) => ({ ...p, [id]: role }));
  };

  const handleRoleSaveClick = (id) => {
    setPwModal({ userId: id, action: 'role' });
    setPwValue('');
    setPwError('');
    setPwVisible(false);
    setTimeout(() => pwInputRef.current?.focus(), 80);
  };

  const handleDeleteClick = (id) => {
    setPwModal({ userId: id, action: 'delete' });
    setPwValue('');
    setPwError('');
    setPwVisible(false);
    setTimeout(() => pwInputRef.current?.focus(), 80);
  };

  const handlePwConfirm = async () => {
    if (!pwValue.trim()) {
      setPwError('ກະລຸນາໃສ່ລະຫັດຜ່ານ');
      return;
    }
    const id = pwModal.userId;
    const action = pwModal.action;

    setPwLoading(true);
    setPwError('');
    try {
      if (action === 'role') {
        const role = roleEdits[id];
        if (!role) {
          setPwModal(null);
          return;
        }
        await api.verifyAdminPassword(pwValue);
        setPwModal(null);
        setActionLoading((p) => ({ ...p, [`role_${id}`]: true }));
        await api.updateUserRole(id, role, pwValue);
        showToast('ອັບເດດສິດສຳເລັດ');
      } else if (action === 'delete') {
        setActionLoading((p) => ({ ...p, [`delete_${id}`]: true }));
        await api.deleteUser(id, pwValue);
        setPwModal(null);
        showToast('ລຶບຜູ້ໃຊ້ສຳເລັດ', 'error');
      }
      await loadData();
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('incorrect password') || msg.toLowerCase().includes('incorrect')) {
        setPwError('ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ');
      } else if (msg.toLowerCase().includes('cannot delete yourself')) {
        setPwError('ບໍ່ສາມາດລຶບບັນຊີຕົນເອງໄດ້');
      } else {
        setPwError(msg || 'ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່');
      }
    } finally {
      setPwLoading(false);
      setActionLoading((p) => ({ ...p, [`role_${id}`]: null, [`delete_${id}`]: null }));
    }
  };

  const getUserDisplayName = (u) => {
    if (u.profile?.companyName) return u.profile.companyName;
    const full = `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim();
    return full || u.email || u.phone || '-';
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="container">
        {/* Toast Notification */}
        {toast && (
          <div className={`admin-toast ${toast.type === 'error' ? 'admin-toast-error' : 'admin-toast-success'}`}>
            {toast.msg}
          </div>
        )}

        <div className="page-header">
          <div>
            <h1>ຈັດການຂໍ້ມູນພື້ນຖານ</h1>
            <p className="page-desc">ອະນຸມັດການສະໝັກ ແລະ ກຳນົດສິດຜູ້ໃຊ້ງານໃນລະບົບ</p>
          </div>
          <div className="header-badges">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowCreateAdmin(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
              >
                + ເພີ່ມ Admin
              </button>
              {pendingUsers.length > 0 && (
                <span className="badge-pending-count" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  <IconBell size={16} /> ລໍຖ້າອະນຸມັດ {pendingUsers.length} ລາຍການ
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            type="button"
            className={tab === 'all' ? 'tab active' : 'tab'}
            onClick={() => setTab('all')}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <IconGroup size={16} /> ຜູ້ໃຊ້ທັງໝົດ
            </span>
            <span className="tab-badge tab-badge-muted">{allUsers.length}</span>
          </button>
          <button
            type="button"
            className={tab === 'pending' ? 'tab active' : 'tab'}
            onClick={() => setTab('pending')}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <IconBell size={16} /> ລໍຖ້າອະນຸມັດ
            </span>
            {pendingUsers.length > 0 && (
              <span className="tab-badge">{pendingUsers.length}</span>
            )}
          </button>
          <button
            type="button"
            className={tab === 'roles' ? 'tab active' : 'tab'}
            onClick={() => setTab('roles')}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <IconGear size={16} /> ກຳນົດສິດ
            </span>
          </button>
        </div>

        {/* ─── แท็บ: ผู้ใช้ทั้งหมด ─── */}
        {tab === 'all' && (
          <div className="card">
            {allUsers.length === 0 ? (
              <p className="empty-text">ຍັງບໍ່ມີຜູ້ໃຊ້ໃນລະບົບ</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ຊື່ / ບໍລິສັດ</th>
                    <th>ອີເມວ / ເບີ</th>
                    <th>ປະເພດ</th>
                    <th>ສະຖານະບັນຊີ</th>
                    <th>ວັນທີສະໝັກ</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr key={u.id} className="clickable-row" onClick={() => setSelectedUser(u)}>
                      <td>
                        <div className="user-cell">
                          <span className="user-avatar-placeholder" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {u.role === 'company' ? <IconCompany size={16} /> : u.role === 'admin' ? <IconGear size={16} /> : <IconUser size={16} />}
                          </span>
                          <span>{getUserDisplayName(u)}</span>
                        </div>
                      </td>
                      <td>{u.email || u.phone || '-'}</td>
                      <td>
                        <span className={`badge badge-role-${u.role || 'none'}`}>
                          {roleLabels[u.role] || 'ຍັງບໍ່ໄດ້ກຳນົດ'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-status-${u.status || 'approved'}`}>
                          {statusLabels[u.status] || 'ອະນຸມັດແລ້ວ'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString('lo-LA')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ─── แท็บ: รออนุมัติ ─── */}
        {tab === 'pending' && (
          <div className="card">
            {pendingUsers.length === 0 ? (
              <div className="empty-state">
                <IconSuccess size={48} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
                <p className="empty-text">ບໍ່ມີລາຍການທີ່ລໍຖ້າອະນຸມັດ</p>
                <p className="empty-sub">ຜູ້ໃຊ້ທຸກຄົນໄດ້ຮັບການອະນຸມັດແລ້ວ</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ຊື່ / ບໍລິສັດ</th>
                    <th>ອີເມວ / ເບີ</th>
                    <th>ປະເພດ</th>
                    <th>ວັນທີສະໝັກ</th>
                    <th>ການດຳເນີນການ</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((u) => (
                    <tr key={u.id} className="pending-row clickable-row" onClick={() => setSelectedUser(u)}>
                      <td>
                        <div className="user-cell">
                          <span className="user-avatar-placeholder" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {u.role === 'company' ? <IconCompany size={16} /> : <IconUser size={16} />}
                          </span>
                          <span>{getUserDisplayName(u)}</span>
                        </div>
                      </td>
                      <td>{u.email || u.phone || '-'}</td>
                      <td>
                        <span className={`badge badge-role-${u.role || 'none'}`}>
                          {roleLabels[u.role] || 'ຍັງບໍ່ໄດ້ກຳນົດ'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString('lo-LA')}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="btn-approve"
                            onClick={(e) => { e.stopPropagation(); handleApprove(u.id); }}
                            disabled={!!actionLoading[u.id]}
                          >
                            {actionLoading[u.id] === 'approve' ? '...' : 'ອະນຸມັດ'}
                          </button>
                          <button
                            type="button"
                            className="btn-reject"
                            onClick={(e) => { e.stopPropagation(); handleReject(u.id); }}
                            disabled={!!actionLoading[u.id]}
                          >
                            {actionLoading[u.id] === 'reject' ? '...' : 'ປະຕິເສດ'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ─── แท็บ: กำหนดสิทธิ์ ─── */}
        {tab === 'roles' && (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ຊື່ / ບໍລິສັດ</th>
                  <th>ອີເມວ / ເບີ</th>
                  <th>ສະຖານະບັນຊີ</th>
                  <th>ສິດປັດຈຸບັນ</th>
                  <th>ປ່ຽນສິດ</th>
                  <th>ການດຳເນີນການ</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => (
                  <tr key={u.id} className="clickable-row" onClick={() => setSelectedUser(u)}>
                    <td>
                      <div className="user-cell">
                        <span className="user-avatar-placeholder" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {u.role === 'company' ? <IconCompany size={16} /> : u.role === 'admin' ? <IconGear size={16} /> : <IconUser size={16} />}
                        </span>
                        <span>{getUserDisplayName(u)}</span>
                      </div>
                    </td>
                    <td>{u.email || u.phone || '-'}</td>
                    <td>
                      <span className={`badge badge-status-${u.status || 'approved'}`}>
                        {statusLabels[u.status] || 'ອະນຸມັດແລ້ວ'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-role-${u.role || 'none'}`}>
                        {roleLabels[u.role] || 'ຍັງບໍ່ໄດ້ກຳນົດ'}
                      </span>
                    </td>
                    <td>
                      <select
                        className="role-select"
                        value={roleEdits[u.id] ?? u.role ?? ''}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="admin">ຜູ້ດູແລລະບົບ</option>
                        <option value="company">ບໍລິສັດ</option>
                        <option value="employees">ຜູ້ຊອກວຽກ</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-save-role"
                          onClick={() => handleRoleSaveClick(u.id)}
                          disabled={!!actionLoading[`role_${u.id}`]}
                          style={{ margin: 0 }}
                        >
                          {actionLoading[`role_${u.id}`] ? '...' : 'ບັນທຶກ'}
                        </button>
                        {u.id !== user?.id && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleDeleteClick(u.id)}
                            disabled={!!actionLoading[`delete_${u.id}`]}
                            style={{ margin: 0, padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                          >
                            {actionLoading[`delete_${u.id}`] ? '...' : 'ລຶບ'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <DetailModal
          title={
            selectedUser.role === 'company'
              ? 'ຂໍ້ມູນບໍລິສັດ'
              : selectedUser.role === 'employees'
              ? 'ຂໍ້ມູນຜູ້ຊອກວຽກ'
              : 'ຂໍ້ມູນຜູ້ໃຊ້ງານ'
          }
          onClose={() => setSelectedUser(null)}
        >
          {renderUserDetail(selectedUser)}
        </DetailModal>
      )}

      {pwModal && (
        <div className="pw-modal-overlay" onClick={() => setPwModal(null)}>
          <div className="pw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header" style={pwModal.action === 'delete' ? { backgroundColor: 'var(--danger)' } : {}}>
              <span className="pw-modal-icon">
                <IconGear size={36} style={{ color: 'white', display: 'inline-block' }} />
              </span>
              <h3 className="pw-modal-title">ຢືนຢັນຕົວຕົນ</h3>
              <p className="pw-modal-sub">
                {pwModal.action === 'delete'
                  ? 'ກະລຸນາປ້ອນລະຫັດຜ່ານຂອງທ່ານເພື່ອຢືนຢັນການລຶບບັນຊີຜູ້ໃຊ້'
                  : 'ກະລຸນາປ້ອນລະຫັດຜ່ານຂອງທ່ານເພື່ອຢືນຢັນການປ່ຽນສິດຜູ້ໃຊ້'}
              </p>
            </div>
            
            <div className="pw-modal-body">
              <div className="pw-input-wrap">
                <input
                  ref={pwInputRef}
                  type={pwVisible ? 'text' : 'password'}
                  className={`pw-input${pwError ? ' pw-input-error' : ''}`}
                  placeholder="ລະຫັດຜ່ານຂອງທ່ານ..."
                  value={pwValue}
                  onChange={(e) => { setPwValue(e.target.value); setPwError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && !pwLoading && handlePwConfirm()}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pw-toggle-btn"
                  onClick={() => setPwVisible((v) => !v)}
                  tabIndex={-1}
                >
                  {pwVisible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
              {pwError && <p className="pw-error-msg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><IconAlert size={14} /> {pwError}</p>}
            </div>

            <div className="pw-modal-footer">
              <button
                type="button"
                className="pw-btn-cancel"
                onClick={() => setPwModal(null)}
                disabled={pwLoading}
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                className="pw-btn-confirm"
                onClick={handlePwConfirm}
                disabled={pwLoading}
                style={pwModal.action === 'delete' ? { backgroundColor: 'var(--danger)' } : {}}
              >
                {pwLoading ? (
                  <>
                    <span className="pw-btn-spinner" /> ກຳລັງກວດສອບ...
                  </>
                ) : pwModal.action === 'delete' ? (
                  'ຢືນຢັນ & ລຶບ'
                ) : (
                  'ຢືນຢັນ & ບັນທຶກ'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateAdmin && (
        <DetailModal
          title="ເພີ່ມ Admin ໃໝ່"
          onClose={() => setShowCreateAdmin(false)}
        >
          <form onSubmit={handleCreateAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
            {adminFormError && (
              <div style={{ padding: '0.75rem', background: '#fef2f2', color: 'var(--error)', borderRadius: '8px', fontSize: '0.875rem' }}>
                {adminFormError}
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>ຊື່ (First Name) *</label>
                <input
                  type="text"
                  style={{ padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                  value={adminForm.firstName}
                  onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>ນາມສະກຸນ (Last Name) *</label>
                <input
                  type="text"
                  style={{ padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                  value={adminForm.lastName}
                  onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>ອີເມວ (Email)</label>
              <input
                type="email"
                placeholder="admin@example.com"
                style={{ padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', width: '100%' }}
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>ເບີໂທລະສັບ (Phone)</label>
              <input
                type="text"
                placeholder="020xxxxxxxx"
                style={{ padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', width: '100%' }}
                value={adminForm.phone}
                onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>ລະຫັດຜ່ານ (Password) *</label>
              <input
                type="password"
                placeholder="ຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ"
                style={{ padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', width: '100%' }}
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setShowCreateAdmin(false)}
                disabled={adminFormLoading}
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={adminFormLoading}
              >
                {adminFormLoading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
              </button>
            </div>
          </form>
        </DetailModal>
      )}
    </div>
  );
}
