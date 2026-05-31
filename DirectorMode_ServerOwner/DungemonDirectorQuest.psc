; DungemonDirectorQuest.psc
; Admin Director Mode script for SkyMP.
; Provides Zeus-like director controls: spawn actors, items, buildings,
; set marker anchors, move NPCs along path points, clean up spawns, and
; manage director state with configurable options.

Scriptname DungemonDirectorQuest extends Quest

Actor Property DirectorActor Auto
ObjectReference Property DirectorMarker Auto
FormList Property DefaultSpawnActors Auto
FormList Property DefaultSpawnItems Auto
FormList Property DefaultSpawnBuildings Auto
Float Property DefaultSpawnDistance = 150.0 Auto
Float Property DefaultSpawnHeightOffset = 30.0 Auto
Float Property DefaultSpawnForwardOffset = 120.0 Auto
Float Property DefaultSpawnRightOffset = 0.0 Auto
Float Property DefaultPathDelay = 2.5 Auto
Bool Property DirectorModeEnabled = True Auto
Bool Property AutoAnchorToDirector = True Auto
Bool Property UseCrosshairAnchor = False Auto
Bool Property ShowDebugNotifications = True Auto
Int Property MaxSpawnedObjects = 40 Auto
Int Property SpawnedCleanupBatch = 4 Auto
ObjectReference[] Property SpawnedObjects Auto

Actor Property PathActor Auto
ObjectReference[] Property PathPoints Auto
Int Property PathPointIndex = 0 Auto
Bool Property PathingPaused = False Auto
String Property AnchorMode = "auto" Auto
String[] Property Objectives Auto
String Property DirectorCommandPrefix = "/directormode" Auto

Event OnInit()
    Notify("initialized")

    if DirectorActor == None
        Notify("Director actor is not assigned.")
    endif

    EnsureObjectivesInitialized()
    ; NOTE: PruneStaleSpawnedReferences() removed; this script does not define it.

EndEvent


Function EnsureObjectivesInitialized()
    if Objectives == None
        Objectives = new String[0]
    endif
EndFunction


Function Notify(String message)
    Debug.Trace("[DungemonDirectorQuest] " + message)
    if ShowDebugNotifications
        Debug.Notification("Director: " + message)
    endif
EndFunction

Bool Function RequireAdmin(Actor ac) Global
    if ac == None
        return False
    endif
    if ObjectReferenceEx.GetStorageValueBool(ac, "isAdmin")
        return True
    endif
    M.SendChatMessage(ac, "Director commands require admin privileges.")
    return False
EndFunction

Function BroadcastDirectorSpawn(String commandType, String formId, Int count)
    if !DirectorModeEnabled || DirectorActor == None
        return
    endif
    String payload = formId + ":" + count
    M.SendChatCommand(DirectorActor, "DIRECTOR_SPAWN_" + StringUtilEx.ToLower(commandType), payload)
EndFunction

Function BroadcastDirectorPath(String pathCommand)
    if !DirectorModeEnabled || DirectorActor == None
        return
    endif
    M.SendChatCommand(DirectorActor, "DIRECTOR_PATH", pathCommand)
EndFunction

Function ToggleDirectorMode()
    DirectorModeEnabled = !DirectorModeEnabled
    Notify(DirectorModeEnabled ? "Director mode enabled." : "Director mode disabled.")
EndFunction

Function EnableDirectorMode(Bool abEnabled)
    DirectorModeEnabled = abEnabled
    Notify(DirectorModeEnabled ? "Director mode enabled." : "Director mode disabled.")
EndFunction

Function IsReady() Global Bool
    if !DirectorModeEnabled
        Notify("Director mode is disabled.")
        return False
    endif
    if DirectorActor == None
        Notify("Director actor is not assigned.")
        return False
    endif
    return True
EndFunction

Function SetDirectorActor(Actor akActor)
    if akActor == None
        Notify("Unable to assign DirectorActor: actor is None.")
        return
    endif
    DirectorActor = akActor
    Notify("Director actor set.")
EndFunction

