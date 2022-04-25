import {lerp} from "three/src/math/MathUtils";

export const getPowerGraph = (x: number, pow: number = 2) => {
    x = lerp(-1, 1, x)
    const result = (Math.pow((x), pow) - 1) * -1
    return result
}
