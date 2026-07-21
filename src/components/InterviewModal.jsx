import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function InterviewModal({ onClose, onSuccess, preSelectedEmployee, preSelectedJob }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);

  const defaultInterviewerName = user?.profile?.companyName || user?.profile?.firstName
    ? `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim()
    : 'ບໍລິສັດ';
  const defaultInterviewerPhone = user?.profile?.phone || '';

  const [form, setForm] = useState({
    jobId: preSelectedJob?.id || '',
    employeeId: preSelectedEmployee?.id || '',
    interviewerName: defaultInterviewerName,
    interviewerPhone: defaultInterviewerPhone,
    date: '',
    time: '09:00',
    type: 'onsite',
    location: 'ບໍລິສັດ',
    meetingLink: '',
    notes: '',
  });

  useEffect(() => {
    if (preSelectedEmployee?.id) {
      setForm((prev) => ({ ...prev, employeeId: preSelectedEmployee.id }));
    }
  }, [preSelectedEmployee]);

  useEffect(() => {
    if (preSelectedJob?.id) {
      setForm((prev) => ({ ...prev, jobId: preSelectedJob.id }));
    }
  }, [preSelectedJob]);

  useEffect(() => {
    if (!preSelectedJob) {
      api.getJobs()
        .then((data) => {
          const allJobs = data.jobs || [];
          // Filter to show only active jobs posted by this company
          if (user?.role === 'company') {
            const companyJobs = allJobs.filter((j) => String(j.companyId) === String(user.id) && j.status !== 'closed');
            setJobs(companyJobs);
          } else {
            setJobs(allJobs);
          }
        })
        .catch((err) => console.error('Error fetching jobs:', err));
    }
    if (!preSelectedEmployee) {
      api.getResumes()
        .then((data) => setEmployees(data.resumes || []))
        .catch((err) => console.error('Error fetching resumes:', err));
    }
  }, [preSelectedJob, preSelectedEmployee, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const finalNotes = `ຜູ້ສຳພາດ: ${form.interviewerName || 'ບໍລິສັດ'}${form.interviewerPhone ? ` | ເບີໂທ: ${form.interviewerPhone}` : ''}${form.notes ? `\n${form.notes}` : ''}`;

    const data = {
      jobId: form.jobId,
      employeeId: form.employeeId,
      date: form.date,
      time: form.time,
      type: form.type,
      location: form.type === 'online' ? (form.meetingLink || 'Online') : form.location,
      meetingLink: form.type === 'online' ? form.meetingLink : null,
      notes: finalNotes,
    };

    if (!data.jobId || !data.employeeId || !data.date || !data.time || !data.location) {
      setError('ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ (ເລືອກຕຳແໜ່ງງານ, ວັນທີ, ເວລາ ແລະ ສະຖານທີ່)');
      setLoading(false);
      return;
    }

    try {
      await api.createInterview(data);
      setSuccessMsg('ນັດສຳພາດສຳເລັດ!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການນັດສຳພາດ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-box detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', width: '95%' }}>

        {/* Header */}
        <div className="detail-modal-header">
          <h2>ນັດສຳພາດໃໝ່ / ສົ່ງຄຳຊວນ</h2>
          <button type="button" className="modal-x" onClick={onClose} aria-label="ປິດ">×</button>
        </div>

        {/* Form Body */}
        <div className="detail-modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid #fca5a5' }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', color: '#16a34a', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid #86efac' }}>
                {successMsg}
              </div>
            )}

            {/* Row 1: Interviewer Name & Contact Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>ຊື່ຜູ້ສຳພາດ / ຜູ້ປະສານງານ</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.9rem' }}
                  value={form.interviewerName}
                  onChange={(e) => setForm({ ...form, interviewerName: e.target.value })}
                  placeholder="ຊື່ບໍລິສັດ ຫຼື ຜູ້ປະສານງານ..."
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>ເບີຕິດຕໍ່</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.9rem' }}
                  value={form.interviewerPhone}
                  onChange={(e) => setForm({ ...form, interviewerPhone: e.target.value })}
                  placeholder="020XXXXXXXX"
                  required
                />
              </div>
            </div>

            {/* Row 2: Date & Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>ວັນທີສຳພາດ</label>
                <input
                  type="date"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.9rem' }}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>ເວລາສຳພາດ</label>
                <input
                  type="time"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.9rem' }}
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Row 3: Job Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>
                ເລືອກຕຳແໜ່ງງານທີ່ຈະຊວນ (ຈາກວຽກທີ່ບໍລິສັດປະກາດ)
              </label>
              {preSelectedJob ? (
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '0.9rem', cursor: 'not-allowed' }}
                  value={preSelectedJob.title}
                  disabled
                />
              ) : (
                <select
                  style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.9rem' }}
                  value={form.jobId}
                  onChange={(e) => setForm({ ...form, jobId: e.target.value })}
                  required
                >
                  <option value="">-- ເລືອກຕຳແໜ່ງງານ --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              )}
              {user?.role === 'company' && jobs.length === 0 && !preSelectedJob && (
                <span style={{ fontSize: '0.8rem', color: '#e11d48' }}>
                  * ບໍລິສັດຂອງທ່ານຍັງບໍ່ມີປະກາດງານ. ກະລຸນາປະກາດງານກ່ອນເພື່ອເລືອກຕຳແໜ່ງງານ.
                </span>
              )}
            </div>

            {/* Employee Field */}
            {preSelectedEmployee ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>ຜູ້ຊອກວຽກ (ຜູ້ຮັບຄຳຊວນ)</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontSize: '0.9rem', fontWeight: '500', cursor: 'not-allowed' }}
                  value={
                    preSelectedEmployee.name ||
                    (preSelectedEmployee.profile?.firstName
                      ? `${preSelectedEmployee.profile.firstName} ${preSelectedEmployee.profile.lastName}`
                      : (preSelectedEmployee.contact?.email || 'ຜູ້ຊອກວຽກ'))
                  }
                  disabled
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>ຜູ້ຊອກວຽກ</label>
                <select
                  style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.9rem' }}
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  required
                >
                  <option value="">-- ເລືອກຜູ້ຊອກວຽກ --</option>
                  {employees.map((emp) => {
                    const displayName = emp.profile?.firstName
                      ? `${emp.profile.firstName} ${emp.profile.lastName}`
                      : emp.id;
                    return (
                      <option key={emp.id} value={emp.id}>
                        {displayName} ({emp.resume?.desiredPosition || 'ບໍ່ມີຕຳແໜ່ງ'})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Row 4: Interview Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>ຮູບແບບການສຳພາດ</label>
              <select
                style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.9rem' }}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="onsite">ຢູ່ບໍລິສັດ (Onsite)</option>
                <option value="online">ອອນລາຍ (Online Meeting)</option>
              </select>
            </div>

            {/* Row 5: Location / Meeting Link */}
            {form.type === 'onsite' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>ສະຖານທີ່ສຳພາດ</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.9rem' }}
                  placeholder="ບໍລິສັດ..."
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>ລິ້ງຫ້ອງປະຊຸມ (Meeting Link)</label>
                <input
                  type="url"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.9rem' }}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={form.meetingLink}
                  onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Row 6: Notes / Required Docs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>ໝາຍເຫດ / ເອກະສານທີ່ຕ້ອງກຽມມາ</label>
              <textarea
                style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical' }}
                placeholder=""
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Row 7: Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem' }}
                onClick={onClose}
                disabled={loading}
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem', backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#fff', fontWeight: '600' }}
                disabled={loading}
              >
                {loading ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນການນັດສຳພາດ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
