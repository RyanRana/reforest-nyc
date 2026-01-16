import React, { useEffect } from 'react';
import { GreenInitiative } from '../lib/supabase';
import '../styles/GreenInitiativeModal.css';

interface GreenInitiativeModalProps {
  initiatives: GreenInitiative[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const INITIATIVE_TYPE_LABELS: { [key: string]: { label: string; icon: string } } = {
  plant_flower: { label: 'Plant a Flower', icon: '🌸' },
  hang_vines: { label: 'Hang Vines', icon: '🌿' },
  plant_tree: { label: 'Plant a Tree', icon: '🌳' },
  general: { label: 'General Green Initiative', icon: '♻️' },
};

const GreenInitiativeModal: React.FC<GreenInitiativeModalProps> = ({
  initiatives,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  const currentInitiative = initiatives[currentIndex];
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < initiatives.length - 1;
  const typeInfo = INITIATIVE_TYPE_LABELS[currentInitiative.initiative_type] || INITIATIVE_TYPE_LABELS.general;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canGoPrev) {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight' && canGoNext) {
        onNavigate('next');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoPrev, canGoNext, onNavigate, onClose]);

  return (
    <div 
      className="initiative-modal-overlay" 
      onClick={onClose}
    >
      <div className="initiative-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {canGoPrev && (
          <button 
            className="modal-nav-btn modal-nav-prev" 
            onClick={() => onNavigate('prev')}
            aria-label="Previous"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        )}

        {canGoNext && (
          <button 
            className="modal-nav-btn modal-nav-next" 
            onClick={() => onNavigate('next')}
            aria-label="Next"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        )}

        <div className="modal-content">
          <div className="modal-image-container">
            <img 
              src={currentInitiative.image_url} 
              alt={currentInitiative.caption || 'Green initiative'} 
              className="modal-image"
            />
            <div className="modal-type-badge">
              <span className="type-icon">{typeInfo.icon}</span>
              <span className="type-label">{typeInfo.label}</span>
            </div>
          </div>

          <div className="modal-info">
            <div className="modal-header">
              {currentInitiative.user_profile?.company_logo_url ? (
                <div className="modal-author corporate">
                  <img 
                    src={currentInitiative.user_profile.company_logo_url} 
                    alt="Company logo" 
                    className="author-logo"
                  />
                  <div className="author-info">
                    <span className="author-name">
                      🏢 {currentInitiative.user_profile.company_domain}
                    </span>
                    <span className="initiative-date">{formatDate(currentInitiative.created_at)}</span>
                  </div>
                </div>
              ) : (
                <div className="modal-author">
                  <div className="author-icon">🌱</div>
                  <div className="author-info">
                    <span className="author-name">
                      {currentInitiative.user_profile?.email.split('@')[0]}
                    </span>
                    <span className="initiative-date">{formatDate(currentInitiative.created_at)}</span>
                  </div>
                </div>
              )}
            </div>

            {currentInitiative.caption && (
              <div className="modal-caption">
                <p>{currentInitiative.caption}</p>
              </div>
            )}

            <div className="modal-location">
              <span className="location-label">ZIP Code:</span>
              <span className="location-value">{currentInitiative.zipcode}</span>
            </div>
          </div>
        </div>

        <div className="modal-counter">
          {currentIndex + 1} / {initiatives.length}
        </div>
      </div>
    </div>
  );
};

export default GreenInitiativeModal;
