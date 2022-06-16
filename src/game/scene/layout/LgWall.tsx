import React, {useCallback, useEffect, useState} from "react"
import {SyncComponent} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../data/keys";
import uniqid from "uniqid";
import {useWorld} from "../../../worker/WorldProvider";
import {Box, Vec2} from "planck";
import {halve} from "../../../utils/physics";
import {COLLISION_FILTER_GROUPS, CollisionTypes} from "../../data/collisions";
import {useOnMobEvents} from "../../events/mobs";
import {MobEventType} from "../../mobs/brain/events";
import {sceneStateProxy, setStateFlag, setVisibilityZoneDisabled, setWallDestroyed} from "../../state/backend/scene";
import {WallData} from "./LgWallsHandler";
import {subscribe} from "valtio";

const useWallBody = (id: string, x: number, y: number, w: number, h: number, breakable: boolean) => {

    const world = useWorld()

    useEffect(() => {

        const body = world.createBody({
            type: "static",
            position: new Vec2(x, y),
        })

        body.createFixture({
            shape: Box(halve(w), halve(h)),
            filterCategoryBits: breakable ? COLLISION_FILTER_GROUPS.environment | COLLISION_FILTER_GROUPS.npcs : COLLISION_FILTER_GROUPS.environment,
            userData: {
                collisionId: id,
                collisionType: breakable ? CollisionTypes.BREAKABLE_BARRIER : CollisionTypes.BARRIER,
            }
        })

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

}

const BreakableHandler: React.FC<{
    id: string,
    onDestroyKey?: string,
    onDamage: () => void,
}> = ({id, onDestroyKey, onDamage}) => {

    const [health, setHealth] = useState(10)

    useOnMobEvents(id, useCallback((event) => {
        switch (event.type) {
            case MobEventType.DAMAGED:
                onDamage()
                setHealth(prev => prev - event.data.damage)
                break;
        }
    }, []))

    const destroyed = health <= 0

    useEffect(() => {
        if (!destroyed) return
        setWallDestroyed(id)
        if (onDestroyKey) {
            setStateFlag(onDestroyKey)
        }
    }, [destroyed])

    return null

}

const RemoveHandler: React.FC<{
    id: string,
    flag: string,
}> = ({id, flag}) => {

    useEffect(() => {
        const unsub = subscribe(sceneStateProxy.stateFlags, () => {
            if (sceneStateProxy.stateFlags[flag]) {
                setWallDestroyed(id)
            }
        })
        return () => {
            unsub()
        }
    }, [])

    return null
}

export enum WallCondition {
    DEFAULT,
    DAMAGED,
}

export const LgWall: React.FC<{
   data: WallData,
}> = ({data}) => {

    const {
        id, x, y, w, h, breakable = false
    } = data

    const [wallState, setWallState] = useState(WallCondition.DEFAULT)

    useWallBody(id, x, y, w, h, breakable)

    const unlockable = !!data.removeOnStateFlag

    return (
        <>
            {
                breakable && (
                    <BreakableHandler id={id} onDestroyKey={data.onDestroyKey} onDamage={() => {
                        setWallState(WallCondition.DAMAGED)
                    }} />
                )
            }
            {
                data.removeOnStateFlag && (
                    <RemoveHandler id={id} flag={data.removeOnStateFlag}/>
                )
            }
            <SyncComponent data={{
                x,
                y,
                w,
                h,
            }} id={`wall-${id}`} componentId={componentSyncKeys.wall} wallState={wallState} unlockable={unlockable} breakable={breakable}/>
        </>
    )
}
