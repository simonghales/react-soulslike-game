import React, {useCallback, useRef, useState} from "react"
import {useIsKeyPressed, useOnPhysicsUpdate} from "react-three-physics";
import {defaultKeys, defaultKeysState, KEY_BINDINGS, KeysProcessedState, KeysState} from "../keys";
import {usePlayerContext} from "../PlayerContext";
import {Body, Vec2} from "planck";
import {angleToV2, lerpRadians, v2ToAngle} from "../../../utils/angles";
import {
    getAttackAngleRange,
    getAttackDuration,
    getAttackDurationAndCooldown, getAttackEnergyUsage,
    getAttackInputExpiration, playerAttacksConfig,
    PlayerAttackType, playerConfig
} from "../config";
import {degToRad, lerp} from "three/src/math/MathUtils";
import {useEffectRef} from "../../../utils/hooks";
import {normalize} from "../../../utils/numbers";
import {PlayerMovementState} from "../types";
import {PlayerEventType, useOnPlayerEvents} from "../../events/player";
import {AttackData, useAttackHandler} from "./attackHandler";

let pressed = false
let held = false
let released = false

let attackType = ''
let duration = 0
let timeElapsed = 0
let progress = 0
let now = 0
let recentlyLooked = false
const INPUT_QUEUE_LIMIT = 2
let excess = 0
let shouldDelete = false
let lookViaMovement = false
let prevLookViaMovement = false
let releaseLookHorizontal = false
let releaseLookVertical = false
let pendingAttackThresholdReached = false
let shouldReleaseAttack = false
let hasRemainingEnergy = false

let lookX = 0
let lookY = 0
let moveX = 0
let moveY = 0
let wantsToLook = false
let wantsToMove = false
let speed = 0
let previousMovementDirection = 0
let movementDirection = 0
let previousLookDirection = 0
let lookDirection = 0
let angle = 0

const plainV2 = new Vec2()
const v2 = new Vec2()
const movementVector = new Vec2()

const WALKING_SPEED = 2
const JUMPING_SPEED = WALKING_SPEED * 1.25
const CHARGING_SPEED = WALKING_SPEED * 0.5
const RUNNING_SPEED = WALKING_SPEED * 1.4
const ROLLING_SPEED = RUNNING_SPEED * 0.95
const ATTACKING_SPEED = WALKING_SPEED * 2.75

const processKeys = (keysState: KeysProcessedState, prevKeys: KeysState, isKeyPressed: (keys: string[]) => boolean) => {
    Object.keys(prevKeys).forEach(key => {
        held = isKeyPressed((KEY_BINDINGS as any)[key] ?? []) as boolean
        pressed = held && !(prevKeys as any)[key];
        released = !held && (prevKeys as any)[key];
        (keysState as any)[`${key}Pressed`] = pressed;
        (keysState as any)[`${key}Held`] = held;
        (keysState as any)[`${key}Released`] = released;
        (prevKeys as any)[key] = held
    })
}

export type ProcessedState = {
    attackCooldown: boolean,
    attackCharging: boolean,
    canMove: boolean,
    canAttack: boolean,
    canSpecialMove: boolean,
    canRun: boolean,
    isRolling: boolean,
    isJumping: boolean,
    isBackStepping: boolean,
    isRunning: boolean,
    isAttacking: boolean,
}

const defaultProcessedState: ProcessedState = {
    attackCooldown: false,
    attackCharging: false,
    canMove: false,
    canAttack: false,
    canSpecialMove: false,
    canRun: false,
    isRolling: false,
    isJumping: false,
    isBackStepping: false,
    isRunning: false,
    isAttacking: false,
}

export enum QueuedInputType {
    ATTACK = 'ATTACK',
    ROLL = 'ROLL',
    JUMP = 'JUMP',
}

export type QueuedInput = {
    time: number,
    type: QueuedInputType,
    data?: any,
}

export type InputQueue = Array<QueuedInput>

