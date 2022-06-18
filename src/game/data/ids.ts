export const VISIBILITY_IDS = [
    'ENTRY_HALLWAY',
    'MAIN_ROOM_GAP',
    'MAIN_ROOM',
    'MOB_ROOM_HALLWAY',
    'MOB_ROOM',
]

export enum SensorId {
    ENTRY_HALLWAY = 'ENTRY_HALLWAY',
    MAIN_ROOM = 'MAIN_ROOM',
    MAIN_ROOM_EXIT = 'MAIN_ROOM_EXIT',
    MOB_ROOM_HALLWAY = 'MOB_ROOM_HALLWAY',
    MOB_ROOM_ENTRANCE = 'MOB_ROOM_ENTRANCE',
    MOB_ROOM = 'MOB_ROOM',
    HALLWAY = 'HALLWAY',
    SPAWN_HALLWAY = 'SPAWN_HALLWAY',
}

export enum GameWorldStateIds {
    SPAWN_WALL_DESTROYED = 'SPAWN_WALL_DESTROYED',
    MOB_ROOM_WALL_DESTROYED = 'MOB_ROOM_WALL_DESTROYED',
    MOB_ROOM_TRIGGER_RELEASED = 'MOB_ROOM_TRIGGER_RELEASED',
}

export enum BreakableWallStrength {
    DEFAULT = 'DEFAULT',
    WEAK = 'WEAK',
    STRONG = 'STRONG',
}
