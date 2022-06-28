import {
    DialogueChunkData,
    SceneComponent,
    SceneComponentRenderProps,
    SceneComponents,
    SceneStateFlag,
    SceneStateFlags
} from "./types";
import {DialogueChunk, DialogueChunkWrapper} from "./DialogueChunk";
import {GameWorldDynamicStateIds, GameWorldStateIds, ItemType, SensorId, WorldPositionId} from "../../data/ids";
import {
    isDynamicStateFlagActive,
    sceneStateProxy,
    setComponentDisabled,
    setDialogueCompleted,
    setStateFlag
} from "../../state/backend/scene";
import {subscribe} from "valtio";
import {backendPlayerStateProxy} from "../../state/backend/player";
import {LgHatch} from "../assets/niche/LgHatch";


const subscribeDynamicFlag = (flag: string, setResult: (result: boolean) => void) => {

    const check = () => {
        setResult(isDynamicStateFlagActive(flag))
    }

    check()

    const unsubs: any[] = []

    unsubs.push(subscribe(sceneStateProxy.dynamicStateFlags, check))

    const unsub = () => {
        unsubs.forEach(unsub => unsub())
    }

    return unsub


}

export const l1IntroNextStepDialogue: DialogueChunkData = {
    id: 'l1_intro_nextSteps',
    positionId: WorldPositionId.L0_AI_CHAT,
    conversation: [
        {
            text: {
                text: `Good. Now I've assigned you the co-ords for the generator.`,
            },
        },
        {
            text: {
                text: `Do not hesitate to kill anyone or anything.`,
            },
        },
        {
            text: {
                text: `It's important that we succeed..`,
            },
        },
        {
            text: {
                text: `Behind you is the emergency hatch.`,
            },
            onShown: () => {
                setStateFlag(GameWorldStateIds.L0_AI_ENABLE_HATCH)
            },
        },
        {
            text: {
                text: `Head down the ladder and you should be able to find your way.`,
            },
        },
    ],
    isActiveListener: (setIsActive: (active: boolean) => void) => {
        return subscribeDynamicFlag(GameWorldDynamicStateIds.L0_AI_ITEMS_OBTAINED, setIsActive)
    },
}

export const l1IntroDialogue: DialogueChunkData = {
    id: 'l1_intro',
    positionId: WorldPositionId.L0_AI_CHAT,
    conversation: [
        {
            text: {
                text: 'You need to restore the power for this facility.',
            },
        },
        {
            text: {
                text: `There's a back-up generator nearby that you need to activate.`,
            },
        },
        {
            text: {
                text: `In the next room, grab the battery and a weapon, you'll need it.`,
            },
            onShown: () => {
                setStateFlag(GameWorldStateIds.L0_AI_OPEN_DOOR)
            },
        },
        {
            text: {
                text: `Come back here once you have the battery and weapon.`,
            },
        },
    ],
    onComplete: (sceneStateFlags: SceneStateFlags) => {
        sceneStateFlags[SceneStateFlag.L1_INTRO_DIALOGUE_COMPLETE] = true;
    },
    completeListener: (componentId: string, id: string) => {

        return subscribeDynamicFlag(GameWorldDynamicStateIds.L0_AI_ITEMS_OBTAINED, (active: boolean) => {
            if (active) {
                setDialogueCompleted(id)
                setComponentDisabled(componentId)
            }
        })

    },
}

export const l1IntroDialogueSceneComponent: SceneComponent = {
    id: 'l1_intro_sc',
    mountCondition: (activeSensors: string[]) => {
        return activeSensors.includes(SensorId.L0_AI_INTERACTION)
    },
    render: (props: SceneComponentRenderProps) => <DialogueChunkWrapper data={l1IntroDialogue} {...props}/>
}

export const l1IntroNextStepDialogueSceneComponent: SceneComponent = {
    id: 'l1_intro_nextStep_sc',
    mountCondition: (activeSensors: string[]) => {
        return activeSensors.includes(SensorId.L0_AI_INTERACTION)
    },
    render: (props: SceneComponentRenderProps) => <DialogueChunkWrapper data={l1IntroNextStepDialogue} {...props}/>,
}

enum HatchId {
    L0_HATCH_ENTRY = 'L0_HATCH_ENTRY',
    L0_HATCH_EXIT = 'L0_HATCH_EXIT',
}

export const l1IntroHatchComponent: SceneComponent = {
    id: 'l1_intro_hatch_sc',
    render: () => <LgHatch id={HatchId.L0_HATCH_ENTRY} exit={HatchId.L0_HATCH_EXIT} positionId={WorldPositionId.L0_HATCH} activeFlag={GameWorldStateIds.L0_AI_OPEN_HATCH}/>,
}

const onHatchExit = () => {
    console.log('onHatchExit!')
}

export const l1IntroHatchExitComponent: SceneComponent = {
    id: 'l1_intro_hatch_exit_sc',
    render: () => <LgHatch id={HatchId.L0_HATCH_EXIT}
                           exit={HatchId.L0_HATCH_ENTRY} height={10} exitOnly
                           positionId={WorldPositionId.L0_HATCH_DESTINATION} onExit={onHatchExit}/>,
}

export const l0SceneComponents: SceneComponents = {
    [l1IntroDialogueSceneComponent.id]: l1IntroDialogueSceneComponent,
    [l1IntroNextStepDialogueSceneComponent.id]: l1IntroNextStepDialogueSceneComponent,
    [l1IntroHatchComponent.id]: l1IntroHatchComponent,
    [l1IntroHatchExitComponent.id]: l1IntroHatchExitComponent,
}

export const sceneStateFlags: SceneStateFlags = {}
