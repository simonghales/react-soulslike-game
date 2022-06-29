import React, { Suspense } from "react"
import {Circle, Html, useTexture} from "@react-three/drei";
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

const itemsData: Record<string, {
    texture: string,
}> = {
    [ItemType.SPARE_BATTERY]: {
        texture: "assets/sprites/battery-pack-alt.png",
    },
    [ItemType.MELEE_WEAPON]: {
        texture: "assets/sprites/monkey-wrench.png",
    },
}

const ItemVisuals: React.FC<{
    data: ItemData,
}> = ({data}) => {
    const texturePath = itemsData[data.itemType]?.texture ?? ''

    const texture = useTexture(texturePath)

    return (
        <>
            <sprite position={[0, 0, 0.10001]}>
                <spriteMaterial map={texture} depthWrite={false} depthTest={false}/>
            </sprite>
        </>
    )
}

export const CollectableItem: React.FC<{
    data: ItemData,
    isTarget: boolean,
    interacting: boolean,
}> = ({data, isTarget, interacting}) => {
    return (
        <group position={[data.position[0], data.position[1], 0]}>
            {/*<Circle args={[0.5]}>*/}
            {/*    <meshBasicMaterial color={interacting ? 'orange' : isTarget ? 'red' : 'green'} transparent opacity={0.15} depthTest={false} depthWrite={false}/>*/}
            {/*    */}
            {/*</Circle>*/}
            {
                isTarget && (
                    <Html center>
                        <InteractionPrompt quickPrompt interacting={interacting} hidden={false}/>
                    </Html>
                )
            }
            <Suspense fallback={null}>
                <ItemVisuals data={data}/>
            </Suspense>
        </group>
    )
}

export const CollectableItemPreview: React.FC = () => {
    return (
        <Circle args={[0.5]}>
            <meshBasicMaterial color={'green'} transparent opacity={0.5} depthTest={false} depthWrite={false}/>
        </Circle>
    )
}
