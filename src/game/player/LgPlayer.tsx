import React, {useCallback, useEffect, useRef, useState} from "react"
import {useAddBody, useIsKeyPressed, useOnPrePhysicsUpdate, useTransmitData} from "react-three-physics";
import {KEYS} from "../input/keys";
import {Body, Box, Circle, Vec2} from "planck";
import {useWorld} from "../../worker/WorldProvider";
import {PlayerAttackStateType, syncKeys} from "../data/keys";
import {lerpRadians, v2ToAngleDegrees} from "../../utils/angles";
import {degToRad, lerp} from "three/src/math/MathUtils";
import {useEffectRef} from "../../utils/hooks";
import {normalize} from "../../utils/numbers";

let right = false
let left = false
let up = false
let down = false
let space = false
let xDir = 0
let yDir = 0
let isMoving = false
let angle = 0

const speed = 3

const v2 = new Vec2()
const plainV2 = new Vec2()

export enum AttackType {
    SHORT = 'SHORT',
    LONG = 'LONG',
}

const Controller: React.FC<{
    body: Body,
    combatBody: Body,
}> = ({body, combatBody}) => {

    const [spacePressed, setSpacePressed] = useState(false)

    const isKeyPressed = useIsKeyPressed()

    const localStateRef = useRef({
        lastSpace: 0,
        cooldown: 0,
        lastAttackType: '' as AttackType | '',
        prevAngle: 0,
    })

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

    const increaseEnergyUsage = (amount: number) => {
        setEnergyUsage(state => state + amount)
        setEnergyLastUsed(Date.now())
    }

    const energyHasBeenUsed = energyUsage > 0

    useEffect(() => {
        if (!energyHasBeenUsed) return

        let intervalId: any

        const timeout = setTimeout(() => {

            const decrease = () => {
                setEnergyUsage(state => {
                    const update = state - 10
                    if (update < 0) return 0
                    return update
                })
            }

            decrease()

            intervalId = setInterval(decrease, 100)

        }, 2000)

        return () => {
            clearTimeout(timeout)
            if (intervalId) {
                clearInterval(intervalId)
            }
        }

    }, [energyHasBeenUsed, energyLastUsed])

    const attackStateRef = useEffectRef(attackState)

    const onPhysicsUpdate = useCallback((delta: number) => {

        right = isKeyPressed(KEYS.RIGHT)
        left = isKeyPressed(KEYS.LEFT)
        up = isKeyPressed(KEYS.UP)
        down = isKeyPressed(KEYS.DOWN)
        space = isKeyPressed(KEYS.SPACE)

        isMoving = right || left || up || down

        xDir = right ? 1 : left ? -1 : 0
        yDir = up ? 1 : down ? -1 : 0
        v2.set(xDir, yDir)
        v2.normalize()

        if (isMoving) {
            angle = degToRad(v2ToAngleDegrees(v2.x, v2.y))
            angle = lerpRadians(angle, localStateRef.current.prevAngle, 0.5)
            localStateRef.current.prevAngle = angle
            body.setAngle(angle)
        }

        v2.mul(delta * speed)

        if (space) {
            setSpacePressed(true)
        } else {
            setSpacePressed(false)
        }

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

    }, [])

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

        // console.log('space down...')

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

                increaseEnergyUsage(100)

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

    return null

}

export const LgPlayer: React.FC = () => {

    const world = useWorld()

    const addBody = useAddBody()
    const [body, setBody] = useState<null | Body>(null)
    const [combatBody, setCombatBody] = useState<null | Body>(null)

    useEffect(() => {

        const bodyDef: any = {
            type: "dynamic",
            linearDamping: 40,
            angularDamping: 0.1,
            allowSleep: false,
            fixedRotation: true,
        }

        const combatBodyDef: any = {
            type: "kinematic",
            allowSleep: false,
            fixedRotation: true,
        }

        const body = world.createBody(bodyDef)
        const combatBody = world.createBody(combatBodyDef)

        body.setPosition(new Vec2(0, 0))

        const circleShape = Circle(0.5)

        const fixture = body.createFixture({
            shape: circleShape,
        } as any)

        const shortAttackShape = Box((1.5 / 2), (0.5 / 2), new Vec2(0.75, 0))

        combatBody.createFixture({
            shape: shortAttackShape,
            isSensor: true,
        } as any)

        setBody(body)
        setCombatBody(combatBody)

        const unsub: any[] = []

        unsub.push(addBody('test', body))
        unsub.push(addBody('combatBody', combatBody))

        return () => {
            unsub.forEach(fn => fn())
        }

    }, [])

    if (!body || !combatBody) return null

    return (
        <>
            <Controller body={body} combatBody={combatBody}/>
        </>
    )
}
