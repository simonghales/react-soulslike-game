import {proxy, ref, useSnapshot} from "valtio";
import {MutableRefObject, useEffect} from "react";
import {Object3D} from "three";

export const miscProxy = proxy({
    playerRef: null as null | MutableRefObject<Object3D | undefined>,
})

export const usePlayerRef = () => {
    return useSnapshot(miscProxy).playerRef
}

export const useSetPlayerRef = (playerRef: MutableRefObject<Object3D | undefined>) => {

    useEffect(() => {
        miscProxy.playerRef = ref(playerRef)
        return () => {
            miscProxy.playerRef = null
        }
    }, [playerRef])

}
