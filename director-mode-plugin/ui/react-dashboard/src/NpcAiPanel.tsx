import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addLog } from './directorSlice';

const sendToSkymp = (type: string, data: any) => {
  console.log('Sending to SkyMP:', type, data);
  if ((window as any).skyrimPlatform) {
    (window as any).skyrimPlatform.sendMessage({ type, data });
  }
};

const NpcAiPanel: React.FC = () => {
  const dispatch = useDispatch();
  const [selectedNpc, setSelectedNpc] = useState('');
  const [aiPackage, setAiPackage] = useState('Wander');
  const [aggression, setAggression] = useState(50);

  const applyAi = () => {
    sendToSkymp('setNpcAi', { npc: selectedNpc, package: aiPackage, aggression });
    dispatch(addLog(`AI updated for ${selectedNpc}: ${aiPackage}`));
  };

  return (
    <div className="panel">
      <h3>NPC & AI CONTROL</h3>
      <div>
        <label>Select NPC:</label>
        <select value={selectedNpc} onChange={(e) => setSelectedNpc(e.target.value)}>
          <option value="">-- Choose --</option>
          <option value="Alduin">Alduin</option>
          <option value="Bandit">Bandit</option>
          <option value="Guard">Guard</option>
        </select>
      </div>
      <div>
        <label>AI Package:</label>
        <select value={aiPackage} onChange={(e) => setAiPackage(e.target.value)}>
          <option>Wander</option>
          <option>Guard</option>
          <option>Attack</option>
          <option>Follow Player</option>
        </select>
      </div>
      <div>
        <label>Aggression: {aggression}%</label>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={aggression} 
          onChange={(e) => setAggression(parseInt(e.target.value))} 
        />
      </div>
      <button onClick={applyAi}>APPLY AI CHANGES</button>
      <button onClick={() => sendToSkymp('stopAllAi', {})}>STOP ALL AI</button>
    </div>
  );
};

export default NpcAiPanel;
