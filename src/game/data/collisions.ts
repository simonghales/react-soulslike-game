
export const BIT_FLAGS = {
    0: 0,
    1: 1,
    2: 2,
    3: 4,
    4: 8,
    5: 16,
    6: 32,
}

export const COLLISION_FILTER_GROUPS = {
    player: BIT_FLAGS["1"],
    playerRolling: BIT_FLAGS["2"],
    playerRange: BIT_FLAGS["3"],
    barrier: BIT_FLAGS["4"],
    npcs: BIT_FLAGS["5"],
}

export enum PlayerAttackCollisionTypes {
    QUICK_ATTACK = 'QUICK_ATTACK',
    LONG_ATTACK = 'LONG_ATTACK',
}

export enum PlayerRangeCollisionTypes {
    PLAYER_RANGE = 'PLAYER_RANGE',
    PLAYER_MEDIUM_RANGE = 'PLAYER_MEDIUM_RANGE',
    PLAYER_LONG_RANGE = 'PLAYER_LONG_RANGE',
}