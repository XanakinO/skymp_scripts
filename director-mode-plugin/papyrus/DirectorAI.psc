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

; Example: Advanced Dragon Spawn with AI
Function SpawnDragonAttack(Float x, Float y, Float z) Global
    Int dragonBase = 0x000F8A8A
    ObjectReference dragon = Game.GetPlayer().PlaceAtMe(Game.GetForm(dragonBase), 1, True)
    If dragon
        dragon.SetPosition(x, y, z)
        (dragon as Actor).SetAggression(100)
        Debug.Notification("Dragon summoned for attack!")
    EndIf
EndFunction