export type InputsState = {
    pendingJump: boolean,
    spacePressed: number,
    queue: InputQueue,
    attackX: number,
    attackXReleased: number,
    attackY: number,
    attackYReleased: number,
    pendingAttack: number,
}

const defaultInputsState: InputsState = {
    pendingJump: false,
    spacePressed: 0,
    queue: [],
    attackX: 0,
    attackXReleased: 0,
    attackY: 0,
    attackYReleased: 0,
    pendingAttack: 0,
}

const PENDING_JUMP_THRESHOLD = 150
const JUMP_THRESHOLD = PENDING_JUMP_THRESHOLD + 100

const handleSpaceInput = (inputsState: InputsState, energyState: EnergyState) => {

    timeElapsed = Date.now() - inputsState.spacePressed

    if (timeElapsed < JUMP_THRESHOLD) {
        inputsState.queue.push({
            time: now,
            type: QueuedInputType.ROLL,
        })
        // inputsState.pendingAttack = 0
    } else {
        inputsState.queue.push({
            time: now,
            type: QueuedInputType.JUMP,
        })
        // inputsState.pendingAttack = 0
    }

    inputsState.pendingJump = false

}


const handleSpaceHeld = (inputsState: InputsState, energyState: EnergyState) => {

    timeElapsed = Date.now() - inputsState.spacePressed

    inputsState.pendingJump = timeElapsed > PENDING_JUMP_THRESHOLD

}

let lookHorizontalHeld = false
let lookVerticalHeld = false
let lookPressed = false

const handleAttackInputs = (keysState: KeysProcessedState, inputsState: InputsState, energyState: EnergyState) => {

    now = Date.now()

    if (keysState.aimRightPressed) {
        inputsState.attackX = 1
    } else if (keysState.aimLeftPressed) {
        inputsState.attackX = -1
    }

    if (keysState.aimUpPressed) {
        inputsState.attackY = 1
    } else if (keysState.aimDownPressed) {
        inputsState.attackY = -1
    }

    lookHorizontalHeld = keysState.aimLeftHeld || keysState.aimRightHeld
    lookVerticalHeld = keysState.aimUpHeld || keysState.aimDownHeld
    lookPressed = false

    if (keysState.aimUpPressed && !inputsState.pendingAttack) {
        lookPressed = true
    }

    if (keysState.aimDownPressed && !inputsState.pendingAttack) {
        lookPressed = true
    }

    if (keysState.aimRightPressed && !inputsState.pendingAttack) {
        lookPressed = true
    }

    if (keysState.aimLeftPressed && !inputsState.pendingAttack) {
        lookPressed = true
    }

    if (keysState.aimRightReleased && (!keysState.aimLeftHeld)) {
        releaseLookHorizontal = true
    } else if (keysState.aimLeftReleased && (!keysState.aimRightHeld)) {
        releaseLookHorizontal = true
    } else {
        releaseLookHorizontal = false
    }

    if (keysState.aimUpReleased && (!keysState.aimDownHeld)) {
        releaseLookVertical = true
    } else if (keysState.aimDownReleased && (!keysState.aimUpHeld)) {
        releaseLookVertical = true
    } else {
        releaseLookVertical = false
    }

    if (releaseLookHorizontal) {
        inputsState.attackXReleased = now
    }

    if (releaseLookVertical) {
        inputsState.attackYReleased = now
    }

    pendingAttackThresholdReached = false

    if (inputsState.pendingAttack) {
        if ((now - inputsState.pendingAttack >= 2000)) {
            pendingAttackThresholdReached = true
            inputsState.attackXReleased = now
            inputsState.attackYReleased = now
        }
    }

    shouldReleaseAttack = !!inputsState.pendingAttack && ((releaseLookVertical || releaseLookHorizontal) && (!lookHorizontalHeld && !lookVerticalHeld))

    if ((shouldReleaseAttack || pendingAttackThresholdReached)) {

        timeElapsed = now - inputsState.pendingAttack

        inputsState.pendingAttack = 0

        if ((now - inputsState.attackXReleased) > 75) {
            inputsState.attackX = 0
        }

        if ((now - inputsState.attackYReleased) > 75) {
            inputsState.attackY = 0
        }

        attackType = timeElapsed >= 250 ? PlayerAttackType.LONG : PlayerAttackType.SHORT

        inputsState.queue.push({
            time: now,
            type: QueuedInputType.ATTACK,
            data: {
                timeElapsed,
                attackX: inputsState.attackX,
                attackY: inputsState.attackY,
                attackType,
            }
        })

        inputsState.attackX = 0
        inputsState.attackY = 0

    }

    if (lookPressed) {
        inputsState.pendingAttack = now
    }

}


