import React, {useEffect, useState} from "react"
import {SyncComponent} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../data/keys";
import uniqid from "uniqid";
import {useWorld} from "../../../worker/WorldProvider";
import {Box, Vec2} from "planck";
import {halve} from "../../../utils/physics";
import {COLLISION_FILTER_GROUPS, CollisionTypes} from "../../data/collisions";

const useWallBody = (x: number, y: number, w: number, h: number) => {

    const world = useWorld()

    useEffect(() => {

        const body = world.createBody({
            type: "static",
            position: new Vec2(x, y),
        })

        body.createFixture({
            shape: Box(halve(w), halve(h)),
            filterCategoryBits: COLLISION_FILTER_GROUPS.environment,
            userData: {
                collisionType: CollisionTypes.BARRIER,
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

export const LgWall: React.FC<{
    x: number,
    y: number,
    w: number,
    h: number,
}> = ({x, y, w, h}) => {
    const [id] = useState(() => uniqid())

    useWallBody(x, y, w, h)

    return (
        <SyncComponent data={{
            x,
            y,
            w,
            h,
        }} id={`wall-${id}`} componentId={componentSyncKeys.wall}/>
    )
}
