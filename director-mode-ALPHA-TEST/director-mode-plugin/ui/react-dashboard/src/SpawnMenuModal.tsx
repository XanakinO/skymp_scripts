import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setSpawnSearch } from './directorSlice';

interface SpawnMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpawn: (type: string, position?: any) => void;
}

const SpawnMenuModal: React.FC<SpawnMenuModalProps> = ({ isOpen, onClose, onSpawn }) => {
  const dispatch = useDispatch();
  const { spawnSearch } = useSelector((state: RootState) => state.director);
  const [category, setCategory] = useState<'npcs' | 'creatures' | 'objects' | 'items'>('npcs');

  if (!isOpen) return null;

  const npcs = ['Bandit', 'Stormcloak Soldier', 'Imperial Soldier', 'Whiterun Guard', 'Mages Guild Mage'];
  const creatures = ['Dragon', 'Giant', 'Troll', 'Wolf'];
  const objects = ['Barrel', 'Chest', 'Campfire'];
  const items = ['Iron Sword', 'Health Potion', 'Gold'];

  const filteredItems = (category === 'npcs' ? npcs : 
    category === 'creatures' ? creatures : 
    category === 'objects' ? objects : items).filter(item => 
      item.toLowerCase().includes(spawnSearch.toLowerCase())
    );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Full Spawn Menu</h2>
        <input 
          type="text" 
          placeholder="Search..." 
          value={spawnSearch}
          onChange={(e) => dispatch(setSpawnSearch(e.target.value))} 
        />
        
        <div className="categories">
          <button onClick={() => setCategory('npcs')}>NPCs</button>
          <button onClick={() => setCategory('creatures')}>Creatures</button>
          <button onClick={() => setCategory('objects')}>Objects</button>
          <button onClick={() => setCategory('items')}>Items</button>
        </div>

        <div className="spawn-list">
          {filteredItems.map((item, index) => (
            <button key={index} onClick={() => onSpawn(item)}>
              {item}
            </button>
          ))}
        </div>

        <button onClick={onClose} className="close-btn">CLOSE</button>
      </div>
    </div>
  );
};

export default SpawnMenuModal;