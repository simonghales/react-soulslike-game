import React, {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {useIsKeyPressed, useOnPhysicsUpdate, useSendCustomMessage} from "@simonghales/react-three-physics";
import {defaultKeys, defaultKeysState, KEY_BINDINGS, KeysProcessedState, KeysState} from "../keys";
import {usePlayerContext} from "../PlayerContext";
import {Body, Vec2} from "planck";
import {angleToV2, lerpRadians, v2ToAngle} from "../../../utils/angles";
import {
    getAttackAngleRange,
    getAttackDuration,
    getAttackDurationAndCooldown,
    getAttackEnergyUsage,
    getAttackInputExpiration,
    playerAttacksConfig,
    PlayerAttackType,
    playerConfig
} from "../config";
import {degToRad, lerp} from "three/src/math/MathUtils";
import {useEffectRef} from "../../../utils/hooks";
import {normalize} from "../../../utils/numbers";
import {PlayerFixtures, PlayerMovementState} from "../types";
import {PlayerEventType, useOnPlayerEvents} from "../../events/player";
import {AttackData, useAttackHandler} from "./attackHandler";
import {updateRollingFixtures} from "./rolling";
import {SelectedTarget, SelectedTargetWithBody, useTargetControls} from "./targetHandler";
import {defaultMovementState, defaultPlayerState, MovementState, PlayerState} from "./types";
import {easeInOutBack, easeInOutQuad, easeInOutQuint, easeOutQuart} from "../../../utils/easing";
import {getMobEventsKey, messageKeys, PLAYER_EVENTS_KEY} from "../../data/keys";
import {MobEventType} from "../../mobs/brain/events";
import {useInteractionHandler} from "./interactionHandler";
import {emitInteractionBegan, emitInteractionEnded, emitInteractionInterrupted} from "../../events/interaction";
import {RollingHandler} from "./RollingHandler";
import {HatchData} from "../../state/backend/scene";
import {HatchConfig} from "../../scene/assets/niche/LgHatch";

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
const CONSTANT_ROLLING_SPEED = RUNNING_SPEED * 1.1
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
    isConstantRolling: boolean,
    isJumping: boolean,
    isBackStepping: boolean,
    isRunning: boolean,
    isAttacking: boolean,
    isStunned: boolean,
    isInteracting: boolean,
}

const defaultProcessedState: ProcessedState = {
    attackCooldown: false,
    attackCharging: false,
    canMove: false,
    canAttack: false,
    canSpecialMove: false,
    canRun: false,
    isRolling: false,
    isConstantRolling: false,
    isJumping: false,
    isBackStepping: false,
    isRunning: false,
    isAttacking: false,
    isStunned: false,
    isInteracting: false,
}

export enum QueuedInputType {
    ATTACK = 'ATTACK',
    ROLL = 'ROLL',
    CONSTANT_ROLL = 'CONSTANT_ROLL',
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
    pendingTarget: number,
    interactionId: string,
    interactionBegan: number,
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
    pendingTarget: 0,
    interactionId: '',
    interactionBegan: 0,
}

const PENDING_JUMP_THRESHOLD = 150
const JUMP_THRESHOLD = PENDING_JUMP_THRESHOLD + 100

