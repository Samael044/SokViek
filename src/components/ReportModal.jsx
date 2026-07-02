import { useState } from 'react';
import { api } from '../api/client';
import { IconFlag } from './Icons';

export default function ReportModal({ onClose, targetType, targetId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    reason: 'spam',
    description: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!form.description.trim()) {
      setError('ກະລຸນາປ້ອນລາຍລະອຽດ');
      setLoading(false);
      return;
    }

    try {
      await api.submitReport({
        targetType,
        targetId,
        reason: form.reason,
        description: form.description,
      });

      setSuccessMsg('ສົ່ງລາຍງານສຳເລັດແລ້ວ');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'ເກີດຂໍ้ຜິດພາດໃນການສົ່ງລາຍງານ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-box detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        
        {/* Header */}
        <div className="detail-modal-header">
          <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconFlag size={18} style={{ color: 'var(--error)' }} /> ແຈ້ງບັນຫາ / ລະເມີດ
          </h2>
          <button type="button" className="modal-x" onClick={onClose} aria-label="ປິດ">×</button>
        </div>

        {/* Body Form */}
        <div className="detail-modal-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ padding: '0.75rem', background: '#fef2f2', color: 'var(--error)', borderRadius: '8px', fontSize: '0.8125rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{ padding: '0.75rem', background: '#f0fdf4', color: 'var(--success)', borderRadius: '8px', fontSize: '0.8125rem', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                {successMsg}
              </div>
            )}

            {/* Reason Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>ເຫດຜົນ</label>
              <select
                style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
              >
                <option value="spam">ສະແປມ (Spam)</option>
                <option value="inappropriate">ເນື້ອຫາບໍ່ເໝາະສົມ (Inappropriate)</option>
                <option value="fraud">ສໍ້ໂກງ / ຫຼອກລວງ (Fraud)</option>
                <option value="other">ອື່ນໆ (Other)</option>
              </select>
            </div>

            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>ລາຍລະອຽດເພີ່ມເຕີມ</label>
              <textarea
                style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', fontFamily: 'inherit', resize: 'vertical' }}
                placeholder="ກະລຸນາລະບຸລາຍລະອຽດຂອງບັນຫາ ຫຼື ການລະເມີດ..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={3}
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
                {loading ? 'ກຳລັງສົ່ງ...' : 'ສົ່ງລາຍງານ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
