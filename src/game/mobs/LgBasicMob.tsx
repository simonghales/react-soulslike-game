import React, {useEffect, useState} from "react"
import {SyncComponent, useAddBody} from "react-three-physics";
import {componentSyncKeys} from "../data/keys";
import {useWorld} from "../../worker/WorldProvider";
import {Body, Circle, Vec2} from "planck";
import {COLLISION_FILTER_GROUPS} from "../data/collisions";

export const LgBasicMob: React.FC<{
    id: string,
    x?: number,
    y?: number,
}> = ({id, x, y}) => {

    const world = useWorld()

    const addBody = useAddBody()
    const [body, setBody] = useState<null | Body>(null)

    useEffect(() => {

        const bodyDef: any = {
            type: "static",
            linearDamping: 40,
            angularDamping: 0.1,
            allowSleep: false,
            fixedRotation: true,
        }

        const body = world.createBody(bodyDef)

        body.setPosition(new Vec2(x ?? 2, y ?? 2))

        const circleShape = Circle(0.5)

        console.log('mask bits', COLLISION_FILTER_GROUPS.player | COLLISION_FILTER_GROUPS.playerRange)

        const fixture = body.createFixture({
            shape: circleShape,
            filterCategoryBits: COLLISION_FILTER_GROUPS.npcs,
            filterMaskBits: COLLISION_FILTER_GROUPS.player | COLLISION_FILTER_GROUPS.playerRange,
            userData: {
                collisionId: id,
            }
        })

        setBody(body)

        return addBody(id, body)

    }, [])

    return (
        <>
            <SyncComponent id={id} componentId={componentSyncKeys.basicMob}/>
        </>
    )
}
