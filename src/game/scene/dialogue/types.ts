import {FC} from "react";

export type ConversationPointTextData = {
    text: string,
}

export type ConversationPointData = {
    text: ConversationPointTextData,
    onShown?: () => void,
}

export type DialogueChunkData = {
    id: string,
    conversation: ConversationPointData[],
    positionId?: string,
    onComplete?: (sceneStateFlags: SceneStateFlags) => void,
    completeListener?: (componentId: string, id: string) => any,
    isActiveListener?: (setIsActive: (active: boolean) => void) => any,
    CompleteListenerComponent?: () => any,
}

export type SceneStateFlags = Record<string, boolean>

export enum SceneStateFlag {
    L1_INTRO_DIALOGUE_COMPLETE = 'L1_INTRO_DIALOGUE_COMPLETE',
}

export type SceneComponentRenderProps = {
    componentId: string,
    active: boolean,
}

export type SceneComponent = {
    id: string,
    mountCondition?: (activeSensors: string[]) => boolean,
    unmountOnConditionLost?: boolean,
    render: (props: SceneComponentRenderProps) => any,
}

export type SceneComponents = Record<string, SceneComponent>