const processInputs = (keysState: KeysProcessedState, inputsState: InputsState, energyState: EnergyState) => {

    now = Date.now()

    if (keysState.spacePressed) {
        inputsState.spacePressed = now
    }

    if (keysState.spaceReleased) {
        handleSpaceInput(inputsState, energyState)
    } else if (keysState.spaceHeld) {
        handleSpaceHeld(inputsState, energyState)
    } else {
        inputsState.pendingJump = false
    }

    handleAttackInputs(keysState, inputsState, energyState)

    excess = inputsState.queue.length - INPUT_QUEUE_LIMIT

    if (excess > 0) {
        inputsState.queue.splice(0, excess)
    }

}

const getTimeElapsed = (queuedInput: QueuedInput) => {
    return Date.now() - queuedInput.time
}

const checkHasExpired = (queuedInput: QueuedInput, maxAge: number) => {
    timeElapsed = Date.now() - queuedInput.time
    return timeElapsed > maxAge
}

const hasEnergyRemaining = (energyState: EnergyState) => {
    return (energyState.currentUsage + energyState.newUsage) < playerConfig.defaultEnergy
}

const processJumpInput = (
    queuedInput: QueuedInput,
    inputsState: InputsState,
    processedState: ProcessedState,
    actionState: PlayerActionState,
    energyState: EnergyState,
) => {

    if (checkHasExpired(queuedInput, 1000)) {
        return true
    }

    if (!hasEnergyRemaining(energyState)) {
        if (getTimeElapsed(queuedInput) > 500) {
            return true
        }
        return false
    }

    if (!processedState.canMove || !processedState.canSpecialMove) {
        return false
    }

    energyState.newUsage += playerConfig.actions.jump.energyUsage

    actionState.currentAction = {
        type: PlayerActionType.JUMP,
        time: Date.now(),
    }

    actionState.specialMoveCooldown = Date.now() + playerConfig.actions.jump.duration + playerConfig.actions.jump.cooldown

    return true
}

const processRollInput = (
    queuedInput: QueuedInput,
    inputsState: InputsState,
    processedState: ProcessedState,
    actionState: PlayerActionState,
    energyState: EnergyState,
    keysState: KeysProcessedState,
    body: Body,
) => {

    if (checkHasExpired(queuedInput, 1000)) {
        return true
    }

    if (!hasEnergyRemaining(energyState)) {
        if (getTimeElapsed(queuedInput) > 500) {
            return true
        }
        return false
    }

    if (!processedState.canMove || !processedState.canSpecialMove) {
        return false
    }


    moveX = keysState.moveRightHeld ? 1 : keysState.moveLeftHeld ? -1 : 0
    moveY = keysState.moveUpHeld ? 1 : keysState.moveDownHeld ? -1 : 0

    wantsToMove = moveX !== 0 || moveY !== 0

    if (wantsToMove) {

        energyState.newUsage += playerConfig.actions.roll.energyUsage

        v2.set(moveX, moveY)
        v2.normalize()

        actionState.currentAction = {
            type: PlayerActionType.ROLL,
            time: Date.now(),
            data: {
                moveX: v2.x,
                moveY: v2.y,
            }
        }

        actionState.specialMoveCooldown = Date.now() + playerConfig.actions.roll.duration + playerConfig.actions.roll.cooldown

    } else {

        angle = body.getAngle() - degToRad(180)

        energyState.newUsage += playerConfig.actions.backStep.energyUsage

        actionState.currentAction = {
            type: PlayerActionType.BACK_STEP,
            time: Date.now(),
            data: {
                angle,
            }
        }

        actionState.specialMoveCooldown = Date.now() + playerConfig.actions.backStep.duration + playerConfig.actions.backStep.cooldown

    }

    return true
}

