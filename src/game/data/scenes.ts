import l0Data from "../scene/editorData/l0.json"
import l1Data from "../scene/editorData/l1.json"

export type GameScene = {
    id: string,
    name: string,
    data?: any,
}

export enum SceneIds {
    l0 = '',
    l1 = '_restorePower',
}

export const l0Scene: GameScene = {
    id: SceneIds.l0,
    name: 'Level 0',
    data: l0Data,
}

export const l1Scene: GameScene = {
    id: SceneIds.l1,
    name: 'Restore Power',
    data: l1Data,
}

export const gameScenes: Record<string, GameScene> = {
    [l0Scene.id]: l0Scene,
    [l1Scene.id]: l1Scene,
}
