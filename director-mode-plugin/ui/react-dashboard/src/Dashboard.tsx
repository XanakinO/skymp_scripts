import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setActiveEvent, addLog, updateMultipliers, setSpawnSearch } from './directorSlice';
import SpawnMenuModal from './SpawnMenuModal';
import NpcAiPanel from './NpcAiPanel';
import QuestEditor from './QuestEditor';
import FormBrowser from './FormBrowser';
import Minimap from './Minimap';
import './App.css';

const sendToSkymp = (type: string, data: any) => {
  console.log('Sending to SkyMP:', type, data);
  if ((window as any).skyrimPlatform) {
    (window as any).skyrimPlatform.sendMessage({ type, data });
  }
};

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { activeEvent, logs, globalMultipliers, spawnSearch } = useSelector((state: RootState) => state.director);
  const [showSpawnModal, setShowSpawnModal] = useState(false);

  const startEvent = (type: string, location: string) => {
    sendToSkymp('startEvent', { type, location });
    const newEvent = {
      id: Date.now().toString(),
      name: `${type.toUpperCase()}: ${location}`,
      location,
      state: 'active',
      participants: 18,
    };
    dispatch(setActiveEvent(newEvent));
    dispatch(addLog(`EVENT STARTED: ${newEvent.name}`));
  };

  const spawnNpc = (type: string, position?: any) => {
    sendToSkymp('spawnNpc', { type, position });
    dispatch(addLog(`NPC Spawned: ${type}`));
  };

  const applyMultipliers = () => {
    sendToSkymp('setMultipliers', globalMultipliers);
    dispatch(addLog('Global multipliers updated'));
  };

  const setTime = (hour: number) => {
    sendToSkymp('setTime', hour);
  };

  return (
    <div className="director-dashboard">
      <header className="header">
        <div className="logo">DIRECTOR MODE</div>
        <div className="status">Connected to: SkyMP Server • 7:42 PM</div>
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
          <div className="server-status">
            <p>Players Online: 18 / 64</p>
            <p>Server Uptime: 2h 47m</p>
          </div>
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
                <button onClick={() => {/* end event logic */}}>END EVENT</button>
                <button>PAUSE EVENT</button>
                <button>EDIT EVENT</button>
              </div>
            ) : (
              <button onClick={() => startEvent('dragonAttack', 'Riverwood')} className="big-btn">
                START DRAGON ATTACK: RIVERWOOD
              </button>
            )}
          </div>

          {/* Event Templates */}
          <div className="panel">
            <h3>EVENT TEMPLATES</h3>
            <div className="templates">
              <button onClick={() => startEvent('dragonAttack', 'Riverwood')}>Dragon Attack</button>
              <button onClick={() => startEvent('banditRaid', 'Whiterun')}>Bandit Raid</button>
              <button onClick={() => startEvent('giantRampage', 'Location')}>Giant Rampage</button>
              <button onClick={() => startEvent('vampireInvasion', 'Settlement')}>Vampire Invasion</button>
            </div>
          </div>

          {/* Spawn Tools with Modal + New Components */}
          <div className="panel">
            <h3>SPAWN TOOLS</h3>
            <button onClick={() => setShowSpawnModal(true)} className="big-btn">OPEN FULL SPAWN MENU</button>
            <div className="quick-spawns">
              <button onClick={() => spawnNpc('Bandit')}>Bandit</button>
              <button onClick={() => spawnNpc('Stormcloak Soldier')}>Stormcloak Soldier</button>
            </div>
          </div>

          {/* FormID Browser */}
          <FormBrowser />

          {/* Visual Minimap */}
          <Minimap />

          {/* World Controls with Multipliers */}
          <div className="panel">
            <h3>WORLD CONTROLS</h3>
            <div>
              <label>Time of Day: <span id="timeValue">19:00</span></label>
              <input 
                type="range" 
                min="0" 
                max="24" 
                defaultValue="19" 
                onChange={(e) => {
                  setTime(parseInt(e.target.value));
                  document.getElementById('timeValue')!.textContent = `${e.target.value}:00`;
                }} 
              />
            </div>
            <select onChange={(e) => sendToSkymp('setWeather', e.target.value)}>
              <option value="clear">Clear Skies</option>
              <option value="storm">Storm</option>
              <option value="fog">Fog</option>
            </select>

            <h4>Global Multipliers</h4>
            <div>
              <label>NPC Damage: {globalMultipliers.npcDamage.toFixed(1)}x</label>
              <input 
                type="range" 
                min="0.5" 
                max="3" 
                step="0.1" 
                value={globalMultipliers.npcDamage}
                onChange={(e) => dispatch(updateMultipliers({ npcDamage: parseFloat(e.target.value) }))} 
              />
            </div>
            <div>
              <label>NPC Health: {globalMultipliers.npcHealth.toFixed(1)}x</label>
              <input 
                type="range" 
                min="0.5" 
                max="3" 
                step="0.1" 
                value={globalMultipliers.npcHealth}
                onChange={(e) => dispatch(updateMultipliers({ npcHealth: parseFloat(e.target.value) }))} 
              />
            </div>
            <button onClick={applyMultipliers}>APPLY MULTIPLIERS</button>
          </div>

          {/* NPC & AI Control */}
          <NpcAiPanel />

          {/* Quest Control */}
          <QuestEditor />
        </div>

        {/* Right Sidebar */}
        <div className="side-panels">
          <div className="panel">
            <h3>QUICK CONTROLS</h3>
            <button onClick={() => sendToSkymp('sendAnnouncement', 'Server-wide message')}>SEND ANNOUNCEMENT</button>
            <button onClick={() => setShowSpawnModal(true)}>SPAWN NPC</button>
          </div>
          <div className="panel">
            <h3>EVENT LOG</h3>
            <ul className="log-list">
              {logs.map((log, i) => <li key={i}>{log}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <SpawnMenuModal 
        isOpen={showSpawnModal} 
        onClose={() => setShowSpawnModal(false)} 
        onSpawn={spawnNpc} 
      />
    </div>
  );
};

export default Dashboard;