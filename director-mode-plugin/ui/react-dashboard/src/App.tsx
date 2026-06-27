import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import './App.css';
import Dashboard from './Dashboard';

interface DirectorEvent {
  id: string;
  name: string;
  location: string;
  state: string;
  participants: number;
}

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Dashboard />
    </Provider>
  );
};

export default App;
      <header className="header">
        <div className="logo">DIRECTOR MODE</div>
        <div className="status">Connected to: SkyMP Server • Active</div>
      </header>

      <div className="container">
        {/* Sidebar */}
        <div className="sidebar">
          <nav>
            <ul>
              <li className="active">DASHBOARD</li>
              <li>LIVE EVENTS</li>
              <li>SPAWN TOOLS</li>
              <li>NPC & AI CONTROL</li>
              <li>QUEST CONTROL</li>
              <li>WORLD STATE</li>
              <li>WEATHER & TIME</li>
              <li>ANNOUNCEMENTS</li>
              <li>LOGS</li>
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Active Event */}
          <div className="panel active-event">
            <h2>ACTIVE EVENT</h2>
            {activeEvent ? (
              <div>
                <h3>{activeEvent.name}</h3>
                <p>Location: {activeEvent.location}</p>
                <p>Participants: {activeEvent.participants}</p>
                <p>State: <span className="active">In Progress</span></p>
                <button onClick={() => {/* end event */}}>END EVENT</button>
                <button>PAUSE EVENT</button>
              </div>
            ) : (
              <button onClick={startDragonAttack} className="big-btn">START DRAGON ATTACK: RIVERWOOD</button>
            )}
          </div>

          {/* Event Templates */}
          <div className="panel">
            <h3>EVENT TEMPLATES</h3>
            <div className="templates">
              <button onClick={startDragonAttack}>Dragon Attack</button>
              <button onClick={() => spawnNpc('Bandit')}>Bandit Raid</button>
              <button>Giant Rampage</button>
              <button>Vampire Invasion</button>
            </div>
          </div>

          {/* Spawn Tools */}
          <div className="panel">
            <h3>SPAWN TOOLS</h3>
            <input type="text" placeholder="Search NPCs..." id="npcSearch" />
            <button onClick={() => {
              const search = (document.getElementById('npcSearch') as HTMLInputElement).value;
              spawnNpc(search || 'Bandit');
            }}>SPAWN</button>
            <div className="quick-spawns">
              <button onClick={() => spawnNpc('Stormcloak Soldier')}>Stormcloak Soldier</button>
              <button onClick={() => spawnNpc('Imperial Soldier')}>Imperial Soldier</button>
            </div>
          </div>

          {/* World Controls */}
          <div className="panel">
            <h3>WORLD CONTROLS</h3>
            <div>
              <label>Time of Day</label>
              <input type="range" min="0" max="24" defaultValue="19" onChange={(e) => setTime(parseInt(e.target.value))} />
            </div>
            <select onChange={(e) => sendToSkymp('setWeather', e.target.value)}>
              <option>Clear Skies</option>
              <option>Storm</option>
            </select>
          </div>
        </div>

        {/* Right Sidebar / Quick Controls & Log */}
        <div className="side-panels">
          <div className="panel">
            <h3>QUICK CONTROLS</h3>
            <button>ANNOUNCEMENT</button>
            <button>SPAWN NPC</button>
          </div>
          <div className="panel">
            <h3>EVENT LOG</h3>
            <ul className="log-list">
              {logs.map((log, i) => <li key={i}>{log}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
