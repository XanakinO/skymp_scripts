import React, { useState } from 'react';
import { sendToSkymp } from '../../utils/skympBridge';

const Minimap: React.FC = () => {
  const [selectedPos, setSelectedPos] = useState({ x: 0, y: 0, z: 0 });
  const mapWidth = 800;
  const mapHeight = 600;

  // Skyrim Tamriel map approximate scaling (very rough)
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Rough conversion to Skyrim coordinates (example values)
    const gameX = Math.round((clickX / mapWidth) * 400000 - 200000);
    const gameY = Math.round((clickY / mapHeight) * 400000 - 200000);

    setSelectedPos({ x: gameX, y: gameY, z: 1000 }); // Default Z
    sendToSkymp('directorSetSpawnPosition', { x: gameX, y: gameY, z: 1000 });
  };

  return (
    <div className="minimap panel">
      <h3>World Minimap - Click to Select Spawn Location</h3>
      <div 
        className="skyrim-map" 
        onClick={handleMapClick}
        style={{
          width: `${mapWidth}px`,
          height: `${mapHeight}px`,
          backgroundImage: `url('https://i.imgur.com/tamriel-map.jpg')`, // Replace with actual Skyrim map asset
          backgroundSize: 'cover',
          position: 'relative',
          cursor: 'crosshair'
        }}
      >
        <div 
          className="selected-marker"
          style={{
            position: 'absolute',
            left: `${((selectedPos.x + 200000) / 400000) * mapWidth}px`,
            top: `${((selectedPos.y + 200000) / 400000) * mapHeight}px`,
            width: '12px',
            height: '12px',
            background: 'red',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>
      <p>Selected: X: {selectedPos.x}, Y: {selectedPos.y}, Z: {selectedPos.z}</p>
    </div>
  );
};

export default Minimap;
