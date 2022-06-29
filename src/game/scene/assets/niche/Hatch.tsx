import React from "react"
import {Circle, Html} from "@react-three/drei";
import {InteractionPrompt} from "../../../mobs/frontend/MobDeadBody";

export const Hatch: React.FC<{
    isTarget: boolean,
    entering: boolean,
    activated: boolean,
    position: [number, number],
    climbing: boolean,
}> = ({position, entering, activated, climbing, isTarget}) => {
    return (
        <Circle args={[0.5]} position={[position[0], position[1], climbing ? 1 : 0]}>
            <meshBasicMaterial color={climbing ? 'orange' : activated ? isTarget ? 'red' : 'green' : 'purple'} transparent opacity={0.5} depthTest={false} depthWrite={false}/>
            {
                isTarget && (
                    <Html center>
                        <InteractionPrompt quickPrompt interacting={entering} hidden={false}/>
                    </Html>
                )
            }
        </Circle>
    )
}
