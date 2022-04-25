export const SHORT_ATTACK_DURATION = 175
export const LONG_ATTACK_DURATION = 275

export const attacksConfig = {
    short: {
        energyUsage: 20,
        duration: 175,
        cooldown: 75,
        baseDamage: 6,
    },
    long: {
        energyUsage: 75,
      duration: 275,
        cooldown: 150,
      baseDamage: 17,
    },
}

const BASIC_WARMUP_DURATION = 200
const BASIC_ANIMATION_DELAY = 100
const BASIC_DAMAGE_DURATION = 100

export const mobAttacksConfig = {
    basic: {
        warmupDuration: BASIC_WARMUP_DURATION,
        damageDelay: BASIC_ANIMATION_DELAY,
        damageDuration: BASIC_ANIMATION_DELAY + BASIC_DAMAGE_DURATION,
        attackDuration: BASIC_ANIMATION_DELAY + BASIC_DAMAGE_DURATION + 300,
        cooldown: 1500,
    },
}
