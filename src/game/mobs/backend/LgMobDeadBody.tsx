import React, {useCallback, useEffect, useState} from "react"
import {componentSyncKeys} from "../../data/keys";
import {SyncComponent, useAddBody} from "@simonghales/react-three-physics";
import {useWorld} from "../../../worker/WorldProvider";
import {Body, Circle, Vec2} from "planck";
import {COLLISION_FILTER_GROUPS, MobCollisionTypes} from "../../data/collisions";
import {addItemToPlayerInventory, useIsTargetedItem} from "../../state/backend/player";
import {InteractionEvent, InteractionEventType, useOnInteractionEvents} from "../../events/interaction";
import {emitPlayerCarvingBegan, emitPlayerCarvingEnd} from "../../events/player";
import {removeDeadBody} from "../../state/game";

const useMobDeadBody = (id: string, x: number, y: number) => {

    const world = useWorld()
    const addBody = useAddBody()

    const [body, setBody] = useState(null as null | Body)

    const [controller] = useState(() => ({
        removed: false,
        removeBody: (() => {
            return false
        }) as () => boolean,
    }))

    useEffect(() => {

        const body = world.createBody({
            type: "dynamic",
            linearDamping: 160,
            angularDamping: 0.1,
            allowSleep: true,
            fixedRotation: true,
        })

        body.setPosition(new Vec2(x, y))

        const circleShape = Circle(0.025)

        const fixture = body.createFixture({
            shape: circleShape,
            density: 200,
            filterCategoryBits: COLLISION_FILTER_GROUPS.items,
            filterMaskBits: COLLISION_FILTER_GROUPS.player | COLLISION_FILTER_GROUPS.npcs | COLLISION_FILTER_GROUPS.playerRange,
            userData: {
                collisionId: id,
            }
        })

        setBody(body)

        const unsub = addBody(id, body)

        controller.removeBody = () => {
            if (controller.removed) return false
            setBody(null)
            unsub()
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
            controller.removed = true
            console.log('removed body...')
            return true
        }

        return () => {
            controller.removeBody()
        }

    }, [])

    return [body, controller]

}

const CARVING_DURATION = 2000

export enum ItemType {
    MEDIUM_BRAIN = 'MEDIUM_BRAIN',
    MEDIUM_BONES = 'MEDIUM_BONES',
}

export type ChestInventoryItem = {
    type: ItemType,
    count: number,
}

const defaultInventory: ChestInventoryItem[] = [
    {
        type: ItemType.MEDIUM_BRAIN,
        count: 1,
    },
    {
        type: ItemType.MEDIUM_BONES,
        count: 1,
    },
]

const retrieveNextInventoryItem = (inventory: ChestInventoryItem[], setInventory: any) => {

    const update = [...inventory]

    const nextItem = update.shift()

    if (nextItem) {
        addItemToPlayerInventory(nextItem.type, nextItem.count)
    }

    setInventory(update)

}

const BodyHandler: React.FC<{
    id: string,
    x: number,
    y: number,
}> = ({id, x, y}) => {

    const body = useMobDeadBody(id, x, y)

    return null

}

export const LgMobDeadBody: React.FC<{
    id: string,
    x: number,
    y: number,
}> = ({id, x, y}) => {

    const [interacting, setInteracting] = useState(false)
    const [interactionBegan, setInteractionBegan] = useState(0)
    const [carving, setCarving] = useState(0)
    const [inventory, setInventory] = useState(defaultInventory)
    const emptyInventory = inventory.length === 0

    const isTarget = useIsTargetedItem(id)

    useEffect(() => {
        if (!emptyInventory) return
        const timeout = setTimeout(() => {
            removeDeadBody(id)
        }, 200)
        return () => {
            clearTimeout(timeout)
        }
    }, [emptyInventory])

    useOnInteractionEvents(id, useCallback((data: InteractionEvent) => {
        switch (data.type) {
            case InteractionEventType.INTERACTION_BEGIN:
                setInteracting(true)
                setInteractionBegan(Date.now())
                break;
            case InteractionEventType.INTERACTION_END:
                setInteracting(false)
                break;
            case InteractionEventType.INTERACTION_INTERRUPTED:
                setInteracting(false)
                setCarving(0)
                break;
        }
    }, []))

    useEffect(() => {
        if (!interacting) return

        const remainingTime = (interactionBegan + 200) - Date.now()

        const timeout = setTimeout(() => {
            setCarving(Date.now())
            emitPlayerCarvingBegan(id, Date.now())
        }, remainingTime)

        return () => {
            clearTimeout(timeout)
        }

    }, [interacting, interactionBegan])

    useEffect(() => {
        if (!carving) return
        const timeRemaining = (carving + CARVING_DURATION) - Date.now()
        let cleared = false

        const timeout = setTimeout(() => {
            setCarving(0)
            setInteracting(false)
            setInteractionBegan(0)
            emitPlayerCarvingEnd(id, Date.now())
            cleared = true

            retrieveNextInventoryItem(inventory, setInventory)

        }, timeRemaining)

        return () => {
            clearTimeout(timeout)
            if (!cleared) {
                emitPlayerCarvingEnd(id, Date.now())
            }
        }

    }, [carving])

    return (
        <>
            {
                !emptyInventory && (
                    <BodyHandler id={id} x={x} y={y}/>
                )
            }
            <SyncComponent id={id} carving={carving}
                           interacting={interacting}
                           isTarget={isTarget}
                           componentId={componentSyncKeys.basicMobDead}
                           empty={emptyInventory}
                           x={x}
                           y={y}/>
        </>
    )
}
