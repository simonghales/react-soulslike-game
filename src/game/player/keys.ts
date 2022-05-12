import {INPUT_KEYS} from "../input/INPUT_KEYS";

export const RAW_KEYS = [
    'moveRight',
    'moveLeft',
    'moveUp',
    'moveDown',
    'aimRight',
    'aimLeft',
    'aimUp',
    'aimDown',
    'shift',
    'rightAngle',
    'space',
    'target',
    'targetUnlock',
] as const

export const RAW_KEYS_PRESSED = [
    'moveRightPressed',
    'moveLeftPressed',
    'moveUpPressed',
    'moveDownPressed',
    'aimRightPressed',
    'aimLeftPressed',
    'aimUpPressed',
    'aimDownPressed',
    'shiftPressed',
    'rightAnglePressed',
    'spacePressed',
    'targetPressed',
    'targetUnlockPressed',
] as const

export const RAW_KEYS_RELEASED = [
    'moveRightReleased',
    'moveLeftReleased',
    'moveUpReleased',
    'moveDownReleased',
    'aimRightReleased',
    'aimLeftReleased',
    'aimUpReleased',
    'aimDownReleased',
    'shiftReleased',
    'rightAngleReleased',
    'spaceReleased',
    'targetReleased',
    'targetUnlockReleased',
] as const

export const RAW_KEYS_HELD = [
    'moveRightHeld',
    'moveLeftHeld',
    'moveUpHeld',
    'moveDownHeld',
    'aimRightHeld',
    'aimLeftHeld',
    'aimUpHeld',
    'aimDownHeld',
    'shiftHeld',
    'rightAngleHeld',
    'spaceHeld',
    'targetHeld',
    'targetUnlockHeld',
] as const

export const RAW_KEYS_STATE = [
    ...RAW_KEYS_PRESSED,
    ...RAW_KEYS_RELEASED,
    ...RAW_KEYS_HELD,
] as const

export type Keys = {
    [K in typeof RAW_KEYS[number]]: string
}

export const KEYS = RAW_KEYS.reduce((o, key) => ({ ...o, [key]: key}), {}) as Keys

export type KeysState = {
    [K in typeof RAW_KEYS[number]]: boolean
}

export type KeyBindings = {
    [key: string]: any[]
}

export const KEY_BINDINGS: KeyBindings = {
    [KEYS.moveRight]: INPUT_KEYS.MOVE_RIGHT,
    [KEYS.moveLeft]: INPUT_KEYS.MOVE_LEFT,
    [KEYS.moveUp]: INPUT_KEYS.MOVE_UP,
    [KEYS.moveDown]: INPUT_KEYS.MOVE_DOWN,
    [KEYS.aimRight]: INPUT_KEYS.LOOK_RIGHT,
    [KEYS.aimLeft]: INPUT_KEYS.LOOK_LEFT,
    [KEYS.aimUp]: INPUT_KEYS.LOOK_UP,
    [KEYS.aimDown]: INPUT_KEYS.LOOK_DOWN,
    [KEYS.shift]: INPUT_KEYS.SHIFT,
    [KEYS.rightAngle]: INPUT_KEYS.RIGHT_ANGLE,
    [KEYS.space]: INPUT_KEYS.SPACE,
    [KEYS.target]: INPUT_KEYS.Q,
    [KEYS.targetUnlock]: INPUT_KEYS.E,
} as KeyBindings

export type KeysProcessedState = {
    [K in typeof RAW_KEYS_STATE[number]]: boolean;
}

export const defaultKeys: KeysState = RAW_KEYS.reduce((o, key) => ({ ...o, [key]: false}), {}) as unknown as KeysState

export const defaultKeysState: KeysProcessedState = RAW_KEYS_STATE.reduce((o, key) => ({ ...o, [key]: false}), {}) as unknown as KeysProcessedState