const handleSpaceInput = (
    inputsState: InputsState,
    energyState: EnergyState,
    previousStateData: PreviousStateData,
    ) => {

    now = performance.now()

    timeElapsed = performance.now() - inputsState.spacePressed

    if (timeElapsed < JUMP_THRESHOLD) {
        if (previousStateData.isRolling) {
            inputsState.queue.length = 0
            inputsState.queue.push({
                time: now,
                type: QueuedInputType.CONSTANT_ROLL,
            })
        } else {
            inputsState.queue.push({
                time: now,
                type: QueuedInputType.ROLL,
            })
        }
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

    timeElapsed = performance.now() - inputsState.spacePressed

    inputsState.pendingJump = timeElapsed > PENDING_JUMP_THRESHOLD

}

let lookHorizontalHeld = false
let lookVerticalHeld = false
let lookPressed = false

const handleAttackInputs = (keysState: KeysProcessedState, inputsState: InputsState, energyState: EnergyState) => {

    now = performance.now()

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

const handleTargetInput = (
    keysState: KeysProcessedState,
    inputsState: InputsState,
    playerState: PlayerState,
    controllerActions: ControllerActions,
) => {

    if (keysState.targetPressed) {

        if (!playerState.inTargetMode) {
            if (controllerActions.enterTargetMode()) {
                playerState.inTargetMode = true
            }
        } else {
            controllerActions.selectNewTarget()
        }

        // set target key held

    } else if (keysState.targetReleased) {

        // set target key released

    }

    if (keysState.targetUnlockReleased) {

        if (playerState.inTargetMode) {
            playerState.inTargetMode = false
            controllerActions.exitTargetMode()
        }

    }

}

const handleInteractInput = (
    keysState: KeysProcessedState,
    inputsState: InputsState,
    playerState: PlayerState,
    controllerActions: ControllerActions,
) => {

    if (keysState.interactPressed) {

        if (!playerState.targetItem) {
            return
        }

        inputsState.interactionId = playerState.targetItem
        inputsState.interactionBegan = performance.now()

    } else if (keysState.interactReleased) {

        if (!inputsState.interactionId) return

        if (playerState.currentInteractionId) {
            controllerActions.onInteractEnd(playerState.currentInteractionId)
            playerState.currentInteractionId = ''
        }

        inputsState.interactionId = ''
        inputsState.interactionBegan = 0


    }

}

const processInputs = (
    keysState: KeysProcessedState,
    inputsState: InputsState,
    energyState: EnergyState,
    playerState: PlayerState,
    controllerActions: ControllerActions,
    previousStateData: PreviousStateData,
) => {

    now = performance.now()

    if (keysState.spacePressed) {
        inputsState.spacePressed = now
    }

    if (keysState.spaceReleased) {
        handleSpaceInput(inputsState, energyState, previousStateData)
    } else if (keysState.spaceHeld) {
        handleSpaceHeld(inputsState, energyState)
    } else {
        inputsState.pendingJump = false
    }

    handleTargetInput(keysState, inputsState, playerState, controllerActions)

    handleAttackInputs(keysState, inputsState, energyState)

    handleInteractInput(keysState, inputsState, playerState, controllerActions)

    excess = inputsState.queue.length - INPUT_QUEUE_LIMIT

    if (excess > 0) {
        inputsState.queue.splice(0, excess)
    }

}

const getTimeElapsed = (queuedInput: QueuedInput) => {
    return performance.now() - queuedInput.time
}

const checkHasExpired = (queuedInput: QueuedInput, maxAge: number) => {
    timeElapsed = performance.now() - queuedInput.time
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
        return false
    }

    if (!processedState.canMove || !processedState.canSpecialMove) {
        return false
    }

    energyState.newUsage += playerConfig.actions.jump.energyUsage

    actionState.currentAction = {
        type: PlayerActionType.JUMP,
        time: performance.now(),
    }

    actionState.specialMoveCooldown = performance.now() + playerConfig.actions.jump.duration + playerConfig.actions.jump.cooldown

    return true
}

const processConstantRollInput = (
    queuedInput: QueuedInput,
    processedState: ProcessedState,
    actionState: PlayerActionState,
    keysState: KeysProcessedState,
    energyState: EnergyState,
) => {

    if (actionState.currentAction?.type !== PlayerActionType.ROLL) {
        return true
    }

    moveX = keysState.moveRightHeld ? 1 : keysState.moveLeftHeld ? -1 : 0
    moveY = keysState.moveUpHeld ? 1 : keysState.moveDownHeld ? -1 : 0

    wantsToMove = moveX !== 0 || moveY !== 0

    if (!wantsToMove) {
        moveX = actionState.currentAction.data.moveX
        moveY = actionState.currentAction.data.moveY
    }

    v2.set(moveX, moveY)
    v2.normalize()

    energyState.newUsage += 1000

    actionState.currentAction = {
        type: PlayerActionType.CONSTANT_ROLL,
        time: performance.now(),
        data: {
            moveX: v2.x,
            moveY: v2.y,
        }
    }

    console.log('now constant roll...')

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
            time: performance.now(),
            data: {
                moveX: v2.x,
                moveY: v2.y,
            }
        }

        actionState.specialMoveCooldown = performance.now() + playerConfig.actions.roll.duration + playerConfig.actions.roll.cooldown

    } else {

        angle = body.getAngle() - degToRad(180)

        energyState.newUsage += playerConfig.actions.backStep.energyUsage

        actionState.currentAction = {
            type: PlayerActionType.BACK_STEP,
            time: performance.now(),
            data: {
                angle,
            }
        }

        actionState.specialMoveCooldown = performance.now() + playerConfig.actions.backStep.duration + playerConfig.actions.backStep.cooldown

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
    selectedTarget: SelectedTarget,
    body: Body,
) => {

    if (checkHasExpired(queuedInput, getAttackInputExpiration(queuedInput.data.attackType))) {
        return true
    }

    if (!hasEnergyRemaining(energyState)) {
        return false
    }

    if (!processedState.canMove || !processedState.canAttack) {
        return false
    }

    energyState.newUsage += getAttackEnergyUsage(queuedInput.data.attackType)

    actionState.currentAction = {
        type: PlayerActionType.ATTACK,
        time: performance.now(),
        data: queuedInput.data,
    }

    if (selectedTarget) {
        calculateTargetVector(v2, body, selectedTarget)
        actionState.currentAction.data.attackX = v2.x
        actionState.currentAction.data.attackY = v2.y
    }

    setCurrentAttack({
        time: performance.now(),
        type: queuedInput.data.attackType,
    })

    actionState.attackCooldown = performance.now() + getAttackDurationAndCooldown(queuedInput.data.attackType)

    return true
}

