import React, {useEffect, useMemo, useState} from "react"
import {sceneStateProxy, useIsFlag} from "../../../state/backend/scene";
import {GameWorldStateIds, WorldPositionId} from "../../../data/ids";
import {SyncComponent} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../../data/keys";
import {useWorld} from "../../../../worker/WorldProvider";
import {Body, Circle, Vec2} from "planck";
import {removeWorldBody} from "../../items/LgItem";
import {COLLISION_FILTER_GROUPS, CollisionTypes} from "../../../data/collisions";
import {useIsTargetedItem} from "../../../state/backend/player";

const useHatchBody = (id: string, position: [number, number], activated: boolean) => {

    const [body, setBody] = useState(null as null | Body)
    const world = useWorld()

    useEffect(() => {
        const body = world.createBody({
            type: "static",
            position: new Vec2(position[0], position[1]),
        })

        setBody(body)

        body.createFixture({
            shape: new Circle(0.05),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.items,
            userData: {
                collisionId: id,
                collisionType: CollisionTypes.INTERACTIVE_ITEM,
            },
        })

        return removeWorldBody(world, body)

    }, [])

    useEffect(() => {
        if (!body) return
        body.setActive(activated)
    }, [body, activated])

}

export const LgHatch: React.FC = () => {

    const id = 'hatch'

    const position = sceneStateProxy.miscData.worldPositions[WorldPositionId.L0_HATCH]

    const activated = useIsFlag(GameWorldStateIds.L0_AI_OPEN_HATCH)

    if (!position) throw new Error(`No position...`)

    useHatchBody(id, position, activated)

    const isTarget = useIsTargetedItem(id)

    return <SyncComponent isTarget={isTarget} activated={activated} componentId={componentSyncKeys.hatch} id={id} position={position}/>
}
