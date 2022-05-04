import React, {createContext, MutableRefObject, useCallback, useContext, useEffect, useMemo, useState} from "react"
import {useEffectRef} from "../../utils/hooks";

export type Tokens = Record<string, number>

export const MobsGroupContext = createContext(null! as {
    requestAttackToken: (id: string, ref: MutableRefObject<() => number>) => () => void,
    grantedAttackTokens: Tokens,
})

export const useMobsGroupContext = () => {
    return useContext(MobsGroupContext)
}

export const MAX_ATTACK_TOKENS = 2

export const usePositioningHandler = () => {

    const [positionTokensQueue, setPositionsTokenQueue] = useState({} as Record<string, MutableRefObject<() => number>>)



}

export const useCombatHandler = () => {

    const [attackTokensQueue, setAttackTokensQueue] = useState({} as Record<string, MutableRefObject<() => number>>)
    const [grantedAttackTokens, setGrantedAttackTokens] = useState({} as Tokens)
    const [manualAttackTokens, setManualAttackTokens] = useState({} as Tokens)

    const combinedAttackTokens = useMemo(() => {
        const combined: Tokens = {}
        Object.entries(grantedAttackTokens).forEach(([id, value]) => {
            combined[id] = value
        })
        Object.entries(manualAttackTokens).forEach(([id, value]) => {
            combined[id] = value
        })
        return combined
    }, [grantedAttackTokens, manualAttackTokens])

    const attackTokensQueueRef = useEffectRef(attackTokensQueue)
    const grantedAttackTokensRef = useEffectRef(grantedAttackTokens)
    const manualAttackTokensRef = useEffectRef(manualAttackTokens)
    const combinedAttackTokensRef = useEffectRef(combinedAttackTokens)

    const hasPendingRequests = useMemo(() => {
        let pending = false
        Object.keys(attackTokensQueue).forEach(id => {
            if (!combinedAttackTokens[id]) {
                pending = true
            }
        })
        return pending
    }, [attackTokensQueue, combinedAttackTokens])

    const hasSpareTokens = Object.keys(combinedAttackTokens).length < MAX_ATTACK_TOKENS

    useEffect(() => {

        if (!hasPendingRequests) return

        const update = () => {

            const numberOfManualTokens = Object.keys(manualAttackTokensRef.current).length
            const spareTokens = MAX_ATTACK_TOKENS - numberOfManualTokens

            if (spareTokens <= 0) {
                return
            }

            const newAssignedTokens: Tokens = {}

            const attackTokensQueue = attackTokensQueueRef.current
            const grantedAttackTokens = grantedAttackTokensRef.current
            const manualAttackTokens = manualAttackTokensRef.current

            const sortedQueue = Object.entries(attackTokensQueue).sort(([,refA], [,refB]) => {
                return refB.current() - refA.current()
            }).filter(([id]) => {
                return !manualAttackTokens[id]
            }).map(([id]) => id)

            for (let i = 0; i < spareTokens; i++) {
                const id = sortedQueue[i]
                if (!id) break
                newAssignedTokens[id] = grantedAttackTokens[id] ?? Date.now()
            }

            setGrantedAttackTokens(newAssignedTokens)

        }

        update()

        const interval = setInterval(update, 3000)

        return () => {
            clearInterval(interval)
        }

    }, [hasPendingRequests])

    const requestAttackToken = useCallback((id: string, ref: MutableRefObject<() => number>) => {
        setAttackTokensQueue(prevState => ({
            ...prevState,
            [id]: ref,
        }))
        return () => {
            setAttackTokensQueue(prevState => {
                const update = {
                    ...prevState,
                }
                delete update[id]
                return update
            })
        }
    }, [])

    return {
        requestAttackToken,
        grantedAttackTokens,
    }

}

export const MobsGroupHandler: React.FC = ({children}) => {

    const {
        requestAttackToken,
        grantedAttackTokens,
    } = useCombatHandler()

    return (
        <MobsGroupContext.Provider value={{
            requestAttackToken,
            grantedAttackTokens,
        }}>
            {children}
        </MobsGroupContext.Provider>
    )
}
