import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import '../styles/Leaderboard.css';

interface LeaderboardEntry {
  zipcode: string;
  initiative_count: number;
  rank: number;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch green initiatives grouped by zipcode
      const { data, error: fetchError } = await supabase
        .from('green_initiatives')
        .select('zipcode')
        .not('zipcode', 'is', null);

      if (fetchError) throw fetchError;

      // Count initiatives per zipcode
      const zipcodeCounts: { [key: string]: number } = {};
      data?.forEach((initiative) => {
        const zip = initiative.zipcode;
        zipcodeCounts[zip] = (zipcodeCounts[zip] || 0) + 1;
      });

      // Get all NYC ZIP codes from backend
      let allNYCZips: string[] = [];
      try {
        const response = await fetch(`${API_BASE_URL}/zipcodes`);
        if (response.ok) {
          const zipData = await response.json();
          allNYCZips = zipData.zipcodes || [];
        }
      } catch (err) {
        console.warn('Could not fetch all ZIP codes from backend, using only those with initiatives');
      }

      // Get all ZIP codes that have initiatives
      const zipsWithInitiatives = Object.keys(zipcodeCounts);
      
      // Get ZIP codes with 0 initiatives (all NYC ZIPs minus those with initiatives)
      const zipsWithZeroInitiatives = allNYCZips
        .filter(zip => !zipsWithInitiatives.includes(zip))
        .sort((a, b) => parseInt(a) - parseInt(b)); // Sort numerically

      // ZIPs with initiatives (sorted by count, then zipcode)
      const zipsWithInitiativesData = Object.entries(zipcodeCounts)
        .map(([zipcode, count]) => ({
          zipcode,
          initiative_count: count,
          rank: 0,
        }))
        .sort((a, b) => {
          if (b.initiative_count !== a.initiative_count) {
            return b.initiative_count - a.initiative_count;
          }
          return parseInt(a.zipcode) - parseInt(b.zipcode);
        });

      // Fill remaining slots up to 30 with ZIP codes that have 0 initiatives
      const remainingSlots = Math.max(0, 30 - zipsWithInitiativesData.length);
      const zeroInitiativeZips = zipsWithZeroInitiatives
        .slice(0, remainingSlots)
        .map(zipcode => ({
          zipcode,
          initiative_count: 0,
          rank: 0,
        }));

      // Combine: ZIPs with initiatives + remaining slots with 0 initiatives
      const allZipsData: LeaderboardEntry[] = [
        ...zipsWithInitiativesData,
        ...zeroInitiativeZips
      ];

      // Assign ranks
      const leaderboardData = allZipsData.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setEntries(leaderboardData);
    } catch (err: any) {
      console.error('Error loading leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  // Always show at least 30 entries (fill with 0-initiative ZIPs if needed)
  const minEntries = 30;
  const displayedEntries = showAll ? entries : entries.slice(0, minEntries);
  const hasMore = entries.length > minEntries;

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-error">
          <p>Error: {error}</p>
          <button onClick={loadLeaderboard}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Green Initiatives Leaderboard</h1>
        <p className="leaderboard-subtitle">
          Top neighborhoods by number of green initiatives shared
        </p>
      </div>

      <div className="leaderboard-list">
        {displayedEntries.length > 0 ? (
          displayedEntries.map((entry) => (
            <div key={entry.zipcode} className="leaderboard-entry">
              <div className="rank-badge">
                <span className="rank-number">{entry.rank}</span>
              </div>
              <div className="entry-content">
                <div className="zipcode-label">ZIP Code</div>
                <div className="zipcode-value">{entry.zipcode}</div>
              </div>
              <div className="entry-stats">
                <div className="initiative-count">
                  <span className="count-number">{entry.initiative_count}</span>
                  <span className="count-label">
                    {entry.initiative_count === 1 ? 'initiative' : 'initiatives'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="leaderboard-entry empty-state">
            <div className="rank-badge">
              <span className="rank-number">—</span>
            </div>
            <div className="entry-content">
              <div className="zipcode-label">No Data Yet</div>
              <div className="zipcode-value">Start sharing green initiatives!</div>
            </div>
            <div className="entry-stats">
              <div className="initiative-count">
                <span className="count-number">0</span>
                <span className="count-label">initiatives</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="leaderboard-footer">
          <button
            className="view-more-btn"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Top 30' : `View All ${entries.length} Neighborhoods`}
          </button>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
