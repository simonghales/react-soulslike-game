import {MutableRefObject, useEffect, useState} from "react";
import {Object3D} from "three";
import {sceneManagerControls, SceneManagerControlsTypes} from "../../scene/sceneManagerContext";
import {ParticleType} from "../../scene/particles/ParticlesManager";
import {DustType} from "../../scene/particles/DustParticles";
import {degToRad, lerp, radToDeg} from "three/src/math/MathUtils";
import {Vec2} from "planck";
import {getAngleBetweenAngles, lerpRadians, v2ToAngle} from "../../../utils/angles";

let x = 0
let y = 0
let xDiff = 0
let yDiff = 0
const v2 = new Vec2()
const tV2 = new Vec2()
let direction = 0
let difference = 0
let roughSpeed = 0
let speedDifference = 0

export const useFootstepsHandler = (ref: MutableRefObject<Object3D>) => {

    const [data] = useState(() => ({
        prevX: 0,
        prevY: 0,
        lastUpdate: 0,
        movingWeight: 0,
        direction: 0,
        roughSpeed: 0,
    }))

    useEffect(() => {
        const interval = setInterval(() => {

            const object = ref.current

            if (!object) return

            x = object.position.x
            y = object.position.y

            xDiff = Math.abs(x - data.prevX)
            yDiff = Math.abs(y - data.prevY)

            if ((xDiff < 0.1) && (yDiff < 0.1)) {
                data.movingWeight = lerp(data.movingWeight, 0, 0.4)
                return
            }

            v2.set(x, y)
            tV2.set(data.prevX, data.prevY)
            v2.sub(tV2)

            roughSpeed = v2.lengthSquared()

            speedDifference = roughSpeed - data.roughSpeed

            data.roughSpeed = lerp(data.roughSpeed, roughSpeed, 0.3)

            direction = v2ToAngle(v2.x, v2.y)

            difference = Math.abs(getAngleBetweenAngles(radToDeg(direction), radToDeg(data.direction)))

            if (difference > 45) {
                data.movingWeight = lerp(data.movingWeight, 0, 0.75)
            } else {
                data.movingWeight = lerp(data.movingWeight, 2, 0.2)
            }

            data.direction = lerpRadians(data.direction, direction, 0.5)

            data.prevX = x
            data.prevY = y
            data.lastUpdate = Date.now()
            // if (data.movingWeight < 1) {
            //     data.movingWeight = lerp(data.movingWeight, 2, 0.2)
            // }

            if (data.movingWeight >= 1 && speedDifference <= 0.1) {
                return
            }

            sceneManagerControls[SceneManagerControlsTypes.particles].initParticle(
                ParticleType.DUST,
                {
                    x: x,
                    y: y - 0.5,
                    type: DustType.MEDIUM,
                }
            )

        }, 200)
        return () => {
            clearInterval(interval)
        }
    }, [])

}
