export const playerConfig = {
    rechargeAmount: 4,
    defaultHealth: 200,
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
        shortAttack: {
            w: 1.8,
            h: 0.5,
            x: 0.9,
        },
        longAttack: {
            w: 1.8,
            h: 0.75,
            x: 0.9,
        }
    }
}