Function SetDirectorActorFromCrosshair()
    Actor hoverActor = Game.GetCrosshairRef() as Actor
    if hoverActor != None
        DirectorActor = hoverActor
        Notify("Director actor set from crosshair.")
    else
        Notify("No actor under crosshair.")
    endif
EndFunction

Function SetDirectorMarker(ObjectReference akMarker)
    if akMarker == None
        Notify("Unable to assign DirectorMarker: reference is None.")
        return
    endif
    DirectorMarker = akMarker
    Notify("Director marker set.")
EndFunction

Function ClearDirectorMarker()
    DirectorMarker = None
    Notify("Director marker cleared.")
EndFunction

Function SetDirectorMarkerFromCrosshair()
    ObjectReference hoverRef = Game.GetCrosshairRef() as ObjectReference
    if hoverRef != None
        DirectorMarker = hoverRef
        Notify("Director marker set from crosshair.")
    else
        Notify("Marker not found under crosshair.")
    endif
EndFunction

ObjectReference Function GetSpawnAnchor()
    ObjectReference crosshairRef = Game.GetCrosshairRef() as ObjectReference
    String lowerMode = StringUtilEx.ToLower(AnchorMode)

    if lowerMode == "crosshair"
        if crosshairRef != None
            return crosshairRef
        endif
        if DirectorMarker != None
            return DirectorMarker
        endif
        if DirectorActor != None
            return DirectorActor
        endif
        return None
    elseif lowerMode == "marker"
        if DirectorMarker != None
            return DirectorMarker
        endif
        if UseCrosshairAnchor && crosshairRef != None
            return crosshairRef
        endif
        if AutoAnchorToDirector && DirectorActor != None
            return DirectorActor
        endif
        return None
    endif

    if UseCrosshairAnchor && crosshairRef != None
        return crosshairRef
    endif
    if DirectorMarker != None
        return DirectorMarker
    endif
    if AutoAnchorToDirector && DirectorActor != None
        return DirectorActor
    endif

    return None
EndFunction

Function SetSpawnOffsets(Float afHeight, Float afForward)
    DefaultSpawnHeightOffset = afHeight
    DefaultSpawnForwardOffset = afForward
    Notify("Spawn offset updated.")
EndFunction

Function SpawnActorFromDefaultList(Int aiCount = 1)
    if !DirectorModeEnabled
        Notify("Director mode is disabled.")
        return None
    endif
    if DefaultSpawnActors == None || DefaultSpawnActors.GetSize() == 0
        Notify("Default actor list is not configured.")
        return None
    endif


    Int listSize = DefaultSpawnActors.GetSize()
    Int randomIndex = Utility.RandomInt(0, listSize - 1)
    ActorBase actorBase = DefaultSpawnActors.GetAt(randomIndex) as ActorBase
    if actorBase == None
        Notify("Default actor entry is invalid.")
        return None
    endif

    return SpawnActorAtAnchor(actorBase, aiCount)
EndFunction

Function SpawnItemFromDefaultList(Int aiCount = 1)
    if !DirectorModeEnabled
        Notify("Director mode is disabled.")
        return None
    endif
    if DefaultSpawnItems == None || DefaultSpawnItems.GetSize() == 0
        Notify("Default item list is not configured.")
        return None
    endif


    Int listSize = DefaultSpawnItems.GetSize()
    Int randomIndex = Utility.RandomInt(0, listSize - 1)
    Form itemForm = DefaultSpawnItems.GetAt(randomIndex)
    return SpawnItemAtAnchor(itemForm, aiCount)
EndFunction

Function SpawnBuildingFromDefaultList()
    if !DirectorModeEnabled
        Notify("Director mode is disabled.")
        return None
    endif
    if DefaultSpawnBuildings == None || DefaultSpawnBuildings.GetSize() == 0
        Notify("Default building list is not configured.")
        return None
    endif


    Int listSize = DefaultSpawnBuildings.GetSize()
    Int randomIndex = Utility.RandomInt(0, listSize - 1)
    Form buildingForm = DefaultSpawnBuildings.GetAt(randomIndex)
    return SpawnBuildingAtAnchor(buildingForm)
EndFunction

