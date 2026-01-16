import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Review } from '../lib/supabase';
import '../styles/ReviewSection.css';

interface ReviewSectionProps {
  zipcode: string;
  h3Cell?: string;
}

const StarRating: React.FC<{
  rating: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}> = ({ rating, onRate, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
          onClick={() => !readonly && onRate && onRate(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          disabled={readonly}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const ReviewSection: React.FC<ReviewSectionProps> = ({ zipcode, h3Cell }) => {
  const { user, profile, isGuest, updateProfile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [livesHere, setLivesHere] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load all reviews for this zipcode
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .eq('zipcode', zipcode)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsData = data || [];
      setReviews(reviewsData);

      // Check if current user has already reviewed
      if (user) {
        const existing = reviewsData.find(r => r.user_id === user.id);
        setUserReview(existing || null);
      } else {
        setUserReview(null);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [zipcode, user]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setError('');
    setSubmitting(true);

    try {
      // Validate: user can only live in one zipcode
      if (livesHere && profile.zipcode && profile.zipcode !== zipcode) {
        setError('You already marked a different area as your residence. You can only live in one location.');
        setSubmitting(false);
        return;
      }

      // Regular users can only review where they live
      if (profile.user_type === 'regular' && !livesHere) {
        setError('Regular users can only review areas where they live.');
        setSubmitting(false);
        return;
      }

      // Insert or update review
      let reviewData;
      if (userReview) {
        // Update existing review
        const { data, error: updateError } = await supabase
          .from('reviews')
          .update({
            rating,
            message,
            lives_here: livesHere,
          })
          .eq('id', userReview.id)
          .select(`
            *,
            user_profile:user_profiles(*)
          `)
          .single();

        if (updateError) throw updateError;
        reviewData = data;
      } else {
        // Insert new review
        const { data, error: insertError } = await supabase
          .from('reviews')
          .insert({
            user_id: user.id,
            zipcode,
            h3_cell: h3Cell,
            rating,
            message,
            lives_here: livesHere,
          })
          .select(`
            *,
            user_profile:user_profiles(*)
          `)
          .single();

        if (insertError) throw insertError;
        reviewData = data;
      }

      // Update user profile if they marked this as their residence
      if (livesHere && profile.zipcode !== zipcode) {
        await updateProfile({ zipcode });
      }

      // Optimistically update reviews list instead of full reload
      if (reviewData) {
        if (userReview) {
          // Update existing review in list
          setReviews(prev => prev.map(r => r.id === reviewData.id ? reviewData : r));
          setUserReview(reviewData);
        } else {
          // Add new review to list
          setReviews(prev => [reviewData, ...prev]);
          setUserReview(reviewData);
        }
      }

      // Batch state updates
      setShowForm(false);
      setMessage('');
      setSubmitting(false);
    } catch (error: any) {
      setError(error.message || 'Failed to submit review');
      setSubmitting(false);
      // Fallback to full reload on error
      loadReviews();
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

  if (loading) {
    return <div className="review-section loading">Loading reviews...</div>;
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="review-section">
      <div className="review-header">
        <div className="review-header-top">
          <h3>Community Reviews</h3>
          {reviews.length > 0 && (
            <button
              className="review-toggle"
              onClick={() => setExpanded(!expanded)}
              aria-label="Toggle reviews"
            >
              {expanded ? '−' : '+'}
            </button>
          )}
        </div>
        <div className="review-stats">
          {reviews.length > 0 ? (
            <>
              <StarRating rating={Math.round(averageRating)} readonly />
              <span className="review-count">
                {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </>
          ) : (
            <span className="no-reviews">No reviews yet</span>
          )}
        </div>
      </div>

      <div className={`review-content ${expanded ? 'expanded' : ''}`}>
        {user && !isGuest && (
          <div className="review-action">
            {userReview ? (
              <button className="edit-review-btn" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : 'Edit Your Review'}
              </button>
            ) : (
              <button className="add-review-btn" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : '+ Add Review'}
              </button>
            )}
          </div>
        )}

        {isGuest && (
          <div className="guest-notice">
            <span>🔒 Sign in to leave a review</span>
          </div>
        )}

        {user && !isGuest && showForm && (
          <form className="review-form" onSubmit={handleSubmitReview}>
            <div className="form-group">
              <label>Your Rating</label>
              <StarRating rating={rating} onRate={setRating} />
            </div>

            <div className="form-group">
              <label>Your Review</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts about this neighborhood..."
                required
                rows={4}
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={livesHere}
                  onChange={(e) => setLivesHere(e.target.checked)}
                />
                <span>I live in this neighborhood</span>
              </label>
            </div>

            {error && <div className="review-error">{error}</div>}

            <button type="submit" className="submit-review-btn" disabled={submitting}>
              {submitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
            </button>
          </form>
        )}

        <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review.id} className="review-card">
            <div className="review-card-header">
              <div className="reviewer-info">
                {review.user_profile?.company_logo_url && (
                  <img 
                    src={review.user_profile.company_logo_url} 
                    alt="Company logo" 
                    className="reviewer-logo"
                  />
                )}
                <div>
                  <div className="reviewer-email">
                    {review.user_profile?.user_type === 'corporate' ? (
                      <span className="corporate-badge">
                        🏢 {review.user_profile.company_domain}
                      </span>
                    ) : (
                      review.user_profile?.email.split('@')[0]
                    )}
                  </div>
                  <div className="review-date">{formatDate(review.created_at)}</div>
                </div>
              </div>
              <div className="review-rating-wrapper">
                <StarRating rating={review.rating} readonly />
                {review.lives_here && (
                  <span className="lives-here-badge">🏠 Local Resident</span>
                )}
              </div>
            </div>
            <p className="review-message">{review.message}</p>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;
