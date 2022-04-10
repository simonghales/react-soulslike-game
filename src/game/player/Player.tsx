import React, {useEffect, useState} from "react"
import {Box, Cylinder, Html} from "@react-three/drei";
import {degToRad} from "three/src/math/MathUtils";
import {usePhysicsRef, useSyncData} from "react-three-physics";
import {PlayerCamera} from "./PlayerCamera";
import {useSetPlayerRef} from "../state/misc";
import {PlayerAttackStateType, syncKeys} from "../data/keys";
import {setPlayerEnergyUsage} from "../state/player";

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
                <Html center>
                    <div>
                        {attackCompleted ? "complete" : playerAttackState.type}
                    </div>
                </Html>
            </group>
            <group ref={combatBodyRef}>
                <Box position={[0.75, 0, 0]} args={[1.5, 0.5, 0.5]}>
                    <meshBasicMaterial color={'red'} transparent opacity={0.5}/>
                </Box>
                <Box position={[1, 0, 0]} args={[2, 0.75, 0.45]}>
                    <meshBasicMaterial color={'orange'} transparent opacity={0.5}/>
                </Box>
            </group>
            <PlayerCamera/>
        </>
    )
}
