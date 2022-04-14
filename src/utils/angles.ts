export const v2ToAngleDegrees = (x: number, y: number) => {
    var angle = Math.atan2(y, x);
    var degrees = 180 * angle / Math.PI;
    return (360 + Math.round(degrees)) % 360;
}

export const lerpRadians = (A: number, B: number, w: number) => {
    let CS = (1-w)*Math.cos(A) + w*Math.cos(B);
    let SN = (1-w)*Math.sin(A) + w*Math.sin(B);
    return Math.atan2(SN,CS);
}

export const calculateAngleBetweenVectors = (x1: number, x2: number, y1: number, y2: number): number => {
    return Math.atan2((x1 - x2), (y1 - y2))
}
