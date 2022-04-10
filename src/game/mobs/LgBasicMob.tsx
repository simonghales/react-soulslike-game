import React, {useEffect, useState} from "react"
import {SyncComponent, useAddBody} from "react-three-physics";
import {componentSyncKeys} from "../data/keys";
import {useWorld} from "../../worker/WorldProvider";
import {Body, Circle, Vec2} from "planck";

export const LgBasicMob: React.FC = () => {

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

        body.setPosition(new Vec2(2, 2))

        const circleShape = Circle(0.5)

        const fixture = body.createFixture({
            shape: circleShape,
        } as any)

        setBody(body)

        return addBody('basicMob-0', body)

    }, [])

    return (
        <>
            <SyncComponent id={'basicMob-0'} componentId={componentSyncKeys.basicMob}/>
        </>
    )
}
