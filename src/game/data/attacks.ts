export const SHORT_ATTACK_DURATION = 175
export const LONG_ATTACK_DURATION = 275

// const ATTACK_MULTIPLIER = 1
const ATTACK_MULTIPLIER = 10

export const attacksConfig = {
    short: {
        energyUsage: 75,
        duration: 175,
        cooldown: 250,
        baseDamage: 6 * ATTACK_MULTIPLIER,
    },
    long: {
        energyUsage: 110,
      duration: 275,
        cooldown: 500,
      baseDamage: 17 * ATTACK_MULTIPLIER,
    },
}

const BASIC_WARMUP_DURATION = 250
const BASIC_ANIMATION_DELAY = 750
const BASIC_DAMAGE_DURATION = 100

export const mobAttacksConfig = {
    basic: {
        warmupDuration: BASIC_WARMUP_DURATION,
        damageDelay: BASIC_ANIMATION_DELAY,
        damageDuration: BASIC_ANIMATION_DELAY + BASIC_DAMAGE_DURATION,
        attackDuration: BASIC_ANIMATION_DELAY + BASIC_DAMAGE_DURATION + 100,
        cooldown: 2000,
    },
}
