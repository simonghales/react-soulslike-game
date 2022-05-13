import {createContext, useContext, useEffect} from "react";
import {ParticleControls} from "./BloodSprayParticles";

export const ParticlesManagerContext = createContext(null! as {
    registerControls: (key: string, controls: ParticleControls) => () => void,
})

export const useRegisterControls = (key: string, controls: ParticleControls) => {

    const registerControls = useContext(ParticlesManagerContext).registerControls

    useEffect(() => {
        return registerControls(key, controls)
    }, [key, controls])

}
