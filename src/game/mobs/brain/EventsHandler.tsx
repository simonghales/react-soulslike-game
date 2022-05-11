import React, {useCallback, useMemo} from "react"
import {useMobBrainContext} from "../mobBrainContext";
import {Vec2} from "planck";
import {lerp} from "three/src/math/MathUtils";
import {normalize} from "../../../utils/numbers";
import {MobEvent, MobEventType, useOnMobEvents} from "../../events/mobs";

const v2 = new Vec2()
const emptyV2 = new Vec2()

export const EventsHandler: React.FC = () => {

    const {
        id,
        body,
        onDamage,
    } = useMobBrainContext()

    const {
        handleDamaged,
    } = useMemo(() => {
        return {
            handleDamaged: (damage: number, currentPosition: Vec2) => {
                onDamage(damage)
                if (!body) return
                v2.set(body.getPosition())
                const xVel = v2.x - currentPosition.x
                const yVel = v2.y - currentPosition.y
                v2.set(xVel, yVel)
                v2.normalize()
                const power = lerp(50, 100, normalize(damage, 12, 2))
                v2.mul(power)
                body.applyLinearImpulse(v2, emptyV2)
            },
        }
    }, [])

    const onMobEvents = useCallback((data: MobEvent) => {
        switch (data.type) {
            case MobEventType.DAMAGED:
                handleDamaged(data.data.damage as number, data.data.currentPosition)
                break;
        }
    }, [handleDamaged])

    useOnMobEvents(id, onMobEvents)

    return null
}
