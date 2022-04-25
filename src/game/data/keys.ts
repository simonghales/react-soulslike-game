export const syncKeys = {
    playerState: 'playerState',
    playerAttackState: 'playerAttackState',
    playerEnergyUsage: 'playerEnergyUsage',
}

export const getMobSyncKey = (id: string) => {
    return `mob--${id}`
}

export enum PlayerAttackStateType {
    CHARGING = 'CHARGING',
    SHORT = 'SHORT',
    LONG = 'LONG',
    IDLE = 'IDLE',
}

export const componentSyncKeys = {
    basicMob: 'basicMob',
}