ObjectReference Function SpawnObjectAtAnchor(Form akForm, Int aiCount = 1)
    if !DirectorModeEnabled
        Notify("Director mode is disabled.")
        return None
    endif
    if akForm == None
        Notify("Cannot spawn: form is None.")
        return None
    endif


    ObjectReference anchor = GetSpawnAnchor()
    if anchor == None
        Notify("No anchor available for spawn.")
        return None
    endif

    ObjectReference spawned = None
    while aiCount > 0
        spawned = anchor.PlaceAtMe(akForm, 1, True, False)
        AddSpawnedReference(spawned)
        aiCount -= 1
    endwhile

    if spawned != None
        Notify("Spawned object at anchor.")
    endif
    return spawned
EndFunction

Actor Function SpawnActorAtAnchor(ActorBase akActorBase, Int aiCount = 1)
    if !DirectorModeEnabled
        Notify("Director mode is disabled.")
        return None
    endif
    if akActorBase == None
        Notify("Cannot spawn actor: ActorBase is None.")
        return None
    endif
    
    if aiCount <= 0
        Notify("Invalid spawn count.")
        return None
    endif


    ObjectReference anchor = GetSpawnAnchor()
    if anchor == None
        Notify("No anchor available for actor spawn.")
        return None
    endif

    Actor spawnedActor = None
    while aiCount > 0
        ObjectReference spawnedRef = anchor.PlaceAtMe(akActorBase, 1, True, False)
        spawnedActor = spawnedRef as Actor
        if spawnedActor != None
            spawnedActor.MoveTo(anchor, DefaultSpawnForwardOffset, DefaultSpawnRightOffset, DefaultSpawnHeightOffset)
        endif
        AddSpawnedReference(spawnedRef)
        aiCount -= 1
    endwhile

    if spawnedActor != None
        Notify("Spawned actor at anchor.")
    endif
    return spawnedActor
EndFunction

Actor Function SpawnActorAtAnchorWithOffset(ActorBase akActorBase, Float afForward, Float afRight, Float afUp, Int aiCount = 1)
    ObjectReference anchor = GetSpawnAnchor()
    if anchor == None
        Notify("No anchor available for offset spawn.")
        return None
    endif

    Actor spawnedActor = SpawnActorAtAnchor(akActorBase, aiCount)
    if spawnedActor != None
        spawnedActor.MoveTo(anchor, afForward, afRight, afUp)
        Notify("Spawned actor with offset.")
    endif
    return spawnedActor
EndFunction

ObjectReference Function SpawnItemAtAnchor(Form akItemBase, Int aiCount = 1)
    return SpawnObjectAtAnchor(akItemBase, aiCount)
EndFunction

ObjectReference Function SpawnBuildingAtAnchor(Form akBuildingBase)
    return SpawnObjectAtAnchor(akBuildingBase, 1)
EndFunction

Actor Function SpawnActorAtCrosshair(ActorBase akActorBase, Int aiCount = 1)
    ObjectReference target = Game.GetCrosshairRef() as ObjectReference
    if target == None
        Notify("No crosshair anchor found.")
        return None
    endif

    Actor spawnedActor = None
    while aiCount > 0
        ObjectReference spawnedRef = target.PlaceAtMe(akActorBase, 1, True, False)
        spawnedActor = spawnedRef as Actor
        AddSpawnedReference(spawnedRef)
        aiCount -= 1
    endwhile

    if spawnedActor != None
        Notify("Spawned actor at crosshair.")
    endif
    return spawnedActor
EndFunction

ObjectReference Function SpawnItemAtCrosshair(Form akItemBase, Int aiCount = 1)
    ObjectReference target = Game.GetCrosshairRef() as ObjectReference
    if target == None
        Notify("No crosshair anchor found.")
        return None
    endif

    ObjectReference spawnedRef = target.PlaceAtMe(akItemBase, aiCount, True, False)
    AddSpawnedReference(spawnedRef)
    Notify("Spawned item at crosshair.")
    return spawnedRef
EndFunction

Function TeleportDirectorToMarker()
    if DirectorActor == None || DirectorMarker == None
        Notify("Assign DirectorActor and DirectorMarker first.")
        return
    endif
    DirectorActor.MoveTo(DirectorMarker)
    Notify("Director teleported to marker.")
