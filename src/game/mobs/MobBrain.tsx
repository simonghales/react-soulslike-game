import React, {useRef, useState} from "react"
import {Body, Vec2} from "planck";
import {MobBrainContext} from "./mobBrainContext";
import {MovementHandler} from "./brain/MovementHandler";
import {GoalHandler, useMobBrainGoalHandler} from "./brain/GoalHandler";
import {CollisionsHandler} from "./brain/CollisionsHandler";
import {AttackState, CollisionsState} from "./brain/types";
import {useGetBody} from "../state/bodies";
import {useEffectRef} from "../../utils/hooks";
import {useTransmitData} from "react-three-physics";

export const MobBrain: React.FC<{
    id: string,
    body: Body,
}> = ({id, body}) => {

    const goalHandler = useMobBrainGoalHandler()
    const [collisionsState, setCollisionsState] = useState<CollisionsState>({
        enemiesInAttackRange: false,
        isInExtraLargeCombatRange: false,
        isInLargeCombatRange: false,
        isInSmallCombatRange: false,
        isInExtraSmallCombatRange: false,
        isInMediumCombatRange: false,
    })

    const collisionsStateRef = useEffectRef(collisionsState)

    const [attackState, setAttackState] = useState(null as null | AttackState)

    const attackStateRef = useEffectRef(attackState)

    const movementStateRef = useRef({
        targetPosition: null as null | Vec2,
        lastMovementGoal: 0,
        lockedTarget: null as null | Vec2,
    })

    const targetBody = useGetBody('player')
    const targetBodyRef = useEffectRef(targetBody)
    const [debugData, setDebugData] = useState({} as any)
    const [running, setRunning] = useState(false)
    const [preventMovement, setPreventMovement] = useState(false)
    const [speedLimit, setSpeedLimit] = useState(null as null | number)

    useTransmitData(`mob--${id}`, debugData)

    return (
        <MobBrainContext.Provider value={{
            id,
            body,
            collisionsState,
            setCollisionsState,
            targetBody,
            targetBodyRef,
            movementStateRef,
            setDebugData,
            running,
            setRunning,
            collisionsStateRef,
            preventMovement,
            setPreventMovement,
            speedLimit,
            setSpeedLimit,
            setAttackState,
            attackState,
            attackStateRef,
            ...goalHandler,
        }}>
            <MovementHandler/>
            <CollisionsHandler/>
            <GoalHandler/>
        </MobBrainContext.Provider>
    )
}
