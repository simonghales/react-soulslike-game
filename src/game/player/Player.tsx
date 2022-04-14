import React, {useEffect, useState} from "react"
import {Box, Circle, Cylinder, Html} from "@react-three/drei";
import {degToRad} from "three/src/math/MathUtils";
import {usePhysicsRef, useSyncData} from "react-three-physics";
import {PlayerCamera} from "./PlayerCamera";
import {useSetPlayerRef} from "../state/misc";
import {PlayerAttackStateType, syncKeys} from "../data/keys";
import {setPlayerEnergyUsage} from "../state/player";
import {playerConfig} from "./config";

export const Player: React.FC = () => {

    const ref = usePhysicsRef('test')
    const combatBodyRef = usePhysicsRef('combatBody')

    const playerAttackState = useSyncData(syncKeys.playerAttackState, {
        type: '',
        time: 0,
    })


    const energyUsage = useSyncData(syncKeys.playerEnergyUsage, 0)

    useEffect(() => {
        setPlayerEnergyUsage(energyUsage)
    }, [energyUsage])

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

    return (
        <>
            <group ref={ref}>
                <Cylinder args={[0.5, 0.5, 1.5, 16]}
                          position={[0, 0, 0.75]}
                          rotation={[degToRad(90), 0, 0]}/>
                <Box position={[1.75, 0, 0]} args={[4, 3, 0.4]}>
                    <meshBasicMaterial color={'white'} transparent opacity={0.25}/>
                </Box>
                <Circle args={[playerConfig.sensors.mediumRangeRadius, 32]}>
                    <meshBasicMaterial color={'yellow'} transparent opacity={0.25}/>
                </Circle>
                <Circle args={[playerConfig.sensors.largeRangeRadius, 32]}>
                    <meshBasicMaterial color={'pink'} transparent opacity={0.25}/>
                </Circle>
                <Html center>
                    <div>
                        {attackCompleted ? "complete" : playerAttackState.type}
                    </div>
                </Html>
            </group>
            <group ref={combatBodyRef}>
                <Box position={[playerConfig.sensors.shortAttack.x, 0, 0]} args={[playerConfig.sensors.shortAttack.w, playerConfig.sensors.shortAttack.h, 0.5]}>
                    <meshBasicMaterial color={'red'} transparent opacity={0.5}/>
                </Box>
                <Box position={[playerConfig.sensors.longAttack.x, 0, 0]} args={[playerConfig.sensors.longAttack.w, playerConfig.sensors.longAttack.h, 0.45]}>
                    <meshBasicMaterial color={'orange'} transparent opacity={0.5}/>
                </Box>
            </group>
            <PlayerCamera/>
        </>
    )
}
