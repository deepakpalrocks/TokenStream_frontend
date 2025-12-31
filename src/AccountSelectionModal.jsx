import './AccountSelectionModal.css'

function AccountSelectionModal({ isOpen, onClose, onTrySample, onUseRealAccount }) {
  if (!isOpen) return null

  return (
    <div className="account-selection-modal-overlay" onClick={onClose}>
      <div className="account-selection-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Choose Your Experience</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <p className="modal-description">
            Do you just want to try the app? Try with Sample account to see what it looks like.
          </p>
          
          <div className="modal-buttons">
            <button className="modal-button sample-button" onClick={onTrySample}>
              Try with Sample Account
            </button>
            <button className="modal-button real-button" onClick={onUseRealAccount}>
              I have account with salary being streamed
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountSelectionModal

