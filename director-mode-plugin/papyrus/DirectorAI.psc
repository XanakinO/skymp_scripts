ScriptName DirectorAI extends Quest

Function ApplyAIPackage(Actor akActor, String packageType, Int aggression) Global
    If packageType == "Guard"
        akActor.SetAI("GuardPackage")
    ElseIf packageType == "Attack"
        akActor.SetAI("Aggressive")
    ElseIf packageType == "Follow"
        akActor.FollowPlayer()
    EndIf
    
    akActor.SetAggression(aggression)
    Debug.Notification("Director AI applied to " + akActor.GetDisplayName())
EndFunction

Function SpawnWithAI(Int baseFormId, Float x, Float y, Float z, String aiType) Global
    ObjectReference spawned = Game.GetPlayer().PlaceAtMe(Game.GetForm(baseFormId), 1, True)
    If spawned
        spawned.SetPosition(x, y, z)
        ApplyAIPackage(spawned as Actor, aiType, 50)
    EndIf
EndFunction

; Enhanced SpawnNearPlayer for region-scoped spawns
Function SpawnNearPlayer(Int baseFormId, String aiType, Float offsetRange = 3000.0) Global
    Actor player = Game.GetPlayer()
    If player
        Float px = player.GetPositionX()
        Float py = player.GetPositionY()
        Float pz = player.GetPositionZ()
        
        ; Add random offset for natural region spawn
        Float rx = px + (Utility.RandomFloat(-offsetRange, offsetRange))
        Float ry = py + (Utility.RandomFloat(-offsetRange, offsetRange))
        Float rz = pz + 100.0  ; Slight height adjustment
        
        SpawnWithAI(baseFormId, rx, ry, rz, aiType)
        Debug.Notification("Spawned near player at region offset")
    EndIf
EndFunction

; New: Event Triggers
Function TriggerDirectorEvent(String eventType, String location) Global
    Debug.Notification("Director Event Triggered: " + eventType + " at " + location)
    ; Add custom logic, e.g., start quest, spawn multiple actors, etc.
EndFunction

; New: Weather Control
Function SetDirectorWeather(String weatherType) Global
    Weather targetWeather = Weather.GetWeatherFromEditorID(weatherType)
    If targetWeather
        targetWeather.ForceActive(true)
        Debug.Notification("Weather changed to: " + weatherType)
    EndIf
EndFunction

; Enhanced Dragon Spawn for events (with flight AI, scale, etc.)
Function SpawnDragonAttack(Float x, Float y, Float z, Bool isHostile = true) Global
    Int dragonBase = 0x000F8A8A  ; Adjust FormID as needed for specific dragon
    ObjectReference dragonRef = Game.GetPlayer().PlaceAtMe(Game.GetForm(dragonBase), 1, True)
    If (dragonRef as Actor)
        Actor dragon = dragonRef as Actor
        dragon.SetPosition(x, y, z + 500.0)  ; Spawn in air for dramatic entry
        dragon.SetScale(1.2)  ; Slightly larger for boss feel
        dragon.SetAggression(If isHostile then 100 else 0)
        ; Trigger flight/combat AI
        dragon.EvaluatePackage()
        Debug.Notification("Dragon summoned for attack at " + x + ", " + y)
    EndIf
EndFunction