const processAttackInput = (
    queuedInput: QueuedInput,
    inputsState: InputsState,
    processedState: ProcessedState,
    actionState: PlayerActionState,
    energyState: EnergyState,
    setCurrentAttack: any,
) => {

    if (checkHasExpired(queuedInput, getAttackInputExpiration(queuedInput.data.attackType))) {
        return true
    }

    if (!hasEnergyRemaining(energyState)) {
        if (getTimeElapsed(queuedInput) > 500) {
            return true
        }
        return false
    }

    if (!processedState.canMove || !processedState.canAttack) {
        return false
    }

    energyState.newUsage += getAttackEnergyUsage(queuedInput.data.attackType)

    actionState.currentAction = {
        type: PlayerActionType.ATTACK,
        time: Date.now(),
        data: queuedInput.data,
    }

    setCurrentAttack({
        time: Date.now(),
        type: queuedInput.data.attackType,
    })

    actionState.attackCooldown = Date.now() + getAttackDurationAndCooldown(queuedInput.data.attackType)

    return true
}

const processInputsQueue = (
    inputsState: InputsState,
    processedState: ProcessedState,
    actionState: PlayerActionState,
    energyState: EnergyState,
    keysState: KeysProcessedState,
    body: Body,
    setCurrentAttack: any,
) => {

    inputsState.queue.forEach((queuedInput, index, queue) => {
        switch (queuedInput.type) {
            case QueuedInputType.JUMP:
                shouldDelete = processJumpInput(queuedInput, inputsState, processedState, actionState, energyState)
                break;
            case QueuedInputType.ROLL:
                shouldDelete = processRollInput(queuedInput, inputsState, processedState, actionState, energyState, keysState, body)
                break;
            case QueuedInputType.ATTACK:
                shouldDelete = processAttackInput(queuedInput, inputsState, processedState, actionState, energyState, setCurrentAttack)
                break;
        }
        if (shouldDelete) {
            queue.splice(index, 1)
        }
    })

}

const processActionAttack = (action: PlayerAction, actionState: PlayerActionState, setCurrentAttack: any) => {

    now = Date.now()
    timeElapsed = now - action.time

    if (timeElapsed > getAttackDuration(action.data.attackType)) {
        actionState.currentAction = null
        setCurrentAttack(null)
    }

}

const processActionRoll = (action: PlayerAction, actionState: PlayerActionState) => {

    now = Date.now()
    timeElapsed = now - action.time

    if (timeElapsed > playerConfig.actions.roll.duration) {
        actionState.currentAction = null
    }

}

const processActionBackStep = (action: PlayerAction, actionState: PlayerActionState) => {

    now = Date.now()
    timeElapsed = now - action.time

    if (timeElapsed > playerConfig.actions.backStep.duration) {
        actionState.currentAction = null
    }

}

const processActionJump = (action: PlayerAction, actionState: PlayerActionState) => {

    now = Date.now()
    timeElapsed = now - action.time

    if (timeElapsed > playerConfig.actions.roll.duration) {
        actionState.currentAction = null
    }

}

const processAction = (actionState: PlayerActionState, setCurrentAttack: any) => {

    if (!actionState.currentAction) {
        return
    }

    switch (actionState.currentAction.type) {
        case PlayerActionType.ATTACK:
            processActionAttack(actionState.currentAction, actionState, setCurrentAttack)
            break;
        case PlayerActionType.ROLL:
            processActionRoll(actionState.currentAction, actionState)
            break;
        case PlayerActionType.BACK_STEP:
            processActionBackStep(actionState.currentAction, actionState)
            break;
        case PlayerActionType.JUMP:
            processActionJump(actionState.currentAction, actionState)
            break;
    }

}

