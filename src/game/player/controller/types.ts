export type MovementState = {
    previousLookDirection: number,
    previousMovementDirection: number,
    lastLooked: number,
    lastMoved: number,
    lookViaMovement: boolean,
    lastLookX: number,
    lastLookXTime: number,
    lastLookY: number,
    lastLookYTime: number,
    lastMoveX: number,
    lastMoveXTime: number,
    lastMoveY: number,
    lastMoveYTime: number,
    lastCombatAngle: number,
}

export const defaultMovementState: MovementState = {
    previousLookDirection: 0,
    previousMovementDirection: 0,
    lastLooked: 0,
    lastMoved: 0,
    lookViaMovement: false,
    lastLookX: 0,
    lastLookXTime: 0,
    lastLookY: 0,
    lastLookYTime: 0,
    lastMoveX: 0,
    lastMoveXTime: 0,
    lastMoveY: 0,
    lastMoveYTime: 0,
    lastCombatAngle: 0,
}

export type PlayerState = {
    stunnedCooldown: number,
    lastStunned: number,
    inTargetMode: boolean,
}

export const defaultPlayerState: PlayerState = {
    stunnedCooldown: 0,
    lastStunned: 0,
    inTargetMode: false,
}
