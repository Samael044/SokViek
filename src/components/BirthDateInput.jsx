/**
 * ຊ່ອງວັນ/ເດືອນ/ປີເກີດ — ເລືອກຈາກປະຕິທິນ
 */
export default function BirthDateInput({ value, onChange, required = false, ageBadge = null }) {
  return (
    <div className="form-group">
      <label>
        <span lang="lo">ວັນ/ເດືອນ/ປີເກີດ</span>
        {ageBadge && <> &nbsp;{ageBadge}</>}
      </label>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || '')}
        required={required}
        aria-label="ວັນເດືອນປີເກີດ"
      />
    </div>
  );
}
