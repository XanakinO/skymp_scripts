import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendToSkymp } from '../../utils/skympBridge';
import './SpawnMenu.css';

const SpawnMenu: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'npcs' | 'creatures' | 'objects'>('npcs');
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [selectedNpc, setSelectedNpc] = useState('');

  // Full Form Database imported
  const formDb = formDatabase;

  const filteredItems = formDb[selectedCategory].filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSpawn = () => {
    if (!selectedNpc) return;
    sendToSkymp('directorSpawnNpc', {
      type: selectedNpc,
      position
    });
  };

  const getCurrentPlayerPosition = () => {
    sendToSkymp('directorGetPlayerPosition', {});
  };

  // Add this useEffect to listen for position updates from CEF
  useEffect(() => {
    (window as any).updatePlayerPosition = (pos: {x: number, y: number, z: number}) => {
      setPosition(pos);
      console.log("Received current player position:", pos);
    };
    return () => {
      delete (window as any).updatePlayerPosition;
    };
  }, []);

  return (
    <div className="spawn-menu panel">
      <h3>Full Spawn Menu</h3>
      
      <input 
        type="text" 
        placeholder="Search NPCs/Creatures..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="category-tabs">
        {(['npcs', 'creatures', 'objects'] as const).map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={selectedCategory === cat ? 'active' : ''}>
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="item-list">
        {filteredItems.map(item => (
          <div key={item} className={`item ${selectedNpc === item ? 'selected' : ''}`} onClick={() => setSelectedNpc(item)}>
            {item}
          </div>
        ))}
      </div>

      {/* Coordinate Picker */}
      <div className="coordinate-picker">
        <h4>Position</h4>
        <input type="number" placeholder="X" value={position.x} onChange={(e) => setPosition({...position, x: parseFloat(e.target.value)})} />
        <input type="number" placeholder="Y" value={position.y} onChange={(e) => setPosition({...position, y: parseFloat(e.target.value)})} />
        <input type="number" placeholder="Z" value={position.z} onChange={(e) => setPosition({...position, z: parseFloat(e.target.value)})} />
        <button onClick={getCurrentPlayerPosition}>Get Current Pos</button>
      </div>

      <button onClick={handleSpawn} disabled={!selectedNpc}>SPAWN SELECTED</button>
    </div>
  );
};

export default SpawnMenu;