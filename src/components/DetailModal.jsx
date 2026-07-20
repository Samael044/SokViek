export default function DetailModal({ title, onClose, onBack, children }) {
  return (
    <div className="modal-overlay modal-overlay-full" onClick={onClose} role="presentation">
      <div className="modal-box detail-modal detail-modal-full" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <div className="detail-modal-header-content">
            <button type="button" className="detail-modal-back-btn" onClick={onBack || onClose} aria-label="ກັບຄືນ">
              <span className="back-icon">←</span>
              <span className="back-text">ກັບຄືນ</span>
            </button>
            <h2 className="detail-modal-title">{title}</h2>
            <button type="button" className="detail-modal-close-btn" onClick={onClose} aria-label="ປິດ">×</button>
          </div>
        </div>
        <div className="detail-modal-body">
          <div className="detail-modal-body-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}


