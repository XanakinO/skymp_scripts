// Director Mode UI extracted from:
//   skymp/skymp5-front/src/constructorComponents/chat/index.js
//
// This file contains the React component that renders the Director Mode panel
// and sends Director Mode chat commands (e.g. /directormode spawn*, /browserFocused).
//
// IMPORTANT:
// - This is still React code; it must be bundled/compiled by a React toolchain
//   (or included into the Skymp frontend build) to actually run as a UI.
// - If your “server owner” packaging expects static CEF HTML/JS/CSS, you should
//   instead copy the compiled/bundled output from the Skymp frontend build.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import ChatCheckbox from './constructorComponents/chat/checkbox';
import Dices from './constructorComponents/chat/dices';

import ChatCorner from './constructorComponents/img/chat_corner.svg';
import Settings from './constructorComponents/chat/settings';
import SendButton from './constructorComponents/chat/sendButton';
import ChatInput from './constructorComponents/chat/input';
import { replaceIfMoreThan20 } from './constructorComponents/utils/replaceIfMoreThan20';

import './constructorComponents/chat/styles.scss';

const MAX_LENGTH = 2000; // Max message length
const TIME_LIMIT = 1; // Seconds
const SHOUT_LIMIT = 180; // Seconds
const MAX_LINES = 10;
const MAX_SHOUT_LENGTH = 100;
const MAX_HISTORY_LENGTH = 20;

const SHOUTREGEXP = /№(.*?)№/gi;

