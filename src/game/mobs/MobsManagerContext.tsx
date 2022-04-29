import {createContext, useContext} from "react";

export const MobsManagerContext = createContext(null! as {
    grantedTokens: any,
    requestAttackToken: any,
    addManualToken: any,
    updateAttackTokenWeight: any,
    requestStandbyToken: any,
    standbyTokens: any,
    setHasManualAttackToken: any,
})

export const useMobsManagerContext = () => {
    return useContext(MobsManagerContext)
}
