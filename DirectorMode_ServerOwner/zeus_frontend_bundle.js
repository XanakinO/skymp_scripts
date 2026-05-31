/*
Director Mode front-end bundle loader.

Important: In this repository, Director Mode UI is implemented inside the Skymp frontend React app
(chat constructor component), not as a standalone zeus.js file.

This file provides a safe shim that:
- exposes a global function to open/close/focus the Director panel via chat commands
- documents how the real UI is wired to /directormode and browserFocused
*/

(function () {
  function sendChat(text) {
    try {
      // Skymp CEF chat bridge convention used by the frontend code:
      // performDirectorCommand() sends via window.mp.send('cef::chat:send', command)
      if (window && window.mp && typeof window.mp.send === 'function') {
        window.mp.send('cef::chat:send', text);
        return;
      }
    } catch (e) {}

    try {
      // Alternative bridge (some builds use window.skymp)
      if (window && window.skymp && typeof window.skymp.send === 'function') {
        window.skymp.send({ type: 'cef::chat:send', data: text });
      }
    } catch (e2) {}
  }

  // Provide simple helpers for the CEF page (if it loads this file).
  window.DIRECTOR_MODE_CEF = {
    openPanel: function () {
      // The React chat component opens when user types /directormode or /directormode
      // (see skymp5-front/src/constructorComponents/chat/index.js sendMessage())
      sendChat('/directormode');
    },

    showStatus: function () {
      sendChat('/directormode showstatus');
    },

    toggle: function () {
      sendChat('/directormode toggle');
    },

    focusCursor: function (enabled) {
      sendChat('/browserFocused ' + (enabled ? 'true' : 'false'));
    }
  };
})();