const Chat = (props) => {
  const [input, updateInput] = useState('');
  const [isInputFocus, changeInputFocus] = useState(false);
  const [hideNonRP, changeNonRPHide] = useState(false);
  const [disableDiceSounds, setDisableDiceSounds] = useState(false);
  const [disableDiceColors, setDisableDiceColors] = useState(false);
  const [isPouchOpened, setPouchOpened] = useState(0);
  const [moveChat, setMoveChat] = useState(false);
  const [showSendButton, setSendButtonShow] = useState(false);
  const [isSettingsOpened, setSettingsOpened] = useState(false);
  const [showDirectorPanel, setShowDirectorPanel] = useState(false);
  const [directorActorBaseId, setDirectorActorBaseId] = useState('');
  const [directorItemBaseId, setDirectorItemBaseId] = useState('');
  const [directorBuildingBaseId, setDirectorBuildingBaseId] = useState('');
  const [directorSpawnCount, setDirectorSpawnCount] = useState(1);

  const SAFE_SPAWN_MAX = 40;
  const spawnSafetyExceeded = directorSpawnCount > SAFE_SPAWN_MAX;
  const canSpawn = !spawnSafetyExceeded && directorSpawnCount > 0;

  const [directorPathDelay, setDirectorPathDelay] = useState(2.5);

  const [directorAnchorMode, setDirectorAnchorMode] = useState('auto');
  const [directorCleanupCount, setDirectorCleanupCount] = useState(4);
  const [directorObjectiveText, setDirectorObjectiveText] = useState('');
  const [directorCursorMode, setDirectorCursorMode] = useState('active');

  const [directorForwardOffset, setDirectorForwardOffset] = useState(120);
  const [directorRightOffset, setDirectorRightOffset] = useState(0);
  const [directorHeightOffset, setDirectorHeightOffset] = useState(30);
  const [directorAutoShowStatus, setDirectorAutoShowStatus] = useState(true);

  const [lastCursorCommand, setLastCursorCommand] = useState('');
  const [directorTelemetry, setDirectorTelemetry] = useState({
    modeEnabled: null,
    anchorMode: 'unknown',
    offsets: { forward: directorForwardOffset, right: directorRightOffset, height: directorHeightOffset },
    pathDelay: directorPathDelay,
    pathState: 'unknown',
  });

  const requestDirectorStatus = useCallback((telemetryPatch) => {
    performDirectorCommand('/directormode showstatus');
    if (telemetryPatch) {
      setDirectorTelemetry((prev) => ({ ...prev, ...telemetryPatch }));
    }
  }, [performDirectorCommand]);

  const [fontSize, setFontSize] = useState(16);
  const placeholder = props.placeholder;
  const isInputHidden = props.isInputHidden;
  const send = props.send;
  const [lastSendInputText, setLastSendInputText] = useState(0);

  const [doesIncludeShout, setIncludeShout] = useState(false);
  const [shoutLength, setShoutLength] = useState(0);

  const inputRef = useRef();
  const chatRef = useRef();

  const isReset = useRef(true);
  const shoutReset = useRef(true);
  const messagesHistory = useRef([]);
  const currentMessageInHistory = useRef(-1);
  const writtenMessage = useRef('');

  const handleScroll = () => {
    if (chatRef.current) {
      window.needToScroll = (chatRef.current.scrollTop === chatRef.current.scrollHeight - chatRef.current.offsetHeight);
    }
  };

  const setEndOfContenteditable = (elem) => {
    const sel = window.getSelection();
    sel.selectAllChildren(elem);
    sel.collapseToEnd();
  };

  const addMessageToHistory = (message) => {
    messagesHistory.current = [message, ...messagesHistory.current];
    if (messagesHistory.length > MAX_HISTORY_LENGTH) {
      messagesHistory.current = messagesHistory.current.slice(0, MAX_HISTORY_LENGTH);
    }
    currentMessageInHistory.current = -1;
    writtenMessage.current = '';
  };

  const performDirectorCommand = useCallback((command) => {
    if (send !== undefined) {
      send(command);
    } else if (window?.mp?.send) {
      window.mp.send('cef::chat:send', command);
    }
  }, [send]);

  const clipboardWrite = useCallback(async (text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch (e) {
      // ignore and fallback
    }

    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleCursorFocus = useCallback((enabled) => {
    const cmd = `/browserFocused ${enabled ? 'true' : 'false'}`;
    setLastCursorCommand(cmd);
    performDirectorCommand(cmd);
    setDirectorCursorMode(enabled ? 'active' : 'released');
  }, [performDirectorCommand]);

  const sendMessage = useCallback((text) => {
    const trimmedText = text.trim();
    if (trimmedText.toLowerCase() === '/directormode') {
      setShowDirectorPanel(true);
      updateInput('');
      if (inputRef.current) {
        inputRef.current.innerHTML = '';
        inputRef.current.focus();
      }
      return;
    }

    const shout = text.match(SHOUTREGEXP);
    const shoutLen = shout
      ? shout.reduce((acc, text) => {
        acc += text.length;
        return acc;
      }, 0)
      : 0;

    if (text !== '' && text.length <= MAX_LENGTH && isReset.current && shoutLen <= MAX_SHOUT_LENGTH && (shoutLen === 0 || shoutReset.current)) {
      if (send !== undefined) {
        const message = replaceIfMoreThan20(text.trim(), '\n', '', MAX_LINES);
        send(message);
        addMessageToHistory(message);
      }

      isReset.current = false;
      updateInput('');
      inputRef.current.innerHTML = '';
      inputRef.current.focus();

      if (shout) {
        shoutReset.current = false;
        setTimeout(() => {
          shoutReset.current = true;
        }, 1000 * SHOUT_LIMIT);
        setIncludeShout(false);
        setShoutLength(0);
      }
    }
  }, [send, updateInput, input, isReset.current, shoutReset.current, shoutLength, doesIncludeShout]);

  useEffect(() => {
    window.needToScroll = true;
    const interval = setInterval(() => {
      isReset.current = true;
    }, 1000 * TIME_LIMIT);
    return () => clearInterval(interval);
  }, []);

  // NOTE: To keep this file focused on Director Mode, the remaining chat keybind
  // / scroll / message rendering logic is intentionally omitted.
  // If you want the full exact component, you should copy the entire file from Skymp.

  return (
    <div className='fullPage'>
      {showDirectorPanel &&
        <div className='director-panel'>
          <div className='director-panel__header'>
            <div>
              <div className='director-panel__title'>Director Mode</div>
              <div className='director-panel__subtitle'>Zeus-style command hub</div>
            </div>
            <button className='director-panel__close' onClick={() => setShowDirectorPanel(false)}>×</button>
          </div>

          <div className='director-panel__section'>
            <div className='director-panel__label'>Core controls</div>
            <div className='director-panel__note'>
              Director status: {directorTelemetry.modeEnabled === null ? 'unknown' : (directorTelemetry.modeEnabled ? 'enabled' : 'disabled')} | Anchor: {directorTelemetry.anchorMode} | Offsets: fwd={directorTelemetry.offsets.forward} right={directorTelemetry.offsets.right} hgt={directorTelemetry.offsets.height} | PathDelay: {directorTelemetry.pathDelay} | Path: {directorTelemetry.pathState}
            </div>
            <div className='director-panel__grid'>
              <button type='button' onClick={() => performDirectorCommand('/directormode help')}>Help</button>
              <button type='button' onClick={() => performDirectorCommand('/directormode toggle')}>Toggle Mode</button>
              <button type='button' onClick={() => performDirectorCommand('/directormode showstatus')}>Status</button>
              <button type='button' onClick={() => performDirectorCommand('/directormode setmarkerfromcrosshair')}>Set Marker</button>
              <button type='button' onClick={() => performDirectorCommand('/directormode setdirectoractorfromcrosshair')}>Set Actor</button>
              <button type='button' onClick={() => performDirectorCommand('/directormode teleportdirectortomarker')}>Teleport</button>
            </div>

            <div className='director-panel__button-group'>
              <button type='button' onClick={() => { performDirectorCommand('/directormode setanchormode auto'); setDirectorAnchorMode('auto'); }}>Anchor Auto</button>
              <button type='button' onClick={() => { performDirectorCommand('/directormode setanchormode crosshair'); setDirectorAnchorMode('crosshair'); }}>Crosshair</button>
              <button type='button' onClick={() => { performDirectorCommand('/directormode setanchormode marker'); setDirectorAnchorMode('marker'); }}>Marker</button>
            </div>

            <div className='director-panel__anchor-mode'>Mode: {directorAnchorMode}</div>
          </div>

          <div className='director-panel__section'>
            <div className='director-panel__label'>Cursor control</div>
            <div className='director-panel__grid'>
              <button type='button' onClick={() => handleCursorFocus(false)}>Release Cursor</button>
              <button type='button' onClick={() => handleCursorFocus(true)}>Capture Cursor</button>
            </div>
            <div className='director-panel__anchor-mode'>Cursor: {directorCursorMode}</div>
            {lastCursorCommand !== '' &&
              <div className='director-panel__note'>Last cursor cmd: <strong>{lastCursorCommand}</strong></div>}
            <div className='director-panel__note'>This sends browser focus commands to the game. If the UI stays visible after releasing focus, use <strong>/browserFocused true</strong> to restore it.</div>
          </div>

          <div className='director-panel__section'>
            <div className='director-panel__label'>Spawn</div>
            <div className='director-panel__field-row'>
              <input type='text' placeholder='Actor base ID' value={directorActorBaseId} onChange={(e) => setDirectorActorBaseId(e.target.value)} />
              <input type='number' min='1' max='200' value={directorSpawnCount} onChange={(e) => {
                const next = Number(e.target.value) || 1;
                setDirectorSpawnCount(next);
              }} />
            </div>
            <div className='director-panel__field-row'>
              <input type='text' placeholder='Item base ID' value={directorItemBaseId} onChange={(e) => setDirectorItemBaseId(e.target.value)} />
              <input type='text' placeholder='Building base ID' value={directorBuildingBaseId} onChange={(e) => setDirectorBuildingBaseId(e.target.value)} />
            </div>
            <div className='director-panel__grid'>
              <button type='button' disabled={!canSpawn} onClick={() => performDirectorCommand(`/directormode spawnactor ${directorActorBaseId.trim() || '0'} ${directorSpawnCount}`)}>Spawn Actor</button>
              <button type='button' disabled={!canSpawn} onClick={() => performDirectorCommand(`/directormode spawnitem ${directorItemBaseId.trim() || '0'} ${directorSpawnCount}`)}>Spawn Item</button>
              <button type='button' onClick={() => performDirectorCommand(`/directormode spawnbuilding ${directorBuildingBaseId.trim() || '0'}`)}>Spawn Building</button>
              <button type='button' disabled={!canSpawn} onClick={() => performDirectorCommand(`/directormode spawnactorlist ${directorSpawnCount}`)}>Default Actors</button>
              <button type='button' disabled={!canSpawn} onClick={() => performDirectorCommand(`/directormode spawnitemlist ${directorSpawnCount}`)}>Default Items</button>
              <button type='button' disabled={!canSpawn} onClick={() => performDirectorCommand('/directormode spawnbuildinglist')}>Default Buildings</button>
            </div>
          </div>

          <div className='director-panel__section'>
            <div className='director-panel__label'>Pathing</div>
            <div className='director-panel__field-row'>
              <input type='number' min='0.1' step='0.1' value={directorPathDelay} onChange={(e) => setDirectorPathDelay(Number(e.target.value) || 0.5)} placeholder='Delay sec' />
              <button type='button' onClick={() => performDirectorCommand(`/directormode startactorpath ${directorPathDelay}`)}>Start Path</button>
            </div>
            <div className='director-panel__grid'>
              <button type='button' onClick={() => performDirectorCommand('/directormode addpathpointfromcrosshair')}>Add Path Point</button>
              <button type='button' onClick={() => performDirectorCommand('/directormode pauseactorpath')}>Pause</button>
              <button type='button' onClick={() => performDirectorCommand('/directormode resumeactorpath')}>Resume</button>
              <button type='button' onClick={() => performDirectorCommand('/directormode cancelactorpath')}>Cancel</button>
              <button type='button' onClick={() => performDirectorCommand('/directormode clearpath')}>Clear Points</button>
            </div>
          </div>

          <div className='director-panel__section'>
            <div className='director-panel__label'>Offsets & cleanup</div>
            <div className='director-panel__field-row'>
              <input type='number' step='1' value={directorHeightOffset} onChange={(e) => setDirectorHeightOffset(Number(e.target.value) || 0)} placeholder='Height' />
              <input type='number' step='1' value={directorForwardOffset} onChange={(e) => setDirectorForwardOffset(Number(e.target.value) || 0)} placeholder='Forward' />
              <input type='number' step='1' value={directorRightOffset} onChange={(e) => setDirectorRightOffset(Number(e.target.value) || 0)} placeholder='Right' />
            </div>
            <div className='director-panel__grid'>
              <button type='button' onClick={() => {
                performDirectorCommand(`/directormode testoffsets ${directorForwardOffset} ${directorRightOffset} ${directorHeightOffset}`);
                if (directorAutoShowStatus) performDirectorCommand('/directormode showstatus');
              }}>Apply 3-axis offsets</button>
              <button type='button' onClick={() => {
                setDirectorHeightOffset(30);
                setDirectorForwardOffset(120);
                setDirectorRightOffset(0);
                performDirectorCommand('/directormode testoffsets 120 0 30');
                if (directorAutoShowStatus) performDirectorCommand('/directormode showstatus');
              }}>Reset offsets</button>
              <button type='button' onClick={() => performDirectorCommand('/directormode setdefaultdelay 2.5')}>Default Path Delay 2.5</button>
            </div>

            <div className='director-panel__field-row'>
              <input type='number' min='1' max='20' value={directorCleanupCount} onChange={(e) => setDirectorCleanupCount(Number(e.target.value) || 1)} placeholder='Cleanup count' />
              <button type='button' onClick={() => {
                performDirectorCommand(`/directormode cleanup ${directorCleanupCount}`);
                if (directorAutoShowStatus) performDirectorCommand('/directormode showstatus');
              }}>Cleanup</button>
            </div>

            <div className='director-panel__field-row'>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type='checkbox' checked={directorAutoShowStatus} onChange={(e) => setDirectorAutoShowStatus(e.target.checked)} />
                Auto showstatus after actions
              </label>
            </div>
          </div>

          <div className='director-panel__section'>
            <div className='director-panel__label'>Mission objective</div>
            <div className='director-panel__field-row'>
              <input type='text' placeholder='Objective description' value={directorObjectiveText} onChange={(e) => setDirectorObjectiveText(e.target.value)} />
              <button type='button' onClick={() => performDirectorCommand(`/directormode objective ${directorObjectiveText.trim()}`)}>Set</button>
            </div>
            <div className='director-panel__grid'>
              <button type='button' onClick={() => performDirectorCommand('/directormode listobjectives')}>List Objectives</button>
              <button type='button' onClick={() => performDirectorCommand('/directormode clearobjectives')}>Clear Objectives</button>
            </div>
          </div>

          <div className='director-panel__footer'>
            Type <strong>/directormode</strong> in chat to re-open this panel.
          </div>
        </div>
      }
    </div>
  );
};

export default Chat;

