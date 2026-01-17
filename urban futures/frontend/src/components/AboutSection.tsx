import React, { useState, useEffect } from 'react';
import { supabase, GreenInitiative } from '../lib/supabase';
import EventsSection from './EventsSection';
import '../styles/AboutSection.css';

interface AboutSectionProps {
  onNavigate?: (page: 'map') => void;
  showEvents?: boolean;
}

const INITIATIVE_TYPES = [
  { value: 'plant_flower', label: '🌸 Plant a Flower', icon: '🌸' },
  { value: 'hang_vines', label: '🌿 Hang Vines', icon: '🌿' },
  { value: 'plant_tree', label: '🌳 Plant a Tree', icon: '🌳' },
  { value: 'general', label: '♻️ General Green Initiative', icon: '♻️' },
];

const AboutSection: React.FC<AboutSectionProps> = ({ onNavigate, showEvents = false }) => {
  const [showMore, setShowMore] = useState(false);
  const [recentInitiatives, setRecentInitiatives] = useState<GreenInitiative[]>([]);
  const [loadingInitiatives, setLoadingInitiatives] = useState(true);
  const [contactForm, setContactForm] = useState({
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadRecentInitiatives();
  }, []);

  const loadRecentInitiatives = async () => {
    try {
      setLoadingInitiatives(true);
      
      const { data, error } = await supabase
        .from('green_initiatives')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      setRecentInitiatives(data || []);
    } catch (error) {
      console.error('Error loading recent initiatives:', error);
    } finally {
      setLoadingInitiatives(false);
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

  const handleMapClick = () => {
    if (onNavigate) {
      onNavigate('map');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      setSubmitStatus('success');
      setContactForm({ email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } catch (error: any) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="about-section">
      {/* Mission Section */}
      <section className="about-subsection mission-section">
        <div className="subsection-content">
          <h2 className="subsection-title">Mission</h2>
          <div className="mission-text">
            <p className="subsection-text">
              No matter how strong and accurate climate forecasting models are, meaningful change does not happen fast without government intervention, infrastructure adoption, or emergencies. Meaningful change ONLY happens when you put the power in the people.
            </p>
            <p className="subsection-text">
              This project embodies a fundamental shift from top-down policy making to grassroots empowerment: "Ask not what your country can do for you, but what you can do for your country." - JFK
            </p>
            {!showMore && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button className="read-more-btn" onClick={() => setShowMore(true)}>
                  Read more
                </button>
                </div>
            )}
            {showMore && (
              <div className="expanded-content">
                <p className="subsection-text">
                  We are a multi-talented team of students across several universities tasked with solving climate change in NYC but specifically in Staten Island where roughly 70% of resident properties have a backyard where vegetation can potentially happen. We iterated on dozens of ideas on how to combat different climate issues such as flooding, emergency evacs, etc but we decided to build something that doesn't rely on authorities to create real change fast.
                </p>
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button className="read-less-btn" onClick={() => setShowMore(false)}>
                    Show less
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="about-subsection what-we-do">
        <div className="subsection-content">
          <h2 className="subsection-title">What We Do</h2>
          <div className="what-we-do-grid">
            <div className="what-we-do-card">
              <div className="what-we-do-icon">🧮</div>
              <h3 className="what-we-do-title">Advanced Computation</h3>
              <p className="what-we-do-description">
                Our platform leverages cutting-edge machine learning models, including C++ neural networks for sub-10ms predictions and random forest ensembles for robust impact forecasting. We analyze heat vulnerability, air quality, tree density, and socioeconomic factors to identify optimal locations for climate resilience interventions.
              </p>
            </div>
            <div className="what-we-do-card">
              <div className="what-we-do-icon">🤝</div>
              <h3 className="what-we-do-title">Community Engagement</h3>
              <p className="what-we-do-description">
                We empower residents to take direct action through neighborhood reviews, green initiative sharing, and collaborative tracking. By putting climate data in the hands of communities, we enable grassroots change that doesn't wait for institutional responses. Every tree planted, every initiative shared, compounds into measurable environmental impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Events & News */}
      {showEvents && (
        <EventsSection showAll={true} limit={20} />
      )}

      {/* Recent Green Initiatives */}
      <section className="about-subsection recent-initiatives">
        <div className="subsection-content">
          <h2 className="subsection-title">Latest from the community</h2>
          {loadingInitiatives ? (
            <div className="initiatives-loading">Loading initiatives...</div>
          ) : recentInitiatives.length === 0 ? (
            <div className="no-initiatives">
              <span className="empty-icon">🌱</span>
              <p>No initiatives shared yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="initiatives-grid-landing">
              {recentInitiatives.map((initiative) => (
                <div key={initiative.id} className="initiative-card-landing">
                  <div className="initiative-image-wrapper-landing">
                    <img 
                      src={initiative.image_url} 
                      alt={initiative.caption || 'Green initiative'} 
                      className="initiative-image-landing"
                    />
                    <div className="initiative-type-badge-landing">
                      {getInitiativeIcon(initiative.initiative_type)}
                    </div>
                  </div>
                  <div className="initiative-content-landing">
                    <div className="initiative-header-row-landing">
                      {initiative.user_profile?.company_logo_url ? (
                        <div className="initiative-author-landing corporate">
                          <img 
                            src={initiative.user_profile.company_logo_url} 
                            alt="Company logo" 
                            className="author-logo-landing"
                          />
                          <div className="author-info-landing">
                            <span className="author-name-landing">
                              🏢 {initiative.user_profile.company_domain}
                            </span>
                            <span className="initiative-date-landing">{formatDate(initiative.created_at)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="initiative-author-landing">
                          <div className="author-icon-landing">🌱</div>
                          <div className="author-info-landing">
                            <span className="author-name-landing">
                              {initiative.user_profile?.email.split('@')[0]}
                            </span>
                            <span className="initiative-date-landing">{formatDate(initiative.created_at)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {initiative.caption && (
                      <p className="initiative-caption-landing">{initiative.caption}</p>
                    )}
                    <div className="initiative-location-landing">
                      📍 ZIP: {initiative.zipcode}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How Can You Predict the Future */}
      <section className="about-subsection trust-section">
        <div className="subsection-content">
          <h2 className="subsection-title">How Can You Predict the Future? Why Should We Trust You?</h2>
            <p className="subsection-text">
            Transparency and scientific rigor are at the core of our platform. All our code, data pipelines, machine learning models, and research documentation are open source and publicly available. We believe that trust comes from openness, peer review, and community verification.
            </p>
          <div className="trust-links">
              <a 
              href="https://github.com/RyanRana/nycleap/tree/main" 
                target="_blank" 
                rel="noopener noreferrer"
              className="trust-link"
              >
                <span>
                  <svg className="github-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                </span>
              <span>View Open Source Code</span>
              <span className="link-arrow">→</span>
            </a>
            <a 
              href="https://github.com/RyanRana/nycleap/blob/main/urban%20futures/docs/TECHNICAL_DOCUMENTATION.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="trust-link"
            >
              <span>📚</span>
              <span>Research & Development</span>
              <span className="link-arrow">→</span>
            </a>
            <a 
              href="https://github.com/RyanRana/nycleap/blob/main/urban%20futures/docs/QUICKSTART.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="trust-link"
            >
              <span>🚀</span>
              <span>Run & Train Locally</span>
              <span className="link-arrow">→</span>
            </a>
            <a 
              href="/healthcare/index.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="trust-link"
            >
              <span>🏥</span>
              <span>Healthcare Productivity by ZIP</span>
              <span className="link-arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* About Our Team */}
      <section className="about-subsection team-section">
        <div className="subsection-content">
          <h2 className="subsection-title">About Our Team</h2>
          <div className="team-grid">
            <div className="team-member-card">
              <div className="team-photo-placeholder">
                <span className="photo-placeholder-text">Photo</span>
              </div>
              <h3 className="team-name">Ryan</h3>
            </div>
            <div className="team-member-card">
              <div className="team-photo-placeholder">
                <span className="photo-placeholder-text">Photo</span>
              </div>
              <h3 className="team-name">Vincent</h3>
            </div>
            <div className="team-member-card">
              <div className="team-photo-placeholder">
                <span className="photo-placeholder-text">Photo</span>
              </div>
              <h3 className="team-name">Julia</h3>
            </div>
            <div className="team-member-card">
              <div className="team-photo-placeholder">
                <span className="photo-placeholder-text">Photo</span>
              </div>
              <h3 className="team-name">Chaitanya</h3>
            </div>
            <div className="team-member-card">
              <div className="team-photo-placeholder">
                <span className="photo-placeholder-text">Photo</span>
              </div>
              <h3 className="team-name">Kai</h3>
            </div>
              </div>
        </div>
      </section>

      {/* Get in Touch */}
      <section className="about-subsection contact-section">
        <div className="subsection-content">
          <h2 className="subsection-title">Get in Touch</h2>
          <p className="subsection-text" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            Have questions, suggestions, or want to collaborate? We'd love to hear from you.
          </p>
          
          <form className="contact-form" onSubmit={handleContactSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={contactForm.email}
                onChange={handleContactChange}
                required
                placeholder="your.email@example.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={contactForm.subject}
                onChange={handleContactChange}
                required
                placeholder="What's this about?"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={contactForm.message}
                onChange={handleContactChange}
                required
                rows={6}
                placeholder="Tell us what's on your mind..."
                className="form-textarea"
              />
            </div>

            {submitStatus === 'success' && (
              <div className="form-message form-message-success">
                ✓ Message sent successfully! We'll get back to you soon.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="form-message form-message-error">
                ✗ {errorMessage}
            </div>
          )}

            <button 
              type="submit" 
              className="contact-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="brand-name-footer">ReforestNYC</div>
            <p className="footer-tagline">Empowering communities through data-driven climate action</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4 className="footer-heading">Platform</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); handleMapClick(); }} className="footer-link">Interactive Map</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleMapClick(); }} className="footer-link">Leaderboard</a>
            </div>
            <div className="footer-column">
              <h4 className="footer-heading">Resources</h4>
              <a 
                href="https://github.com/RyanRana/nycleap/tree/main" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                Source Code
              </a>
              <a 
                href="https://github.com/RyanRana/nycleap/blob/main/urban%20futures/docs/TECHNICAL_DOCUMENTATION.md" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                Documentation
              </a>
            </div>
            <div className="footer-column">
              <h4 className="footer-heading">About</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="footer-link">Mission</a>
              <a href="#" onClick={(e) => { e.preventDefault(); document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="footer-link">Team</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">© {new Date().getFullYear()} ReforestNYC. All rights reserved.</p>
          <p className="footer-license">Open source under MIT License</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutSection;
