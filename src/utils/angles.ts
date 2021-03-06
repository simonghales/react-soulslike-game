import {Vec2} from "planck";
import {lerp} from "three/src/math/MathUtils";

let a = 0

export const getAngleBetweenAngles = (targetA: number, sourceA: number) => {
    a = targetA - sourceA
    a = (a + 180) % 360 - 180
    return a
}

export const v2ToAngle = (x: number, y: number) => {
    return Math.atan2(y, x);
}

export const v2ToAngleDegrees = (x: number, y: number) => {
    var angle = Math.atan2(y, x);
    var degrees = 180 * angle / Math.PI;
    return degrees
    // return (360 + Math.round(degrees)) % 360;
}

export const angleToV2 = (angle: number, v2: Vec2) => {
    v2.x = Math.cos(angle)
    v2.y = Math.sin(angle)
}

export const roundAngleDegrees = (angle: number, round: number) => {
    return Math.round((angle / round)) * round
}

export const lerpRadians = (A: number, B: number, w: number) => {
    if (w > 1) {
        w = 1
    } else if (w < 0) {
        w = 0
    }
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

export const rotateVector = (v2: Vec2, radians: number) => {
    const x = v2.x * Math.cos(radians) - v2.y * Math.sin(radians);
    const y = v2.x * Math.sin(radians) + v2.y * Math.cos(radians);
    return v2.set(x, y)
}
