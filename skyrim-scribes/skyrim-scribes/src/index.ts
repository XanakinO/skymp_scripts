import * as sp from 'skyrimPlatform';

const MOD_NAME = "skyrim-scribes";

sp.on("equip", (e: any) => {
    if (e.baseObj && isScribesBook(e.baseObj)) {
        openEditor();
    }
});

function isScribesBook(book: any): boolean {
    return book.getName && book.getName().toLowerCase().includes("scribe");
}

function openEditor() {
    const browser = sp.Browser.create("scribes-editor", 1280, 820);
    browser.loadFile("Platform/Plugins/skyrim-scribes/ui/editor.html");
}

function openLibrary() {
    const browser = sp.Browser.create("scribes-library", 1100, 780);
    browser.loadFile("Platform/Plugins/skyrim-scribes/ui/library.html");
}

// Callbacks from UI
sp.browser.setCallback("openLibrary", () => openLibrary());
sp.browser.setCallback("saveScribesBook", (data: any) => {
    sp.sendEvent("Scribes_SaveBook", data);
    sp.Debug.notification("Book saved to the eternal archives...");
});

sp.browser.setCallback("closeBrowser", () => {
    // Handled by UI
});