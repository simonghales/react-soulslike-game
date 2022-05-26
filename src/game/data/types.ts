export enum ItemType {
    MEDIUM_MEAT = 'MEDIUM_MEAT',
    MEDIUM_BRAIN = 'MEDIUM_BRAIN',
}

export type ChestInventoryItem = {
    type: ItemType,
    count: number,
}