EndFunction

Function SetPathPoints(ObjectReference[] akPoints)
    PathPoints = akPoints
    PathPointIndex = 0
    Notify("Director path points updated.")
EndFunction

Function AddPathPoint(ObjectReference akPoint)
    if akPoint == None
        Notify("Cannot add path point: reference is None.")
        return
    endif

    if PathPoints == None
        PathPoints = new ObjectReference[0]
    endif
    PathPoints = PathPoints + [akPoint]
    Notify("Added path point " + PathPoints.Length)
EndFunction

Function AddPathPointFromCrosshair()
    ObjectReference hoverRef = Game.GetCrosshairRef() as ObjectReference
    if hoverRef == None
        Notify("No object found under crosshair to use as path point.")
        return
    endif
    AddPathPoint(hoverRef)
EndFunction

Function ClearPathPoints()
    if !DirectorModeEnabled
        Notify("Director mode is disabled.")
        return
    endif

    PathPoints = new ObjectReference[0]
    PathPointIndex = 0
    Notify("Path points cleared.")
EndFunction

Function StartActorPath(Actor akActor, ObjectReference[] akPoints, Float afDelay = 2.5)
    if !DirectorModeEnabled
        Notify("Director mode is disabled.")
        return
    endif
    if akActor == None
        Notify("Cannot path: actor is None.")
        return
    endif

    if akPoints == None || akPoints.Length == 0
        Notify("Cannot path: no path points configured.")
        return
    endif

    PathActor = akActor
    PathPoints = akPoints
    PathPointIndex = 0
    DefaultPathDelay = afDelay
    PathingPaused = False
    Notify("Director path started.")
    RegisterForSingleUpdate(DefaultPathDelay)
EndFunction

Function PauseActorPath()
    if PathActor == None
        Notify("No actor is currently pathing.")
        return
    endif
    PathingPaused = True
    UnregisterForUpdate()
    Notify("Pathing paused.")
EndFunction

Function ResumeActorPath()
    if PathActor == None
        Notify("No actor is currently pathing.")
        return
    endif
    if !PathingPaused
        Notify("Pathing is already running.")
        return
    endif
    PathingPaused = False
    RegisterForSingleUpdate(DefaultPathDelay)
    Notify("Pathing resumed.")
EndFunction

Function CancelActorPath()
    if !DirectorModeEnabled
        Notify("Director mode is disabled.")
        return
    endif
    PathActor = None
    PathPointIndex = 0
    PathPoints = new ObjectReference[0]
    PathingPaused = False
    UnregisterForUpdate()
    Notify("Actor path canceled.")
EndFunction

Function MoveActorToNextPoint()
    if PathActor == None || PathPoints == None || PathPointIndex >= PathPoints.Length
        Notify("Path finished or canceled.")
        PathActor = None
        UnregisterForUpdate()
        return
    endif

    ObjectReference nextPoint = PathPoints[PathPointIndex]
    if nextPoint != None
        PathActor.MoveTo(nextPoint)
        Notify("Moving actor to path point " + (PathPointIndex + 1))
    endif
    PathPointIndex += 1
EndFunction

Event OnUpdate()
    if PathingPaused
        return
    endif
    if PathActor != None && PathPoints != None && PathPointIndex < PathPoints.Length
        MoveActorToNextPoint()
        RegisterForSingleUpdate(DefaultPathDelay)
    endif
EndEvent

Function AddSpawnedReference(ObjectReference akSpawned)
    if akSpawned == None
        return
    endif
    if SpawnedObjects == None
        SpawnedObjects = new ObjectReference[0]
    endif
    SpawnedObjects = SpawnedObjects + [akSpawned]
    if SpawnedObjects.Length > MaxSpawnedObjects
        CleanupSpawnedObjects(SpawnedCleanupBatch)
    endif
EndFunction