let hasCurrentAction = false
let isInAttackCooldown = false
let isInSpecialMoveCooldown = false
let isInCooldown = false

const processState = (processedState: ProcessedState, actionState: PlayerActionState, inputsState: InputsState) => {

    now = Date.now()

    hasCurrentAction = !!actionState.currentAction

    isInAttackCooldown = now < actionState.attackCooldown
    isInSpecialMoveCooldown = now < actionState.specialMoveCooldown

    isInCooldown = isInAttackCooldown || isInSpecialMoveCooldown

    processedState.canMove = !isInAttackCooldown
    processedState.canAttack = !hasCurrentAction && !isInCooldown
    processedState.canSpecialMove = !hasCurrentAction && !isInCooldown
    processedState.attackCooldown = isInAttackCooldown
    processedState.attackCharging = (!!inputsState.pendingAttack) && !hasCurrentAction
    processedState.canRun = processedState.canMove && !hasCurrentAction && !isInCooldown && !inputsState.pendingJump && !inputsState.pendingAttack

    processedState.isRolling = actionState?.currentAction?.type === PlayerActionType.ROLL
    processedState.isJumping = actionState?.currentAction?.type === PlayerActionType.JUMP
    processedState.isBackStepping = actionState?.currentAction?.type === PlayerActionType.BACK_STEP
    processedState.isAttacking = actionState?.currentAction?.type === PlayerActionType.ATTACK

}

let from = 0
let to = 0

const processAttackSpeed = (action: PlayerAction) => {
    now = Date.now()
    timeElapsed = now - action.time
    progress = timeElapsed / getAttackDuration(action.data.attackType)
    if (progress < 0) {
        progress = 0
    } else if (progress > 1) {
        progress = 1
    }
    from = 0
    to = ATTACKING_SPEED
    if (action.data.attackType === PlayerAttackType.SHORT) {
        from = CHARGING_SPEED
        to = RUNNING_SPEED
    }
    return lerp(from, to, progress)
}

const processRollingSpeed = (action: PlayerAction) => {
    now = Date.now()
    timeElapsed = now - action.time
    progress = normalize(timeElapsed, playerConfig.actions.roll.duration, 0)
    return lerp(RUNNING_SPEED, CHARGING_SPEED, progress)
}

const processBackSteppingSpeed = (action: PlayerAction) => {
    now = Date.now()
    timeElapsed = now - action.time
    progress = normalize(timeElapsed, playerConfig.actions.backStep.duration, 50)
    if (progress <= 0) return 0
    return lerp(ATTACKING_SPEED, RUNNING_SPEED, progress)
}

const processBackJumpingSpeed = (action: PlayerAction) => {
    now = Date.now()
    timeElapsed = now - action.time
    progress = normalize(timeElapsed, playerConfig.actions.jump.duration, 0)
    progress = Math.pow(progress, 2)
    return lerp(JUMPING_SPEED, CHARGING_SPEED, progress)
}

const processSpeed = (
    keysState: KeysProcessedState,
    delta: number,
    actionState: PlayerActionState,
    inputsState: InputsState,
    processedState: ProcessedState,
) => {
    speed = keysState.shiftHeld ? RUNNING_SPEED : WALKING_SPEED

    if (processedState.isJumping) {
        speed = processBackJumpingSpeed(actionState.currentAction as PlayerAction)
    } else if (processedState.isBackStepping) {
        speed = processBackSteppingSpeed(actionState.currentAction as PlayerAction)
    } else if (processedState.isRolling) {
        speed = processRollingSpeed(actionState.currentAction as PlayerAction)
    } else if (actionState?.currentAction?.type === PlayerActionType.ATTACK) {
        speed = processAttackSpeed(actionState.currentAction)
    } else {
        if (!!inputsState.pendingAttack || inputsState.pendingJump) {
            speed = CHARGING_SPEED
        }
    }

    return speed * delta
}

export enum PlayerActionType {
    ATTACK = 'ATTACK',
    ROLL = 'ROLL',
    JUMP = 'JUMP',
    BACK_STEP = 'BACK_STEP',
}

