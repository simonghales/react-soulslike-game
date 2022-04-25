export const playerConfig = {
    rechargeAmount: 6,
    defaultHealth: 200,
    collisionIds: {
        player: 'player',
        attack: 'playerAttack',
    },
    sensors: {
        mediumRangeRadius: 5.5,
        largeRangeRadius: 8,
        mediumCombatRadius: 3.5,
        shortAttack: {
            w: 2,
            h: 0.5,
            x: 1,
        },
        longAttack: {
            w: 2,
            h: 0.75,
            x: 1,
        }
    }
}