ObjectReference[] Function PruneSpawnedReferences(Int aiCount)
    if SpawnedObjects == None || SpawnedObjects.Length == 0 || aiCount <= 0
        return SpawnedObjects
    endif

    Int toRemove = aiCount
    if toRemove > SpawnedObjects.Length
        toRemove = SpawnedObjects.Length
    endif

    Int keepCount = SpawnedObjects.Length - toRemove
    if keepCount <= 0
        return new ObjectReference[0]
    endif

    ObjectReference[] result = new ObjectReference[keepCount]
    Int writeIndex = 0
    Int readIndex = toRemove
    while writeIndex < keepCount
        result[writeIndex] = SpawnedObjects[readIndex]
        writeIndex += 1
        readIndex += 1
    endwhile
    return result
EndFunction

Function CleanupSpawnedObjects(Int aiCount = 1)
    if !DirectorModeEnabled
        Notify("Director mode is disabled.")
        return
    endif
    if SpawnedObjects == None || SpawnedObjects.Length == 0
        return
    endif

    Int removed = 0
    Int validRemoved = 0
    Int toRemove = aiCount
    if toRemove > SpawnedObjects.Length
        toRemove = SpawnedObjects.Length
    endif

    while validRemoved < toRemove && removed < SpawnedObjects.Length
        ObjectReference candidate = SpawnedObjects[validRemoved]
        if candidate != None
            candidate.DisableNoWait()
            candidate.Delete()
            validRemoved += 1
        endif
        removed += 1
    endwhile

    SpawnedObjects = PruneSpawnedReferences(validRemoved)
    Notify("Cleaned up " + validRemoved + " spawned objects.")
EndFunction

Function PrintStatus()
    Int spawnedCount = 0
    if SpawnedObjects != None
        spawnedCount = SpawnedObjects.Length
    endif
    Debug.Notification("DirectorMode=" + DirectorModeEnabled + ", Anchor=" + (DirectorMarker != None ? "marker" : (DirectorActor != None ? "actor" : "none")) + ", Spawned=" + spawnedCount)
EndFunction

Function ShowDirectorHelp()
    Debug.Notification("Director commands: /directormode help | /dm help")
    Debug.Notification("toggle, showstatus, setanchormode <auto|crosshair|marker>")
    Debug.Notification("setmarkerfromcrosshair, setdirectoractorfromcrosshair, teleportdirectortomarker")
    Debug.Notification("spawnactor <baseId> [count], spawnitem <baseId> [count], spawnbuilding <baseId>")
    Debug.Notification("addpathpointfromcrosshair, startactorpath <delay>, pauseactorpath, resumeactorpath")
    Debug.Notification("cancelactorpath, clearpath, cleanup <count>, setspawnoffset <height> <forward>")
    Debug.Notification("testoffsets <forward> <right> <height>")
    Debug.Notification("setdefaultdelay <delay>, objective <text>, listobjectives, clearobjectives")
EndFunction

Function OnChatInput(Actor ac, String text) Global
    if text == None
        return
    endif

    if StringUtil.GetNthChar(text, 0) == "/"
        String[] tokens = StringUtil.Split(text, " ")
        HandleDirectorCommand(ac, tokens)
    endif
EndFunction

