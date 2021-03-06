import React, {useEffect, useState} from "react"
import {SyncComponent} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../data/keys";
import {useWorld} from "../../../worker/WorldProvider";
import {Body, Box, Circle, Vec2} from "planck";
import {halve} from "../../../utils/physics";
import {COLLISION_FILTER_GROUPS, CollisionTypes} from "../../data/collisions";
import {interactionObjectRadius, interactionTriggerRadius} from "./InteractionTrigger";
import {useIsTargetedItem} from "../../state/backend/player";
import {useInteractionStateHandler} from "../../mobs/backend/LgMobDeadBody";
import {emitPlayerCarvingBegan, emitPlayerInteractionEnd} from "../../events/player";
import {setStateFlag} from "../../state/backend/scene";

export type InteractionTriggerData = {
    id: string,
    position: [number, number, number],
    onInteractionKey: string,
}

const useInteractionTriggerBody = (data: InteractionTriggerData, interactable: boolean) => {

    const world = useWorld()
    const [body, setBody] = useState(null as null | Body)

    useEffect(() => {

        const itemId = data.id

        const body = world.createBody({
            type: "static",
            position: new Vec2(data.position[0], data.position[1]),
            userData: {
                collisionType: CollisionTypes.INTERACTIVE_ITEM,
                id: itemId,
            }
        })

        body.createFixture({
            shape: Circle(interactionObjectRadius),
            filterCategoryBits: COLLISION_FILTER_GROUPS.environment,
        })

        body.createFixture({
            shape: Circle(interactionTriggerRadius),
            filterCategoryBits: COLLISION_FILTER_GROUPS.items,
            filterMaskBits: COLLISION_FILTER_GROUPS.playerRange,
            isSensor: true,
            userData: {
                collisionType: CollisionTypes.INTERACTIVE_ITEM,
                collisionId: itemId,
            }
        })

        // body.createFixture({
        //     shape: Box(halve(w), halve(h)),
        //     filterCategoryBits: breakable ? COLLISION_FILTER_GROUPS.environment | COLLISION_FILTER_GROUPS.npcs : COLLISION_FILTER_GROUPS.environment,
        //     userData: {
        //         collisionId: id,
        //         collisionType: breakable ? CollisionTypes.BREAKABLE_BARRIER : CollisionTypes.BARRIER,
        //     }
        // })

        setBody(body)

        return () => {
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
    }, [])

    useEffect(() => {
        if (interactable || !body) return

        for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
            const fixtureData = fixture.getUserData() as any
            if (fixtureData?.collisionType === CollisionTypes.INTERACTIVE_ITEM) {
                body.destroyFixture(fixture)
                // fixture.setFilterCategoryBits(0)
                // fixture.setFilterMaskBits(0)
            }
        }

    }, [body, interactable])

}

export const LgInteractionTrigger: React.FC<{
    data: InteractionTriggerData,
}> = ({data}) => {


    const isTarget = useIsTargetedItem(data.id)

    const [interacted, setInteracted] = useState(false)

    const interactable = !interacted

    useInteractionTriggerBody(data, interactable)

    const {
        interacting,
        interactionBegan,
        clearInteraction,
    } = useInteractionStateHandler(data.id)

    useEffect(() => {
        if (!interacting) return

        const remainingTime = (interactionBegan + 400) - performance.now()

        const timeout = setTimeout(() => {
            clearInteraction()
            emitPlayerInteractionEnd(data.id, performance.now())
            setInteracted(true)
            if (data.onInteractionKey) {
                setStateFlag(data.onInteractionKey)
            }
        }, remainingTime)

        return () => {
            clearTimeout(timeout)
        }

    }, [interacting, interactionBegan])

    return (
        <SyncComponent id={data.id} interactable={interactable} interacting={interacting} componentId={componentSyncKeys.interactionTrigger} isTarget={isTarget && interactable} position={data.position}/>
    )

}

export const LgInteractionTriggersHandler: React.FC<{
    data: InteractionTriggerData[],
}> = ({data}) => {
    return (
        <>
            {
                data.map(instance => (
                    <LgInteractionTrigger data={instance} key={instance.id}/>
                ))
            }
        </>
    )
}
