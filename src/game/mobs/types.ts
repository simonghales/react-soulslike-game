export enum GoalType {
    IDLE = 'IDLE',
    ATTACK_ENTITY = 'ATTACK_ENTITY',
    FOLLOW_ENTITY = 'FOLLOW_ENTITY',
}

export type Goal = {
    type: GoalType,
    data?: any,
}
