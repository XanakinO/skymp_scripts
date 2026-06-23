import { 
  on, once, printConsole, Debug, Game, Ui, browser, 
  ObjectReference, Form 
} from 'skyrimPlatform';

let currentPlaneId: string = "";
let isInPlane: boolean = false;
let spawnedObjects: { [id: string]: ObjectReference } = {};
let ghostLights: { [furnId: string]: ObjectReference } = {};
let selectedFurnId: string = "";
let lastPlacedId: string = "";
let ghostStates: { [furnId: string]: boolean } = {};

const furnitureForms: { [key: string]: number } = {
    "Throne": 0x0006E7E6,
    "Bookshelf": 0x0006B0A1,
    "AlchemyLab": 0x0006B0A0,
    "Bed": 0x0006B0A2,
    "DisplayCase": 0x0006E9C2,
};

const GLOW_LIGHT_FORM = 0x0001A2C9;

once('update', () => {
    printConsole('[Pocket Plane Real Estate] Fully Loaded! Commands: /tome, /portal');
    browser.loadUrl("file:///Data/Platform/UI/pocketplane/index.html");
});

on('consoleCommand', (e) => {
    const cmd = e.command.toLowerCase().trim();
    if (cmd === '/tome') claimNewPlane();
    if (cmd === '/portal') togglePlanePortal();
    if (cmd === '/clearplane') clearPlane();
});

function claimNewPlane() {
    const player = Game.getPlayer();
    if (!player) return;
    currentPlaneId = `plane_${player.getFormID()}`;
    Debug.notification("Daedric Tome bound! Your Pocket Plane is ready.");
}

function togglePlanePortal() {
    isInPlane = !isInPlane;
    if (isInPlane) enterPlane();
    else exitPlane();
}

function enterPlane() {
    if (!currentPlaneId) return Debug.notification("No plane claimed.");
    Debug.notification("Entering your Pocket Plane...");
    browser.setVisible(true);
    browser.setFocused(true);
    browser.executeJavaScript(`enterPlane("${currentPlaneId}")`);
    printConsole(`[Client] Requesting load for ${currentPlaneId}`);
}

function exitPlane() {
    Debug.notification("Returning to Tamriel...");
    browser.setVisible(false);
    browser.setFocused(false);
    clearLocalObjects();
}

function loadFurniture(savedFurniture: any[]) {
    clearLocalObjects();
    savedFurniture.forEach(f => {
        const ref = spawnFurnitureFromData(f);
        if (ref) {
            spawnedObjects[f.id] = ref;
            ghostStates[f.id] = !!f.isGhost;
            if (f.isGhost) applyGhostState(ref, f.id);
        }
    });
    Debug.notification(`Loaded ${savedFurniture.length} items.`);
}

function spawnFurnitureFromData(f: any) {
    const baseForm = Form.from(Game.getForm(furnitureForms[f.type]));
    if (!baseForm) return null;
    const ref = baseForm.placeAtMe(1, true, false) as ObjectReference;
    if (ref) {
        ref.setPosition(f.position.x, f.position.y, f.position.z);
        ref.setAngle(f.angle.x, f.angle.y, f.angle.z);
    }
    return ref;
}

function applyGhostState(ref: ObjectReference, furnId: string) {
    ref.setMotionType(4, true);
    ref.setAlpha(0.65);
    addGlowLight(ref, furnId);
}

function clearLocalObjects() {
    Object.values(spawnedObjects).forEach(ref => ref?.disable(true).then(() => ref.delete()));
    Object.values(ghostLights).forEach(light => light?.disable(true).then(() => light.delete()));
    spawnedObjects = {};
    ghostLights = {};
    ghostStates = {};
}