const processInputsQueue = (
    inputsState: InputsState,
    processedState: ProcessedState,
    actionState: PlayerActionState,
    energyState: EnergyState,
    keysState: KeysProcessedState,
    playerState: PlayerState,
    body: Body,
    setCurrentAttack: any,
    selectedTarget: SelectedTarget,
    controllerActions: ControllerActions,
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
                shouldDelete = processAttackInput(queuedInput, inputsState, processedState, actionState, energyState, setCurrentAttack, selectedTarget, body)
                break;
            case QueuedInputType.CONSTANT_ROLL:
                shouldDelete = processConstantRollInput(queuedInput, processedState, actionState, keysState, energyState)
                break;
        }
        if (shouldDelete) {
            queue.splice(index, 1)
        }
    })

    if (inputsState.interactionBegan) {
        if (!playerState.currentInteractionId && !playerState.currentlyCarvingId) {
            playerState.currentInteractionId = playerState.targetItem
            controllerActions.onInteractBegin(playerState.targetItem)
            inputsState.interactionBegan = 0
        }
    }

}

const processActionAttack = (action: PlayerAction, actionState: PlayerActionState, setCurrentAttack: any) => {

    now = performance.now()
    timeElapsed = now - action.time

    if (timeElapsed > getAttackDuration(action.data.attackType)) {
        actionState.currentAction = null
        setCurrentAttack(null)
    }

}

const processActionRoll = (action: PlayerAction, actionState: PlayerActionState, fixtures: PlayerFixtures) => {

    now = performance.now()
    timeElapsed = now - action.time

    if (timeElapsed > playerConfig.actions.roll.duration) {
        actionState.currentAction = null

        fixtures.default.setSensor(false)
        fixtures.medium.setSensor(false)
        fixtures.small.setSensor(false)

    } else {
        updateRollingFixtures(fixtures, normalize(timeElapsed, playerConfig.actions.roll.duration, 0))
    }

}

const processActionBackStep = (action: PlayerAction, actionState: PlayerActionState) => {

    now = performance.now()
    timeElapsed = now - action.time

    if (timeElapsed > playerConfig.actions.backStep.duration) {
        actionState.currentAction = null
    }

}

const processActionJump = (action: PlayerAction, actionState: PlayerActionState) => {

    now = performance.now()
    timeElapsed = now - action.time

    if (timeElapsed > playerConfig.actions.roll.duration) {
        actionState.currentAction = null
    }

}

const processActionConstantRoll = (
    action: PlayerAction,
    actionState: PlayerActionState,
    inputsState: InputsState,
    keysState: KeysProcessedState,
    playerState: PlayerState,
    delta: number,
) => {


    moveX = keysState.moveRightHeld ? 1 : keysState.moveLeftHeld ? -1 : 0
    moveY = keysState.moveUpHeld ? 1 : keysState.moveDownHeld ? -1 : 0

    wantsToMove = moveX !== 0 || moveY !== 0

    if (!wantsToMove) {
        playerState.stopRollingWeight += 5 * delta
        if (playerState.stopRollingWeight >= 100) {
            now = performance.now()
            actionState.specialMoveCooldown = now + 500
            actionState.currentAction = null
        }
    } else {
        playerState.stopRollingWeight -= 30 * delta
        if (playerState.stopRollingWeight < 0) {
            playerState.stopRollingWeight = 0
        }
    }

}

const processAction = (
    actionState: PlayerActionState,
    setCurrentAttack: any,
    fixtures: PlayerFixtures,
    inputsState: InputsState,
    keysState: KeysProcessedState,
    playerState: PlayerState,
    delta: number,
) => {

    if (!actionState.currentAction) {
        return
    }

    switch (actionState.currentAction.type) {
        case PlayerActionType.ATTACK:
            processActionAttack(actionState.currentAction, actionState, setCurrentAttack)
            break;
        case PlayerActionType.ROLL:
            processActionRoll(actionState.currentAction, actionState, fixtures)
            break;
        case PlayerActionType.BACK_STEP:
            processActionBackStep(actionState.currentAction, actionState)
            break;
        case PlayerActionType.JUMP:
            processActionJump(actionState.currentAction, actionState)
            break;
        case PlayerActionType.CONSTANT_ROLL:
            processActionConstantRoll(actionState.currentAction, actionState, inputsState, keysState, playerState, delta)
            break;
    }

}

