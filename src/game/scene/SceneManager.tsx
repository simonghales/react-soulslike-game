import React, {useCallback, useEffect, useState} from "react"
import {ParticlesManager} from "./particles/ParticlesManager";
import {
    defaultControls,
    resetSceneManagerProxy,
    SceneManagerContext,
    updateSceneManagerProxy
} from "./sceneManagerContext";

export const SceneManager: React.FC = ({children}) => {

    const [controls, setControls] = useState(defaultControls)

    const registerControls = useCallback((key: string, subControls: any) => {
        setControls(prevState => ({
            ...prevState,
            [key]: subControls,
        }))
    }, [])

    useEffect(() => {
        updateSceneManagerProxy(controls)
    }, [controls])

    useEffect(() => {
        return () => {
            resetSceneManagerProxy()
        }
    }, [])

    return (
        <SceneManagerContext.Provider value={{
            controls,
            registerControls,
        }}>
            {children}
            <ParticlesManager/>
        </SceneManagerContext.Provider>
    )
}
