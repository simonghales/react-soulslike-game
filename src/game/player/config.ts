import {degToRad} from "three/src/math/MathUtils";

export enum PlayerAttackType {
    SHORT = 'SHORT',
    LONG = 'LONG',
}

export type AttackConfig = {
    energyUsage: number,
    duration: number,
    cooldown: number,
    baseDamage: number,
    inputExpiration: number,
    angleRange: number,
}

const ATTACK_MULTIPLIER = 1
// const ATTACK_MULTIPLIER = 10

export const playerAttacksConfig: Record<string, AttackConfig> = {
    [PlayerAttackType.SHORT]: {
        energyUsage: 75,
        duration: 175,
        cooldown: 250,
        baseDamage: 6 * ATTACK_MULTIPLIER,
        inputExpiration: 1000,
        angleRange: degToRad(40),
    },
    [PlayerAttackType.LONG]: {
        energyUsage: 110,
        duration: 275,
        cooldown: 500,
        baseDamage: 17 * ATTACK_MULTIPLIER,
        inputExpiration: 1500,
        angleRange: degToRad(50),
    },
}

export const getAttackEnergyUsage = (attackType: string) => {
    const config = playerAttacksConfig[attackType]
    if (!config) {
        console.error(`No attack config found for ${attackType}`)
        return 0
    }
    return config.energyUsage
}

export const getAttackDamage = (attackType: string) => {
    const config = playerAttacksConfig[attackType]
    if (!config) {
        console.error(`No attack config found for ${attackType}`)
        return 0
    }
    return config.baseDamage
}

export const getAttackDuration = (attackType: string) => {
    const config = playerAttacksConfig[attackType]
    if (!config) {
        console.error(`No attack config found for ${attackType}`)
        return 0
    }
    return config.duration
}

export const getAttackAngleRange = (attackType: string) => {
    const config = playerAttacksConfig[attackType]
    if (!config) {
        console.error(`No attack config found for ${attackType}`)
        return 0
    }
    return config.angleRange
}

export const getAttackInputExpiration = (attackType: string) => {
    const config = playerAttacksConfig[attackType]
    if (!config) {
        console.error(`No attack config found for ${attackType}`)
        return 0
    }
    return config.inputExpiration
}

export const getAttackDurationAndCooldown = (attackType: string) => {
    const config = playerAttacksConfig[attackType]
    if (!config) {
        console.error(`No attack config found for ${attackType}`)
        return 0
    }
    return config.duration + config.cooldown
}

export const playerConfig = {
    rechargeAmount: 4,
    defaultEnergy: 150,
    // defaultHealth: 200,
    defaultHealth: 2000,
    collisionIds: {
        player: 'player',
        attack: 'playerAttack',
    },
    sensors: {
        mediumRangeRadius: 5.5,
        largeRangeRadius: 8,
        farCombatRadius: 12,
        extraLargeCombatRadius: 12,
        largeCombatRadius: 7.75,
        mediumCombatRadius: 5.5,
        smallCombatRadius: 3.25,
        extraSmallCombatRadius: 1.75,
        interactionRadius: 1.1,
        // interactionRadius: 5,
        shortAttack: {
            w: 1.6,
            h: 0.7,
            x: 0.8,
        },
        longAttack: {
            w: 1.6,
            h: 0.9,
            x: 0.8,
        }
    },
    actions: {
        run: {
            energyUsage: 0.5,
        },
        roll: {
            duration: 700,
            cooldown: 150,
            energyUsage: 75,
        },
        jump: {
            duration: 600,
            cooldown: 100,
            energyUsage: 50,
        },
        backStep: {
            duration: 250,
            cooldown: 50,
            energyUsage: 50,
        },
    }
}