Bool Function HandleDirectorCommand(Actor ac, String[] tokens) Global
    if tokens == None || tokens.Length == 0
        return False
    endif

    String command = StringUtilEx.ToLower(tokens[0])
    if command != StringUtilEx.ToLower(DirectorCommandPrefix) && command != "/dm"
        return False
    endif

    if !RequireAdmin(ac)
        return False
    endif

    if tokens.Length == 1
        Debug.Notification("Director mode: type /directormode help")
        return True
    endif

    String subcommand = StringUtilEx.ToLower(tokens[1])
    if subcommand == "help"
        ShowDirectorHelp()
        return True
    elseif subcommand == "toggle"
        ToggleDirectorMode()
        return True
    elseif subcommand == "showstatus"
        PrintStatus()
        return True
    elseif subcommand == "setanchormode"
        if tokens.Length < 3
            Debug.Notification("Director: setanchormode requires auto, crosshair, or marker")
            return True
        endif
        SetAnchorMode(tokens[2])
        return True
    elseif subcommand == "setmarkerfromcrosshair"
        SetDirectorMarkerFromCrosshair()
        return True
    elseif subcommand == "setdirectoractorfromcrosshair"
        SetDirectorActorFromCrosshair()
        return True
    elseif subcommand == "teleportdirectortomarker"
        TeleportDirectorToMarker()
        return True
    elseif subcommand == "spawnactor"
        if tokens.Length < 3
            Debug.Notification("Director: spawnactor requires <baseId> [count]")
            return True
        endif
        Int count = 1
        if tokens.Length >= 4
            count = Utility.StringToInt(tokens[2])
        endif

        SpawnActorByBaseId(tokens[2], count)
        BroadcastDirectorSpawn("Actor", tokens[2], count)
        return True
    elseif subcommand == "spawnitem"
        if tokens.Length < 3
            Debug.Notification("Director: spawnitem requires <baseId> [count]")
            return True
        endif
        Int count = 1
        if tokens.Length >= 4
            count = Utility.StringToInt(tokens[3])
        endif
        SpawnItemByBaseId(tokens[2], count)
        return True
    elseif subcommand == "spawnbuilding"
        if tokens.Length < 3
            Debug.Notification("Director: spawnbuilding requires <baseId>")
            return True
        endif
        SpawnBuildingByBaseId(tokens[2])
        return True
    elseif subcommand == "spawnactorlist"
        Int spawnCount = 1
        if tokens.Length >= 3
            spawnCount = Utility.StringToInt(tokens[2])
        endif
        SpawnActorFromDefaultList(spawnCount)
        return True
    elseif subcommand == "spawnitemlist"
        Int itemCount = 1
        if tokens.Length >= 3
            itemCount = Utility.StringToInt(tokens[2])
        endif
        SpawnItemFromDefaultList(itemCount)
        return True
    elseif subcommand == "spawnbuildinglist"
        SpawnBuildingFromDefaultList()
        return True
    elseif subcommand == "addpathpointfromcrosshair"
        AddPathPointFromCrosshair()
        return True
    elseif subcommand == "startactorpath"
        Float delay = DefaultPathDelay
        if tokens.Length >= 3
            delay = Utility.StringToFloat(tokens[2])
        endif
        StartActorPath(DirectorActor, PathPoints, delay)
        return True
    elseif subcommand == "pauseactorpath"
        PauseActorPath()
        return True
    elseif subcommand == "resumeactorpath"
        ResumeActorPath()
        return True
    elseif subcommand == "cancelactorpath"
        CancelActorPath()
        return True
    elseif subcommand == "clearpath"
        ClearPathPoints()
        return True
    elseif subcommand == "cleanup"
        Int cleanupCount = 1
        if tokens.Length >= 2
            cleanupCount = Utility.StringToInt(tokens[1])
        endif
        CleanupSpawnedObjects(cleanupCount)
        return True
    elseif subcommand == "setspawnoffset"
        if tokens.Length < 3
            Debug.Notification("Director: setspawnoffset requires <height> <forward>")
            return True
        endif
        Float height = Utility.StringToFloat(tokens[2])
        Float forward = DefaultSpawnForwardOffset
        if tokens.Length >= 4
            forward = Utility.StringToFloat(tokens[3])
        endif
        SetSpawnOffsets(height, forward)
        return True
    elseif subcommand == "setdefaultdelay"
        if tokens.Length < 3
            Debug.Notification("Director: setdefaultdelay requires <delay>")
            return True
        endif
        DefaultPathDelay = Utility.StringToFloat(tokens[2])
        Debug.Notification("Director default delay set to " + DefaultPathDelay)
        return True

    elseif subcommand == "testoffsets"
        if tokens.Length < 5
            Debug.Notification("Director: testoffsets requires <forward> <right> <height>")
            return True
        endif
        Float forward = Utility.StringToFloat(tokens[2])
        Float right = Utility.StringToFloat(tokens[3])
        Float height = Utility.StringToFloat(tokens[4])
        DefaultSpawnForwardOffset = forward
        DefaultSpawnRightOffset = right
        DefaultSpawnHeightOffset = height
        Debug.Notification("Director offsets updated for test: forward=" + forward + ", right=" + right + ", height=" + height)
        return True

    elseif subcommand == "objective"
        if tokens.Length < 2
            Debug.Notification("Director: objective requires text")
            return True
        endif
        AddObjective(MergeTokens(tokens, 1))
        return True
    elseif subcommand == "listobjectives"
        ListObjectives()
        return True
    elseif subcommand == "clearobjectives"
        ClearObjectives()
        return True
    endif

    Debug.Notification("Unknown director command. Type /directormode help")
    return False
