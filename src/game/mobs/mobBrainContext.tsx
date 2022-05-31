import {createContext, MutableRefObject, useContext} from "react";
import {Body, Vec2} from "planck";
import {CollisionsState, MainGoal} from "./brain/types";

export const MobBrainContext = createContext(null! as {
    id: string,
    body: Body,
    goal: MainGoal,
    setGoal: any,
    subGoal: any,
    setSubGoal: any,
    movementStateRef: any,
    setDebugData: any,
    targetBody: null | Body,
    targetBodyRef: MutableRefObject<null | Body>,
    collisionsState: CollisionsState,
    collisionsStateRef: any,
    setCollisionsState: any,
    running: any,
    setRunning: any,
    preventMovement: boolean,
    setPreventMovement: any,
    speedLimit: number | null,
    setSpeedLimit: any,
    setAttackState: any,
    attackState: any,
    attackStateRef: any,
    positionToken: string,
    onDamage: any,
    damageRecentlyTaken: boolean,
    stunned: boolean,
    updateTargetPosition: (position: null | Vec2) => void,
    nextStepInPath: () => void,
})

export const useMobBrainContext = () => {
    return useContext(MobBrainContext)
}
