import {useEffect, useRef} from "react";

export const useEffectRef = <T>(value: T) => {
    const ref = useRef(value)
    useEffect(() => {
        ref.current = value
    }, [value])
    return ref
}
