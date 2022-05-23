import React, {useCallback, useEffect, useRef, useState} from "react"
import {Box, Circle, Cylinder, Html, useTexture} from "@react-three/drei";
import {degToRad} from "three/src/math/MathUtils";
import {usePhysicsRef, usePhysicsSubscription, useSyncData} from "@simonghales/react-three-physics";
import {PlayerCamera} from "./PlayerCamera";
import {useSetPlayerRef} from "../state/misc";
import {PlayerAttackStateType, syncKeys} from "../data/keys";
import {setPlayerEnergyUsage, setPlayerHealthRemaining} from "../state/frontend/player";
import {playerConfig} from "./config";
import {useFrame} from "@react-three/fiber";
import {PlayerMovementState} from "./types";
import {Object3D} from "three";
import {mapBufferDataToObjectRef} from "../physics/custom";
import {PlanckjsBuffersData} from "@simonghales/react-three-physics/dist/declarations/src/physics/planckjs/buffers";
import {useEventsHandler} from "./frontend/eventsHandler";
import {useFootstepsHandler} from "./frontend/footstepsHandler";

export const Player: React.FC = () => {

    const combatBodyRef = usePhysicsRef('combatBody')

    const ref = useRef<Object3D>(null!)
    const rotateRef = useRef<Object3D>(null!)

    usePhysicsSubscription('test', useCallback((
        buffers: PlanckjsBuffersData,
        index: number,
    ) => {
        mapBufferDataToObjectRef(buffers, index, ref, rotateRef)
    }, []))

    const playerAttackState = useSyncData(syncKeys.playerAttackState, {
        type: '',
        time: 0,
    })

    const {
        energyUsage,
        movementState,
        healthRemaining,
        selectedTarget,
    } = useSyncData(syncKeys.playerState, {
        energyUsage: 0,
        movementState: '',
        healthRemaining: playerConfig.defaultHealth,
        selectedTarget: '',
    })

    const localStateRef = useRef({
        previousHealthRemaining: healthRemaining,
    })

    const [playerDamaged, setPlayerDamaged] = useState(0)

    useEffect(() => {
        if (!playerDamaged) return
        const timeout = setTimeout(() => {
            setPlayerDamaged(0)
        }, 300)
        return () => {
            clearTimeout(timeout)
        }
    }, [playerDamaged])

    useEffect(() => {
        setPlayerHealthRemaining(healthRemaining)
        if (healthRemaining < localStateRef.current.previousHealthRemaining) {
            setPlayerDamaged(Date.now())
        }
        localStateRef.current.previousHealthRemaining = healthRemaining
    }, [healthRemaining])

    useEffect(() => {
        setPlayerEnergyUsage(energyUsage)
    }, [energyUsage])

    const shrink = movementState === PlayerMovementState.PENDING_JUMP || movementState === PlayerMovementState.ROLLING
    const stretch = movementState === PlayerMovementState.JUMPING

    const [attackCompleted, setAttackCompleted] = useState(false)

    useSetPlayerRef(ref)

    useEffect(() => {
        setAttackCompleted(false)
        const timeouts: any[] = []

        if (playerAttackState.type === PlayerAttackStateType.SHORT) {
            const completed = playerAttackState.time + 250
            const timeLeft = completed - Date.now()
            timeouts.push(setTimeout(() => {
                setAttackCompleted(true)
            }, timeLeft))

        } else if (playerAttackState.type === PlayerAttackStateType.LONG) {
            const completed = playerAttackState.time + 1000
            const timeLeft = completed - Date.now()
            timeouts.push(setTimeout(() => {
                setAttackCompleted(true)
            }, timeLeft))
        }

        return () => {
            timeouts.forEach(timeout => {
                clearTimeout(timeout)
            })
        }

    }, [playerAttackState])

    const color = !!playerDamaged ? 'red' :
                    movementState === PlayerMovementState.STUNNED ? 'purple' :
                    movementState === PlayerMovementState.ATTACKING ? 'orange' :
                    movementState === PlayerMovementState.PENDING_ATTACK ? 'yellow' :
                        movementState === PlayerMovementState.COOLDOWN ? 'grey' : 'white'

    const texture = useTexture("assets/rat-sword.png")

    useEventsHandler(ref)
    useFootstepsHandler(ref)

    return (
        <>
            <group ref={ref}>
                <group ref={rotateRef}>
                    {/*<Circle args={[0.5, 32]}>*/}
                    {/*    <meshBasicMaterial color={'orange'} transparent opacity={0.5}/>*/}
                    {/*</Circle>*/}
                    {/*<Cylinder args={[0.5, 0.5, 1.5, 16]}*/}
                    {/*          position={[0, 0, 0.75]}*/}
                    {/*          rotation={[degToRad(90), 0, 0]}/>*/}
                    <Box position={[1, 0, 0]} args={[2, 0.2, 0.4]}>
                        <meshBasicMaterial color={'white'} transparent opacity={0.25}/>
                    </Box>
                    {/*<Box position={[1.75, 0, 0]} args={[4, 3, 0.4]}>*/}
                    {/*    <meshBasicMaterial color={'white'} transparent opacity={0.25}/>*/}
                    {/*</Box>*/}
                    {/*<Circle args={[playerConfig.sensors.mediumRangeRadius, 32]}>*/}
                    {/*    <meshBasicMaterial color={'yellow'} transparent opacity={0.25}/>*/}
                    {/*</Circle>*/}
                    {/*<Circle args={[playerConfig.sensors.largeRangeRadius, 32]}>*/}
                    {/*    <meshBasicMaterial color={'pink'} transparent opacity={0.25}/>*/}
                    {/*</Circle>*/}
                    {/*<Html center>*/}
                    {/*    <div>*/}
                    {/*        {attackCompleted ? "complete" : playerAttackState.type}*/}
                    {/*    </div>*/}
                    {/*</Html>*/}
                    <Circle args={[playerConfig.sensors.interactionRadius, 32]}>
                        <meshBasicMaterial color={'pink'} transparent opacity={0.05}/>
                    </Circle>
                    {/*<Circle args={[playerConfig.sensors.extraSmallCombatRadius, 32]}>*/}
                    {/*    <meshBasicMaterial color={'pink'} transparent opacity={0.05}/>*/}
                    {/*</Circle>*/}
                    {/*<Circle args={[playerConfig.sensors.smallCombatRadius, 32]}>*/}
                    {/*    <meshBasicMaterial color={'pink'} transparent opacity={0.05}/>*/}
                    {/*</Circle>*/}
                    {/*<Circle args={[playerConfig.sensors.mediumCombatRadius, 32]}>*/}
                    {/*    <meshBasicMaterial color={'pink'} transparent opacity={0.05}/>*/}
                    {/*</Circle>*/}
                    {/*<Circle args={[playerConfig.sensors.largeCombatRadius, 32]}>*/}
                    {/*    <meshBasicMaterial color={'pink'} transparent opacity={0.05}/>*/}
                    {/*</Circle>*/}
                    {/*<Circle args={[playerConfig.sensors.extraLargeCombatRadius, 32]}>*/}
                    {/*    <meshBasicMaterial color={'pink'} transparent opacity={0.05}/>*/}
                    {/*</Circle>*/}
                </group>
                <sprite scale={shrink ? [1.5, 1, 1.5] : stretch ? [1.5, 2, 1.5] : [1.5, 1.5, 1.5]} position={[0.125, 0.2, 0.10001]}>
                    <spriteMaterial color={color} map={texture} depthWrite={false} depthTest={false}/>
                </sprite>
            </group>
            <group ref={combatBodyRef}>
                <Box position={[playerConfig.sensors.shortAttack.x, 0, 0]} args={[playerConfig.sensors.shortAttack.w, playerConfig.sensors.shortAttack.h, 0.5]}>
                    <meshBasicMaterial color={'red'} transparent opacity={0.15}/>
                </Box>
                <Box position={[playerConfig.sensors.longAttack.x, 0, 0]} args={[playerConfig.sensors.longAttack.w, playerConfig.sensors.longAttack.h, 0.45]}>
                    <meshBasicMaterial color={'orange'} transparent opacity={0.15}/>
                </Box>
            </group>
            <PlayerCamera/>
        </>
    )
}
