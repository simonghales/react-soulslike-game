export const KEYS = {
    RIGHT: ['68', '39'],
    LEFT: ['65', '37'],
    UP: ['87', '38'],
    DOWN: ['83', '40'],
    SPACE: ['32'],
    SHIFT: ['16'],
    E: ['69'],
    Z: ['90'],
    Q: ['81'],
}

export type KeysState = {
    ePressed: boolean,
}

export const defaultKeysState: KeysState = {
    ePressed: false,
}
