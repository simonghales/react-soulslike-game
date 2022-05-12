import {Fixture} from "planck/dist/planck-with-testbed";

export enum PlayerMovementState {
    ROLLING = 'ROLLING',
    PENDING_JUMP = 'PENDING_JUMP',
    PENDING_ATTACK = 'PENDING_ATTACK',
    JUMPING = 'JUMPING',
    ATTACKING = 'ATTACKING',
    BACK_STEPPING = 'BACK_STEPPING',
    RUNNING = 'RUNNING',
    COOLDOWN = 'COOLDOWN',
    STUNNED = 'STUNNED',
}

export type PlayerFixtures = {
    default: Fixture,
    small: Fixture,
    medium: Fixture,
}

export type PlayerCollisionsState = {
    enemiesInLongAttackSensor: string[],
    enemiesInShortAttackSensor: string[],
}
