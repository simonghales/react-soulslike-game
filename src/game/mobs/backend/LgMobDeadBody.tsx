import React, {useCallback, useEffect, useState} from "react"
import {componentSyncKeys} from "../../data/keys";
import {SyncComponent, useAddBody} from "@simonghales/react-three-physics";
import {useWorld} from "../../../worker/WorldProvider";
import {Body, Circle, Vec2} from "planck";
import {COLLISION_FILTER_GROUPS} from "../../data/collisions";
import {addItemToPlayerInventory, useIsTargetedItem} from "../../state/backend/player";
import {InteractionEvent, InteractionEventType, useOnInteractionEvents} from "../../events/interaction";
import {emitPlayerCarvingBegan, emitPlayerCarvingEnd} from "../../events/player";
import {MobType, removeDeadBody} from "../../state/game";
import {ChestInventoryItem, ItemType} from "../../data/types";

const deadBodyConfig = {
    [MobType.BASIC_RAT]: {
        shape: Circle(0.025),
        density: 200,
    },
    [MobType.LARGE_RAT]: {
        shape: Circle(0.05),
        density: 200,
    },
}

const useMobDeadBody = (id: string, x: number, y: number, type: MobType) => {

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

        const config = deadBodyConfig[type]

        body.setPosition(new Vec2(x, y))

        const fixture = body.createFixture({
            shape: config.shape,
            density: config.density,
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

const defaultInventory: ChestInventoryItem[] = [
    {
        type: ItemType.MEDIUM_BRAIN,
        count: 1,
    },
    {
        type: ItemType.MEDIUM_MEAT,
        count: 2,
    },
]

const largeMobDefaultInventory: ChestInventoryItem[] = [
    {
        type: ItemType.MEDIUM_BRAIN,
        count: 2,
    },
    {
        type: ItemType.MEDIUM_MEAT,
        count: 3,
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
    type: MobType,
}> = ({id, x, y, type}) => {

    const body = useMobDeadBody(id, x, y, type)

    return null

}

export const useInteractionStateHandler = (id: string, onInterrupted?: () => void) => {

    const [interacting, setInteracting] = useState(false)
    const [interactionBegan, setInteractionBegan] = useState(0)

    const clearInteraction = () => {
        setInteracting(false)
        setInteractionBegan(0)
    }

    useOnInteractionEvents(id, useCallback((data: InteractionEvent) => {
        switch (data.type) {
            case InteractionEventType.INTERACTION_BEGIN:
                setInteracting(true)
                setInteractionBegan(performance.now())
                break;
            case InteractionEventType.INTERACTION_END:
                setInteracting(false)
                break;
            case InteractionEventType.INTERACTION_INTERRUPTED:
                setInteracting(false)
                if (onInterrupted) {
                    onInterrupted()
                }
                // setCarving(0)
                break;
        }
    }, []))

    return {
        interacting,
        interactionBegan,
        clearInteraction,
    }

}

export const LgMobDeadBody: React.FC<{
    id: string,
    x: number,
    y: number,
    type: MobType,
}> = ({id, x, y, type}) => {

    // const [interacting, setInteracting] = useState(false)
    // const [interactionBegan, setInteractionBegan] = useState(0)
    const [carving, setCarving] = useState(0)

    const {
        interacting,
        interactionBegan,
        clearInteraction,
    } = useInteractionStateHandler(id, () => {
        setCarving(0)
    })

    const [inventory, setInventory] = useState(type === MobType.LARGE_RAT ? largeMobDefaultInventory : defaultInventory)
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

    useEffect(() => {
        if (!interacting) return

        const remainingTime = (interactionBegan + 200) - performance.now()

        const timeout = setTimeout(() => {
            setCarving(performance.now())
            emitPlayerCarvingBegan(id, performance.now())
        }, remainingTime)

        return () => {
            clearTimeout(timeout)
        }

    }, [interacting, interactionBegan])

    useEffect(() => {
        if (!carving) return
        const timeRemaining = (carving + CARVING_DURATION) - performance.now()
        let cleared = false

        const timeout = setTimeout(() => {
            setCarving(0)
            clearInteraction()
            emitPlayerCarvingEnd(id, performance.now())
            cleared = true

            retrieveNextInventoryItem(inventory, setInventory)

        }, timeRemaining)

        return () => {
            clearTimeout(timeout)
            if (!cleared) {
                emitPlayerCarvingEnd(id, performance.now())
            }
        }

    }, [carving])

    return (
        <>
            {
                !emptyInventory && (
                    <BodyHandler id={id} x={x} y={y} type={type}/>
                )
            }
            <SyncComponent id={id} carving={carving}
                           interacting={interacting}
                           isTarget={isTarget}
                           componentId={componentSyncKeys.basicMobDead}
                           empty={emptyInventory}
                           type={type}
                           x={x}
                           y={y}/>
        </>
    )
}
