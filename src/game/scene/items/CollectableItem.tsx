import React from "react"
import {Circle, Html} from "@react-three/drei";
import {ItemId, ItemType} from "../../data/ids";
import {ItemData} from "./ItemsManager";
import {InteractionPrompt} from "../../mobs/frontend/MobDeadBody";

export const collectableItemInputsConfig = {
    inputs: {
        itemType: {
            key: 'itemType',
            label: 'Item Type',
            defaultValue: '',
            options: {
                options: Object.keys(ItemType),
            }
        },
        itemId: {
            key: 'itemId',
            label: 'Item ID',
            defaultValue: '',
            options: {
                options: Object.keys(ItemId),
            }
        },
    }
}

export const CollectableItem: React.FC<{
    data: ItemData,
    isTarget: boolean,
    interacting: boolean,
}> = ({data, isTarget, interacting}) => {
    return (
        <Circle args={[0.5]} position={[data.position[0], data.position[1], 0]}>
            <meshBasicMaterial color={interacting ? 'orange' : isTarget ? 'red' : 'green'} transparent opacity={0.5} depthTest={false} depthWrite={false}/>
            {
                isTarget && (
                    <Html center>
                        <InteractionPrompt quickPrompt interacting={interacting} hidden={false}/>
                    </Html>
                )
            }
        </Circle>
    )
}

export const CollectableItemPreview: React.FC = () => {
    return (
        <Circle args={[0.5]}>
            <meshBasicMaterial color={'green'} transparent opacity={0.5} depthTest={false} depthWrite={false}/>
        </Circle>
    )
}
