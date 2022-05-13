import React, {Suspense, useCallback, useEffect, useMemo, useState} from "react"
import {
    SceneManagerControlsTypes,
    useRegisterSceneManagerControls,
} from "../sceneManagerContext";
import {BloodSprayParticles, ParticleControls, useBloodSprayParticles} from "./BloodSprayParticles";
import {ParticlesManagerContext} from "./particlesManagerContext";

export enum ParticleType {
    BLOOD_SPRAY = 'BLOOD_SPRAY',
}

export type ParticlesManagerControls = {
    initParticle: (type: ParticleType, x: number, y: number, xVel: number, yVel: number) => void,
}

export const defaultParticlesManagerControls: ParticlesManagerControls = {
    initParticle: () => {},
}

export const ParticlesManager: React.FC = () => {

    useBloodSprayParticles()

    const [particleControls, setParticleControls] = useState({} as Record<string, ParticleControls>)

    const controls = useMemo<ParticlesManagerControls>(() => {
        return {
            initParticle: (type: ParticleType, x: number, y: number, xVel: number, yVel: number) => {
                if (particleControls[type]) {
                    particleControls[type].initParticle(type, x, y, xVel, yVel)
                }
            }
        }
    }, [particleControls])

    const registerControls = useCallback((key: string, controls: ParticleControls) => {
        setParticleControls(prevState => ({
            ...prevState,
            [key]: controls,
        }))
        return () => {
            setParticleControls(prevState => {
                const update = {
                    ...prevState,
                }
                delete update[key]
                return update
            })
        }
    }, [])

    useRegisterSceneManagerControls(SceneManagerControlsTypes.particles, controls)

    return (
        <ParticlesManagerContext.Provider value={{
            registerControls,
        }}>
            <Suspense fallback={null}>
                <BloodSprayParticles/>
            </Suspense>
        </ParticlesManagerContext.Provider>
    )
}
