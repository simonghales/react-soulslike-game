export const easeOutExpo = (x: number) => {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export const easeOutQuart = (x: number) => {
    return 1 - Math.pow(1 - x, 4);
}

export const easeInOutQuint = (x: number) => {
    return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

export const easeInOutBack = (x: number) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;

    return x < 0.5
        ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
        : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

export const easeInOutQuad = (x: number) => {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

export const easeInQuad = (x: number) => {
    return x * x;
}

export const easeInOutSine = (x: number) => {
    return -(Math.cos(Math.PI * x) - 1) / 2;
}


export const easeInQuart = (x: number) => {
    return x * x * x * x;
}

export const easeInOutCubic = (x: number) => {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
