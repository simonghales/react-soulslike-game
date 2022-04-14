import React, {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {
    useAddBody,
    useIsKeyPressed,
    useOnCollisionBegin,
    useOnCollisionEnd,
    useOnPrePhysicsUpdate,
    useTransmitData
} from "react-three-physics";
import {KEYS} from "../input/keys";
import {Body, Box, Circle, Vec2} from "planck";
import {useWorld} from "../../worker/WorldProvider";
import {PlayerAttackStateType, syncKeys} from "../data/keys";
import {calculateAngleBetweenVectors, lerpRadians, v2ToAngleDegrees} from "../../utils/angles";
import {degToRad, lerp} from "three/src/math/MathUtils";
import {useEffectRef} from "../../utils/hooks";
import {normalize} from "../../utils/numbers";
import {COLLISION_FILTER_GROUPS, PlayerAttackCollisionTypes, PlayerRangeCollisionTypes} from "../data/collisions";
import {Fixture} from "planck/dist/planck-with-testbed";
import {calculateVectorsDistance} from "../../utils/vectors";
import {playerConfig} from "./config";
import {halve, getFixtureCollisionId, getFixtureCollisionType} from "../../utils/physics";
import {useAttackCollisionsHandler} from "./AttackCollisionsHandler";

let right = false
let left = false
let up = false
let down = false
let space = false
let xDir = 0
let yDir = 0
let isMoving = false
let angle = 0
let shift = false
let roll = false
let prevRoll = false
let prevTargetKey = false
let isRolling = false
let isRunning = false
let targetKey = false

const walkSpeed = 2.4
const rollSpeed = walkSpeed * 1.25
const runSpeed = walkSpeed * 1.45

const rollDuration = 500

const energyRegenerationDelay = 1500

let speed = walkSpeed

const v2 = new Vec2()
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
            [id]: Date.now(),
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
                    const timeSinceSelected = Date.now() - recentlySelectedRef.current[id]
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

export const useCollisionsHandler = (setTarget: any) => {

    const [activeCollisions, setActiveCollisions] = useState({} as Record<string, Record<string, any>>)

    // const target = useMemo(() => {
    //     if (!activeCollisions[CollisionTypes.PLAYER_RANGE]) return null
    //     return Object.entries(activeCollisions[CollisionTypes.PLAYER_RANGE])[0] ?? null
    // }, [activeCollisions])
    //
    // useEffect(() => {
    //     if (target) {
    //         setTarget({
    //             id: target[0],
    //             body: target[1],
    //         })
    //     } else {
    //         setTarget(null)
    //     }
    // }, [target])

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

const Controller: React.FC<{
    body: Body,
    combatBody: Body,
    fixtures: PlayerFixtures,
}> = ({body, combatBody, fixtures}) => {

    const [spacePressed, setSpacePressed] = useState(false)
    const [shiftPressed, setShiftPressed] = useState(false)

    const isKeyPressed = useIsKeyPressed()

    const localStateRef = useRef({
        lastSpace: 0,
        cooldown: 0,
        lastAttackType: '' as AttackType | '',
        prevAngle: 0,
        lastTargetDown: 0,
    })

    const [target, setTarget] = useState(null  as null | {
        id: string,
        body: Body,
    })

    const activeCollisions = useCollisionsHandler(setTarget)

    const selectNextTarget = useSelectTarget(target, body, setTarget, activeCollisions)

    const [pendingAttackState, setPendingAttackState] = useState({
        type: '',
        wait: 0,
    })

    const [attackState, setAttackState] = useState({
        type: '',
        time: 0,
    })

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
        setEnergyLastUsed(Date.now())
    }

    const energyHasBeenUsed = energyUsage > 0

    useEffect(() => {
        if (!energyHasBeenUsed) return

        let intervalId: any

        const timeout = setTimeout(() => {

            const decrease = () => {
                setEnergyUsage(state => {
                    const update = state - 3
                    if (update < 0) return 0
                    return update
                })
            }

            decrease()

            intervalId = setInterval(decrease, 75)

        }, energyRegenerationDelay)

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
    })

    const [rolling, setRolling] = useState(false)

    const onPhysicsUpdate = useCallback((delta: number) => {

        right = isKeyPressed(KEYS.RIGHT)
        left = isKeyPressed(KEYS.LEFT)
        up = isKeyPressed(KEYS.UP)
        down = isKeyPressed(KEYS.DOWN)
        space = isKeyPressed(KEYS.SPACE)
        shift = isKeyPressed(KEYS.SHIFT)
        roll = isKeyPressed(KEYS.Z)
        prevRoll = prevKeysRef.current.roll
        prevKeysRef.current.roll = roll
        targetKey = isKeyPressed(KEYS.Q)
        prevTargetKey = prevKeysRef.current.target
        prevKeysRef.current.target = targetKey

        if (targetKey && !prevTargetKey) {
            selectNextTarget()
            localStateRef.current.lastTargetDown = Date.now()
        }

        if (prevTargetKey && !targetKey && localStateRef.current.lastTargetDown) {
            const timeSinceDown = Date.now() - localStateRef.current.lastTargetDown
            if (timeSinceDown > 500) {
                setTarget(null)
            }
            localStateRef.current.lastTargetDown = 0
        }

        setShiftPressed(shift)

        isRolling = rollingStateRef.current.isRolling

        isMoving = right || left || up || down

        xDir = right ? 1 : left ? -1 : 0
        yDir = up ? 1 : down ? -1 : 0
        v2.set(xDir, yDir)
        v2.normalize()

        if (roll && !prevRoll && hasEnergyRemainingRef.current && !isRolling && isMoving) {
            isRolling = true
            rollingStateRef.current.isRolling = true
            rollingStateRef.current.rollingStart = Date.now()
            rollingStateRef.current.rollXVel = v2.x
            rollingStateRef.current.rollYVel = v2.y
            setRolling(true)
            increaseEnergyUsage(40)
        }

        if (isRolling) {

            if (Date.now() > rollingStateRef.current.rollingStart + rollDuration) {
                rollingStateRef.current.isRolling = false
                isRolling = false
                setRolling(false)
                updateRollingFixtures(fixtures, false, 0)
            } else {
                const progress = 1 - (((rollingStateRef.current.rollingStart + rollDuration) - Date.now()) / rollDuration)
                updateRollingFixtures(fixtures, true, progress)

                v2.x = lerp(rollingStateRef.current.rollXVel, v2.x, 0.3)
                v2.y = lerp(rollingStateRef.current.rollYVel, v2.y, 0.3)
                v2.normalize()

            }

        }

        isRunning = (shift && hasEnergyRemainingRef.current && !isRolling) && isMoving

        speed = isRunning ? runSpeed : isRolling ? rollSpeed : walkSpeed

        if (space) {
            setSpacePressed(true)
        } else {
            setSpacePressed(false)
        }

        if (isRunning) {
            increaseEnergyUsage(delta * 0.5)
        }

        if (target) {
            angle = calculateAngleBetweenVectors(body.getPosition().x, target.body.getPosition().x, target.body.getPosition().y, body.getPosition().y)
            angle += Math.PI / 2
            localStateRef.current.prevAngle = angle
            body.setAngle(angle)
        } else if (isMoving) {
            angle = degToRad(v2ToAngleDegrees(v2.x, v2.y))
            angle = lerpRadians(angle, localStateRef.current.prevAngle, 0.5)
            localStateRef.current.prevAngle = angle
            body.setAngle(angle)
        }

        v2.mul(delta * speed)

        body.applyLinearImpulse(v2, plainV2)

        if (
            attackStateRef.current.type === PlayerAttackStateType.SHORT ||
            attackStateRef.current.type === PlayerAttackStateType.LONG) {
            const isShort = attackStateRef.current.type === PlayerAttackStateType.SHORT
            const from = attackStateRef.current.time
            const duration = isShort ? 150 : 250
            const to = from + duration
            const progress = normalize(Date.now(), to, from)
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
            setAttackState({
                type: pendingAttackState.type,
                time: Date.now(),
            })
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
        if (!spacePressed) return


        let spaceDown = Date.now()
        const cooldownRemaining = localStateRef.current.cooldown - spaceDown


        let executionDelay = 0

        if (cooldownRemaining > 150) {
            console.log('cooldownRemaining is too big, so ignoring this one...', cooldownRemaining)
            return
        } else if (cooldownRemaining > 0) {
            executionDelay = cooldownRemaining
        }

        setPendingAttackState({
            type: PlayerAttackStateType.CHARGING,
            wait: executionDelay,
        })

        // if it's been long enough since last release...

        return () => {

            if (!hasEnergyRemainingRef.current) {
                setPendingAttackState({
                    type: PlayerAttackStateType.IDLE,
                    wait: 0,
                })
                return
            }

            const now = Date.now()

            const timeDown = now - spaceDown

            let cooldown = 300

            if (timeDown <= 250) {

                increaseEnergyUsage(20)

                setPendingAttackState({
                    type: PlayerAttackStateType.SHORT,
                    wait: executionDelay,
                })
            } else {

                increaseEnergyUsage(75)

                if (timeDown <= 500) {
                    const diff = 500 - timeDown
                    executionDelay += diff
                }
                cooldown = 1000
                setPendingAttackState({
                    type: PlayerAttackStateType.LONG,
                    wait: executionDelay,
                })
            }

            const cooldownDelay = now + executionDelay + cooldown

            localStateRef.current.cooldown = cooldownDelay

            // console.log('execution delay', executionDelay)

            // ...
        }
    }, [spacePressed])

    useAttackCollisionsHandler(attackState)

    return null

}

export const LgPlayer: React.FC = () => {

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

        body.setPosition(new Vec2(0, 0))

        const circleShape = Circle(0.5)

        const mediumCircleShape = Circle(0.25)

        const smallCircleShape = Circle(0.05)

        const rangeFixture = body.createFixture({
            shape: Box((4 / 2), (3 / 2), new Vec2(1.75, 0)),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            userData: {
                collisionId: playerConfig.collisionIds.player,
                collisionType: PlayerRangeCollisionTypes.PLAYER_RANGE,
            },
        })

        const mediumRangeFixture = body.createFixture({
            shape: Circle(playerConfig.sensors.mediumRangeRadius),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            userData: {
                collisionId: playerConfig.collisionIds.player,
                collisionType: PlayerRangeCollisionTypes.PLAYER_MEDIUM_RANGE,
            },
        })

        const largeRangeFixture = body.createFixture({
            shape: Circle(playerConfig.sensors.largeRangeRadius),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.playerRange,
            userData: {
                collisionId: playerConfig.collisionIds.player,
                collisionType: PlayerRangeCollisionTypes.PLAYER_LONG_RANGE,
            },
        })

        console.log('COLLISION_FILTER_GROUPS.player', COLLISION_FILTER_GROUPS)

        const fixture = body.createFixture({
            shape: circleShape,
            filterCategoryBits: COLLISION_FILTER_GROUPS.player,
            // filterMaskBits: COLLISION_FILTER_GROUPS.barrier,
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

    if (!body || !combatBody || !fixtures) return null

    return (
        <>
            <Controller fixtures={fixtures} body={body} combatBody={combatBody}/>
        </>
    )
}
