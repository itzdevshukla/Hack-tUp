import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import OurTeam from './components/OurTeam';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import HostEvent from './components/HostEvent';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import EventLeaderboard from './components/EventLeaderboard';
import ClassicLeaderboard from './components/ClassicLeaderboard';


import EventDetails from './components/EventDetails';
import Challenges from './components/Challenges';
import UserChallengeDetail from './components/UserChallengeDetail';
import AdminDashboard from './components/AdminDashboard';
import EventAnnouncements from './components/EventAnnouncements';
import EventWriteUps from './components/EventWriteUps';

import UserDashboardLayout from './components/UserDashboardLayout';
import EventArenaLayout from './components/EventArenaLayout';
import UserOverview from './components/UserOverview';
import RegisteredEvents from './components/RegisteredEvents';
import NotFound from './components/NotFound';
import TeamSection from './components/TeamSection';
import { useParams } from 'react-router-dom';

// Wrapper to parse the event ID and pass username
const TeamSectionWrapper = () => {
  const { id } = useParams();
  const { user } = useAuth();

  // Need to get is_team_mode and max_team_size somehow - easiest is through an API call inside TeamSection
  // But since we just need max_team_size, we'll fetch it inside the wrapper
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/event/${id}/`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then(data => {
        setEventData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: '2rem', color: '#9ACD32', fontFamily: 'monospace' }}>LOADING TEAM INTEL...</div>;

  if (eventData && !eventData.is_team_mode) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#ff4d4d', fontFamily: 'Orbitron', fontSize: '1.2rem' }}>
        TEAM MODE IS DISABLED FOR THIS EVENT.
      </div>
    );
  }

  return <TeamSection eventId={id} maxTeamSize={eventData?.max_team_size || 4} currentUsername={user?.username} />;
};

function App() {
  return (
    <div className="app">
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/our-team" element={<OurTeam />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User Dashboard layout wraps these routes */}
          <Route path="/dashboard" element={<UserDashboardLayout />}>
            <Route index element={<UserOverview />} />
            <Route path="explore" element={<Dashboard />} />
            <Route path="registered" element={<RegisteredEvents />} />
            <Route path="host-event" element={<HostEvent />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/profile" element={
            <UserDashboardLayout>
              <Profile />
            </UserDashboardLayout>
          } />
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* Event Details page (before joining) */}
          <Route path="/event/:id" element={
            <UserDashboardLayout>
              <EventDetails />
            </UserDashboardLayout>
          } />

          <Route path="/event/:id/*" element={<EventArenaLayout />}>
            <Route path="team" element={<TeamSectionWrapper />} />
            <Route path="challenges" element={<Challenges />} />
            <Route path="challenges/:challengeId" element={<UserChallengeDetail />} />
            <Route path="leaderboard" element={<EventLeaderboard />} />

            <Route path="announcements" element={<EventAnnouncements />} />
            <Route path="writeups" element={<EventWriteUps />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin Dashboard Catch-All Route */}
          <Route path="/administration/*" element={<AdminDashboard />} />

          {/* Standalone Classic Leaderboard – no layout, opens in new tab */}
          <Route path="/classic-leaderboard/:id" element={<ClassicLeaderboard />} />

          {/* 404 Catch-All Route */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