function spawnFurniture(itemType: string, offset: any = {x:0,y:0,z:0}) {
    const player = Game.getPlayer();
    if (!player) return;
    const baseForm = Form.from(Game.getForm(furnitureForms[itemType]));
    if (!baseForm) return Debug.notification("Invalid form");
    const ref = baseForm.placeAtMe(1, true, false) as ObjectReference;
    if (ref) {
        const id = `furn_${Date.now()}`;
        const pos = player.getPosition();
        const newPos = { x: pos.x + (offset.x||0), y: pos.y + (offset.y||0), z: pos.z + (offset.z||50) };
        ref.setPosition(newPos.x, newPos.y, newPos.z);
        ref.setAngle(0, 0, 0);
        spawnedObjects[id] = ref;
        ghostStates[id] = false;
        selectedFurnId = id;
        lastPlacedId = id;
        sendToServer('spawnFurniture', {planeId: currentPlaneId, furnitureId: id, type: itemType, position: newPos, angle: {x:0,y:0,z:0}, isGhost: false});
        Debug.notification(`${itemType} placed!`);
    }
}

function sendToServer(event: string, data: any) {
    printConsole(`[Client → Server] ${event}: ${JSON.stringify(data)}`);
}

function toggleCollision(furnId: string) {
    const ref = spawnedObjects[furnId];
    if (!ref) return Debug.notification("Nothing selected!");
    const newGhost = !ghostStates[furnId];
    ghostStates[furnId] = newGhost;
    if (newGhost) {
        ref.setMotionType(4, true);
        ref.setAlpha(0.65);
        addGlowLight(ref, furnId);
        Debug.notification("Ghost Mode + Glow");
    } else {
        ref.setMotionType(2, true);
        ref.setAlpha(1.0);
        removeGlowLight(furnId);
        Debug.notification("Solid Mode");
    }
    sendToServer('toggleCollision', {planeId: currentPlaneId, furnitureId: furnId, isGhost: newGhost});
}

function addGlowLight(ref: ObjectReference, furnId: string) {
    const lightBase = Form.from(Game.getForm(GLOW_LIGHT_FORM));
    if (lightBase) {
        const lightRef = lightBase.placeAtMe(1, false, false) as ObjectReference;
        if (lightRef) {
            const pos = ref.getPosition();
            lightRef.setPosition(pos.x, pos.y, pos.z + 40);
            ghostLights[furnId] = lightRef;
        }
    }
}

function removeGlowLight(furnId: string) {
    const light = ghostLights[furnId];
    if (light) {
        light.disable(true).then(() => light.delete());
        delete ghostLights[furnId];
    }
}

function moveSelected(axis: string, amount: number) {
    const ref = spawnedObjects[selectedFurnId];
    if (!ref) return;
    const pos = ref.getPosition();
    const newPos: any = {...pos};
    newPos[axis] += amount;
    ref.setPosition(newPos.x, newPos.y, newPos.z);
    sendToServer('updatePosition', {planeId: currentPlaneId, furnitureId: selectedFurnId, position: newPos});
}

function rotateFurniture(furnId: string, axis: string, degrees: number) {
    const ref = spawnedObjects[furnId];
    if (!ref) return;
    const angle = ref.getAngle();
    const newAngle: any = {...angle};
    newAngle[axis] = (newAngle[axis] + degrees) % 360;
    ref.setAngle(newAngle.x, newAngle.y, newAngle.z);
    sendToServer('updateRotation', {planeId: currentPlaneId, furnitureId: furnId, angle: newAngle});
}

function deleteSelected() {
    const ref = spawnedObjects[selectedFurnId];
    if (!ref) return;
    if (confirm("Delete this item?")) {
        ref.disable(true).then(() => ref.delete());
        delete spawnedObjects[selectedFurnId];
        sendToServer('deleteFurniture', {planeId: currentPlaneId, furnitureId: selectedFurnId});
        selectedFurnId = "";
    }
}

on('browserMessage', (e) => {
    const [action, ...args] = e.arguments as any[];
    switch (action) {
        case 'placeFurniture': spawnFurniture(args[0], args[1]); break;
        case 'move': moveSelected(args[0], args[1]); break;
        case 'rotate': rotateFurniture(selectedFurnId || lastPlacedId, args[0], args[1]); break;
        case 'toggleCollision': toggleCollision(selectedFurnId || lastPlacedId); break;
        case 'delete': deleteSelected(); break;
        case 'exit': exitPlane(); break;
    }
});

on('customEvent', (e) => {
    if (e.eventName === 'loadPlaneFurniture' && e.planeId === currentPlaneId) {
        loadFurniture(e.furniture || []);
    }
});
