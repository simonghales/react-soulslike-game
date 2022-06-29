import React, {useCallback, useEffect, useMemo, useState} from "react"
import {
    getHatchPosition,
    getWorldPosition,
    sceneStateProxy,
    setHatchPosition,
    useIsFlag
} from "../../../state/backend/scene";
import {GameWorldStateIds, WorldPositionId} from "../../../data/ids";
import {SyncComponent, useOnKeyDown} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../../data/keys";
import {useWorld} from "../../../../worker/WorldProvider";
import {Body, Circle, Vec2} from "planck";
import {removeWorldBody} from "../../items/LgItem";
import {COLLISION_FILTER_GROUPS, CollisionTypes} from "../../../data/collisions";
import {useIsTargetedItem} from "../../../state/backend/player";
import {INPUT_KEYS} from "../../../input/INPUT_KEYS";
import {emitPlayerEnterLadder} from "../../../events/player";

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

export type HatchConfig = {
    id: string,
    exit: string,
    positionId: string,
    activeFlag?: string,
    exitOnly?: boolean,
    height?: number,
    onExit?: () => void,
    noReturnDistance?: number,
    triggerThreshold?: number,
}

export const LgHatch: React.FC<{
    data: HatchConfig,
}> = ({data}) => {

    const {id, exit, positionId, activeFlag, exitOnly, height, onExit} = data

    const position = getWorldPosition(positionId)

    useEffect(() => {
        setHatchPosition(id, position, height)
    }, [])

    const activated = useIsFlag(activeFlag) && !exitOnly

    if (!position) throw new Error(`No position...`)

    useHatchBody(id, position, activated)

    const isTarget = useIsTargetedItem(id)

    const [enteringHatch, setEnteringHatch] = useState(0)

    const canInteract = isTarget && !exitOnly

    const canEnter = canInteract && !enteringHatch

    useOnKeyDown(INPUT_KEYS.C[0], useCallback(() => {
        if (!canEnter) return
        const destination = getHatchPosition(exit)
        if (!destination) {
            throw new Error(`No destination found.`)
        }
        let direction = (destination.position[1] < position[1]) ? -1 : 1
        emitPlayerEnterLadder(id, position, destination, direction, height, data)
        setEnteringHatch(Date.now())
    }, [canEnter]))

    useEffect(() => {
        if (!enteringHatch) return
        const timeout = setTimeout(() => {
            setEnteringHatch(0)
        }, 1000)
        return () => {
            clearTimeout(timeout)
        }
    }, [enteringHatch])

    useEffect(() => {
        if (!onExit) return
        // todo - listen for exit event, and then trigger this function...
    }, [onExit])

    return <SyncComponent entering={enteringHatch} isTarget={canInteract} activated={activated} componentId={componentSyncKeys.hatch} id={id} position={position}/>
}
