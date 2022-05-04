import {Body} from "planck";

export enum AttackGoalSubGoalTypes {
    IDLE = 'IDLE',
    MOVE = 'MOVE',
    FOLLOW = 'FOLLOW',
    DAMAGE = 'DAMAGE',
    COOLDOWN = 'COOLDOWN',
}

export type AttackGoalSubGoal = {
    type: AttackGoalSubGoalTypes,
    time: number,
}

export type Collisions = Record<string, Record<string, {
    fixtureTypes: Record<string, number>,
    body: Body,
}>>

export type CollisionsState = {
    isInExtraSmallCombatRange: boolean,
    isInSmallCombatRange: boolean,
    isInMediumCombatRange: boolean,
    isInLargeCombatRange: boolean,
    isInExtraLargeCombatRange: boolean,
    enemiesInAttackRange: boolean,
}

export enum AttackStateType {
    PENDING = 'PENDING',
    CHARGING = 'CHARGING',
    ATTACKING = 'ATTACKING',
    COOLDOWN = 'COOLDOWN',
}

export type AttackState = {
    type: AttackStateType,
    time: number,
}