let hasCurrentAction = false
let isInAttackCooldown = false
let isInSpecialMoveCooldown = false
let isInCooldown = false
let isStunned = false
let isInteracting = false
let canMove = false
let prevIsRolling = false

const processState = (
    initialProcess: boolean,
    processedState: ProcessedState,
    actionState: PlayerActionState,
    inputsState: InputsState,
    playerState: PlayerState,
) => {

    now = performance.now()

    isStunned = false

    if (playerState.stunnedCooldown) {
        if (now < playerState.stunnedCooldown) {
            isStunned = true
        } else {
            playerState.stunnedCooldown = 0
        }
    }

    isInteracting = false

    if (playerState.currentInteractionId || playerState.currentlyCarvingId) {
        isInteracting = true
    }

    processedState.isInteracting = isInteracting

    processedState.isStunned = isStunned

    hasCurrentAction = !!actionState.currentAction

    isInAttackCooldown = now < actionState.attackCooldown
    isInSpecialMoveCooldown = now < actionState.specialMoveCooldown

    isInCooldown = isInAttackCooldown || isInSpecialMoveCooldown || isStunned

    processedState.canMove = !isInAttackCooldown && !isStunned && !isInteracting
    processedState.canAttack = !hasCurrentAction && !isInCooldown && !isInteracting
    processedState.canSpecialMove = !hasCurrentAction && !isInCooldown && !isInteracting
    processedState.attackCooldown = isInAttackCooldown
    processedState.attackCharging = (!!inputsState.pendingAttack) && !hasCurrentAction
    processedState.canRun = processedState.canMove && !hasCurrentAction && !isInCooldown && !inputsState.pendingJump && !inputsState.pendingAttack

    processedState.isRolling = actionState?.currentAction?.type === PlayerActionType.ROLL
    processedState.isConstantRolling = actionState?.currentAction?.type === PlayerActionType.CONSTANT_ROLL

    processedState.isJumping = actionState?.currentAction?.type === PlayerActionType.JUMP
    processedState.isBackStepping = actionState?.currentAction?.type === PlayerActionType.BACK_STEP
    processedState.isAttacking = actionState?.currentAction?.type === PlayerActionType.ATTACK

}

let from = 0
let to = 0

const processAttackSpeed = (action: PlayerAction) => {
    now = performance.now()
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
    now = performance.now()
    timeElapsed = now - action.time
    progress = normalize(timeElapsed, playerConfig.actions.roll.duration, 0)
    return lerp(RUNNING_SPEED, CHARGING_SPEED, progress)
}

const processConstantRollingSpeed = (action: PlayerAction) => {
    return CONSTANT_ROLLING_SPEED
}

const processBackSteppingSpeed = (action: PlayerAction) => {
    now = performance.now()
    timeElapsed = now - action.time
    progress = normalize(timeElapsed, playerConfig.actions.backStep.duration, 50)
    if (progress <= 0) return 0
    return lerp(ATTACKING_SPEED, RUNNING_SPEED, progress)
}

const processBackJumpingSpeed = (action: PlayerAction) => {
    now = performance.now()
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
    } else if (processedState.isConstantRolling) {
        speed = processConstantRollingSpeed(actionState.currentAction as PlayerAction)
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
    CONSTANT_ROLL = 'CONSTANT_ROLL',
    JUMP = 'JUMP',
    BACK_STEP = 'BACK_STEP',
    CLIMBING_LADDER = 'CLIMBING_LADDER',
    ENTER_LADDER = 'ENTER_LADDER',
    FALLING = 'FALLING',
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


    now = performance.now()
    targetAngle = angle

    timeElapsed = now - (actionState.currentAction?.time ?? 0)
    duration = getAttackDuration(actionState.currentAction?.data?.attackType ?? '')
    progress = timeElapsed / duration

    if (progress > 1) {
        progress = 1
    } else if (progress < 0) {
        progress = 0
    }

    progress = easeInOutQuad(progress)

    highAngle = getAttackAngleRange(actionState.currentAction?.data?.attackType ?? '')
    lowAngle = 0 - highAngle
    targetAngle = lerpRadians(lowAngle, highAngle, progress)

    movementState.lastCombatAngle = targetAngle

    combatBody.setAngle(angle + targetAngle)

}

const angleV2 = new Vec2()

