import {proxy, useSnapshot} from "valtio";

export const backendPlayerStateProxy = proxy({
    selectedTarget: '',
})

export const setBackendSelectedTarget = (selectedTarget: string) => {
    backendPlayerStateProxy.selectedTarget = selectedTarget
}

export const useIsSelectedTarget = (id: string) => {
    return useSnapshot(backendPlayerStateProxy).selectedTarget === id
}
