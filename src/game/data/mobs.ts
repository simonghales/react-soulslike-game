import {MobType} from "../state/game";

export type MovementConfig = {
    baseSpeed: number,
    slowSpeed: number,
    runningSpeed: number,
    sprintSpeed: number,
    attackSpeedMultiplier: number,
}

export const SLOW_SPEED_MULTIPLIER = 1
export const RUNNING_SPEED_MULTIPLIER = 2.75
export const SPRINT_SPEED_MULTIPLIER = RUNNING_SPEED_MULTIPLIER * 1.75
export const MAX_SPEED_MULTIPLIER = 3

const generateMovementConfig = (baseSpeed: number, attackSpeedMultiplier: number): MovementConfig => {
    return {
        baseSpeed,
        slowSpeed: baseSpeed * SLOW_SPEED_MULTIPLIER,
        runningSpeed: baseSpeed * RUNNING_SPEED_MULTIPLIER,
        sprintSpeed: baseSpeed * SPRINT_SPEED_MULTIPLIER,
        attackSpeedMultiplier: attackSpeedMultiplier,
    }
}

export type MobConfig = {
    health: number,
    damage: number,
    damageCooldownDuration: number,
    sensors: {
        [key: string]: {
            x: number,
            w: number,
            h: number,
        }
    },
    movement: MovementConfig,
    movementPriorityMultiplier: number,
    attackPriorityMultiplier: number,
    targetPriorityMultiplier: number,
}

export const mobsConfig: Record<string, MobConfig> = {
    [MobType.BASIC]: {
        health: 18,
        damage: 42,
        damageCooldownDuration: 750,
        sensors: {
            attackRange: {
                x: 0.8,
                w: 1.6,
                h: 1.5,
            },
            attack: {
                x: 0.7,
                w: 1.4,
                h: 0.75,
            },
        },
        movement: generateMovementConfig(4, 1.1),
        movementPriorityMultiplier: 5,
        attackPriorityMultiplier: 5,
        targetPriorityMultiplier: 5,
    },
    [MobType.LARGE]: {
        health: 36,
        damage: 78,
        damageCooldownDuration: 750,
        sensors: {
            attackRange: {
                x: 1.4,
                w: 2.6,
                h: 1.8,
            },
            attack: {
                x: 1.1,
                w: 2.4,
                h: 1.6,
            },
        },
        movement: {
            ...generateMovementConfig(8, 1.5),
            runningSpeed: 8 * (RUNNING_SPEED_MULTIPLIER * 2),
            sprintSpeed: 8 * (SPRINT_SPEED_MULTIPLIER * 2),
        },
        movementPriorityMultiplier: 1,
        attackPriorityMultiplier: 1,
        targetPriorityMultiplier: 1,
    },
}

export const getMobConfig = (type: MobType = MobType.BASIC) => {
    const config = mobsConfig[type]
    if (!config) {
        throw new Error(`No config found for type ${type}`)
    }
    return config
}

export const getMobTargetPriorityMultiplier = (mobType: MobType) => {
    if (!mobType) return 1
    return getMobConfig(mobType).targetPriorityMultiplier
}
