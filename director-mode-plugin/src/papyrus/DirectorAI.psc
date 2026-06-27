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
        
        ; Enhanced for dragons/events
        If (baseFormId == 0x000F8A8A) ; Dragon example
            actorRef.SetScale(1.5) ; Bigger dragon for dramatic events
            Debug.Notification("Dragon spawned for event!")
        EndIf
    EndIf
EndFunction

; New: Region-scoped spawn helper (near player or location)
Function SpawnNearPlayer(Int baseFormId, String aiPackage, Float aggression) Global
    Actor player = Game.GetPlayer()
    If (player == None)
        Return
    EndIf
    Float[] pos = new Float[3]
    pos[0] = player.GetPositionX() + Utility.RandomFloat(-500.0, 500.0)
    pos[1] = player.GetPositionY() + Utility.RandomFloat(-500.0, 500.0)
    pos[2] = player.GetPositionZ() + 100.0
    SpawnWithAI(baseFormId, pos, aiPackage, aggression)
EndFunction

; Additional event helpers
Event OnInit()
    Debug.Trace("DirectorAI script initialized")
EndEvent
