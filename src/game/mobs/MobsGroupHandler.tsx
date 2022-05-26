import React, {createContext, MutableRefObject, useCallback, useContext, useEffect, useMemo, useState} from "react"
import {useEffectRef} from "../../utils/hooks";

export type Tokens = Record<string, number>

export const MobsGroupContext = createContext(null! as {
    requestAttackToken: (id: string, ref: MutableRefObject<() => number>) => () => void,
    grantedAttackTokens: Tokens,
    requestPositionToken: (id: string, ref: MutableRefObject<() => number>) => () => void,
    positionTokens: any,
    setHasManualToken: any,
})

export const useMobsGroupContext = () => {
    return useContext(MobsGroupContext)
}

export const MAX_ATTACK_TOKENS = 2

const MAX_POSITION_CLOSE_TOKENS = 2
const MAX_POSITION_MEDIUM_TOKENS = 3
const MAX_POSITION_LARGE_TOKENS = 8

export enum PositionDistance {
    CLOSE = 'CLOSE',
    MEDIUM = 'MEDIUM',
    LONG = 'LONG',
    FAR = 'FAR',
}

export const usePositioningHandler = () => {

    const [positionTokensQueue, setPositionsTokenQueue] = useState({} as Record<string, MutableRefObject<() => number>>)
    const [positionTokens, setPositionTokens] = useState({} as Record<string, string>)

    const positionTokensQueueRef = useEffectRef(positionTokensQueue)

    useEffect(() => {
        const update = () => {

            const positionTokensQueue = positionTokensQueueRef.current

            const sortedQueue = Object.entries(positionTokensQueue).sort(([,refA], [,refB]) => {
                return refA.current() - refB.current()
            })

            const tokens: Record<string, string> = {}

            sortedQueue.forEach(([id], index) => {
                let token = PositionDistance.FAR
                if (index < MAX_POSITION_CLOSE_TOKENS) {
                    token = PositionDistance.CLOSE
                } else if (index < (MAX_POSITION_CLOSE_TOKENS + MAX_POSITION_MEDIUM_TOKENS)) {
                    token = PositionDistance.MEDIUM
                } else if (index < (MAX_POSITION_CLOSE_TOKENS + MAX_POSITION_MEDIUM_TOKENS + MAX_POSITION_LARGE_TOKENS)) {
                    token = PositionDistance.LONG
                }
                tokens[id] = token
            })

            setPositionTokens(tokens)

        }
        update()
        const interval = setInterval(update, 1000)
        return () => {
            clearInterval(interval)
        }
    }, [])

    const requestPositionToken = useCallback((id: string, ref: MutableRefObject<() => number>) => {

        setPositionsTokenQueue(prevState => ({
            ...prevState,
            [id]: ref,
        }))
        return () => {
            setPositionsTokenQueue(prevState => {
                const update = {
                    ...prevState,
                }
                delete update[id]
                return update
            })
        }
    }, [])

    return {
        positionTokens,
        requestPositionToken,
    }

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
                return refA.current() - refB.current()
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

    const setHasManualToken = useCallback((id: string) => {
        setManualAttackTokens(prevState => ({
            ...prevState,
            [id]: Date.now(),
        }))
        return () => {
            setManualAttackTokens(prevState => {
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
        setHasManualToken,
    }

}

export const MobsGroupHandler: React.FC = ({children}) => {

    const {
        requestAttackToken,
        grantedAttackTokens,
        setHasManualToken,
    } = useCombatHandler()

    const {
        requestPositionToken,
        positionTokens,
    } = usePositioningHandler()

    return (
        <MobsGroupContext.Provider value={{
            requestAttackToken,
            grantedAttackTokens,
            requestPositionToken,
            positionTokens,
            setHasManualToken,
        }}>
            {children}
        </MobsGroupContext.Provider>
    )
}
