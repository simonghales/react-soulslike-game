export const KEYS = {
    RIGHT: ['68', '39'],
    LEFT: ['65', '37'],
    UP: ['87', '38'],
    DOWN: ['83', '40'],
    SPACE: ['32'],
    E: ['69'],
}

export type KeysState = {
    ePressed: boolean,
}

export const defaultKeysState: KeysState = {
    ePressed: false,
}
