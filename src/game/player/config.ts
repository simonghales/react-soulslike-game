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
        extraLargeCombatRadius: 7.75,
        largeCombatRadius: 5.5,
        mediumCombatRadius: 3.25,
        smallCombatRadius: 1.5,
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