export type PlayerAction = {
    type: PlayerActionType,
    time: number,
    data?: any,
}

export type PlayerActionState = {
    currentAction: PlayerAction | null,
    attackCooldown: number,
    specialMoveCooldown: number,
}

const defaultPlayerActionState: PlayerActionState = {
    currentAction: null,
    attackCooldown: 0,
    specialMoveCooldown: 0,
}

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

let targetAngle = 0
let lowAngle = 0
let highAngle = 0

const processCombatAngle = (bodyAngle: number, combatBody: Body, isAttacking: boolean, actionState: PlayerActionState, movementState: MovementState, processedState: ProcessedState) => {

    if (!isAttacking) {

        if (processedState.attackCooldown) {
            angle += movementState.lastCombatAngle
        } else if (processedState.attackCharging) {
            angle -= playerAttacksConfig[PlayerAttackType.SHORT].angleRange
        }

        combatBody.setAngle(angle)
        return
    }


    now = Date.now()
    targetAngle = angle

    timeElapsed = now - (actionState.currentAction?.time ?? 0)
    duration = getAttackDuration(actionState.currentAction?.data?.attackType ?? '')
    progress = timeElapsed / duration

    if (progress > 1) {
        progress = 1
    } else if (progress < 0) {
        progress = 0
    }

    highAngle = getAttackAngleRange(actionState.currentAction?.data?.attackType ?? '')
    lowAngle = 0 - highAngle
    targetAngle = lerpRadians(lowAngle, highAngle, progress)

    movementState.lastCombatAngle = targetAngle

    combatBody.setAngle(angle + targetAngle)

}

const processAngle = (
    movementState: MovementState,
    keysState: KeysProcessedState,
    inputsState: InputsState,
    body: Body, combatBody: Body, movementVector: Vec2,
    wantsToMove: boolean,
    isAttacking: boolean,
    actionState: PlayerActionState,
    processedState: ProcessedState,
    isSpecialMove: boolean,
    ) => {


    prevLookViaMovement = movementState.lookViaMovement
    lookViaMovement = prevLookViaMovement

    now = Date.now()

    recentlyLooked = (now - movementState.lastLooked) < 500

    previousMovementDirection = movementState.previousMovementDirection

    if ((!wantsToMove) && !isSpecialMove) {
        movementDirection = previousMovementDirection
    } else if (!isSpecialMove) {

        if (movementVector.x !== 0) {
            movementState.lastMoveX = movementVector.x
            movementState.lastMoveXTime = now
        }

        if (movementVector.y !== 0) {
            movementState.lastMoveY = movementVector.y
            movementState.lastMoveYTime = now
        }

        if (movementVector.x === 0) {
            if (((now - movementState.lastMoveXTime) < 50)) {
                movementVector.x = movementState.lastMoveX
            }
        }

        if (movementVector.y === 0) {
            if (((now - movementState.lastMoveYTime) < 50)) {
                movementVector.y = movementState.lastMoveY
            }
        }

        movementDirection = v2ToAngle(movementVector.x, movementVector.y)
        movementState.lastMoved = now

    }

    movementState.previousMovementDirection = movementDirection

    lookX = keysState.aimRightHeld ? 1 : keysState.aimLeftHeld ? -1 : 0
    lookY = keysState.aimUpHeld ? 1 : keysState.aimDownHeld ? -1 : 0

    wantsToLook = lookX !== 0 || lookY !== 0

    if (lookX !== 0) {
        movementState.lastLookX = lookX
        movementState.lastLookXTime = now
    }

    if (lookY !== 0) {
        movementState.lastLookY = lookY
        movementState.lastLookYTime = now
    }

    if (wantsToLook) {
        if (lookX === 0 && ((now - movementState.lastLookXTime) < 50)) {
            lookX = movementState.lastLookX
        } else if (lookY === 0 && ((now - movementState.lastLookYTime) < 50)) {
            lookY = movementState.lastLookY
        }
        if (isAttacking) {
            lookX = movementVector.x
            lookY = movementVector.y
        }
    }

    v2.set(lookX, lookY)
    lookDirection = v2ToAngle(v2.x, v2.y)
    previousLookDirection = movementState.previousLookDirection

    if (!wantsToLook) {
        lookDirection = previousLookDirection
    } else {
        movementState.lastLooked = now
    }

    if (wantsToLook && !isSpecialMove) {
        lookViaMovement = false
    } else {
        if ((wantsToMove && !recentlyLooked) || isSpecialMove) {
            lookViaMovement = true
        }
    }

    movementState.lookViaMovement = lookViaMovement

    if (lookViaMovement) {
        movementState.previousLookDirection = movementDirection
        angle = lerpRadians(movementDirection, previousMovementDirection, isAttacking ? 1 : 0.25)
        angle = lerpRadians(body.getAngle(), angle, isAttacking ? 0.9 : 0.33)
    } else {
        movementState.previousLookDirection = lookDirection
        angle = lerpRadians(lookDirection, previousLookDirection, isAttacking ? 1 : 0.25)
        angle = lerpRadians(body.getAngle(), angle, isAttacking ? 0.9 : 0.33)
    }

    body.setAngle(angle)

    processCombatAngle(angle, combatBody, isAttacking, actionState, movementState, processedState)

}

