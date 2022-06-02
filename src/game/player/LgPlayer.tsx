import React, {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {
    SyncComponent,
    useAddBody,
    useIsKeyPressed,
    useOnCollisionBegin,
    useOnCollisionEnd,
    useOnPrePhysicsUpdate, useSyncData,
    useTransmitData
} from "@simonghales/react-three-physics";
import {INPUT_KEYS} from "../input/INPUT_KEYS";
import {Body, Box, Circle, Vec2} from "planck";
import {useWorld} from "../../worker/WorldProvider";
import {componentSyncKeys, PlayerAttackStateType, syncKeys} from "../data/keys";
import {
    angleToV2,
    calculateAngleBetweenVectors,
    lerpRadians,
    roundAngleDegrees,
    v2ToAngleDegrees
} from "../../utils/angles";
import {degToRad, lerp, radToDeg} from "three/src/math/MathUtils";
import {useEffectRef} from "../../utils/hooks";
import {normalize} from "../../utils/numbers";
import {COLLISION_FILTER_GROUPS, PlayerAttackCollisionTypes, PlayerRangeCollisionTypes} from "../data/collisions";
import {Fixture} from "planck/dist/planck-with-testbed";
import {calculateVectorsDistance} from "../../utils/vectors";
import {playerConfig} from "./config";
import {halve, getFixtureCollisionId, getFixtureCollisionType} from "../../utils/physics";
import {useAttackCollisionsHandler} from "./AttackCollisionsHandler";
import {attacksConfig} from "../data/attacks";
import {useSetBody} from "../state/bodies";
import {PlayerContext, usePlayerContext} from "./PlayerContext";
import {getPowerGraph} from "../../utils/graphs";
import {PlayerController} from "./controller/PlayerController";
import {PlayerStateHandler} from "./PlayerStateHandler";
import {PlayerMovementState} from "./types";
import {useCollisionsHandler, useCollisionsState} from "./controller/collisionsHandler";
import {setBackendSelectedTarget, setBackendTargetItem} from "../state/backend/player";

let moveRight = false
let moveLeft = false
let moveUp = false
let moveDown = false
let aimRight = false
let aimLeft = false
let aimUp = false
let aimDown = false
let space = false
let aimXDir = 0
let aimYDir = 0
let xDir = 0
let yDir = 0
let isMoving = false
let isAiming = false
let angle = 0
let shift = false
let roll = false
let prevRoll = false
let prevTargetKey = false
let isRolling = false
let isBackwards = false
let isRunning = false
let targetKey = false
let isAttacking = false
let isCharging = false

const walkSpeed = 2.2
const rollSpeed = walkSpeed * 1.25
const runSpeed = walkSpeed * 1.35
const backwardsSpeed = runSpeed * 2.5

const rollDuration = 500
const backDuration = 85

const energyRegenerationDelay = 250
const zeroEnergyRegenerationDelay = 500

let speed = walkSpeed

const aimV2 = new Vec2()
const v2 = new Vec2()
const dirV2 = new Vec2()
const plainV2 = new Vec2()

export enum AttackType {
    SHORT = 'SHORT',
    LONG = 'LONG',
}

type PlayerFixtures = {
    default: Fixture,
    small: Fixture,
    medium: Fixture,
}

const updateRollingFixtures = (fixtures: PlayerFixtures, isRolling: boolean, progress: number) => {

    if (isRolling) {

        if (progress < 0.66) {
            console.log('set all to playerRolling...')
            fixtures.default.setSensor(true)
            fixtures.medium.setSensor(true)
            fixtures.small.setSensor(true)
            return
        }

        if (progress < 0.8) {
            console.log('set to small')
            fixtures.default.setSensor(true)
            fixtures.medium.setSensor(true)
            fixtures.small.setSensor(false)
            return
        }

        if (progress < 0.95) {
            console.log('set to medium')
            fixtures.default.setSensor(true)
            fixtures.medium.setSensor(false)
            fixtures.small.setSensor(false)
            return
        }

    }

    console.log('reset to default...')

    fixtures.default.setSensor(false)
    fixtures.medium.setSensor(false)
    fixtures.small.setSensor(false)

}

export type CollisionBodies = Record<string, Body>

export type ActiveCollisions = {
    [PlayerRangeCollisionTypes.PLAYER_RANGE]?: CollisionBodies,
    [PlayerRangeCollisionTypes.PLAYER_MEDIUM_RANGE]?: CollisionBodies,
    [PlayerRangeCollisionTypes.PLAYER_LONG_RANGE]?: CollisionBodies,
}

export type SelectedTarget = {
    id: string,
    body: Body,
} | null

export const useSelectTarget = (target: SelectedTarget, body: Body, setTarget: any, activeCollisions: ActiveCollisions) => {

    const [recentlySelected, setRecentlySelected] = useState({} as Record<string, number>)

    const recentlySelectedRef = useEffectRef(recentlySelected)
    const activeCollisionsRef = useEffectRef(activeCollisions)
    const targetRef = useEffectRef(target)

    const selectedTargetNotInRange = useMemo(() => {
        if (!target) return false
        if (!activeCollisionsRef.current[PlayerRangeCollisionTypes.PLAYER_LONG_RANGE]?.[target.id]) return true
        return false
    }, [target, activeCollisions])

    useEffect(() => {
        if (!selectedTargetNotInRange) return
        const timeout = setTimeout(() => {
            setTarget(null)
        }, 250)
        return () => {
            clearTimeout(timeout)
        }
    }, [selectedTargetNotInRange])

    useEffect(() => {
        if (Object.keys(recentlySelected).length === 0) return
        const timeout = setTimeout(() => {
            setRecentlySelected({})
        }, 2000)
        return () => {
            clearTimeout(timeout)
        }
    }, [recentlySelected])

    const selectTarget = useCallback((id: string, body: Body) => {
        setRecentlySelected(state => ({
            ...state,
            [id]: performance.now(),
        }))
        setTarget({
            id,
            body,
        })
    }, [setTarget])

    const selectNextTarget = useCallback(() => {
        const currentPosition = body.getPosition()
        const distances: Record<string, number> = {}
        const bodies: Record<string, Body> = {}
        const currentSelected = targetRef.current?.id ?? ''

        Object.entries(activeCollisionsRef.current).forEach(([collisionType, collisions]) => {
            Object.entries(collisions).forEach(([id, body]) => {
                if (distances[id] !== undefined) return
                bodies[id] = body
                v2.set(body.getPosition())
                let distance = calculateVectorsDistance(currentPosition.x, v2.x, currentPosition.y, v2.y)
                if (collisionType !== PlayerRangeCollisionTypes.PLAYER_RANGE && !activeCollisionsRef.current[PlayerRangeCollisionTypes.PLAYER_RANGE]?.[id]) {
                    distance += 16
                }
                if (recentlySelectedRef.current[id]) {
                    const timeSinceSelected = performance.now() - recentlySelectedRef.current[id]
                    if (timeSinceSelected > 5000) {
                        setRecentlySelected(state => {
                            const update = {
                                ...state,
                            }
                            delete update[id]
                            return update
                        })
                    } else {
                        distance += 32 + ((5 - (timeSinceSelected / 1000)) * 10)
                    }
                }
                distances[id] = distance
            })
        })

        const sortedDistances = Object.entries(distances).sort(([idA,distanceA], [idB,distanceB]) => {
            if (idB === currentSelected) return -1
            if (idA === currentSelected) return 1
            return distanceA - distanceB
        })

        const target = sortedDistances[0]

        if (target) {
            selectTarget(target[0], bodies[target[0]])
        } else {
            setTarget(null)
        }


    }, [selectTarget])

    return selectNextTarget

}

export const OLDuseCollisionsHandler = (setTarget: any) => {

    const [activeCollisions, setActiveCollisions] = useState({} as Record<string, Record<string, any>>)

    useOnCollisionBegin('player', (fixture: Fixture, currentFixture: Fixture) => {
        const collidedId = getFixtureCollisionId(fixture)
        if (!collidedId) return
        const collisionType = getFixtureCollisionType(currentFixture)
        setActiveCollisions(prev => {
            const update = {
                ...prev
            }
            if (!update[collisionType]) {
                update[collisionType] = {}
            }
            update[collisionType][collidedId] = fixture.getBody()
            return update
        })
    })

    useOnCollisionEnd('player', (fixture: Fixture, currentFixture: Fixture) => {
        const collidedId = getFixtureCollisionId(fixture)
        if (!collidedId) return
        const collisionType = getFixtureCollisionType(currentFixture)
        setActiveCollisions(prev => {
            const update = {
                ...prev
            }
            if (!update[collisionType]) {
                return update
            }
            delete update[collisionType][collidedId]
            return update
        })
    })

    return activeCollisions

}

const aV2 = new Vec2()

export type AttackState = {
    type: string,
    time: number,
    xDir: number,
    yDir: number,
}

let progress = 0
let morphed = 0
let timeElapsed = 0

const getAttackingMomentum = (attackState: AttackState) => {
    progress = 0
    timeElapsed = performance.now() - attackState.time
    if (attackState.type === PlayerAttackStateType.SHORT) {
        if (timeElapsed > attacksConfig.short.duration) return 0
        progress = normalize(timeElapsed, attacksConfig.short.duration,0)
        morphed = getPowerGraph(progress, 2)
        return progress < 0.5 ? lerp(0.25, 1.75, morphed) : lerp(0.15, 1.75, morphed)
    } else if (attackState.type === PlayerAttackStateType.LONG) {
        if (timeElapsed > attacksConfig.long.duration) return 0
        progress = normalize(timeElapsed, attacksConfig.long.duration,25)
        morphed = getPowerGraph(progress, 4)
        return progress < 0.5 ? lerp(0, 2, morphed) : lerp(0.05, 2, morphed)
    }
    return 0
}

const Controller: React.FC<{
    body: Body,
    combatBody: Body,
    fixtures: PlayerFixtures,
}> = ({body, combatBody, fixtures}) => {

    const {
        setPlayerRolled,
    } = usePlayerContext()

    const [spacePressed, setSpacePressed] = useState(false)
    const [shiftPressed, setShiftPressed] = useState(false)

    const isKeyPressed = useIsKeyPressed()

    const localStateRef = useRef({
        lastSpace: 0,
        cooldown: 0,
        lastAttackType: '' as AttackType | '',
        prevAngle: 0,
        lastTargetDown: 0,
        prevX: 1,
        prevY: 0,
    })

    const [target, setTarget] = useState(null  as null | {
        id: string,
        body: Body,
    })

    useEffect(() => {
        if (!target) return
        const interval = setInterval(() => {
            // console.log('target position', target.body.getPosition())
        }, 50)
        return () => {
            clearInterval(interval)
        }
    }, [target])

    const activeCollisions = OLDuseCollisionsHandler(setTarget)

    const selectNextTarget = useSelectTarget(target, body, setTarget, activeCollisions)

    const [pendingAttackState, setPendingAttackState] = useState({
        type: '',
        wait: 0,
    })

    const [currentAttack, setCurrentAttack] = useState(null as null | {
        type: AttackType,
        time: number,
        xDir: number,
        yDir: number,
    })

    const attackState = useMemo(() => {
        if (!currentAttack) {
            return {
                type: spacePressed ? PlayerAttackStateType.CHARGING : '',
                time: 0,
                xDir: 0,
                yDir: 0,
            }
        }
        return currentAttack
    }, [currentAttack, spacePressed])

    const [pendingAttack, setPendingAttack] = useState('' as '' | AttackType)

    const currentAttackRef = useEffectRef(currentAttack)

    useEffect(() => {
        if (!attackState.type || attackState.type === PlayerAttackStateType.CHARGING) return

        const clear = () => {
            // setAttackState({
            //     type: '',
            //     time: 0,
            //     xDir: 0,
            //     yDir: 0,
            // })
        }

        const delay = attackState.type === PlayerAttackStateType.SHORT ? attacksConfig.short.duration + attacksConfig.short.cooldown : attacksConfig.long.duration + attacksConfig.long.cooldown

        const timeRemaining = (attackState.time + delay) - performance.now()
        if (timeRemaining > 0) {
            const timeout = setTimeout(clear, timeRemaining)
            return () => {
                clearTimeout(timeout)
            }
        } else {
            clear()
        }
    }, [attackState])

    const [energyUsage, setEnergyUsage] = useState(0)

    const [energyLastUsed, setEnergyLastUsed] = useState(0)

    const energyCap = 150

    const hasEnergyRemaining = energyUsage < energyCap

    const hasEnergyRemainingRef = useEffectRef(hasEnergyRemaining)

    const increaseEnergyUsage = (amount: number) => {
        setEnergyUsage(state => {
            const newUsage = state + amount
            if (newUsage > energyCap) {
                return energyCap
            }
            return newUsage
        })
        setEnergyLastUsed(performance.now())
    }

    const energyHasBeenUsed = energyUsage > 0

    useEffect(() => {
        if (!energyHasBeenUsed) return

        let intervalId: any

        const timeout = setTimeout(() => {

            const decrease = () => {
                setEnergyUsage(state => {
                    const update = state - playerConfig.rechargeAmount
                    if (update < 0) return 0
                    return update
                })
            }

            decrease()

            intervalId = setInterval(decrease, 75)

        }, hasEnergyRemainingRef.current ? energyRegenerationDelay : zeroEnergyRegenerationDelay)

        return () => {
            clearTimeout(timeout)
            if (intervalId) {
                clearInterval(intervalId)
            }
        }

    }, [energyHasBeenUsed, energyLastUsed])

    const attackStateRef = useEffectRef(attackState)

    const prevKeysRef = useRef({
        roll: false,
        target: false,
    })

    const rollingStateRef = useRef({
        isRolling: false,
        rollingStart: 0,
        rollXVel: 0,
        rollYVel: 0,
        isBackwards: false,
        backwardsStart: 0,
        backwardsXVel: 0,
        backwardsYVel: 0,
    })

    const [rolling, setRolling] = useState(false)

    const OLDisAttacking = !!attackState.type && attackState.type !== PlayerAttackStateType.IDLE

    const OLDisAttackingRef = useEffectRef(OLDisAttacking)

    const onPhysicsUpdate = useCallback((delta: number) => {

        moveRight = isKeyPressed(INPUT_KEYS.MOVE_RIGHT)
        moveLeft = isKeyPressed(INPUT_KEYS.MOVE_LEFT)
        moveUp = isKeyPressed(INPUT_KEYS.MOVE_UP)
        moveDown = isKeyPressed(INPUT_KEYS.MOVE_DOWN)

        aimRight = isKeyPressed(INPUT_KEYS.LOOK_RIGHT)
        aimLeft = isKeyPressed(INPUT_KEYS.LOOK_LEFT)
        aimUp = isKeyPressed(INPUT_KEYS.LOOK_UP)
        aimDown = isKeyPressed(INPUT_KEYS.LOOK_DOWN)

        space = isKeyPressed(INPUT_KEYS.SPACE)
        shift = isKeyPressed(INPUT_KEYS.SHIFT)
        roll = isKeyPressed(INPUT_KEYS.RIGHT_ANGLE)
        prevRoll = prevKeysRef.current.roll
        prevKeysRef.current.roll = roll
        targetKey = isKeyPressed(INPUT_KEYS.Q)
        prevTargetKey = prevKeysRef.current.target
        prevKeysRef.current.target = targetKey

        isAttacking = attackStateRef.current.type === PlayerAttackStateType.LONG || attackStateRef.current.type === PlayerAttackStateType.SHORT
        isCharging = attackStateRef.current.type === PlayerAttackStateType.CHARGING

        // if (targetKey && !prevTargetKey) {
        //     selectNextTarget()
        //     localStateRef.current.lastTargetDown = performance.now()
        // }

        // if (prevTargetKey && !targetKey && localStateRef.current.lastTargetDown) {
        //     const timeSinceDown = performance.now() - localStateRef.current.lastTargetDown
        //     if (timeSinceDown > 500) {
        //         setTarget(null)
        //     }
        //     localStateRef.current.lastTargetDown = 0
        // }

        setShiftPressed(shift)

        isRolling = rollingStateRef.current.isRolling
        isBackwards = rollingStateRef.current.isBackwards

        isMoving = moveRight || moveLeft || moveUp || moveDown

        isAiming = aimRight || aimLeft || aimUp || aimDown

        xDir = moveRight ? 1 : moveLeft ? -1 : 0
        yDir = moveUp ? 1 : moveDown ? -1 : 0

        aimXDir = aimRight ? 1 : aimLeft ? -1 : 0
        aimYDir = aimUp ? 1 : aimDown ? -1 : 0

        if (isAiming) {
            // store...
        }

        if (isMoving) {
            localStateRef.current.prevX = xDir
            localStateRef.current.prevY = yDir
        }

        if (isAttacking) {
            xDir = attackStateRef.current.xDir
            yDir = attackStateRef.current.yDir
        }

        v2.set(xDir, yDir)
        v2.normalize()



        if (roll && !prevRoll && hasEnergyRemainingRef.current && !isRolling && isMoving && !isBackwards) {
            // todo - check has enough energy remaining...
            isRolling = true
            rollingStateRef.current.isRolling = true
            rollingStateRef.current.rollingStart = performance.now()
            rollingStateRef.current.rollXVel = v2.x
            rollingStateRef.current.rollYVel = v2.y
            setRolling(true)
            increaseEnergyUsage(60)
            setPlayerRolled(performance.now())
        } else {
            if (!isRolling && roll && !prevRoll && !isMoving && !isBackwards) {
                const currentAngle = body.getAngle() - degToRad(180)
                angleToV2(currentAngle, aV2)
                isBackwards = true
                rollingStateRef.current.isBackwards = true
                rollingStateRef.current.backwardsStart = performance.now()
                rollingStateRef.current.backwardsXVel = aV2.x
                rollingStateRef.current.backwardsYVel = aV2.y
                increaseEnergyUsage(30)
            }
        }

        if (isBackwards) {

            if (performance.now() > rollingStateRef.current.backwardsStart + backDuration) {
                rollingStateRef.current.isBackwards = false
                isBackwards = false
            } else {
                v2.x = lerp(rollingStateRef.current.backwardsXVel, v2.x, 0.15)
                v2.y = lerp(rollingStateRef.current.backwardsYVel, v2.y, 0.15)
                v2.normalize()
                console.log('move backwards...')
            }

        }

        if (isRolling) {

            if (performance.now() > rollingStateRef.current.rollingStart + rollDuration) {
                rollingStateRef.current.isRolling = false
                isRolling = false
                setRolling(false)
                updateRollingFixtures(fixtures, false, 0)
            } else {
                const progress = 1 - (((rollingStateRef.current.rollingStart + rollDuration) - performance.now()) / rollDuration)
                updateRollingFixtures(fixtures, true, progress)

                v2.x = lerp(rollingStateRef.current.rollXVel, v2.x, 0.3)
                v2.y = lerp(rollingStateRef.current.rollYVel, v2.y, 0.3)
                v2.normalize()

            }

        }

        isRunning = (shift && hasEnergyRemainingRef.current && !isRolling) && isMoving && (!isAttacking && !isCharging)

        speed = isRolling ? rollSpeed : isBackwards ? backwardsSpeed : isRunning ? runSpeed  : walkSpeed

        if (space) {
            setSpacePressed(true)
        } else {
            setSpacePressed(false)
        }

        if (isRunning) {
            increaseEnergyUsage(delta * 0.55)
        }

        // if (target) {
        //
        //     const targetPosition = target.body.getPosition()
        //     const targetX = targetPosition.x
        //     const targetY = targetPosition.y
        //     const bodyX = body.getPosition().x
        //     const bodyY = body.getPosition().y
        //     dirV2.set(targetPosition)
        //     dirV2.sub(body.getPosition())
        //     dirV2.normalize()
        //
        //     localStateRef.current.prevX = dirV2.x
        //     localStateRef.current.prevY = dirV2.y
        //
        //     angle = calculateAngleBetweenVectors(bodyX, targetX, targetY, bodyY)
        //     angle += Math.PI / 2
        //     if (isCharging) {
        //         angle = lerpRadians(angle, localStateRef.current.prevAngle, 0.5)
        //     }
        //     localStateRef.current.prevAngle = angle
        //     // body.setAngle(angle)
        // }
        if (isAiming) {
            aimV2.set(aimXDir, aimYDir)
            aimV2.normalize()
            angle = v2ToAngleDegrees(aimV2.x, aimV2.y)
            angle = degToRad(angle)
            angle = lerpRadians(angle, localStateRef.current.prevAngle, 0.5)
            localStateRef.current.prevAngle = angle
            // angle = radToDeg(angle)
            // angle = roundAngleDegrees(angle, 45)
            // angle = degToRad(angle)
            body.setAngle(angle)
        } else if (isMoving) {
            angle = degToRad(v2ToAngleDegrees(v2.x, v2.y))
            angle = lerpRadians(angle, localStateRef.current.prevAngle, isCharging ? 0.6 : 0.5)
            localStateRef.current.prevAngle = angle
            body.setAngle(angle)
        }

        v2.mul(delta * speed)
        v2.clamp(delta * speed)

        if (isCharging) {
            v2.mul(0.25)
        } else if (isAttacking) {
            v2.mul(getAttackingMomentum(attackStateRef.current))
        }

        body.applyLinearImpulse(v2, plainV2)

        if (
            attackStateRef.current.type === PlayerAttackStateType.SHORT ||
            attackStateRef.current.type === PlayerAttackStateType.LONG) {
            const isShort = attackStateRef.current.type === PlayerAttackStateType.SHORT
            const from = attackStateRef.current.time + (isShort ? 150 : 250)
            const duration = isShort ? 150 : 250
            const to = from + duration
            const progress = normalize(performance.now(), to, from)
            const startAngle = isShort ? -45 : -70
            const endAngle = isShort ? 45 : 70
            const attackAngle = lerp(startAngle, endAngle, progress)
            combatBody.setAngle(body.getAngle() + degToRad(attackAngle))
        } else {
            combatBody.setAngle(body.getAngle() + degToRad(-45))
        }

        combatBody.setPosition(body.getPosition())

    }, [target, selectNextTarget])

    useOnPrePhysicsUpdate(onPhysicsUpdate)

    useTransmitData(syncKeys.playerAttackState, attackState)
    useTransmitData(syncKeys.playerEnergyUsage, energyUsage)

    useEffect(() => {

        let waitTimeout: any

        if (!pendingAttackState.type) return

        const process = () => {
            // setAttackState({
            //     type: pendingAttackState.type,
            //     time: performance.now(),
            //     xDir: localStateRef.current.prevX,
            //     yDir: localStateRef.current.prevY,
            // })
        }

        if (pendingAttackState.wait) {
            waitTimeout = setTimeout(process, pendingAttackState.wait - 1)
        } else {
            process()
        }

        return () => {
            if (waitTimeout) {
                clearTimeout(waitTimeout)
            }
        }

    }, [pendingAttackState])

    useEffect(() => {
        if (currentAttack || !pendingAttack) return
        setCurrentAttack({
            type: pendingAttack,
            time: performance.now(),
            xDir: localStateRef.current.prevX,
            yDir: localStateRef.current.prevY,
        })
        setPendingAttack('')
    }, [currentAttack, pendingAttack])

    useEffect(() => {
        if (!currentAttack) return
        let cooldown = 0
        if (currentAttack.type === AttackType.SHORT) {
            cooldown = attacksConfig.short.duration + attacksConfig.short.cooldown + 50
        } else {
            cooldown = attacksConfig.long.duration + attacksConfig.long.cooldown + 50
        }
        const timeRemaining = currentAttack.time + cooldown - performance.now()
        const clear = () => {
            setCurrentAttack(null)
        }
        if (timeRemaining <= 0) {
            clear()
            return
        }
        const timeout = setTimeout(clear, timeRemaining)
        return () => {
            clearTimeout(timeout)
        }
    }, [currentAttack])

    const beginAttack = useCallback((attackType: AttackType) => {

        if (currentAttackRef.current) {
            setPendingAttack(attackType)
            return
        }

        setCurrentAttack({
            type: attackType,
            time: performance.now(),
            xDir: localStateRef.current.prevX,
            yDir: localStateRef.current.prevY,
        })

    }, [])

    useEffect(() => {

        if (!spacePressed) return

        let spaceDown = performance.now()
        let released = false

        const onRelease = () => {
            if (released) return
            released = true
            if (!hasEnergyRemainingRef.current) return
            let timeElapsed = performance.now() - spaceDown
            let attackType

            if (timeElapsed <= 250) {
                attackType =  AttackType.SHORT
                increaseEnergyUsage(attacksConfig.short.energyUsage)
            } else {
                attackType =  AttackType.LONG
                increaseEnergyUsage(attacksConfig.long.energyUsage)
            }
            beginAttack(attackType)
        }

        const timeout = setTimeout(onRelease, 1000)

        return () => {

            clearTimeout(timeout)
            onRelease()

        }

    }, [spacePressed])

    // useEffect(() => {
    //     if (!spacePressed) return
    //
    //
    //     let spaceDown = performance.now()
    //     const cooldownRemaining = localStateRef.current.cooldown - spaceDown
    //
    //
    //     let executionDelay = 0
    //
    //     if (cooldownRemaining > 150) {
    //         console.log('cooldownRemaining is too big, so ignoring this one...', cooldownRemaining)
    //         return
    //     } else if (cooldownRemaining > 0) {
    //         executionDelay = cooldownRemaining
    //     }
    //
    //     setPendingAttackState({
    //         type: PlayerAttackStateType.CHARGING,
    //         wait: executionDelay,
    //     })
    //
    //     return () => {
    //
    //         if (!hasEnergyRemainingRef.current) {
    //             setPendingAttackState({
    //                 type: PlayerAttackStateType.IDLE,
    //                 wait: 0,
    //             })
    //             return
    //         }
    //
    //         const now = performance.now()
    //
    //         const timeDown = now - spaceDown
    //
    //         let cooldown = 50
    //
    //         if (timeDown <= 250) {
    //
    //             increaseEnergyUsage(attacksConfig.short.energyUsage)
    //
    //             setPendingAttackState({
    //                 type: PlayerAttackStateType.SHORT,
    //                 wait: executionDelay,
    //             })
    //         } else {
    //
    //             increaseEnergyUsage(attacksConfig.long.energyUsage)
    //
    //             if (timeDown <= 500) {
    //                 const diff = 500 - timeDown
    //                 executionDelay += diff
    //             }
    //             // cooldown = 100
    //             setPendingAttackState({
    //                 type: PlayerAttackStateType.LONG,
    //                 wait: executionDelay,
    //             })
    //         }
    //
    //         const cooldownDelay = now + executionDelay + cooldown
    //
    //         localStateRef.current.cooldown = cooldownDelay
    //
    //         // console.log('execution delay', executionDelay)
    //
    //         // ...
    //     }
    // }, [spacePressed])

    const getCurrentPosition = () => {
        return body.getPosition()
    }

    useAttackCollisionsHandler(attackState, getCurrentPosition)

    return null

}

export const LgPlayer: React.FC = () => {

    const x = -18
    const y = -12

    const world = useWorld()

    const addBody = useAddBody()
    const [body, setBody] = useState<null | Body>(null)
    const [combatBody, setCombatBody] = useState<null | Body>(null)
    const [fixtures, setFixtures] = useState(null as null | PlayerFixtures)

    useEffect(() => {

        const bodyDef: any = {
            type: "dynamic",
            linearDamping: 40,
            angularDamping: 0.1,
            allowSleep: false,
            fixedRotation: true,
        }

        const combatBodyDef: any = {
            type: "dynamic",
            allowSleep: false,
            fixedRotation: true,
        }

        const body = world.createBody(bodyDef)
        const combatBody = world.createBody(combatBodyDef)

        body.setPosition(new Vec2(x, y))

        const circleShape = Circle(0.5)

        const mediumCircleShape = Circle(0.25)

        const smallCircleShape = Circle(0.05)

        const rangeFixture = body.createFixture({
            shape: Box((4 / 2), (3 / 2), new Vec2(1.75, 0)),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
            userData: {
                collisionId: playerConfig.collisionIds.player,
                collisionType: PlayerRangeCollisionTypes.PLAYER_RANGE,
            },
        })

        const mediumRangeFixture = body.createFixture({
            shape: Circle(playerConfig.sensors.mediumRangeRadius),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
            userData: {
                collisionId: playerConfig.collisionIds.player,
                collisionType: PlayerRangeCollisionTypes.PLAYER_MEDIUM_RANGE,
            },
        })

        const interactionRangeFixture = body.createFixture({
            shape: Circle(playerConfig.sensors.interactionRadius),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            filterMaskBits: COLLISION_FILTER_GROUPS.items,
            userData: {
                collisionId: playerConfig.collisionIds.player,
                collisionType: PlayerRangeCollisionTypes.PLAYER_INTERACTION_RANGE,
            },
        })

        const extraSmallCombatRangeFixture = body.createFixture({
            shape: Circle(playerConfig.sensors.extraSmallCombatRadius),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
            userData: {
                collisionId: playerConfig.collisionIds.player,
                collisionType: PlayerRangeCollisionTypes.PLAYER_EXTRA_SMALL_COMBAT_RANGE,
            },
        })

        const smallCombatRangeFixture = body.createFixture({
            shape: Circle(playerConfig.sensors.smallCombatRadius),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
            userData: {
                collisionId: playerConfig.collisionIds.player,
                collisionType: PlayerRangeCollisionTypes.PLAYER_SMALL_COMBAT_RANGE,
            },
        })

        const mediumCombatRangeFixture = body.createFixture({
            shape: Circle(playerConfig.sensors.mediumCombatRadius),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
            userData: {
                collisionId: playerConfig.collisionIds.player,
                collisionType: PlayerRangeCollisionTypes.PLAYER_MEDIUM_COMBAT_RANGE,
            },
        })

        const largeCombatRangeFixture = body.createFixture({
            shape: Circle(playerConfig.sensors.largeCombatRadius),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
            userData: {
                collisionId: playerConfig.collisionIds.player,
                collisionType: PlayerRangeCollisionTypes.PLAYER_LARGE_COMBAT_RANGE,
            },
        })

        const extraLargeCombatRangeFixture = body.createFixture({
            shape: Circle(playerConfig.sensors.extraLargeCombatRadius),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
            userData: {
                collisionId: playerConfig.collisionIds.player,
                collisionType: PlayerRangeCollisionTypes.PLAYER_EXTRA_LARGE_COMBAT_RANGE,
            },
        })

        const largeRangeFixture = body.createFixture({
            shape: Circle(playerConfig.sensors.largeRangeRadius),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
            userData: {
                collisionId: playerConfig.collisionIds.player,
                collisionType: PlayerRangeCollisionTypes.PLAYER_LONG_RANGE,
            },
        })

        const fixture = body.createFixture({
            shape: circleShape,
            filterCategoryBits: COLLISION_FILTER_GROUPS.player,
            userData: {
                collisionId: playerConfig.collisionIds.player,
                collisionType: PlayerRangeCollisionTypes.PLAYER,
            },
        } as any)

        const rollingFixture = body.createFixture({
            shape: circleShape,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRolling,
            // filterMaskBits: COLLISION_FILTER_GROUPS.barrier,
        } as any)

        const mediumFixture = body.createFixture({
            shape: mediumCircleShape,
            filterCategoryBits: COLLISION_FILTER_GROUPS.player,
            filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
        } as any)

        const smallFixture = body.createFixture({
            shape: smallCircleShape,
            filterCategoryBits: COLLISION_FILTER_GROUPS.player,
            filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
        } as any)

        setFixtures({
            default: fixture,
            medium: mediumFixture,
            small: smallFixture,
        })

        // combatBody.createFixture({
        //     shape: Circle(playerConfig.sensors.mediumRangeRadius),
        //     isSensor: true,
        //     filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
        //     filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
        //     userData: {
        //         collisionId: playerConfig.collisionIds.attack,
        //         collisionType: PlayerRangeCollisionTypes.PLAYER_MEDIUM_RANGE,
        //     },
        // })

        combatBody.createFixture({
            shape: Box(halve(playerConfig.sensors.shortAttack.w), halve(playerConfig.sensors.shortAttack.h), new Vec2(playerConfig.sensors.shortAttack.x, 0)),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
            userData: {
                collisionId: playerConfig.collisionIds.attack,
                collisionType: PlayerAttackCollisionTypes.QUICK_ATTACK,
            },
        })

        combatBody.createFixture({
            shape: Box(halve(playerConfig.sensors.longAttack.w), halve(playerConfig.sensors.longAttack.h), new Vec2(playerConfig.sensors.longAttack.x, 0)),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
            userData: {
                collisionId: playerConfig.collisionIds.attack,
                collisionType: PlayerAttackCollisionTypes.LONG_ATTACK,
            },
        })

        setBody(body)
        setCombatBody(combatBody)

        const unsub: any[] = []

        unsub.push(addBody('test', body))
        unsub.push(addBody('combatBody', combatBody))

        return () => {
            unsub.forEach(fn => fn())
        }

    }, [])

    useSetBody('player', body)

    const [playerDamage, setPlayerDamage] = useState(0)
    const [playerRolled, setPlayerRolled] = useState(0)

    let healthRemaining = playerConfig.defaultHealth - playerDamage

    if (healthRemaining < 0) {
        healthRemaining = 0
    }

    // useTransmitData(syncKeys.playerState, {
    //     healthRemaining,
    // })

    const increasePlayerDamage = useCallback((damage: number) => {
        setPlayerDamage(state => state + damage)
    }, [])

    const [energyUsage, setEnergyUsage] = useState(0)
    const [energyLastUsed, setEnergyLastUsed] = useState(0)

    const increaseEnergyUsage = useCallback((amount: number) => {
        setEnergyUsage(prev => {
            if ((prev + amount) > playerConfig.defaultEnergy) {
                return playerConfig.defaultEnergy
            }
            return prev + amount
        })
        setEnergyLastUsed(performance.now())
    }, [])

    const [movementState, setMovementState] = useState('' as '' | PlayerMovementState)

    const [selectedTarget, setSelectedTarget] = useState(null as SelectedTarget)

    const [targetItem, setTargetItem] = useState('')

    useTransmitData(syncKeys.playerState, useMemo(() => {
        return {
            energyUsage,
            movementState,
            healthRemaining,
            selectedTarget: selectedTarget?.id ?? '',
        }
    }, [energyUsage, movementState, healthRemaining, selectedTarget]))

    useEffect(() => {
        const id = selectedTarget?.id ?? ''
        setBackendSelectedTarget(id)
    }, [selectedTarget])

    useEffect(() => {
        setBackendTargetItem(targetItem)
    }, [targetItem])

    const collisions = useCollisionsHandler(playerConfig.collisionIds.player)
    const combatCollisions = useCollisionsHandler(playerConfig.collisionIds.attack)
    const collisionsState = useCollisionsState(collisions, combatCollisions)
    const collisionsRef = useEffectRef(collisions)
    const collisionsStateRef = useEffectRef(collisionsState)



    const isAlive = healthRemaining > 0

    const isActive = body && combatBody && fixtures

    return (
        <>
            {
                isActive && (
                    <>
                        <PlayerContext.Provider value={{
                            body,
                            combatBody,
                            playerDamage,
                            increasePlayerDamage,
                            playerRolled,
                            setPlayerRolled,
                            energyUsage,
                            setEnergyUsage,
                            increaseEnergyUsage,
                            energyLastUsed,
                            movementState,
                            setMovementState,
                            fixtures,
                            collisions,
                            collisionsRef,
                            collisionsState,
                            collisionsStateRef,
                            selectedTarget,
                            setSelectedTarget,
                            targetItem,
                            setTargetItem,
                        }}>
                            {/*<Controller fixtures={fixtures} body={body} combatBody={combatBody}/>*/}
                            {
                                isAlive && (
                                    <>
                                        <PlayerController/>
                                        <PlayerStateHandler/>
                                    </>
                                )
                            }
                            {/*<EventsHandler/>*/}
                        </PlayerContext.Provider>
                    </>
                )
            }
            <SyncComponent id={'player'} componentId={componentSyncKeys.player} x={x} y={y}/>
        </>
    )
}
