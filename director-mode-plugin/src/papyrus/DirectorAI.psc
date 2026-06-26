Scriptname DirectorAI extends Quest

; Director Mode AI and Spawn Helpers
; Compile with Papyrus Compiler and attach to a quest in your .esp

Function ApplyAIPackage(Actor akActor, String asPackage, Float afAggression) Global
    If (akActor == None)
        Debug.Trace("DirectorAI: Invalid actor")
        Return
    EndIf
    
    ; Set aggression
    akActor.SetAggression(afAggression as Int)
    
    ; Apply package (example - use actual package FormIDs in practice)
    If (asPackage == "Guard")
        akActor.EvaluatePackage()
    ElseIf (asPackage == "Attack")
        ; Trigger combat or custom behavior
        akActor.StartCombat(Game.GetPlayer())
    ElseIf (asPackage == "Follow")
        akActor.SetPlayerFollower()
    EndIf
    
    Debug.Notification("DirectorAI: Applied " + asPackage + " to actor")
EndFunction

Function SpawnWithAI(Int baseFormId, Float[] position, String aiPackage, Float aggression) Global
    Form baseForm = Game.GetForm(baseFormId)
    If (baseForm == None)
        Debug.Notification("DirectorAI: Invalid FormID " + baseFormId)
        Return
    EndIf
    
    ObjectReference spawned = baseForm.PlaceAtMe(1, True, False)
    If (spawned as Actor)
        Actor actorRef = spawned as Actor
        actorRef.SetPosition(position[0], position[1], position[2])
        ApplyAIPackage(actorRef, aiPackage, aggression)
    EndIf
EndFunction

; Additional event helpers
Event OnInit()
    Debug.Trace("DirectorAI script initialized")
EndEvent
