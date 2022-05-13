import React, {Suspense, useEffect, useRef, useState} from "react"
import {Box, Cylinder, Html, Sphere, useTexture} from "@react-three/drei";
import {degToRad} from "three/src/math/MathUtils";
import {usePhysicsRef, useSyncData} from "@simonghales/react-three-physics";
import styled from "styled-components";
import {getMobSyncKey} from "../../data/keys";
import {mobsConfig} from "../../data/mobs";
import {GoalType} from "../types";
import {AttackGoalSubGoalTypes, AttackStateType} from "../brain/types";
import {useEventsHandler} from "./eventsHandler";

const StyledContainer = styled.div`
  width: 70px;
  height: 10px;
  background-color: grey;
  border: 1px solid black;
  position: relative;
  overflow: hidden;
  transform: translateY(-50px);
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

const Visuals: React.FC<{
    color: string,
}> = ({color}) => {
    const texture = useTexture("assets/mob-sword.png")
    return (
        <sprite scale={[1.5, 1.5, 1.5]} position={[0, 0, 0.1]}>
            <spriteMaterial color={color} map={texture} depthWrite={false} depthTest={false}/>
        </sprite>
    )
}

export const BasicMob: React.FC<{
    id: string,
}> = ({id}) => {

    // const {
    //     healthRemaining,
    //     attackingState,
    //     hasAttackToken,
    //     goal,
    // } = useSyncData(getMobSyncKey(id), {
    //     healthRemaining: 1000,
    //     attackingState: null,
    //     hasAttackToken: false,
    //     goal: {
    //         type: GoalType.IDLE,
    //     }
    // })

    // const targetPosition = useSyncData(`mob-${id}-targetPosition`, null)

    // useEffect(() => {
    //     console.log('attackingState', attackingState)
    // }, [attackingState])

    // const isAttacking = !!attackingState

    const ref = usePhysicsRef(id)


    // const isAttackGoal = goal?.type === GoalType.ATTACK_ENTITY

    const debugData = useSyncData(`mob--${id}`, {})

    const {
        attackState,
        subGoal,
        healthRemaining,
        isAlive,
    } = useSyncData(`mob--${id}-state`, {
        attackState: null,
        subGoal: null,
        healthRemaining: mobsConfig.basic.health,
        isAlive: true,
    })

    const localStateRef = useRef({
        previousHealthRemaining: mobsConfig.basic.health,
    })

    const [lastDamaged, setLastDamaged] = useState(0)

    const damaged = !!lastDamaged

    useEffect(() => {
        if (healthRemaining >= localStateRef.current.previousHealthRemaining) return
        setLastDamaged(Date.now())
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

    const healthPercent = (100 - (healthRemaining / mobsConfig.basic.health) * 100)

    const targetPosition = debugData?.targetPosition

    const isCharging = attackState?.type === AttackStateType.CHARGING
    const isAttacking = attackState?.type === AttackStateType.ATTACKING

    const isDamageSubGoal = subGoal?.type === AttackGoalSubGoalTypes.DAMAGE

    const color = damaged ? 'red' : 'white'

    useEventsHandler(id, ref)

    return (
        <>
            <group ref={ref}>
                {/*<Cylinder args={[0.5, 0.5, 1.5, 16]}*/}
                {/*          position={[0, 0, 0.75]}*/}
                {/*          rotation={[degToRad(90), 0, 0]}>*/}
                {/*    <meshBasicMaterial color={color}/>*/}
                {/*</Cylinder>*/}
                {
                    isAlive && (
                        <>
                            <Box position={[mobsConfig.basic.sensors.attackRange.x, 0, 0]} args={[mobsConfig.basic.sensors.attackRange.w, mobsConfig.basic.sensors.attackRange.h, 0.4]}>
                                <meshBasicMaterial color={isCharging ? 'red' : isDamageSubGoal ? 'orange' : 'white'} transparent opacity={0.1}/>
                            </Box>
                            <Box position={[mobsConfig.basic.sensors.attack.x, 0, 0]} args={[mobsConfig.basic.sensors.attack.w, mobsConfig.basic.sensors.attack.h, 0.5]}>
                                <meshBasicMaterial color={isAttacking ? 'red' : 'white'} transparent opacity={0.1}/>
                            </Box>
                            <Html center position={[0, 0, 0]}>
                                <StyledContainer>
                                    <StyledBar healthPercent={healthPercent}/>
                                </StyledContainer>
                            </Html>
                        </>
                    )
                }
                <Suspense fallback={null}>
                    <Visuals color={color}/>
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
