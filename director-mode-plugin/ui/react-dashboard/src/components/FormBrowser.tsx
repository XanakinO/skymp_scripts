import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { sendToSkymp } from '../../utils/skympBridge';
import formDatabase from '../../form-database.json';

const FormBrowser: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'npcs' | 'creatures' | 'objects'>('npcs');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const categories = Object.keys(formDatabase) as ('npcs' | 'creatures' | 'objects')[];

  const filteredItems = Object.entries(formDatabase[selectedCategory] || {}).filter(([name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSpawn = () => {
    if (!selectedItem) return;
    sendToSkymp('directorSpawnNpc', {
      type: selectedItem[0],
      baseId: selectedItem[1].baseId,
      plugin: selectedItem[1].plugin,
      position: { x: 0, y: 0, z: 0 } // Will be filled by coordinate picker
    });
  };

  return (
    <div className="form-browser panel">
      <h3>FormID Browser</h3>
      <input
        type="text"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="category-tabs">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={selectedCategory === cat ? 'active' : ''}>
            {cat.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="item-list">
        {filteredItems.map(([name, data]) => (
          <div
            key={name}
            className={`item ${selectedItem && selectedItem[0] === name ? 'selected' : ''}`}
            onClick={() => setSelectedItem([name, data])}
          >
            {name} <span className="formid">0x{data.baseId.toString(16).toUpperCase()}</span>
          </div>
        ))}
      </div>
      <button onClick={handleSpawn} disabled={!selectedItem}>SPAWN SELECTED</button>
    </div>
  );
};

export default FormBrowser;
