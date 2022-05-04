import {createContext, MutableRefObject, useContext} from "react";
import {Body} from "planck";
import {CollisionsState} from "./brain/types";

export const MobBrainContext = createContext(null! as {
    id: string,
    body: Body,
    goal: any,
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
})

export const useMobBrainContext = () => {
    return useContext(MobBrainContext)
}
