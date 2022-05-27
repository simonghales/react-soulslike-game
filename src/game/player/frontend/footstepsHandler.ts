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
let now = 0
let timeElapsed = 0
let delta = 0

const SPEED_DIFFERENCE_THRESHOLD = 0.0075
const INTERVAL = 50

export const useFootstepsHandler = (ref: MutableRefObject<Object3D>) => {

    const [data] = useState(() => ({
        prevX: undefined as undefined | number,
        prevY: undefined as undefined | number,
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

            if (data.prevX === undefined || data.prevY === undefined) {
                data.prevX = x
                data.prevY = y
            }

            xDiff = Math.abs(x - data.prevX)
            yDiff = Math.abs(y - data.prevY)


            now = Date.now()
            timeElapsed = now - data.lastUpdate
            data.lastUpdate = now
            delta = timeElapsed / INTERVAL

            if ((xDiff < 0.1) && (yDiff < 0.1)) {
                data.movingWeight = lerp(data.movingWeight, 0, 0.2)
                return
            }

            v2.set(x, y)
            tV2.set(data.prevX, data.prevY)
            v2.sub(tV2)

            roughSpeed = v2.lengthSquared()

            speedDifference = (roughSpeed - data.roughSpeed) * delta

            direction = v2ToAngle(v2.x, v2.y)

            difference = Math.abs(getAngleBetweenAngles(radToDeg(direction), radToDeg(data.direction)))

            if (difference > (50 * delta)) {
                data.movingWeight = lerp(data.movingWeight, 0, 0.5 * delta)
            } else {
                data.movingWeight = lerp(data.movingWeight, 2, 0.25 * delta)
            }

            data.direction = lerpRadians(data.direction, direction, 0.5 * delta)


            data.prevX = x
            data.prevY = y
            // if (data.movingWeight < 1) {
            //     data.movingWeight = lerp(data.movingWeight, 2, 0.2)
            // }

            data.roughSpeed = lerp(data.roughSpeed, roughSpeed, 0.2 * delta)

            // console.log('roughSpeed', roughSpeed)

            if (speedDifference >= SPEED_DIFFERENCE_THRESHOLD) {
                // console.log('speedDifference', speedDifference)
                data.movingWeight = lerp(data.movingWeight, 0, 0.25 * delta)
            }

            if (data.movingWeight >= 1) {
                return
            }

            if (speedDifference < (0.01)) {
                data.movingWeight = lerp(data.movingWeight, 2, 0.1 * delta)
            }

            sceneManagerControls[SceneManagerControlsTypes.particles].initParticle(
                ParticleType.DUST,
                {
                    x: x,
                    y: y - 0.5,
                    type: DustType.MEDIUM,
                }
            )

        }, INTERVAL)
        return () => {
            clearInterval(interval)
        }
    }, [])

}
