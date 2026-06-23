export default function DetailModal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-box detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-x" onClick={onClose} aria-label="ປິດ">×</button>
        </div>
        <div className="detail-modal-body">{children}</div>
      </div>
    </div>
  );
}
