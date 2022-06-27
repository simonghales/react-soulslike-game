import React, {useCallback, useEffect, useState} from "react"
import {ItemData} from "./ItemsManager";
import {SyncComponent, useOnKeyDown, useOnKeyUp} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../data/keys";
import {useWorld} from "../../../worker/WorldProvider";
import {Body, Circle, Vec2, World} from "planck";
import {COLLISION_FILTER_GROUPS, CollisionTypes} from "../../data/collisions";
import {addItemToPlayerInventory, useIsTargetedItem} from "../../state/backend/player";
import {INPUT_KEYS} from "../../input/INPUT_KEYS";
import {setItemCollected} from "../../state/backend/scene";

export const removeWorldBody = (world: World, body: Body) => {

    const remove = () => {
        const cleanup = () => {
            if (world.isLocked()) {
                throw new Error('World is still locked, failed to remove body.')
            }
            world.destroyBody(body)
        }
        if (world.isLocked()) {
            setTimeout(cleanup, 0)
        } else {
            cleanup()
        }
    }

    return remove

}

export const useItemBody = (data: ItemData) => {

    const world = useWorld()

    useEffect(() => {

        const body = world.createBody({
            type: "static",
            position: new Vec2(data.position[0], data.position[1]),
        })

        body.createFixture({
            shape: new Circle(0.5),
            filterCategoryBits: COLLISION_FILTER_GROUPS.items,
            isSensor: true,
            userData: {
                collisionId: data.id,
                collisionType: CollisionTypes.INTERACTIVE_ITEM,
            },
        })

        return removeWorldBody(world, body)

    }, [])

}

export const LgItem: React.FC<{
    data: ItemData,
}> = ({data}) => {

    const [collected, setCollected] = useState(false)

    const isTarget = useIsTargetedItem(data.id)

    useItemBody(data)

    const [collectHeld, setCollectHeld] = useState(false)

    const interacting = isTarget && collectHeld

    useOnKeyDown(INPUT_KEYS.C[0], useCallback(() => {
        if (!isTarget) return
        setCollectHeld(true)
        addItemToPlayerInventory(data.itemType, 1)
        setItemCollected(data.id)
        setCollected(true)
    }, [isTarget]))

    // useOnKeyUp(INPUT_KEYS.C[0], useCallback(() => {
    //     setCollectHeld(false)
    // }, []))
    //
    // useEffect(() => {
    //     if (isTarget) return
    //     setCollectHeld(false)
    // }, [isTarget])

    if (collected) return null

    return (
        <SyncComponent interacting={interacting} isTarget={isTarget} data={data} id={data.id} componentId={componentSyncKeys.item}/>
    )
}
