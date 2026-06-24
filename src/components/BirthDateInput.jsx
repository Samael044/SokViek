import { useState, useEffect } from 'react';
import { MONTHS_LO, birthYearOptions } from '../utils/date';

/**
 * ຊ່ອງວັນ/ເດືອນ/ປີເກີດ — ເລືອກຈາກ dropdown ແບບ DD-MM-YYYY
 */
export default function BirthDateInput({ value, onChange, required = false, ageBadge = null }) {
  const [d, setD] = useState('');
  const [m, setM] = useState('');
  const [y, setY] = useState('');

  useEffect(() => {
    if (value && typeof value === 'string') {
      const datePart = value.includes('T') ? value.split('T')[0] : value;
      const [yy, mm, dd] = datePart.split('-');
      setY(yy || '');
      setM(Number(mm) || '');
      setD(Number(dd) || '');
    } else {
      setD('');
      setM('');
      setY('');
    }
  }, [value]);

  const handleChange = (newD, newM, newY) => {
    setD(newD);
    setM(newM);
    setY(newY);
    if (newD && newM && newY) {
      const formattedDate = `${newY}-${String(newM).padStart(2, '0')}-${String(newD).padStart(2, '0')}`;
      onChange(formattedDate);
    } else {
      onChange('');
    }
  };

  return (
    <div className="form-group">
      <label>
        <span lang="lo">ວັນ/ເດືອນ/ປີເກີດ</span>
        {ageBadge && <> &nbsp;{ageBadge}</>}
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <select value={d} onChange={e => handleChange(e.target.value, m, y)} required={required}>
          <option value="">ວັນທີ</option>
          {Array.from({length: 31}, (_, i) => i + 1).map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
        <select value={m} onChange={e => handleChange(d, e.target.value, y)} required={required}>
          <option value="">ເດືອນ</option>
          {MONTHS_LO.map((mName, i) => (
            <option key={i+1} value={i+1}>{mName}</option>
          ))}
        </select>
        <select value={y} onChange={e => handleChange(d, m, e.target.value)} required={required}>
          <option value="">ປີ (ຄ.ສ)</option>
          {birthYearOptions().map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
