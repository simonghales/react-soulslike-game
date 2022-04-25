import {createContext, useContext} from "react";
import {Body} from "planck";

export type AttackingState = {
    started: number,
}

export const MobContext = createContext(null! as {
    id: string,
    body: Body,
    collisions: Record<string, Record<string, Body>>,
    attackingState: null | AttackingState,
    setAttackingState: any,
    damageZoneActive: boolean,
    setDamageZoneActive: any,
    movementRestricted: boolean,
    setMovementRestricted: any,
    damageCooldown: number,
})

export const useMobContext = () => {
    return useContext(MobContext)
}

export const useMobCollisions = () => {
    return useContext(MobContext).collisions
}

export const useMobId = () => {
    return useContext(MobContext).id
}