EndFunction

Function SetAnchorMode(String mode)
    if mode == None
        Notify("Anchor mode cannot be empty.")
        return
    endif
    String lowerMode = StringUtilEx.ToLower(mode)
    if lowerMode == "auto" || lowerMode == "marker" || lowerMode == "crosshair"
        AnchorMode = lowerMode
        Notify("Anchor mode set to " + AnchorMode)
    else
        Notify("Invalid anchor mode: " + mode + ". Use auto, marker, or crosshair.")
    endif
EndFunction

Function SpawnActorByBaseId(String baseId, Int count)
    if baseId == None || baseId == ""
        Notify("Invalid actor baseId")
        return
    endif
    Int formId = ParseFormId(baseId)
    if formId == 0
        Notify("Actor baseId not found: " + baseId)
        return
    endif
    ActorBase actorBase = Game.GetFormEx(formId) as ActorBase
    if actorBase == None
        Notify("Actor baseId not found: " + baseId)
        return
    endif
    SpawnActorAtAnchor(actorBase, count)
EndFunction

Function SpawnItemByBaseId(String baseId, Int count)
    if baseId == None || baseId == ""
        Notify("Invalid item baseId")
        return
    endif
    Int formId = ParseFormId(baseId)
    if formId == 0
        Notify("Item baseId not found: " + baseId)
        return
    endif
    Form itemForm = Game.GetFormEx(formId)
    if itemForm == None
        Notify("Item baseId not found: " + baseId)
        return
    endif
    SpawnItemAtAnchor(itemForm, count)
EndFunction

Function SpawnBuildingByBaseId(String baseId)
    if baseId == None || baseId == ""
        Notify("Invalid building baseId")
        return
    endif
    Int formId = ParseFormId(baseId)
    if formId == 0
        Notify("Building baseId not found: " + baseId)
        return
    endif
    Form buildingForm = Game.GetFormEx(formId)
    if buildingForm == None
        Notify("Building baseId not found: " + baseId)
        return
    endif
    SpawnBuildingAtAnchor(buildingForm)
EndFunction

Function AddObjective(String objectiveText)
    if objectiveText == None || objectiveText == ""
        Notify("Objective text cannot be empty.")
        return
    endif
    if Objectives == None
        Objectives = new String[0]
    endif
    Objectives = Objectives + [objectiveText]
    Notify("Objective added: " + objectiveText)
EndFunction

Function ListObjectives()
    if Objectives == None || Objectives.Length == 0
        Notify("No objectives set.")
        return
    endif
    Int index = 0
    while index < Objectives.Length
        Notify("Objective " + (index + 1) + ": " + Objectives[index])
        index += 1
    endwhile
EndFunction

Function ClearObjectives()
    if !DirectorModeEnabled
        Notify("Director mode is disabled.")
        return
    endif
    Objectives = new String[0]
    Notify("Objectives cleared.")
EndFunction

Function MergeTokens(String[] tokens, Int startIndex) String
    String result = ""
    Int index = startIndex
    while index < tokens.Length
        if result == ""
            result = tokens[index]
        else
            result = result + " " + tokens[index]
        endif
        index += 1
    endwhile
    return result
EndFunction

Int Function ParseFormId(String formIdStr)
    if formIdStr == None || formIdStr == ""
        return 0
    endif
    String cleaned = formIdStr
    if cleaned.Length > 2 && StringUtil.GetNthChar(cleaned, 0) == "0" && StringUtil.GetNthChar(cleaned, 1) == "x"
        cleaned = StringUtil.Substring(cleaned, 2, cleaned.Length - 2)
    elseif cleaned.Length > 2 && StringUtil.GetNthChar(cleaned, 0) == "0" && StringUtil.GetNthChar(cleaned, 1) == "X"
        cleaned = StringUtil.Substring(cleaned, 2, cleaned.Length - 2)
    endif
    return Utility.StringToInt(cleaned)
EndFunction

