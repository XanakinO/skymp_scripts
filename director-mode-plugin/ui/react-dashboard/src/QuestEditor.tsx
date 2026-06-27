import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addLog } from './directorSlice';

const sendToSkymp = (type: string, data: any) => {
  console.log('Sending to SkyMP:', type, data);
  if ((window as any).skyrimPlatform) {
    (window as any).skyrimPlatform.sendMessage({ type, data });
  }
};

const QuestEditor: React.FC = () => {
  const dispatch = useDispatch();
  const [questId, setQuestId] = useState('');
  const [stage, setStage] = useState(10);
  const [objective, setObjective] = useState('');

  const startQuest = () => {
    sendToSkymp('startQuest', { questId, stage });
    dispatch(addLog(`Quest started: ${questId} (Stage ${stage})`));
  };

  const updateObjective = () => {
    sendToSkymp('updateQuestObjective', { questId, objective });
    dispatch(addLog(`Objective updated for ${questId}`));
  };

  return (
    <div className="panel">
      <h3>QUEST CONTROL / EDITOR</h3>
      <div>
        <label>Quest ID / Name:</label>
        <input 
          type="text" 
          value={questId} 
          onChange={(e) => setQuestId(e.target.value)} 
          placeholder="e.g. DragonAttackRiverwood" 
        />
      </div>
      <div>
        <label>Stage:</label>
        <input 
          type="number" 
          value={stage} 
          onChange={(e) => setStage(parseInt(e.target.value))} 
        />
      </div>
      <button onClick={startQuest}>START / ADVANCE QUEST</button>
      
      <div>
        <label>New Objective:</label>
        <input 
          type="text" 
          value={objective} 
          onChange={(e) => setObjective(e.target.value)} 
          placeholder="Kill the dragon..." 
        />
        <button onClick={updateObjective}>UPDATE OBJECTIVE</button>
      </div>
      <button onClick={() => sendToSkymp('completeQuest', { questId })}>COMPLETE QUEST</button>
    </div>
  );
};

export default QuestEditor;