let hasPendingAttack = false
let isAttacking = false
let isRunning = false
let isSpecialMove = false

const processRollingMovement = (v2: Vec2, action: PlayerAction) => {
    v2.set(lerp(v2.x, action.data.moveX, 0.9), lerp(v2.y, action.data.moveY, 0.9))
    return v2
}

const processBackSteppingMovement = (v2: Vec2, action: PlayerAction) => {
    angleToV2(action.data.angle, v2)
    return v2
}

const processMovement = (
    movementState: MovementState,
    actionState: PlayerActionState,
    processedState: ProcessedState,
    keysState: KeysProcessedState,
    inputsState: InputsState,
    energyState: EnergyState,
    body: Body,
    combatBody: Body,
    delta: number) => {


    moveX = keysState.moveRightHeld ? 1 : keysState.moveLeftHeld ? -1 : 0
    moveY = keysState.moveUpHeld ? 1 : keysState.moveDownHeld ? -1 : 0

    isAttacking = (actionState?.currentAction?.type === PlayerActionType.ATTACK)

    wantsToMove = (moveX !== 0 || moveY !== 0) && !isAttacking

    isSpecialMove = (processedState.isJumping || processedState.isRolling || processedState.isBackStepping)

    isRunning = wantsToMove && processedState.canRun && keysState.shiftHeld

    processedState.isRunning = isRunning

    speed = processSpeed(keysState, delta, actionState, inputsState, processedState)

    if (actionState?.currentAction?.type === PlayerActionType.ATTACK) {
        v2.set(actionState?.currentAction.data.attackX, actionState?.currentAction.data.attackY)
        v2.normalize()
        movementVector.set(v2)
        v2.mul(speed)
        body.applyLinearImpulse(v2, plainV2)
    } else if ((wantsToMove && processedState.canMove) || isSpecialMove) {
        v2.set(moveX, moveY)
        v2.normalize()

        if (processedState.isRolling) {
            processRollingMovement(v2, actionState.currentAction as PlayerAction)
        } else if (processedState.isBackStepping) {
            processBackSteppingMovement(v2, actionState.currentAction as PlayerAction)
        }

        movementVector.set(v2)
        v2.mul(speed)
        body.applyLinearImpulse(v2, plainV2)

        if (isRunning) {
            energyState.newUsage += playerConfig.actions.run.energyUsage * delta
        }

    }

    processAngle(movementState, keysState, inputsState, body, combatBody, movementVector, wantsToMove, isAttacking, actionState, processedState, isSpecialMove)

    combatBody.setPosition(body.getPosition())

}

let currentEnergyUsage = 0
let newEnergyUsage = 0

export type EnergyState = {
    currentUsage: number,
    newUsage: number,
}

