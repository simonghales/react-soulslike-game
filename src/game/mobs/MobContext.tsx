import {createContext, useContext} from "react";
import {Body} from "planck";

export type AttackingState = {
    started: number,
}

export type Collisions = Record<string, Record<string, {
    fixtureTypes: Record<string, number>,
    body: Body,
}>>

export type CollisionStates = {
    isInSmallCombatRange: boolean,
    isInMediumCombatRange: boolean,
    isInLargeCombatRange: boolean,
    isInExtraLargeCombatRange: boolean,
    enemiesInAttackRange: boolean,
}

export const MobContext = createContext(null! as {
    id: string,
    body: Body,
    collisions: Collisions,
    collisionStates: CollisionStates,
    attackingState: null | AttackingState,
    setAttackingState: any,
    damageZoneActive: boolean,
    setDamageZoneActive: any,
    movementRestricted: boolean,
    setMovementRestricted: any,
    damageCooldown: number,
    setHasAttackToken: any,
    goal: any,
    setGoal: any,
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
