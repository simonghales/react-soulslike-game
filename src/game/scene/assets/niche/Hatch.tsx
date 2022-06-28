import React from "react"
import {Circle, Html} from "@react-three/drei";
import {InteractionPrompt} from "../../../mobs/frontend/MobDeadBody";

export const Hatch: React.FC<{
    isTarget: boolean,
    entering: boolean,
    activated: boolean,
    position: [number, number],
}> = ({position, entering, activated, isTarget}) => {
    return (
        <Circle args={[0.5]} position={[position[0], position[1], 0]}>
            <meshBasicMaterial color={activated ? isTarget ? 'red' : 'green' : 'purple'} transparent opacity={0.5} depthTest={false} depthWrite={false}/>
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