const defaultEnergyState: EnergyState = {
    currentUsage: 0,
    newUsage: 0,
}

const handleIsInvincibleDuringRoll = (action: PlayerAction) => {

    now = Date.now()
    timeElapsed = now - action.time
    progress = normalize(timeElapsed, playerConfig.actions.roll.duration, 0)

    if (progress >= 0.1 && progress <= 0.7) {
        return true
    }

    return false
}

const isInvincible = (actionState: PlayerActionState) => {

    if (actionState.currentAction?.type === PlayerActionType.ROLL) {
        if (handleIsInvincibleDuringRoll(actionState.currentAction as PlayerAction)) {
            return true
        }
    }

    return false
}

export const PlayerController: React.FC = () => {

    const localStateRef = useRef({
        keysState: {...defaultKeysState},
        processedState: {...defaultProcessedState},
        prevKeys: {...defaultKeys},
        inputsState: {...defaultInputsState},
        movementState: {...defaultMovementState},
        actionState: {...defaultPlayerActionState},
        energyState: {...defaultEnergyState},
    })

    const {
        body,
        combatBody,
        energyUsage,
        increaseEnergyUsage,
        setMovementState,
        increasePlayerDamage,
    } = usePlayerContext()

    const [currentAttack, setCurrentAttack] = useState(null as null | AttackData)

    const energyUsageRef = useEffectRef(energyUsage)

    const isKeyPressed = useIsKeyPressed()

    useOnPhysicsUpdate(useCallback((delta) => {

        const keysState = localStateRef.current.keysState
        const prevKeys = localStateRef.current.prevKeys
        const processedState = localStateRef.current.processedState
        const inputsState = localStateRef.current.inputsState
        const movementState = localStateRef.current.movementState
        const actionState = localStateRef.current.actionState
        const energyState = localStateRef.current.energyState

        energyState.newUsage = 0
        energyState.currentUsage = energyUsageRef.current

        processKeys(keysState, prevKeys, isKeyPressed)
        processInputs(keysState, inputsState, energyState)
        processAction(actionState, setCurrentAttack)
        processState(processedState, actionState, inputsState)
        processInputsQueue(inputsState, processedState, actionState, energyState, keysState, body, setCurrentAttack)
        processState(processedState, actionState, inputsState) // process again...
        processMovement(movementState, actionState, processedState, keysState, inputsState, energyState, body, combatBody, delta)

        if (energyState.newUsage > 0) {
            increaseEnergyUsage(energyState.newUsage)
        }

        if (processedState.isAttacking) {
            setMovementState(PlayerMovementState.ATTACKING)
        } else if (processedState.isJumping) {
            setMovementState(PlayerMovementState.JUMPING)
        } else if (processedState.isBackStepping) {
            setMovementState(PlayerMovementState.BACK_STEPPING)
        } else if (processedState.isRolling) {
            setMovementState(PlayerMovementState.ROLLING)
        } else if (inputsState.pendingJump) {
            setMovementState(PlayerMovementState.PENDING_JUMP)
        } else if (inputsState.pendingAttack) {
            setMovementState(PlayerMovementState.PENDING_ATTACK)
        } else if (processedState.isRunning) {
            setMovementState(PlayerMovementState.RUNNING)
        } else if (!processedState.canMove) {
            setMovementState(PlayerMovementState.COOLDOWN)
        } else {
            setMovementState('')
        }

    }, []))

    const onDamageReceived = useCallback((damage: number, from: Vec2) => {

        if (isInvincible(localStateRef.current.actionState)) {
            return
        }

        increasePlayerDamage(damage)

        v2.set(body.getPosition())
        v2.sub(from)
        v2.normalize()
        v2.mul(2)
        body.applyLinearImpulse(v2, plainV2)

    }, [])

    useOnPlayerEvents('', useCallback((event) => {
        switch (event.type) {
            case PlayerEventType.DAMAGED:
                onDamageReceived(event.data.damage, event.data.currentPosition)
                break;
        }
    }, []))

    useAttackHandler(currentAttack)

    return null
}
