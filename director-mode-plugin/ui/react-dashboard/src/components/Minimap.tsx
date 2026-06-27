import React, { useState, useEffect } from 'react';
import { sendToSkymp } from '../../utils/skympBridge';

const Minimap: React.FC = () => {
  const [selectedPos, setSelectedPos] = useState({ x: 0, y: 0, z: 0 });
  const mapWidth = 800;
  const mapHeight = 600;

  // Better position handling
  useEffect(() => {
    (window as any).updatePlayerPosition = (pos: {x: number, y: number, z: number}) => {
      setSelectedPos(pos);
    };
    return () => delete (window as any).updatePlayerPosition;
  }, []);

  // Improved Skyrim Tamriel map calibration
  // Real Tamriel worldspace coords roughly span ~ -300,000 to 300,000 in X/Y for playable areas.
  // This is a calibrated approximation for central Tamriel (Whiterun/Riverwood area around 0,0).
  // For precision, use in-game markers or adjust offsets based on your map image alignment.
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Better calibration: Adjust multipliers/offsets for your specific map image
    const gameX = Math.round((clickX / mapWidth) * 600000 - 300000);
    const gameY = Math.round((clickY / mapHeight) * 600000 - 300000);

    const newPos = { x: gameX, y: gameY, z: 1000 }; // Default Z ~ ground level, adjust per cell
    setSelectedPos(newPos);
    sendToSkymp('directorSpawnAtPosition', { position: newPos, type: 'selected' });
    console.log('Selected spawn position (calibrated):', newPos);
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
