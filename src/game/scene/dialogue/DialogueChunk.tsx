import React, {useCallback, useEffect, useMemo, useState} from "react"
import {DialogueChunkData, SceneComponentRenderProps} from "./types";
import {
    SyncComponent,
    useIsKeyPressed,
    useOnKeyDown,
    useOnKeyUp,
    useOnPhysicsUpdate
} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../data/keys";
import {sceneStateProxy} from "../../state/backend/scene";
import {INPUT_KEYS} from "../../input/INPUT_KEYS";
import {useEffectRef} from "../../../utils/hooks";
import {setPlayerFocusPoint} from "../../state/backend/player";

export const DialogueChunk: React.FC<SceneComponentRenderProps & {
    data: DialogueChunkData,
}> = ({data, active, componentId}) => {

    const [progress, setProgress] = useState(0)
    const [visibleIndex, setVisible] = useState(0)

    const conversationPoint = data.conversation[visibleIndex]

    const focusPoint = conversationPoint?.focusPoint || data.defaultFocusPoint

    const hasNextPoint = visibleIndex < (data.conversation.length - 1)
    const hasPrevPoint = visibleIndex > 0

    const hasNextPointRef = useEffectRef(hasNextPoint)
    const hasPrevPointRef = useEffectRef(hasPrevPoint)

    const position = useMemo(() => {
        const positionId = data.positionId
        if (!positionId) return null
        const miscData = sceneStateProxy.miscData
        const position = miscData.worldPositions[positionId] ?? null
        return position
    }, [])

    const [nextHeld, setNextHeld] = useState(false)
    const [prevHeld, setPrevHeld] = useState(false)

    useOnKeyDown(INPUT_KEYS.O[0], useCallback(() => {
        setPrevHeld(true)
    }, []))

    useOnKeyUp(INPUT_KEYS.O[0], useCallback(() => {
        setPrevHeld(false)
    }, []))

    useOnKeyDown(INPUT_KEYS.P[0], useCallback(() => {
        setNextHeld(true)
    }, []))

    useOnKeyUp(INPUT_KEYS.P[0], useCallback(() => {
        setNextHeld(false)
    }, []))

    useEffect(() => {

        if (!prevHeld || !active) return

        if (hasPrevPointRef.current) {
            setVisible(prevState => {
                return prevState - 1
            })
        }

    }, [prevHeld, active])

    useEffect(() => {

        if (!nextHeld || !active) return

        if (hasNextPointRef.current) {
            setVisible(prevState => {
                const newIndex = prevState + 1

                if (newIndex < (data.conversation.length - 1)) {
                    setProgress(newIndex)
                }

                return newIndex
            })
        }

    }, [nextHeld, active])

    useEffect(() => {
        const point = data.conversation[progress]
        if (point.onShown) {
            point.onShown()
        }
    }, [progress])

    useEffect(() => {
        if (!data.completeListener) return
        return data.completeListener(componentId, data.id)
    }, [])

    useEffect(() => {
        if (!active || !focusPoint) return
        return setPlayerFocusPoint(focusPoint)
    }, [focusPoint, active])

    if (!active || !conversationPoint) return null

    return (
        <>
            <SyncComponent hasNextPoint={hasNextPoint}
                           hasPrevPoint={hasPrevPoint} position={position} text={conversationPoint.text} componentId={componentSyncKeys.activeDialogue} id={data.id}/>
        </>
    )
}

export const DialogueChunkWrapper: React.FC<SceneComponentRenderProps & {
    data: DialogueChunkData,
}> = (props) => {
    const {data} = props

    const [isActive, setIsActive] = useState(false)

    useEffect(() => {
        if (!data.isActiveListener) return
        return data.isActiveListener(setIsActive)
    }, [])

    const active = data.isActiveListener ? isActive : true

    if (!active) return null

    return <DialogueChunk {...props}/>
}
