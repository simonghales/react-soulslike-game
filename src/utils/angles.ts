import {Vec2} from "planck";
import {lerp} from "three/src/math/MathUtils";

export const v2ToAngleDegrees = (x: number, y: number) => {
    var angle = Math.atan2(y, x);
    var degrees = 180 * angle / Math.PI;
    return (360 + Math.round(degrees)) % 360;
}

export const angleToV2 = (angle: number, v2: Vec2) => {
    v2.x = Math.cos(angle)
    v2.y = Math.sin(angle)
}

export const lerpRadians = (A: number, B: number, w: number) => {
    let CS = (1-w)*Math.cos(A) + w*Math.cos(B);
    let SN = (1-w)*Math.sin(A) + w*Math.sin(B);
    return Math.atan2(SN,CS);
}

export const PI = 3.14159265359
export const PI_TIMES_TWO = PI * 2
export const PI_TIMES_FOUR = PI * 4

export const lerpRadiansBROKEN = (angleA: number, angleB: number, lerpFactor: number): number => // Lerps from angle a to b (both between 0.f and PI_TIMES_TWO), taking the shortest path
{

    if (angleA > PI) {
        angleA -= PI_TIMES_TWO
    }

    if (angleB > PI) {
        angleB -= PI_TIMES_TWO
    }

    let result: number;
    let diff: number = angleB - angleA;
    if (diff < -PI)
    {
        // lerp upwards past PI_TIMES_TWO
        angleB += PI_TIMES_TWO;
        result = lerp(angleA, angleB, lerpFactor);
        if (result >= PI_TIMES_TWO)
        {
            result -= PI_TIMES_TWO;
        }
    }
    else if (diff > PI)
    {
        // lerp downwards past 0
        angleB -= PI_TIMES_TWO;
        result = lerp(angleA, angleB, lerpFactor);
        if (result < 0)
        {
            result += PI_TIMES_TWO;
        }
    }
    else
    {
        // straight lerp
        result = lerp(angleA, angleB, lerpFactor);
    }

    if (result > PI_TIMES_FOUR || result < -PI_TIMES_FOUR) {
        return angleB
    }

    return result;
}

export const calculateAngleBetweenVectors = (x1: number, x2: number, y1: number, y2: number): number => {
    return Math.atan2((x1 - x2), (y1 - y2))
}
