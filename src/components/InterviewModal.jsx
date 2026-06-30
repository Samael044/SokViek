import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function InterviewModal({ onClose, onSuccess, preSelectedEmployee, preSelectedJob }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [form, setForm] = useState({
    jobId: preSelectedJob?.id || '',
    employeeId: preSelectedEmployee?.id || '',
    date: '',
    time: '',
    type: 'onsite',
    location: '',
    meetingLink: '',
    notes: '',
  });

  useEffect(() => {
    if (!preSelectedJob) {
      api.getJobs()
        .then((data) => setJobs(data.jobs || []))
        .catch((err) => console.error('Error fetching jobs:', err));
    }
    if (!preSelectedEmployee) {
      api.getResumes()
        .then((data) => setEmployees(data.resumes || []))
        .catch((err) => console.error('Error fetching resumes:', err));
    }
  }, [preSelectedJob, preSelectedEmployee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const data = {
      jobId: form.jobId,
      employeeId: form.employeeId,
      date: form.date,
      time: form.time,
      type: form.type,
      location: form.type === 'online' ? (form.meetingLink || 'Online') : form.location,
      meetingLink: form.type === 'online' ? form.meetingLink : null,
      notes: form.notes,
    };

    if (!data.jobId || !data.employeeId || !data.date || !data.time || !data.location) {
      setError('ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ');
      setLoading(false);
      return;
    }

    try {
      await api.createInterview(data);
      setSuccessMsg('ນັດສຳພາດສຳເລັດ!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການນັດສຳພາດ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-box detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        
        {/* Header */}
        <div className="detail-modal-header">
          <h2>ນັດສຳພາດໃໝ່</h2>
          <button type="button" className="modal-x" onClick={onClose} aria-label="ປິດ">×</button>
        </div>

        {/* Form Body */}
        <div className="detail-modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ padding: '0.75rem', background: 'var(--error-light, #fef2f2)', color: 'var(--error)', borderRadius: '8px', fontSize: '0.8125rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{ padding: '0.75rem', background: 'var(--success-light, #f0fdf4)', color: 'var(--success)', borderRadius: '8px', fontSize: '0.8125rem', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                {successMsg}
              </div>
            )}

            {/* Job Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>ຕຳແໜ່ງງານ</label>
              {preSelectedJob ? (
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-muted)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                  value={preSelectedJob.title}
                  disabled
                />
              ) : (
                <select
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}
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
            </div>

            {/* Employee Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>ຜູ້ຊອກວຽກ</label>
              {preSelectedEmployee ? (
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-muted)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                  value={preSelectedEmployee.name}
                  disabled
                />
              ) : (
                <select
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}
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
              )}
            </div>

            {/* Date & Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>ວັນທີ</label>
                <input
                  type="date"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>ເວລາ</label>
                <input
                  type="time"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Interview Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>ປະເພດການສຳພາດ</label>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text)' }}>
                  <input
                    type="radio"
                    name="type"
                    value="onsite"
                    checked={form.type === 'onsite'}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  />
                  Onsite
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text)' }}>
                  <input
                    type="radio"
                    name="type"
                    value="online"
                    checked={form.type === 'online'}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  />
                  Online
                </label>
              </div>
            </div>

            {/* Location / Meeting Link */}
            {form.type === 'onsite' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>ສະຖານທີ່</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}
                  placeholder="ຕົວຢ່າງ: ຫ້ອງປະຊຸມໃຫຍ່ ຊັ້ນ 3 ຂອງບໍລິສັດ"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>ລິ້ງຫ້ອງປະຊຸມ (Meeting Link)</label>
                <input
                  type="url"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}
                  placeholder="ຕົວຢ່າງ: https://meet.google.com/abc-defg-hij"
                  value={form.meetingLink}
                  onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>ໝາຍເຫດເພີ່ມເຕີມ</label>
              <textarea
                style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', fontFamily: 'inherit', resize: 'vertical' }}
                placeholder="ຂໍ້ຄວາມເພີ່ມເຕີມ ຫຼື ສິ່ງທີ່ຕ້ອງກຽມ..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={onClose}
                disabled={loading}
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນການນັດ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
