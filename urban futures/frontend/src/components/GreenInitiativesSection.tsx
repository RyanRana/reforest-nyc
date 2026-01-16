import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, GreenInitiative } from '../lib/supabase';
import GreenInitiativeModal from './GreenInitiativeModal';
import '../styles/GreenInitiativesSection.css';

interface GreenInitiativesSectionProps {
  zipcode: string;
  h3Cell?: string;
}

const INITIATIVE_TYPES = [
  { value: 'plant_flower', label: '🌸 Plant a Flower', icon: '🌸' },
  { value: 'hang_vines', label: '🌿 Hang Vines', icon: '🌿' },
  { value: 'plant_tree', label: '🌳 Plant a Tree', icon: '🌳' },
  { value: 'general', label: '♻️ General Green Initiative', icon: '♻️' },
];

const GreenInitiativesSection: React.FC<GreenInitiativesSectionProps> = ({ zipcode, h3Cell }) => {
  const { user, profile, isGuest } = useAuth();
  const [initiatives, setInitiatives] = useState<GreenInitiative[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [initiativeType, setInitiativeType] = useState<string>('general');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [topCardIndex, setTopCardIndex] = useState(0);

  useEffect(() => {
    loadInitiatives();
  }, [zipcode]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const loadInitiatives = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('green_initiatives')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .eq('zipcode', zipcode)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInitiatives(data || []);
    } catch (error) {
      console.error('Error loading initiatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !selectedFile) return;

    setError('');
    setSubmitting(true);

    try {
      // Regular users can only post in their zipcode
      // Normalize zipcodes for comparison (handle string/number and whitespace)
      const profileZip = profile.zipcode ? String(profile.zipcode).trim() : null;
      const currentZip = zipcode ? String(zipcode).trim() : null;
      
      if (profile.user_type === 'regular') {
        if (!profileZip) {
          setError('Please mark this neighborhood as your home in a review first');
          setSubmitting(false);
          return;
        }
        if (!currentZip) {
          setError('Invalid neighborhood selected');
          setSubmitting(false);
          return;
        }
        // Compare normalized zipcodes
        if (profileZip !== currentZip) {
          setError(`Regular users can only upload images in their home neighborhood (Home: ${profileZip}, Current: ${currentZip})`);
          setSubmitting(false);
          return;
        }
      }

      // Upload image to Supabase storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('green-initiative-images')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('green-initiative-images')
        .getPublicUrl(fileName);

      // Insert initiative record
      const { error: insertError } = await supabase
        .from('green_initiatives')
        .insert({
          user_id: user.id,
          zipcode,
          h3_cell: h3Cell,
          image_url: publicUrl,
          caption: caption || null,
          initiative_type: initiativeType,
        });

      if (insertError) throw insertError;

      // Reload initiatives
      await loadInitiatives();
      
      // Reset form
      setShowForm(false);
      setSelectedFile(null);
      setPreviewUrl('');
      setCaption('');
      setInitiativeType('general');
    } catch (error: any) {
      setError(error.message || 'Failed to upload initiative');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getInitiativeIcon = (type: string) => {
    return INITIATIVE_TYPES.find(t => t.value === type)?.icon || '♻️';
  };

  const handleCardClick = (index: number) => {
    setSelectedIndex(index);
    setModalOpen(true);
  };

  const handleModalNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (direction === 'next' && selectedIndex < initiatives.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  // Reset selected index when modal closes
  useEffect(() => {
    if (!modalOpen) {
      setSelectedIndex(0);
    }
  }, [modalOpen]);

  // Reset top card when zipcode changes
  useEffect(() => {
    setTopCardIndex(0);
  }, [zipcode]);

  const handleNextCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTopCardIndex((prev) => (prev + 1) % initiatives.length);
  };

  const handlePrevCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTopCardIndex((prev) => (prev - 1 + initiatives.length) % initiatives.length);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  if (loading) {
    return <div className="initiatives-section loading">Loading green initiatives...</div>;
  }

  return (
    <div className="initiatives-section">
      <div className="initiatives-header">
        <h3>Green Initiatives</h3>
        <p className="initiatives-description">
          Community members sharing their environmental actions
        </p>
      </div>

      {user && !isGuest && (
        <div className="initiatives-action">
          <button className="add-initiative-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Share Your Initiative'}
          </button>
        </div>
      )}

      {isGuest && (
        <div className="guest-notice">
          <span>🔒 Sign in to share your green initiatives</span>
        </div>
      )}

      {showForm && user && (
        <form className="initiative-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              required
            />
            {previewUrl && (
              <div className="image-preview">
                <img src={previewUrl} alt="Preview" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Initiative Type</label>
            <div className="initiative-type-selector">
              {INITIATIVE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`type-option ${initiativeType === type.value ? 'selected' : ''}`}
                  onClick={() => setInitiativeType(type.value)}
                >
                  <span className="type-icon">{type.icon}</span>
                  <span className="type-label">{type.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Caption (Optional)</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe your green initiative..."
              rows={3}
            />
          </div>

          {error && <div className="initiative-error">{error}</div>}

          <button type="submit" className="submit-initiative-btn" disabled={submitting || !selectedFile}>
            {submitting ? 'Uploading...' : 'Share Initiative'}
          </button>
        </form>
      )}

      <div className="initiatives-grid">
        {initiatives.length === 0 && (
          <div className="no-initiatives">
            <span className="empty-icon">🌱</span>
            <p>No initiatives shared yet. Be the first to share!</p>
          </div>
        )}

        {initiatives.length > 1 && (
          <>
            <button 
              className="card-nav-arrow card-nav-prev"
              onClick={handlePrevCard}
              aria-label="Previous card"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button 
              className="card-nav-arrow card-nav-next"
              onClick={handleNextCard}
              aria-label="Next card"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </>
        )}

        {initiatives.map((initiative, index) => {
          // Calculate display order: topCardIndex is shown first (on top)
          const displayOrder = (index - topCardIndex + initiatives.length) % initiatives.length;
          const isTopCard = displayOrder === 0;
          
          return (
            <div 
              key={initiative.id} 
              className={`initiative-card ${!isTopCard ? 'overlapping' : ''}`}
              style={{ 
                zIndex: initiatives.length - displayOrder,
                pointerEvents: isTopCard ? 'auto' : 'none'
              }}
              onClick={() => handleCardClick(index)}
            >
            <div className="initiative-image-wrapper">
              <img 
                src={initiative.image_url} 
                alt={initiative.caption || 'Green initiative'} 
                className="initiative-image"
              />
              <div className="initiative-type-badge">
                {getInitiativeIcon(initiative.initiative_type)}
              </div>
            </div>

            <div className="initiative-content">
              <div className="initiative-header-row">
                {initiative.user_profile?.company_logo_url ? (
                  <div className="initiative-author corporate">
                    <img 
                      src={initiative.user_profile.company_logo_url} 
                      alt="Company logo" 
                      className="author-logo"
                    />
                    <div className="author-info">
                      <span className="author-name">
                        🏢 {initiative.user_profile.company_domain}
                      </span>
                      <span className="initiative-date">{formatDate(initiative.created_at)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="initiative-author">
                    <div className="author-icon">🌱</div>
                    <div className="author-info">
                      <span className="author-name">
                        {initiative.user_profile?.email.split('@')[0]}
                      </span>
                      <span className="initiative-date">{formatDate(initiative.created_at)}</span>
                    </div>
                  </div>
                )}
              </div>

              {initiative.caption && (
                <p className="initiative-caption">{initiative.caption}</p>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {modalOpen && initiatives.length > 0 && createPortal(
        <GreenInitiativeModal
          initiatives={initiatives}
          currentIndex={selectedIndex}
          onClose={handleCloseModal}
          onNavigate={handleModalNavigate}
        />,
        document.body
      )}
    </div>
  );
};

export default GreenInitiativesSection;