const calculateTargetVector = (vector: Vec2, body: Body, selectedTarget: SelectedTargetWithBody) => {
    vector.set(selectedTarget.body.getPosition())
    vector.sub(body.getPosition())
    return vector.normalize()
}

const calculateTargetAngle = (body: Body, selectedTarget: SelectedTargetWithBody) => {
    calculateTargetVector(angleV2, body, selectedTarget)
    return v2ToAngle(angleV2.x, angleV2.y)
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
    selectedTarget: SelectedTarget,
    ) => {

    prevLookViaMovement = movementState.lookViaMovement
    lookViaMovement = prevLookViaMovement

    now = performance.now()

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

    if (!isAttacking && selectedTarget) {
        angle = calculateTargetAngle(body, selectedTarget)
        movementState.previousLookDirection = angle
    } else if (lookViaMovement) {
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
const spareV2 = new Vec2()

const processConstantRollingMovement = (body: Body, v2: Vec2, action: PlayerAction) => {
    v2.set(lerp(action.data.moveX, v2.x, 0.2), lerp(action.data.moveY, v2.y, 0.2))
    v2.normalize()
    action.data.moveX = v2.x
    action.data.moveY = v2.y
    spareV2.set(body.getLinearVelocity())
    spareV2.normalize()
    v2.set(lerp(v2.x, spareV2.x, 0.2), lerp(v2.y, spareV2.y, 0.2))
    v2.normalize()
    return v2
}

const processRollingMovement = (v2: Vec2, action: PlayerAction) => {
    v2.set(lerp(v2.x, action.data.moveX, 0.9), lerp(v2.y, action.data.moveY, 0.9))
    return v2
}

const processBackSteppingMovement = (v2: Vec2, action: PlayerAction) => {
    angleToV2(action.data.angle, v2)
    return v2
}

export type PreviousStateData = {
    isRolling: boolean,
    isConstantRolling: boolean,
}

const defaultPreviousStateData: PreviousStateData = {
    isRolling: false,
    isConstantRolling: false,
}

let isRolling = false
let isConstantRolling = false
let prevIsConstantRolling = false

const processSyncState = (
    processedState: ProcessedState,
    previousStateData: PreviousStateData,
    setPlayerRolling: (rolling: boolean) => void,
    setPlayerConstantRolling: (rolling: boolean) => void,
) => {
    prevIsRolling = previousStateData.isRolling
    isRolling = processedState.isRolling
    if (prevIsRolling && !isRolling) {
        setPlayerRolling(false)
    } else if (!prevIsRolling && isRolling) {
        setPlayerRolling(true)
    }
    previousStateData.isRolling = isRolling

    prevIsConstantRolling = previousStateData.isConstantRolling
    isConstantRolling = processedState.isConstantRolling

    if (prevIsConstantRolling && !isConstantRolling) {
        setPlayerConstantRolling(false)
    } else if (!prevIsConstantRolling && isConstantRolling) {
        setPlayerConstantRolling(true)
    }
    previousStateData.isConstantRolling = isConstantRolling

}

let movementAmount = 0
let distanceToMove = 0
let remainingHeight = 0

const processFalling = (action: PlayerAction, body: Body, delta: number, controllerActions: ControllerActions) => {
    distanceToMove = 0.2 * delta
    remainingHeight = action.data.height - distanceToMove
    if (remainingHeight <= 0) {
        controllerActions.stopFalling()
    } else {
        action.data.height = remainingHeight
    }
    v2.set(body.getPosition().x, body.getPosition().y - distanceToMove * 0.5)
    body.setPosition(v2)
}

const processEnterLadder = (actionState: PlayerActionState, body: Body, delta: number) => {
    v2.set((actionState.currentAction as any).data.position[0], (actionState.currentAction as any).data.position[1])
    v2.sub(body.getPosition())
    if (v2.lengthSquared() > 1) {
        v2.normalize()
    }
    if (v2.lengthSquared() <= 0.1) {
        v2.set((actionState.currentAction as any).data.position[0], (actionState.currentAction as any).data.position[1])
        body.setPosition(v2);
        (actionState.currentAction as any).type = PlayerActionType.CLIMBING_LADDER
        return
    }
    v2.mul(0.125 * delta)
    v2.add(body.getPosition())
    body.setPosition(v2)
}

let threshold = 0
let triggerThreshold = 0

const processLadderMovement = (action: PlayerAction, moveX: number, moveY: number, delta: number, controllerActions: ControllerActions) => {
    if (moveY !== 0) {
        movementAmount = moveY * 0.025 * delta

        action.data.yPosition += movementAmount

        if (action.data.hatchData.noReturnDistance && action.data.direction === -1) {
            threshold = action.data.position[1] - action.data.hatchData.noReturnDistance
            triggerThreshold = action.data.position[1] - action.data.hatchData.triggerThreshold
            if (moveY === 1 && action.data.passedThreshold) {
                if (action.data.yPosition > threshold) {
                    action.data.yPosition = threshold
                }
            } else if (moveY === -1) {
                if (action.data.yPosition < triggerThreshold) {
                    action.data.passedThreshold = true
                }
            }
        }

        if (action.data.direction === 1) {
            if (action.data.yPosition > action.data.destination.position[1]) {
                controllerActions.exitLadder()
                return
            } else if (action.data.yPosition < action.data.position[1]) {
                controllerActions.exitLadder()
                return
            }
        } else {
            if (action.data.yPosition > action.data.position[1]) {
                controllerActions.exitLadder()
                return
            } else if (action.data.yPosition < action.data.destination.position[1]) {
                controllerActions.exitLadder()
                return
            }
        }
    }
    if (moveX !== 0) {
        if (action.data.direction === 1) {
            if (action.data.yPosition > action.data.destination.position[1] - 0.25) {
                controllerActions.exitLadder()
                return
            } else if (action.data.yPosition < action.data.position[1] + 0.25) {
                controllerActions.exitLadder()
                return
            }
        } else {
            if (action.data.yPosition > action.data.position[1] - 0.25) {
                controllerActions.exitLadder()
                return
            } else if (action.data.yPosition < action.data.destination.position[1] + 0.25) {
                controllerActions.exitLadder()
                return
            }
        }
    }
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
    delta: number,
    selectedTarget: SelectedTarget,
    controllerActions: ControllerActions,
) => {


    moveX = keysState.moveRightHeld ? 1 : keysState.moveLeftHeld ? -1 : 0
    moveY = keysState.moveUpHeld ? 1 : keysState.moveDownHeld ? -1 : 0

    isAttacking = (actionState?.currentAction?.type === PlayerActionType.ATTACK)

    wantsToMove = (moveX !== 0 || moveY !== 0) && !isAttacking

    isSpecialMove = (processedState.isJumping || processedState.isRolling || processedState.isBackStepping)

    isRunning = wantsToMove && processedState.canRun && keysState.shiftHeld

    processedState.isRunning = isRunning

    speed = processSpeed(keysState, delta, actionState, inputsState, processedState)

    if (actionState?.currentAction?.type === PlayerActionType.FALLING) {
        processFalling(actionState.currentAction, body, delta, controllerActions)
    } else if (actionState?.currentAction?.type === PlayerActionType.ENTER_LADDER) {
        processEnterLadder(actionState, body, delta)
    } else if (actionState?.currentAction?.type === PlayerActionType.CLIMBING_LADDER) {
        processLadderMovement(actionState.currentAction, moveX, moveY, delta, controllerActions)
    } else if (actionState?.currentAction?.type === PlayerActionType.ATTACK) {
        v2.set(actionState?.currentAction.data.attackX, actionState?.currentAction.data.attackY)
        v2.normalize()
        movementVector.set(v2)
        v2.mul(speed)
        body.applyLinearImpulse(v2, plainV2)
    } else if ((wantsToMove && processedState.canMove) || isSpecialMove) {
        v2.set(moveX, moveY)
        v2.normalize()

        if (processedState.isConstantRolling) {
            processConstantRollingMovement(body, v2, actionState.currentAction as PlayerAction)
        } else if (processedState.isRolling) {
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

    processAngle(
        movementState,
        keysState,
        inputsState,
        body,
        combatBody,
        movementVector,
        wantsToMove,
        isAttacking,
        actionState,
        processedState,
        isSpecialMove,
        selectedTarget,
    )

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

    now = performance.now()
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

export type ControllerActions = {
    enterTargetMode: () => boolean,
    selectNewTarget: () => void,
    exitTargetMode: () => void,
    onInteractBegin: (id: string) => void,
    onInteractEnd: (id: string) => void,
    onCarvingBegin: (id: string, time: number) => void,
    onCarvingEnd: (id: string, time: number) => void,
    enterLadder: (id: string, position: [number, number], destination: HatchData, direction: number, height: number, hatchData: HatchConfig) => void,
    exitLadder: () => void,
    stopFalling: () => void,
}

let xPos = 0
let yPos = 0
let currentlyAtRest = false

export const PlayerController: React.FC = () => {

    const localStateRef = useRef({
        keysState: {...defaultKeysState},
        processedState: {...defaultProcessedState},
        prevKeys: {...defaultKeys},
        inputsState: {...defaultInputsState},
        movementState: {...defaultMovementState},
        actionState: {...defaultPlayerActionState},
        energyState: {...defaultEnergyState},
        playerState: {...defaultPlayerState},
        previousStateData: {...defaultPreviousStateData},
    })

    const keysState = localStateRef.current.keysState
    const prevKeys = localStateRef.current.prevKeys
    const processedState = localStateRef.current.processedState
    const inputsState = localStateRef.current.inputsState
    const movementState = localStateRef.current.movementState
    const actionState = localStateRef.current.actionState
    const energyState = localStateRef.current.energyState
    const playerState = localStateRef.current.playerState
    const previousStateData = localStateRef.current.previousStateData

    const [playerRolling, setPlayerRolling] = useState(false)
    const [playerConstantRolling, setPlayerConstantRolling] = useState(false)

    const {
        body,
        combatBody,
        energyUsage,
        increaseEnergyUsage,
        setMovementState,
        increasePlayerDamage,
        fixtures,
    } = usePlayerContext()

    const [currentAttack, setCurrentAttack] = useState(null as null | AttackData)

    const energyUsageRef = useEffectRef(energyUsage)

    const isKeyPressed = useIsKeyPressed()

    const {
        controls: targetControls,
        selectedTargetRef,
        isInTargetMode,
        setIsInTargetMode,
    } = useTargetControls(movementState, keysState, playerState)

    const [atRest, setAtRest] = useState(false)

    const [canInteract, setCanInteract] = useState(true)

    const targetItem = useInteractionHandler(body, atRest, canInteract)

    useEffect(() => {
        localStateRef.current.playerState.targetItem = targetItem
    }, [targetItem])

    useEffect(() => {
        localStateRef.current.playerState.inTargetMode = isInTargetMode
    }, [isInTargetMode])

    const [climbingLadder, setClimbingLadder] = useState(false)

    const controllerActions = useMemo<ControllerActions>(() => {

        const setFalling = (height: number) => {
            actionState.currentAction = {
                type: PlayerActionType.FALLING,
                time: Date.now(),
                data: {
                    height,
                },
            }
        }

        return {
            enterTargetMode: () => {
                const target = targetControls.selectIdealTarget()
                if (target) {
                    setIsInTargetMode(true)
                    return true
                } else {
                    setIsInTargetMode(false)
                    return false
                }
            },
            selectNewTarget: () => {
                const target = targetControls.selectIdealTarget()
                if (!target) {
                    setIsInTargetMode(false)
                    localStateRef.current.playerState.inTargetMode = false
                }
            },
            exitTargetMode: () => {
                setIsInTargetMode(false)
                targetControls.clearTarget()
            },
            onInteractBegin: (id: string) => {
                emitInteractionBegan(id)
            },
            onInteractEnd: (id: string) => {
                emitInteractionEnded(id)
            },
            onCarvingBegin: (id: string, time: number) => {
                localStateRef.current.playerState.currentlyCarvingId = id
                setCanInteract(false)
            },
            onCarvingEnd: (id: string, time: number) => {
                localStateRef.current.playerState.currentInteractionId = ''
                localStateRef.current.playerState.currentlyCarvingId = ''
                setCanInteract(true)
            },
            enterLadder: (id: string, position: [number, number], destination: HatchData, direction: number, height: number, hatchData: HatchConfig) => {
                actionState.currentAction = null
                inputsState.queue.length = 0
                // v2.set(position[0], position[1])
                // body.setPosition(v2)
                actionState.currentAction = {
                    type: PlayerActionType.ENTER_LADDER,
                    time: performance.now(),
                    data: {
                        position,
                        destination,
                        direction,
                        height,
                        hatchData,
                        yPosition: position[1],
                    }
                }
                setClimbingLadder(true)
            },
            exitLadder: () => {
                const action = actionState.currentAction
                actionState.currentAction = null
                inputsState.queue.length = 0
                setClimbingLadder(false)
                if (action?.data?.direction === 1) {
                    if (action?.data?.yPosition <= action?.data?.position[1]) {
                        if (action?.data?.height) {
                            setFalling(action?.data?.height)
                        }
                    }
                } else {
                    if (action?.data?.yPosition <= action?.data?.destination.position[1]) {
                        if (action?.data?.destination.height) {
                            setFalling(action?.data?.destination.height)
                        }
                    }
                }
            },
            stopFalling: () => {
                actionState.currentAction = null
                inputsState.queue.length = 0
            }
        }
    }, [targetControls])

    useEffect(() => {
        body.setActive(!climbingLadder)
    }, [climbingLadder])

    useOnPhysicsUpdate(useCallback((delta) => {

        energyState.newUsage = 0
        energyState.currentUsage = energyUsageRef.current

        const selectedTarget = selectedTargetRef.current

        processKeys(keysState, prevKeys, isKeyPressed)
        processInputs(keysState, inputsState, energyState, playerState, controllerActions, previousStateData)
        processAction(actionState, setCurrentAttack, fixtures, inputsState, keysState, playerState, delta)
        processState(true, processedState, actionState, inputsState, playerState)
        processInputsQueue(inputsState, processedState, actionState, energyState, keysState, playerState, body, setCurrentAttack, selectedTarget, controllerActions)
        processState(false, processedState, actionState, inputsState, playerState) // process again...
        processMovement(
            movementState,
            actionState,
            processedState,
            keysState,
            inputsState,
            energyState,
            body,
            combatBody,
            delta,
            selectedTarget,
            controllerActions,
        )
        processSyncState(processedState, previousStateData, setPlayerRolling, setPlayerConstantRolling)

        if (energyState.newUsage > 0) {
            increaseEnergyUsage(energyState.newUsage)
        }

        xPos = body.getPosition().x
        yPos = body.getPosition().y

        if (actionState?.currentAction?.type === PlayerActionType.CLIMBING_LADDER) {
            v2.set(xPos, actionState.currentAction.data.yPosition)
            body.setPosition(v2)
        }

        currentlyAtRest = (xPos === playerState.previousX && yPos === playerState.previousY)

        playerState.previousX = xPos
        playerState.previousY = yPos

        if (currentlyAtRest !== playerState.previouslyAtRest) {
            playerState.previouslyAtRest = currentlyAtRest
            setAtRest(currentlyAtRest)
        }

        if (processedState.isAttacking) {
            setMovementState(PlayerMovementState.ATTACKING)
        } else if (processedState.isStunned) {
            setMovementState(PlayerMovementState.STUNNED)
        } else if (processedState.isJumping) {
            setMovementState(PlayerMovementState.JUMPING)
        } else if (processedState.isBackStepping) {
            setMovementState(PlayerMovementState.BACK_STEPPING)
        } else if (processedState.isRolling || processedState.isConstantRolling) {
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

    const sendEvent = useSendCustomMessage()

    const onDamageReceived = useCallback((damage: number, from: Vec2) => {

        if (isInvincible(localStateRef.current.actionState)) {
            return
        }

        let damageMultiplier = 1

        const isConstantRolling = actionState.currentAction?.type === PlayerActionType.CONSTANT_ROLL

        if (isConstantRolling) {
            actionState.currentAction = null
            damageMultiplier = 2
        }

        let finalDamage = damage * damageMultiplier

        increasePlayerDamage(finalDamage)

        v2.set(body.getPosition())
        v2.sub(from)
        v2.normalize()
        v2.mul(2)
        body.applyLinearImpulse(v2, plainV2)


        if ((performance.now() - localStateRef.current.playerState.lastStunned) > 1500) {
            localStateRef.current.inputsState.pendingAttack = 0
            localStateRef.current.playerState.lastStunned = performance.now()
            localStateRef.current.playerState.stunnedCooldown = performance.now() + (isConstantRolling ? 1500 : 750)
        }

        if (playerState.currentInteractionId) {
            emitInteractionInterrupted(playerState.currentInteractionId)
            playerState.currentInteractionId = ''
            playerState.currentlyCarvingId = ''
        }

        setMovementState(PlayerMovementState.STUNNED)

        sendEvent(PLAYER_EVENTS_KEY, {
            type: PlayerEventType.DAMAGED,
            damage: finalDamage,
            x: v2.x,
            y: v2.y,
        })

    }, [])

    const sendCustomMessage = useSendCustomMessage()

    useOnPlayerEvents('', useCallback((event) => {
        switch (event.type) {
            case PlayerEventType.DAMAGED:
                onDamageReceived(event.data.damage, event.data.currentPosition)
                break;
            case PlayerEventType.CARVING_BEGAN:
                controllerActions.onCarvingBegin(event.data.id, event.data.time)
                break;
            case PlayerEventType.CARVING_END:
                controllerActions.onCarvingEnd(event.data.id, event.data.time)
                break;
            case PlayerEventType.ENTER_LADDER:
                controllerActions.enterLadder(event.data.id, event.data.position, event.data.destination, event.data.direction, event.data.height, event.data.hatchData)
                break;
            case PlayerEventType.ITEM_RECEIVED:
                sendCustomMessage(messageKeys.playerInventoryChange, {
                    type: PlayerEventType.ITEM_RECEIVED,
                    data: event.data,
                })
                break;
        }
    }, []))

    useAttackHandler(currentAttack)

    return (
        <>
            {
                playerRolling && (
                    <RollingHandler/>
                )
            }
            {
                playerConstantRolling && (
                    <RollingHandler constant/>
                )
            }
        </>
    )
}
