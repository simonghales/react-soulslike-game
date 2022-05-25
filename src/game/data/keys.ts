export const syncKeys = {
    playerState: 'playerState',
    playerAttackState: 'playerAttackState',
    playerEnergyUsage: 'playerEnergyUsage',
    backendStateSync: 'backendStateSync',
}

export const messageKeys = {
    playerInventoryChange: 'playerInventoryChange',
}

export const eventKeys = {
    playerInventory: 'playerInventory',
}

export const getMobSyncKey = (id: string) => {
    return `mob--${id}`
}

export const getMobDebugSyncKey = (id: string) => {
    return `mob--${id}--debug`
}

export const getMobStateSyncKey = (id: string) => {
    return `mob--${id}--state`
}

export const getMobEventsKey = (id: string) => {
    return `mob--${id}--events`
}

export const getInteractionEventsKey = (id: string) => {
    return `interaction--${id}`
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
