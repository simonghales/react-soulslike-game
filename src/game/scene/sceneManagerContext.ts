import {createContext, useContext, useEffect} from "react";
import {defaultParticlesManagerControls, ParticlesManagerControls} from "./particles/ParticlesManager";
import {proxy} from "valtio";

export enum SceneManagerControlsTypes {
    particles = 'particles',
}

export type SceneManagerControls = {
    [SceneManagerControlsTypes.particles]: ParticlesManagerControls,
}

export const SceneManagerContext = createContext(null! as {
    controls: SceneManagerControls,
    registerControls: (key: string, controls: any) => void,
})

export const useSceneManagerControls = () => {
    return useContext(SceneManagerContext).controls
}

export const useSceneManagerRegisterControls = () => {
    return useContext(SceneManagerContext).registerControls
}

export const useRegisterSceneManagerControls = (key: string, controls: any) => {
    const register = useSceneManagerRegisterControls()
    useEffect(() => {
        return register(key, controls)
    }, [key, controls])
}

export const useParticleControls = () => {
    return useSceneManagerControls()[SceneManagerControlsTypes.particles]
}
export const defaultControls: SceneManagerControls = {
    particles: defaultParticlesManagerControls,
}

export const sceneManagerControls = proxy(defaultControls)

export const updateSceneManagerProxy = (controls: SceneManagerControls) => {
    Object.entries(controls).forEach(([id, control]) => {
        (sceneManagerControls as any)[id] = control
    })
}

export const resetSceneManagerProxy = () => {
    updateSceneManagerProxy(defaultControls)
}
