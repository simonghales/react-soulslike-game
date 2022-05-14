export const syncKeys = {
    playerState: 'playerState',
    playerAttackState: 'playerAttackState',
    playerEnergyUsage: 'playerEnergyUsage',
}

export const getMobSyncKey = (id: string) => {
    return `mob--${id}`
}

export const getMobEventsKey = (id: string) => {
    return `mob--${id}`
}

export const PLAYER_EVENTS_KEY = 'PLAYER_EVENTS'

export enum PlayerAttackStateType {
    CHARGING = 'CHARGING',
    SHORT = 'SHORT',
    LONG = 'LONG',
    IDLE = 'IDLE',
}

export const componentSyncKeys = {
    basicMob: 'basicMob',
    basicMobDead: 'basicMobDead',
}
