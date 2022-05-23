import {usePlayerContext} from "../PlayerContext";
import {useCallback, useEffect, useMemo, useState} from "react";
import {Body, Vec2} from "planck";
import {PlayerRangeCollisionTypes} from "../../data/collisions";
import {useEffectRef} from "../../../utils/hooks";
import {getAngleBetweenAngles, v2ToAngle} from "../../../utils/angles";
import {radToDeg} from "three/src/math/MathUtils";

const v2 = new Vec2()

export const useInteractionHandler = (body: Body, atRest: boolean, canInteract: boolean) => {

    const {
        collisions,
        targetItem,
        setTargetItem,
    } = usePlayerContext()

    const [desiredTargetItem, setDesiredTargetItem] = useState('')

    useEffect(() => {
        if (!canInteract) {
            setTargetItem('')
        } else {
            setTargetItem(desiredTargetItem)
        }
    }, [canInteract, desiredTargetItem])

    const interactiveItems = useMemo(() => {
        const interactiveItems = Object.entries(collisions[PlayerRangeCollisionTypes.PLAYER_INTERACTION_RANGE] ?? {})
        return interactiveItems
    }, [collisions])

    const itemsInRange = interactiveItems.length > 0
    const multipleItemsInRange = interactiveItems.length > 0

    const selectIdealInteractiveItem = useCallback(() => {

        const angle = body.getAngle()

        const sortedItems = interactiveItems.sort(([idA, bodyA], [idB, bodyB]) => {

            v2.set(bodyA.getPosition())
            v2.sub(body.getPosition())
            const distanceA = v2.lengthSquared()
            const angleDifferenceA = Math.pow(Math.abs(getAngleBetweenAngles(radToDeg(angle), radToDeg(v2ToAngle(v2.x, v2.y)))), 0.5)


            v2.set(bodyB.getPosition())
            v2.sub(body.getPosition())
            const distanceB = v2.lengthSquared()
            const angleDifferenceB = Math.pow(Math.abs(getAngleBetweenAngles(radToDeg(angle), radToDeg(v2ToAngle(v2.x, v2.y)))), 0.5)

            return (distanceA + angleDifferenceA) - (distanceB + angleDifferenceB)
        })

        const item = sortedItems?.[0]?.[0] ?? ''

        setDesiredTargetItem(item)

    }, [interactiveItems])

    const selectIdealInteractiveItemRef = useEffectRef(selectIdealInteractiveItem)

    useEffect(() => {
        if (!itemsInRange) {
            setDesiredTargetItem('')
            return
        }
        selectIdealInteractiveItem()
    }, [selectIdealInteractiveItem, itemsInRange])

    useEffect(() => {
        if (atRest || !multipleItemsInRange) return
        const interval = setInterval(() => {
            selectIdealInteractiveItemRef.current()
        }, 500)
        return () => {
            clearInterval(interval)
        }
    }, [atRest, multipleItemsInRange])

    return targetItem

}
