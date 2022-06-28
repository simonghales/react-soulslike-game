import React, {Fragment, useEffect, useMemo, useState} from "react"
import {l0SceneComponents} from "./dialogue/data";
import {SensorId} from "../data/ids";
import {usePlayerCollidedSensors} from "../state/backend/player";
import {useSnapshot} from "valtio";
import {sceneStateProxy} from "../state/backend/scene";
import {SceneComponents} from "./dialogue/types";
import {merge} from "lodash";
import {SceneIds} from "../data/scenes";

const allSceneComponents: Record<string, SceneComponents> = {
    ['']: l0SceneComponents,
    ['_restorePower']: {},
}

export const SceneComponentsManager: React.FC = () => {

    const activeScenes = [SceneIds.l0]

    const sceneComponents = useMemo(() => {
        const components: SceneComponents = {}
        activeScenes.forEach(sceneId => {
            merge(components, allSceneComponents[sceneId] ?? {})
        })
        return components
    }, [activeScenes])

    const [renderedComponents, setRenderedComponents] = useState({} as Record<string, any>)

    const collidedSensors = usePlayerCollidedSensors()

    const disabledComponents = useSnapshot(sceneStateProxy.disabledComponents)

    useEffect(() => {

        setRenderedComponents(prevState => {
            const components: Record<string, any> = {}

            Object.entries(sceneComponents).forEach(([id, component]) => {
                if (disabledComponents[id]) return
                const shouldMount = component.mountCondition ? component.mountCondition(collidedSensors as string[]) : true
                if (shouldMount) {
                    components[id] = [component, true]
                } else {
                    if (prevState[id] && !component.unmountOnConditionLost) {
                        components[id] = [component, false]
                    }
                }
            })

            return components
        })

    }, [sceneComponents, collidedSensors, disabledComponents])

    return (
        <>
            {
                Object.entries(renderedComponents).map(([id, [component, active]]) => {
                    const Component = component.render
                    return <Component componentId={id} active={active} key={id}/>
                })
            }
        </>
    )
}
