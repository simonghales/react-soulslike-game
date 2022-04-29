import React, {useEffect} from "react"
import {Box, Cylinder, Html, Sphere} from "@react-three/drei";
import {degToRad} from "three/src/math/MathUtils";
import {usePhysicsRef, useSyncData} from "react-three-physics";
import styled from "styled-components";
import {getMobSyncKey} from "../data/keys";
import {mobsConfig} from "../data/mobs";
import {GoalType} from "./types";

const StyledContainer = styled.div`
  width: 90px;
  height: 12px;
  background-color: grey;
  border: 1px solid black;
  position: relative;
  overflow: hidden;
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

export const BasicMob: React.FC<{
    id: string,
}> = ({id}) => {

    const {
        healthRemaining,
        attackingState,
        hasAttackToken,
        goal,
    } = useSyncData(getMobSyncKey(id), {
        healthRemaining: 1000,
        attackingState: null,
        hasAttackToken: false,
        goal: {
            type: GoalType.IDLE,
        }
    })

    const targetPosition = useSyncData(`mob-${id}-targetPosition`, null)

    // useEffect(() => {
    //     console.log('attackingState', attackingState)
    // }, [attackingState])

    const isAttacking = !!attackingState

    const ref = usePhysicsRef(id)

    const healthPercent = (100 - (healthRemaining / mobsConfig.basic.health) * 100)

    const isAttackGoal = goal?.type === GoalType.ATTACK_ENTITY

    let color = 'purple'

    // if (isAttackGoal) {
    //     color = 'red'
    // } else {
    //     if (goal?.data?.hasStandbyToken) {
    //         color = 'orange'
    //     }
    // }

    return (
        <>
            <group ref={ref}>
                <Cylinder args={[0.5, 0.5, 1.5, 16]}
                          position={[0, 0, 0.75]}
                          rotation={[degToRad(90), 0, 0]}>
                    <meshBasicMaterial color={color}/>
                </Cylinder>
                <Box position={[mobsConfig.basic.sensors.attackRange.x, 0, 0]} args={[mobsConfig.basic.sensors.attackRange.w, mobsConfig.basic.sensors.attackRange.h, 0.4]}>
                    <meshBasicMaterial color={isAttacking ? 'red' : 'white'} transparent opacity={0.25}/>
                </Box>
                <Box position={[mobsConfig.basic.sensors.attack.x, 0, 0]} args={[mobsConfig.basic.sensors.attack.w, mobsConfig.basic.sensors.attack.h, 0.5]}>
                    <meshBasicMaterial color={isAttacking ? 'red' : 'white'} transparent opacity={0.25}/>
                </Box>
                <Html center position={[0, 0.5, 0]}>
                    <StyledContainer>
                        <StyledBar healthPercent={healthPercent}/>
                    </StyledContainer>
                </Html>
            </group>
            {
                targetPosition && (
                    <Sphere args={[0.2]} position={[targetPosition.x, targetPosition.y, 0]}/>
                )
            }
        </>
    )
}
