import {createContext, useContext} from "react";

export const GoalHandlerContext = createContext(null! as {
    subGoal: any,
    setSubGoal: any,
})

export const useGoalHandlerContext = () => {
    return useContext(GoalHandlerContext)
}
