export const INPUT_KEYS = {
    MOVE_RIGHT: ['68'],
    MOVE_LEFT: ['65'],
    MOVE_UP: ['87'],
    MOVE_DOWN: ['83'],
    LOOK_RIGHT: ['39'],
    LOOK_LEFT: ['37'],
    LOOK_UP: ['38'],
    LOOK_DOWN: ['40'],
    SPACE: ['32'],
    SHIFT: ['16'],
    E: ['69'],
    Z: ['90'],
    Q: ['81'],
    C: ['67'],
    O: ['79'],
    P: ['80'],
    RIGHT_ANGLE: ['190'],
}

export type KeysState = {
    ePressed: boolean,
}

export const defaultKeysState: KeysState = {
    ePressed: false,
}
