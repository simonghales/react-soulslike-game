import React, {Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState} from "react"
import {Box, Html, useTexture} from "@react-three/drei";
import {usePhysicsSubscription, useSyncData} from "@simonghales/react-three-physics";
import styled, {css} from "styled-components";
import {getMobStateSyncKey, getMobSyncKey} from "../../data/keys";
import {AttackGoalSubGoalTypes, AttackStateType} from "../brain/types";
import {useEventsHandler} from "./eventsHandler";
import {PlanckjsBuffersData} from "@simonghales/react-three-physics/dist/declarations/src/physics/planckjs/buffers";
import {mapBufferDataToObjectRef} from "../../physics/custom";
import {Object3D} from "three";
import {useSetPlayerTargetRef} from "../../state/frontend/player";
import {useFootstepsHandler} from "../../player/frontend/footstepsHandler";
import {MobType} from "../../state/game";
import {getMobConfig} from "../../data/mobs";


const cssSelected = css`
  box-shadow: 0 0 0 3px white;
`

const StyledContainer = styled.div<{
    isSelectedTarget: boolean,
}>`
  width: 70px;
  height: 10px;
  background-color: #68719599;
  border: 1px solid black;
  position: relative;
  overflow: hidden;
  transform: translateY(-50px);
  ${props => props.isSelectedTarget ? cssSelected : ''};
  border-radius: 2px;
`

const StyledBar = styled.div<{
    healthPercent: number,
}>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #c40b1d;
  transform: translateX(-${props => props.healthPercent}%);
`

const baseScale = [1.5, 1.5, 1.5]
const largeScale = [2.5, 2.5, 2.5]

const Visuals: React.FC<{
    color: string,
    type: MobType,
}> = ({color, type}) => {
    const texture = useTexture("assets/mob-sword.png")
    return (
        <sprite scale={type === MobType.BASIC ? baseScale as any : largeScale as any} position={[0.125, 0, 0.1]}>
            <spriteMaterial color={color} map={texture} depthWrite={false} depthTest={false}/>
        </sprite>
    )
}

const DebugVisuals: React.FC<{
    isCharging: boolean,
    isDamageSubGoal: boolean,
    isAttacking: boolean,
    type: MobType,
}> = ({
                              isCharging,
                              isDamageSubGoal,
                              isAttacking,
                                type,
                          }) => {

    const config = getMobConfig(type)

    return (
        <>
            <Box position={[config.sensors.attackRange.x, 0, 0]} args={[config.sensors.attackRange.w, config.sensors.attackRange.h, 0.4]}>
                <meshBasicMaterial color={isCharging ? 'red' : isDamageSubGoal ? 'orange' : 'white'} transparent opacity={0.1}/>
            </Box>
            <Box position={[config.sensors.attack.x, 0, 0]} args={[config.sensors.attack.w, config.sensors.attack.h, 0.5]}>
                <meshBasicMaterial color={isAttacking ? 'red' : 'white'} transparent opacity={0.1}/>
            </Box>
        </>
    )

}

export const BasicMob: React.FC<{
    id: string,
    x: number,
    y: number,
    type: MobType,
}> = ({id, x, y, type}) => {

    const ref = useRef<Object3D>(null!)

    useLayoutEffect(() => {
        const object = ref.current
        if (!object) return
        object.position.x = x
        object.position.y = y
    }, [])

    const {
        isAlive,
        deathPosition,
    } = useSyncData(getMobSyncKey(id), {
        isAlive: true,
        deathPosition: null,
    })

    const rotateRef = useRef<Object3D>(null!)

    usePhysicsSubscription(id, useCallback((
        buffers: PlanckjsBuffersData,
        index: number,
    ) => {
        mapBufferDataToObjectRef(buffers, index, ref, rotateRef)
    }, []))


    const {
        attackState,
        subGoal,
        healthRemaining,
        isSelectedTarget,
    } = useSyncData(getMobStateSyncKey(id), {
        attackState: null,
        subGoal: null,
        healthRemaining: getMobConfig(type).health,
        isSelectedTarget: false,
    })

    useSetPlayerTargetRef(isSelectedTarget && isAlive, ref)

    const localStateRef = useRef({
        previousHealthRemaining: getMobConfig(type).health,
    })

    const [lastDamaged, setLastDamaged] = useState(0)

    const damaged = !!lastDamaged

    useEffect(() => {
        if (healthRemaining >= localStateRef.current.previousHealthRemaining) return
        setLastDamaged(performance.now())
    }, [healthRemaining])

    useEffect(() => {
        if (!lastDamaged) return
        const timeout = setTimeout(() => {
            setLastDamaged(0)
        }, 750)
        return () => {
            clearTimeout(timeout)
        }
    }, [lastDamaged])

    const healthPercent = (100 - (healthRemaining / getMobConfig(type).health) * 100)

    const isCharging = attackState?.type === AttackStateType.CHARGING
    const isAttacking = attackState?.type === AttackStateType.ATTACKING

    const isDamageSubGoal = subGoal?.type === AttackGoalSubGoalTypes.DAMAGE

    const color = damaged ? 'red' : 'white'

    useEventsHandler(id, ref)

    useFootstepsHandler(ref)

    return (
        <>
            <group ref={ref}>
                <group ref={rotateRef}>
                    {/*<Circle args={[0.6, 32]}>*/}
                    {/*    <meshBasicMaterial color={"orange"} transparent opacity={0.75}/>*/}
                    {/*</Circle>*/}
                    {
                        isAlive && (
                            <>
                                <DebugVisuals isCharging={isCharging}
                                              isDamageSubGoal={isDamageSubGoal}
                                              isAttacking={isAttacking} type={type}/>
                                <Html center position={[0, 0, 0]}>
                                    <StyledContainer isSelectedTarget={isSelectedTarget}>
                                        <StyledBar healthPercent={healthPercent}/>
                                    </StyledContainer>
                                </Html>
                            </>
                        )
                    }
                </group>
                <Suspense fallback={null}>
                    {
                        isAlive && (
                            <>
                                <Visuals color={color} type={type}/>
                            </>
                        )
                    }
                </Suspense>
            </group>
            {/*{*/}
            {/*    (targetPosition && isAlive) && (*/}
            {/*        <Sphere args={[0.2]} position={[targetPosition[0], targetPosition[1], 0]}/>*/}
            {/*    )*/}
            {/*}*/}
        </>
    )
}
