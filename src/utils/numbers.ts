export const normalize = (value: number, max: number, min: number) => {
    if (value > max) {
        value = max
    } else if (value < min) {
        value = min
    }
    return (value - min) / (max - min)
}
