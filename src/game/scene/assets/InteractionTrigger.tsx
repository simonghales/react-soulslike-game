import React from "react"
import {Circle, Cylinder, Html} from "@react-three/drei";
import {degToRad} from "three/src/math/MathUtils";
import {GameWorldStateIds} from "../../data/ids";
import {InteractionPrompt} from "../../mobs/frontend/MobDeadBody";

export const interactionTriggerInputsConfig = {
    inputs: {
        onInteractionKey: {
            key: 'onInteractionKey',
            label: 'On Interaction Key',
            defaultValue: '',
            options: {
                options: ['', ...Object.keys(GameWorldStateIds)],
            },
        },
    },
}

export const interactionObjectRadius = 0.4
export const interactionTriggerRadius = 0.6

export const InteractionTriggerPreview: React.FC = () => {
    return (
        <>
            <Cylinder args={[interactionObjectRadius, interactionObjectRadius]} rotation={[degToRad(90), 0, 0]}/>
            <Circle args={[interactionTriggerRadius, 32]}/>
        </>
    )
}

export const InteractionTrigger: React.FC<{
    position: [number, number, number]
    isTarget: boolean,
    interactable: boolean,
    interacting: boolean,
}> = ({position, isTarget, interactable, interacting}) => {
    return (
        <group position={position}>
            <Cylinder args={[interactionObjectRadius, interactionObjectRadius]} rotation={[degToRad(90), 0, 0]}/>
            {
                interactable && (
                    <Circle args={[interactionTriggerRadius * 1.5, 32]}>
                        <meshBasicMaterial color={isTarget ? 'cyan' : 'purple'} transparent opacity={0.5}/>
                    </Circle>
                )
            }
            {
                isTarget && (
                    <>
                        <Html center>
                            <InteractionPrompt interacting={interacting} hidden={false}/>
                        </Html>
                    </>
                )
            }
        </group>
    )
}
