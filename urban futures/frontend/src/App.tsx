import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import Information from './components/Information';
import LandingPage from './components/LandingPage';
import MapInstructions from './components/MapInstructions';
import AuthModal from './components/AuthModal';
import Leaderboard from './components/Leaderboard';
import { useAuth } from './contexts/AuthContext';
import './styles/App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface H3Data {
  h3_cell: string;
  location_name?: string;
  impact_per_dollar: number;
  recommended_tree_count: number;
  projected_temp_reduction_F: number;
  projected_pm25_reduction_lbs_per_year: number;
  priority_final: number;
  ej_score: number;
  features: any;
}

type Page = 'map' | 'information' | 'leaderboard';

function App() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedH3, setSelectedH3] = useState<H3Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('map');
  const [instructionsDismissed, setInstructionsDismissed] = useState(false);

  const handleLandingNavigate = (page: 'map' | 'leaderboard') => {
    // Show auth modal if user is not logged in and not a guest (only for map)
    if (page === 'map' && !user && !isGuest && !authLoading) {
      setShowAuthModal(true);
    }
    setShowLanding(false);
    setCurrentPage(page);
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    // Always show map after closing modal (user selected an option or closed it)
    setShowLanding(false);
    setCurrentPage('map');
  };

  const handleBackToLanding = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLanding(true);
  };

  const handleH3Click = async (h3Cell: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/h3/${h3Cell}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Received H3 data:', data);
        setSelectedH3(data);
      } else {
        console.error('Failed to fetch H3 data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching H3 data:', error);
    } finally {
      setLoading(false);
    }
  };


  if (showLanding) {
    return <LandingPage onNavigate={handleLandingNavigate} />;
  }

  return (
    <div className="app">
      {showAuthModal && <AuthModal onClose={handleAuthModalClose} />}
      
      <header className="app-header">
        <div className="header-content">
          <button
            type="button"
            className="back-button"
            onClick={handleBackToLanding}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <span className="back-icon">←</span>
            <span className="back-text">back</span>
          </button>
        </div>
      </header>
      <div className="app-content">
        {currentPage === 'map' && (
          <>
        <MapComponent
          onH3Click={handleH3Click}
          selectedH3={selectedH3}
        />
            {!selectedH3 && !loading && !instructionsDismissed && <MapInstructions onDismiss={() => setInstructionsDismissed(true)} />}
            {(selectedH3 || loading) && <Sidebar h3Data={selectedH3} loading={loading} onClose={() => setSelectedH3(null)} />}
          </>
        )}
        {currentPage === 'leaderboard' && <Leaderboard />}
        {currentPage === 'information' && <Information />}
      </div>
    </div>
  );
}

export default App;

