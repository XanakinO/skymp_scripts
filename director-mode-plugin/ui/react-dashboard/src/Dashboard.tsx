import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setActiveEvent, addLog, updateMultipliers, setSpawnSearch, setEvents } from './directorSlice';
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
  const { activeEvent, logs, globalMultipliers, spawnSearch, events = [] } = useSelector((state: RootState) => state.director);
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Live server sync
  React.useEffect(() => {
    const handleServerEvent = (event: any) => {
      const { type, data } = event;
      if (type === "directorEventStarted") {
        dispatch(setActiveEvent(data));
      } else if (type === "directorEventEnded" || type === "directorEventPaused" || type === "directorEventResumed") {
        // Refresh active event from server logic
        if (data && typeof data === 'object') {
          dispatch(setActiveEvent(data));
        }
      } else if (type === "directorLog") {
        dispatch(addLog(data.message || JSON.stringify(data)));
      } else if (type === "directorMultipliersUpdated") {
        dispatch(updateMultipliers(data));
      } else if (type === "playerJoin") {
        // Could update server status live
        console.log("Player joined:", data);
      }
    };

    (window as any).handleServerEvent = handleServerEvent;

    // Elapsed time ticker for active event
    const timer = setInterval(() => {
      if (activeEvent && activeEvent.startedAt) {
        const elapsed = Math.floor((Date.now() - activeEvent.startedAt) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);

    return () => {
      delete (window as any).handleServerEvent;
      clearInterval(timer);
    };
  }, [dispatch, activeEvent]);

  const endEvent = () => {
    if (activeEvent?.id) {
      sendToSkymp('directorEndEvent', activeEvent.id);
    }
  };

  const pauseEvent = () => {
    if (activeEvent?.id) {
      sendToSkymp('directorPauseEvent', activeEvent.id);
    }
  };

  const resumeEvent = () => {
    if (activeEvent?.id) {
      sendToSkymp('directorResumeEvent', activeEvent.id);
    }
  };

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

        {/* Main Content - Matching Screenshot Layout */}
        <div className="main-content">
          {/* ACTIVE EVENT - Top Center - Exact match to image */}
          <div className="panel active-event" style={{marginBottom: '15px'}}>
            <div className="active-event-header">
              <h2>ACTIVE EVENT</h2>
              {activeEvent && <span className="active-badge">ACTIVE</span>}
            </div>
            <div className="event-details">
              {activeEvent ? (
                <>
                  <img src="https://i.imgur.com/7kL9v3D.jpg" alt="Dragon Attack" className="event-image" />
                  <h3>{activeEvent.name || "DRAGON ATTACK: RIVERWOOD"}</h3>
                  <p>{activeEvent.template?.description || "A dragon has been summoned to attack Riverwood."}</p>
                  <div className="event-meta">
                    <div>EVENT TYPE: Dynamic</div>
                    <div>STARTED: {new Date(activeEvent.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    <div>ELAPSED: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</div>
                    <div>PARTICIPANTS: {activeEvent.participants || 18}</div>
                    <div>STATE: In Progress</div>
                  </div>
                  <div className="event-buttons">
                    <button className="red-btn" onClick={endEvent}>END EVENT</button>
                    <button onClick={pauseEvent}>PAUSE EVENT</button>
                    <button>EDIT EVENT</button>
                  </div>
                </>
              ) : (
                <button onClick={() => startEvent('dragonAttack', 'Riverwood')} className="big-btn">
                  START DRAGON ATTACK: RIVERWOOD
                </button>
              )}
            </div>
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
            <button>MANAGE TEMPLATES</button>
          </div>

          {/* Spawn Tools */}
          <div className="panel">
            <h3>SPAWN TOOLS</h3>
            <button onClick={() => setShowSpawnModal(true)} className="big-btn">OPEN SPAWN MENU</button>
            <div className="quick-spawns">
              <button onClick={() => spawnNpc('Bandit')}>Bandit</button>
              <button onClick={() => spawnNpc('Stormcloak Soldier')}>Stormcloak Soldier</button>
            </div>
          </div>

          {/* World Controls */}
          <div className="panel">
            <h3>WORLD CONTROLS</h3>
            <div>
              <label>TIME OF DAY</label>
              <input 
                type="range" 
                min="0" 
                max="24" 
                defaultValue="19" 
                onChange={(e) => {
                  setTime(parseInt(e.target.value));
                }} 
              />
            </div>
            <select onChange={(e) => sendToSkymp('setWeather', e.target.value)}>
              <option value="clear">Clear Skies</option>
              <option value="storm">Storm</option>
              <option value="fog">Fog</option>
            </select>

            <h4>GLOBAL MULTIPLIERS</h4>
            <div>
              <label>NPC Damage: {globalMultipliers.npcDamage.toFixed(1)}x</label>
              <input type="range" min="0.5" max="3" step="0.1" value={globalMultipliers.npcDamage} onChange={(e) => dispatch(updateMultipliers({ npcDamage: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label>NPC Health: {globalMultipliers.npcHealth.toFixed(1)}x</label>
              <input type="range" min="0.5" max="3" step="0.1" value={globalMultipliers.npcHealth} onChange={(e) => dispatch(updateMultipliers({ npcHealth: parseFloat(e.target.value) }))} />
            </div>
            <button onClick={applyMultipliers}>APPLY CHANGES</button>
          </div>
        </div>

          {/* FormID Browser + Minimap + NPC/Quest panels for full feature set */}
          <FormBrowser />
          <Minimap />
          <NpcAiPanel />
          <QuestEditor />
        </div>

        {/* Right Sidebar - Matching Screenshot */}
        <div className="side-panels">
          {/* Quick Controls */}
          <div className="panel">
            <h3>QUICK CONTROLS</h3>
            <button onClick={() => sendToSkymp('sendAnnouncement', 'Server-wide announcement!')}>ANNOUNCEMENT</button>
            <button onClick={() => setShowSpawnModal(true)}>SPAWN NPC</button>
            <button>WEATHER CONTROL</button>
            <button>TIME CONTROL</button>
          </div>

          {/* Event Overview */}
          <div className="panel event-overview">
            <h3>EVENT OVERVIEW</h3>
            <div className="stats-grid">
              <div>ACTIVE EVENTS <span className="stat-value">1</span></div>
              <div>SCHEDULED <span className="stat-value">2</span></div>
              <div>COMPLETED TODAY <span className="stat-value">4</span></div>
              <div>TOTAL PLAYERS IMPACTED <span className="stat-value">56</span></div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="panel recent-events">
            <h3>RECENT EVENTS</h3>
            {events && events.length > 0 ? (
              events.slice(0, 4).map((ev: any, i: number) => (
                <div key={i} className="event-item">
                  <span>🐉</span> {ev.name} <span className="time">{new Date(ev.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span> 
                  <span className={`status ${ev.state === 'active' ? 'active' : ''}`}>• {ev.state}</span>
                </div>
              ))
            ) : (
              <>
                <div className="event-item"><span>🐉</span> Dragon Attack: Riverwood <span className="time">7:30 PM</span> <span className="status active">• Active</span></div>
                <div className="event-item"><span>🏴‍☠️</span> Bandit Raid: Whiterun <span className="time">6:15 PM</span> <span className="status">• Completed</span></div>
              </>
            )}
            <button>VIEW ALL EVENTS</button>
          </div>

          {/* Live Player List Panel - New */}
          <div className="panel">
            <h3>PLAYERS ONLINE</h3>
            <div style={{maxHeight: '200px', overflowY: 'auto'}}>
              {/* Live players would be populated via server broadcast */}
              <div>Player1 (Admin) - Riverwood</div>
              <div>Player2 - Whiterun</div>
              <div>Player3 - Windhelm</div>
              {/* Extend with real player data from server */}
            </div>
            <p>18 / 64 online</p>
          </div>

          {/* Event Log */}
          <div className="panel">
            <h3>EVENT LOG</h3>
            <ul className="log-list">
              {logs.map((log, i) => <li key={i}>{log}</li>)}
            </ul>
            <button>VIEW FULL LOG</button>
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