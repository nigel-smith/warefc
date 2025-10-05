import React, { useState, useEffect } from 'react';
import { Users, Calendar, Trophy, Vote, Bell, LogOut, User, Shield, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

// Mock database - in production, replace with actual SQLite backend
const initializeData = () => {
  const stored = localStorage.getItem('footballAppData');
  if (stored) return JSON.parse(stored);
  
  return {
    users: [
      { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User' },
      { id: 2, username: 'coach', password: 'coach123', role: 'coach', name: 'Head Coach' },
      { id: 3, username: 'parent1', password: 'parent123', role: 'parent', name: 'Parent Smith' }
    ],
    players: [
      { id: 1, name: 'Tommy Wilson', position: 'Forward', number: 9, active: true },
      { id: 2, name: 'Jake Foster', position: 'Midfielder', number: 7, active: true },
      { id: 3, name: 'Ben Clarke', position: 'Defender', number: 4, active: true }
    ],
    fixtures: [
      { 
        id: 1, 
        opponent: 'Riverside FC', 
        date: '2025-10-12', 
        time: '10:00',
        venue: 'Home',
        homeScore: null,
        awayScore: null,
        scorers: [],
        status: 'upcoming',
        coachMotm: null,
        parentMotm: null,
        parentVotes: {}
      }
    ],
    liveMatch: null
  };
};

const App = () => {
  const [data, setData] = useState(initializeData());
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('home');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingFixture, setEditingFixture] = useState(null);
  const [newPlayer, setNewPlayer] = useState({ name: '', position: '', number: '' });
  const [newFixture, setNewFixture] = useState({ opponent: '', date: '', time: '', venue: 'Home' });
  const [votingFixture, setVotingFixture] = useState(null);

  useEffect(() => {
    localStorage.setItem('footballAppData', JSON.stringify(data));
  }, [data]);

  const login = (e) => {
    e.preventDefault();
    const user = data.users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setLoginForm({ username: '', password: '' });
    } else {
      alert('Invalid credentials');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setView('home');
    setData(prev => ({ ...prev, liveMatch: null }));
  };

  const addPlayer = () => {
    if (!newPlayer.name || !newPlayer.position || !newPlayer.number) {
      alert('Please fill all fields');
      return;
    }
    setData(prev => ({
      ...prev,
      players: [...prev.players, { ...newPlayer, id: Date.now(), active: true }]
    }));
    setNewPlayer({ name: '', position: '', number: '' });
  };

  const updatePlayer = (id, updates) => {
    setData(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
    setEditingPlayer(null);
  };

  const deletePlayer = (id) => {
    if (confirm('Remove this player from roster?')) {
      setData(prev => ({
        ...prev,
        players: prev.players.filter(p => p.id !== id)
      }));
    }
  };

  const addFixture = () => {
    if (!newFixture.opponent || !newFixture.date || !newFixture.time) {
      alert('Please fill all fields');
      return;
    }
    setData(prev => ({
      ...prev,
      fixtures: [...prev.fixtures, { 
        ...newFixture, 
        id: Date.now(), 
        homeScore: null, 
        awayScore: null,
        scorers: [],
        status: 'upcoming',
        coachMotm: null,
        parentMotm: null,
        parentVotes: {}
      }]
    }));
    setNewFixture({ opponent: '', date: '', time: '', venue: 'Home' });
  };

  const updateFixture = (id, updates) => {
    setData(prev => ({
      ...prev,
      fixtures: prev.fixtures.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
    setEditingFixture(null);
  };

  const deleteFixture = (id) => {
    if (confirm('Delete this fixture?')) {
      setData(prev => ({
        ...prev,
        fixtures: prev.fixtures.filter(f => f.id !== id)
      }));
    }
  };

  const startLiveMatch = (fixtureId) => {
    const fixture = data.fixtures.find(f => f.id === fixtureId);
    setData(prev => ({
      ...prev,
      liveMatch: { 
        ...fixture, 
        homeScore: fixture.homeScore || 0, 
        awayScore: fixture.awayScore || 0 
      }
    }));
  };

  const updateLiveScore = (type, value) => {
    setData(prev => {
      const updated = { ...prev.liveMatch, [type]: value };
      return {
        ...prev,
        liveMatch: updated,
        fixtures: prev.fixtures.map(f => 
          f.id === prev.liveMatch.id ? updated : f
        )
      };
    });
  };

  const addScorer = (playerId) => {
    setData(prev => {
      const updated = {
        ...prev.liveMatch,
        scorers: [...prev.liveMatch.scorers, playerId]
      };
      return {
        ...prev,
        liveMatch: updated,
        fixtures: prev.fixtures.map(f => 
          f.id === prev.liveMatch.id ? updated : f
        )
      };
    });
  };

  const endLiveMatch = () => {
    setData(prev => ({
      ...prev,
      fixtures: prev.fixtures.map(f => 
        f.id === prev.liveMatch.id 
          ? { ...prev.liveMatch, status: 'completed' }
          : f
      ),
      liveMatch: null
    }));
  };

  const voteMotm = (fixtureId, playerId) => {
    setData(prev => ({
      ...prev,
      fixtures: prev.fixtures.map(f => {
        if (f.id !== fixtureId) return f;
        
        if (currentUser.role === 'coach') {
          return { ...f, coachMotm: playerId };
        } else if (currentUser.role === 'parent') {
          const votes = { ...f.parentVotes, [currentUser.id]: playerId };
          const voteCount = {};
          Object.values(votes).forEach(pid => {
            voteCount[pid] = (voteCount[pid] || 0) + 1;
          });
          const winner = Object.entries(voteCount).sort((a, b) => b[1] - a[1])[0];
          return { 
            ...f, 
            parentVotes: votes,
            parentMotm: winner ? parseInt(winner[0]) : null
          };
        }
        return f;
      })
    }));
    setVotingFixture(null);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full border-4 border-black">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-r from-black via-gray-700 to-black rounded-full mb-4">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
              Football Club Manager
            </h1>
            <p className="text-gray-600 mt-2">Grassroots Football Management</p>
          </div>
          
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full p-3 border-2 border-gray-300 rounded focus:border-black outline-none"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full p-3 border-2 border-gray-300 rounded focus:border-black outline-none"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white p-3 rounded font-semibold hover:bg-gray-800 transition"
            >
              Login
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-100 rounded text-sm">
            <p className="font-semibold mb-2">Demo Accounts:</p>
            <p>Admin: admin / admin123</p>
            <p>Coach: coach / coach123</p>
            <p>Parent: parent1 / parent123</p>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'coach';
  const completedFixtures = data.fixtures.filter(f => f.status === 'completed').reverse();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with stripes */}
      <div className="bg-gradient-to-r from-black via-white to-black p-1">
        <div className="bg-white">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-black via-gray-600 to-black rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">Football Club</h1>
                <p className="text-sm text-gray-600">Season 2025/26</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-black">{currentUser.name}</p>
                <p className="text-xs text-gray-600 capitalize">{currentUser.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-black text-white border-b-4 border-gray-300">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'home', icon: Bell, label: 'Home' },
              { id: 'roster', icon: Users, label: 'Roster' },
              { id: 'fixtures', icon: Calendar, label: 'Fixtures' },
              { id: 'motm', icon: Trophy, label: 'Awards' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center gap-2 px-6 py-3 transition ${
                  view === item.id 
                    ? 'bg-white text-black' 
                    : 'hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* HOME VIEW */}
        {view === 'home' && (
          <div className="space-y-6">
            {/* Live Match */}
            {data.liveMatch && (
              <div className="bg-gradient-to-r from-black via-gray-800 to-black p-1 rounded-lg">
                <div className="bg-white p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Bell className="w-6 h-6 text-red-600 animate-pulse" />
                      LIVE MATCH
                    </h2>
                    {canEdit && (
                      <button
                        onClick={endLiveMatch}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        End Match
                      </button>
                    )}
                  </div>
                  
                  <div className="text-center mb-6">
                    <p className="text-gray-600 mb-4">{data.liveMatch.opponent}</p>
                    <div className="flex items-center justify-center gap-8">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Home</p>
                        {canEdit ? (
                          <input
                            type="number"
                            value={data.liveMatch.homeScore}
                            onChange={e => updateLiveScore('homeScore', parseInt(e.target.value))}
                            className="text-6xl font-bold w-24 text-center border-2 border-black rounded p-2"
                          />
                        ) : (
                          <p className="text-6xl font-bold">{data.liveMatch.homeScore}</p>
                        )}
                      </div>
                      <span className="text-4xl font-bold">-</span>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Away</p>
                        {canEdit ? (
                          <input
                            type="number"
                            value={data.liveMatch.awayScore}
                            onChange={e => updateLiveScore('awayScore', parseInt(e.target.value))}
                            className="text-6xl font-bold w-24 text-center border-2 border-black rounded p-2"
                          />
                        ) : (
                          <p className="text-6xl font-bold">{data.liveMatch.awayScore}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="border-t-2 border-gray-200 pt-4">
                      <p className="font-semibold mb-2">Add Goal Scorer:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {data.players.filter(p => p.active).map(player => (
                          <button
                            key={player.id}
                            onClick={() => addScorer(player.id)}
                            className="p-2 border-2 border-black rounded hover:bg-black hover:text-white transition text-sm"
                          >
                            #{player.number} {player.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.liveMatch.scorers.length > 0 && (
                    <div className="mt-4 border-t-2 border-gray-200 pt-4">
                      <p className="font-semibold mb-2">Goal Scorers:</p>
                      <div className="flex flex-wrap gap-2">
                        {data.liveMatch.scorers.map((scorerId, idx) => {
                          const player = data.players.find(p => p.id === scorerId);
                          return (
                            <span key={idx} className="px-3 py-1 bg-black text-white rounded-full text-sm">
                              {player?.name} #{player?.number}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Results */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-black">
              <h2 className="text-2xl font-bold mb-4">Recent Results</h2>
              <div className="space-y-3">
                {completedFixtures.slice(0, 3).map(fixture => (
                  <div key={fixture.id} className="border-2 border-gray-200 rounded p-4 hover:border-black transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">vs {fixture.opponent}</p>
                        <p className="text-sm text-gray-600">{fixture.date}</p>
                      </div>
                      <div className="text-2xl font-bold">
                        {fixture.homeScore} - {fixture.awayScore}
                      </div>
                    </div>
                  </div>
                ))}
                {completedFixtures.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No results yet</p>
                )}
              </div>
            </div>

            {/* Next Fixture */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-black">
              <h2 className="text-2xl font-bold mb-4">Next Match</h2>
              {data.fixtures.filter(f => f.status === 'upcoming')[0] ? (
                <div className="border-2 border-black rounded p-4">
                  <p className="text-xl font-bold mb-2">
                    vs {data.fixtures.filter(f => f.status === 'upcoming')[0].opponent}
                  </p>
                  <p className="text-gray-600">
                    {data.fixtures.filter(f => f.status === 'upcoming')[0].date} at{' '}
                    {data.fixtures.filter(f => f.status === 'upcoming')[0].time}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {data.fixtures.filter(f => f.status === 'upcoming')[0].venue}
                  </p>
                  {canEdit && !data.liveMatch && (
                    <button
                      onClick={() => startLiveMatch(data.fixtures.filter(f => f.status === 'upcoming')[0].id)}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Start Live Match
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No upcoming fixtures</p>
              )}
            </div>
          </div>
        )}

        {/* ROSTER VIEW */}
        {view === 'roster' && (
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-black">
            <h2 className="text-2xl font-bold mb-6">Player Roster</h2>
            
            {canEdit && (
              <div className="mb-6 p-4 border-2 border-gray-300 rounded">
                <h3 className="font-semibold mb-3">Add New Player</h3>
                <div className="grid grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newPlayer.name}
                    onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    className="p-2 border-2 border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Position"
                    value={newPlayer.position}
                    onChange={e => setNewPlayer({ ...newPlayer, position: e.target.value })}
                    className="p-2 border-2 border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Number"
                    value={newPlayer.number}
                    onChange={e => setNewPlayer({ ...newPlayer, number: e.target.value })}
                    className="p-2 border-2 border-gray-300 rounded"
                  />
                  <button
                    onClick={addPlayer}
                    className="bg-black text-white rounded hover:bg-gray-800 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {data.players.map(player => (
                <div key={player.id} className="border-2 border-gray-300 rounded p-4 hover:border-black transition">
                  {editingPlayer === player.id ? (
                    <div className="grid grid-cols-4 gap-3">
                      <input
                        type="text"
                        defaultValue={player.name}
                        onBlur={e => updatePlayer(player.id, { name: e.target.value })}
                        className="p-2 border-2 border-black rounded"
                      />
                      <input
                        type="text"
                        defaultValue={player.position}
                        onBlur={e => updatePlayer(player.id, { position: e.target.value })}
                        className="p-2 border-2 border-black rounded"
                      />
                      <input
                        type="number"
                        defaultValue={player.number}
                        onBlur={e => updatePlayer(player.id, { number: e.target.value })}
                        className="p-2 border-2 border-black rounded"
                      />
                      <button
                        onClick={() => setEditingPlayer(null)}
                        className="bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {player.number}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{player.name}</p>
                          <p className="text-gray-600">{player.position}</p>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingPlayer(player.id)}
                            className="p-2 hover:bg-gray-100 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePlayer(player.id)}
                            className="p-2 hover:bg-red-100 rounded text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FIXTURES VIEW */}
        {view === 'fixtures' && (
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-black">
            <h2 className="text-2xl font-bold mb-6">Fixtures & Results</h2>
            
            {canEdit && (
              <div className="mb-6 p-4 border-2 border-gray-300 rounded">
                <h3 className="font-semibold mb-3">Add New Fixture</h3>
                <div className="grid grid-cols-5 gap-3">
                  <input
                    type="text"
                    placeholder="Opponent"
                    value={newFixture.opponent}
                    onChange={e => setNewFixture({ ...newFixture, opponent: e.target.value })}
                    className="p-2 border-2 border-gray-300 rounded"
                  />
                  <input
                    type="date"
                    value={newFixture.date}
                    onChange={e => setNewFixture({ ...newFixture, date: e.target.value })}
                    className="p-2 border-2 border-gray-300 rounded"
                  />
                  <input
                    type="time"
                    value={newFixture.time}
                    onChange={e => setNewFixture({ ...newFixture, time: e.target.value })}
                    className="p-2 border-2 border-gray-300 rounded"
                  />
                  <select
                    value={newFixture.venue}
                    onChange={e => setNewFixture({ ...newFixture, venue: e.target.value })}
                    className="p-2 border-2 border-gray-300 rounded"
                  >
                    <option>Home</option>
                    <option>Away</option>
                  </select>
                  <button
                    onClick={addFixture}
                    className="bg-black text-white rounded hover:bg-gray-800 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {data.fixtures.map(fixture => (
                <div key={fixture.id} className="border-2 border-gray-300 rounded p-4 hover:border-black transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-lg">vs {fixture.opponent}</p>
                      <p className="text-sm text-gray-600">
                        {fixture.date} at {fixture.time} • {fixture.venue}
                      </p>
                      {fixture.status === 'completed' && (
                        <p className="text-2xl font-bold mt-2">
                          {fixture.homeScore} - {fixture.awayScore}
                        </p>
                      )}
                      {fixture.status === 'upcoming' && (
                        <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          Upcoming
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        {fixture.status === 'upcoming' && !data.liveMatch && (
                          <button
                            onClick={() => startLiveMatch(fixture.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Go Live
                          </button>
                        )}
                        <button
                          onClick={() => deleteFixture(fixture.id)}
                          className="p-2 hover:bg-red-100 rounded text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MOTM VIEW */}
        {view === 'motm' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-black">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Man of the Match Awards
              </h2>

              {completedFixtures.map(fixture => (
                <div key={fixture.id} className="mb-6 pb-6 border-b-2 border-gray-200 last:border-0">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-lg">vs {fixture.opponent}</p>
                      <p className="text-sm text-gray-600">{fixture.date}</p>
                      <p className="text-lg font-semibold">{fixture.homeScore} - {fixture.awayScore}</p>
                    </div>
                    {!fixture.coachMotm && currentUser.role === 'coach' && (
                      <button
                        onClick={() => setVotingFixture(fixture.id)}
                        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                      >
                        Vote as Coach
                      </button>
                    )}
                    {!fixture.parentVotes[currentUser.id] && currentUser.role === 'parent' && (
                      <button
                        onClick={() => setVotingFixture(fixture.id)}
                        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                      >
                        Vote as Parent
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border-2 border-gray-300 rounded">
                      <p className="font-semibold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Coach's MOTM
                      </p>
                      {fixture.coachMotm ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">
                            {data.players.find(p => p.id === fixture.coachMotm)?.number}
                          </div>
                          <p className="font-bold text-lg">
                            {data.players.find(p => p.id === fixture.coachMotm)?.name}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Not voted yet</p>
                      )}
                    </div>

                    <div className="p-4 border-2 border-gray-300 rounded">
                      <p className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Parents' MOTM
                      </p>
                      {fixture.parentMotm ? (
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">
                              {data.players.find(p => p.id === fixture.parentMotm)?.number}
                            </div>
                            <p className="font-bold text-lg">
                              {data.players.find(p => p.id === fixture.parentMotm)?.name}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">
                            {Object.keys(fixture.parentVotes).length} vote(s)
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No votes yet</p>
                      )}
                    </div>
                  </div>

                  {votingFixture === fixture.id && (
                    <div className="mt-4 p-4 bg-gray-50 border-2 border-black rounded">
                      <p className="font-semibold mb-3">Select Man of the Match:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {data.players.filter(p => p.active).map(player => (
                          <button
                            key={player.id}
                            onClick={() => voteMotm(fixture.id, player.id)}
                            className="p-3 border-2 border-gray-300 rounded hover:border-black hover:bg-white transition text-left"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {player.number}
                              </div>
                              <span className="font-semibold text-sm">{player.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setVotingFixture(null)}
                        className="mt-3 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {completedFixtures.length === 0 && (
                <p className="text-gray-500 text-center py-8">No completed matches yet</p>
              )}
            </div>

            {/* MOTM Leaderboard */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-black">
              <h3 className="text-xl font-bold mb-4">MOTM Leaderboard</h3>
              <div className="space-y-2">
                {(() => {
                  const motmCount = {};
                  completedFixtures.forEach(f => {
                    if (f.coachMotm) motmCount[f.coachMotm] = (motmCount[f.coachMotm] || 0) + 1;
                    if (f.parentMotm) motmCount[f.parentMotm] = (motmCount[f.parentMotm] || 0) + 1;
                  });
                  
                  return Object.entries(motmCount)
                    .sort((a, b) => b[1] - a[1])
                    .map(([playerId, count], index) => {
                      const player = data.players.find(p => p.id === parseInt(playerId));
                      return (
                        <div key={playerId} className="flex items-center justify-between p-3 border-2 border-gray-200 rounded hover:border-black transition">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-400 w-8">#{index + 1}</span>
                            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">
                              {player?.number}
                            </div>
                            <span className="font-bold">{player?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <span className="text-xl font-bold">{count}</span>
                          </div>
                        </div>
                      );
                    });
                })()}
                {Object.keys(completedFixtures.flatMap(f => [f.coachMotm, f.parentMotm]).filter(Boolean)).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No awards yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-black text-white text-center py-4 mt-12">
        <p className="text-sm">Football Club Manager • Season 2025/26</p>
      </div>
    </div>
  );
};

export default App;
