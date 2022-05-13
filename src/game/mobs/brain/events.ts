export enum MobEventType {
    DAMAGED = 'DAMAGED',
}

export type MobEvent = {
    type: MobEventType,
}

export type MobDamagedEvent = MobEvent & {
    damage: number,
    x: number,
    y: number,
}
