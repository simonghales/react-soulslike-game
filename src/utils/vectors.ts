export const getVectorMagnitude = (x: number, y: number): number => {
    return Math.sqrt(x * x + y * y)
}

export const calculateVectorsDistance = (x1: number, x2: number, y1: number, y2: number): number => {
    return getVectorMagnitude(Math.abs(x1 - x2), Math.abs(y1 - y2))
}

export const calculateCheapVectorsDistance = (x1: number, x2: number, y1: number, y2: number): number => {
    return Math.pow(Math.abs(x1 - x2) + Math.abs(y1 - y2), 2)
}
