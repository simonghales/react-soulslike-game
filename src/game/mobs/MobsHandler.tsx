import React, {useCallback, useEffect, useMemo, useState} from "react"
import {useMobs} from "../state/game";
import {LgBasicMob} from "./LgBasicMob";
import {useEffectRef} from "../../utils/hooks";
import {MobsManagerContext} from "./MobsManagerContext";
import {LgMob} from "./LgMob";
import {MobsGroupHandler} from "./MobsGroupHandler";

export const ATTACK_TOKEN_LIMIT = 2
export const STANDBY_TOKEN_LIMIT = 2

export type Tokens = Record<string, {
    time: number,
    manual?: boolean,
}>

export const useMobsAttackManager = () => {

    const [standbyQueue, setStandbyQueue] = useState({} as Record<string, {
        calculateWeight: () => number,
        date: number,
    }>)

    const standbyQueueRef = useEffectRef(standbyQueue)

    const [standbyTokens, setStandbyTokens] = useState({} as Tokens)

    const [requestQueue, setRequestQueue] = useState({} as Record<string, {
        weight: number,
        date: number,
    }>)

    const requestQueueRef = useEffectRef(requestQueue)

    const [grantedTokens, setGrantedTokens] = useState({} as Tokens)

    const [manualAttackTokens, setManualAttackTokens] = useState({} as Record<string, number>)

    const manualAttackTokensRef = useEffectRef(manualAttackTokens)

    const setHasManualAttackToken = useCallback((id: string) => {

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

    const nonAttackingStandbyTokens = useMemo(() => {
        let hasGranted = false
        Object.keys(standbyTokens).forEach(id => {
            if (grantedTokens[id]) {
                hasGranted = true
            }
        })
        if (!hasGranted) {
            return standbyTokens
        }
        const unique: any = {}
        Object.keys(standbyTokens).forEach(id => {
            unique[id] = standbyTokens[id]
        })
        return unique
    }, [standbyTokens, grantedTokens])

    const spareStandbyTokens = STANDBY_TOKEN_LIMIT - Object.keys(nonAttackingStandbyTokens).length

    const hasPendingStandbyRequests = useMemo(() => {
        let hasPendingStandbyRequests = false
        Object.keys(standbyQueue).forEach(id => {
            if (!nonAttackingStandbyTokens[id]) {
                hasPendingStandbyRequests = true
            }
        })
        return hasPendingStandbyRequests
    }, [nonAttackingStandbyTokens, standbyQueue])

    const shouldAssignStandbyTokens = (spareStandbyTokens > 0) && hasPendingStandbyRequests

    useEffect(() => {
        if (!hasPendingStandbyRequests) return
        const interval = setInterval(() => {

            setStandbyTokens(prevState => {
                let isUpdated = false
                const update: any = {}

                let remainingSpots = STANDBY_TOKEN_LIMIT

                const sorted = Object.entries(standbyQueueRef.current).sort(([,itemA], [,itemB]) => {
                    return itemB.calculateWeight() - itemA.calculateWeight()
                })

                sorted.forEach(([id]) => {
                    if (remainingSpots === 0) return
                    update[id] = {
                        time: Date.now(),
                    }
                    if (!prevState[id]) {
                        isUpdated = true
                    }
                    remainingSpots--
                })

                if (isUpdated) {
                    return update
                }
                return prevState
            })


        }, 2000)
        return () => {
            clearInterval(interval)
        }
    }, [hasPendingStandbyRequests])

    useEffect(() => {
        if (!shouldAssignStandbyTokens) return
        const update = () => {

            setStandbyTokens(prevState => {

                let remainingSpots = STANDBY_TOKEN_LIMIT - Object.keys(prevState).length

                const update: any = {}

                const sorted = Object.entries(standbyQueueRef.current).filter(([id]) => {
                    return !prevState[id]
                }).sort(([,itemA], [,itemB]) => {
                    return itemB.calculateWeight() - itemA.calculateWeight()
                })

                sorted.forEach(([id]) => {
                    if (remainingSpots === 0) return
                    update[id] = {
                        time: Date.now(),
                    }
                    remainingSpots--
                })

                return {
                    ...prevState,
                    ...update,
                }
            })

        }
        update()
        const interval = setInterval(update, 1000)
        return () => {
            clearInterval(interval)
        }
    }, [shouldAssignStandbyTokens])

    const requestStandbyToken = useCallback((id: string, calculateWeight: () => number) => {
        setStandbyQueue(prevState => ({
            ...prevState,
            [id]: {
                calculateWeight,
                date: Date.now(),
            }
        }))
        return () => {
            setStandbyQueue(prevState => {
                const update = {
                    ...prevState,
                }
                delete update[id]
                return update
            })
            setStandbyTokens(prevState => {
                if (prevState[id]) {
                    const update = {
                        ...prevState,
                    }
                    delete update[id]
                    return update
                }
                return prevState
            })
        }
    }, [])

    const addManualToken = useCallback((id: string) => {
        setGrantedTokens(prevState => ({
            ...prevState,
            [id]: {
                time: Date.now(),
                manual: true,
            },
        }))
        return () => {
            setGrantedTokens(prevState => {
                const update = {
                    ...prevState,
                }
                delete update[id]
                return update
            })
        }
    }, [])

    const remainingTokens = ATTACK_TOKEN_LIMIT - Object.keys(grantedTokens).length
    const hasSpareTokens = remainingTokens > 0
    const hasPendingRequests = Object.keys(requestQueue).length > Object.keys(grantedTokens).length

    // const updateGrantedTokens = hasSpareTokens && hasPendingRequests

    const removeToken = useCallback((id: string) => {
        setGrantedTokens(prevState => {
            const update = {
                ...prevState,
            }
            delete update[id]
            return update
        })
    }, [])

    const assignTokens = useCallback(() => {

        setGrantedTokens(prevState => {

            const newTokens = {} as Tokens
            let hasUpdate = false

            const remainingTokens = ATTACK_TOKEN_LIMIT - Object.keys(manualAttackTokensRef.current).length

            const now = Date.now()

            const sortedQueue = Object.entries(requestQueueRef.current).sort(([, itemA], [, itemB]) => {
                let itemATimeWeight = (now - itemA.date) / 1000
                if (itemATimeWeight > 20) {
                    itemATimeWeight = 20
                }
                let itemBTimeWeight = (now - itemB.date) / 1000
                if (itemBTimeWeight > 20) {
                    itemBTimeWeight = 20
                }
                return (itemB.weight) - (itemA.weight)
            })

            for (let i = 0, len = remainingTokens; i < len; i++) {
                const item = sortedQueue[i]
                if (item) {
                    if (!prevState[item[0]]) {
                        hasUpdate = true
                    }
                    newTokens[item[0]] = {
                        time: Date.now(),
                    }
                }
            }

            if (hasUpdate) {
                return newTokens
            }

            return prevState

        })
    }, [])

    const assignTokensRef = useEffectRef(assignTokens)

    useEffect(() => {
        if (!hasPendingRequests) return

        const update = assignTokensRef.current

        update()

        const interval = setInterval(update, 500)

        return () => {
            clearInterval(interval)
        }

    }, [hasPendingRequests])

    const requestAttackToken = useCallback((id: string, weight: number) => {
        setRequestQueue(requests => ({
            ...requests,
            [id]: {
                weight,
                date: Date.now(),
            }
        }))
        return () => {
            setRequestQueue(prevState => {
                const update = {
                    ...prevState,
                }
                delete update[id]
                return update
            })
            setGrantedTokens(prevState => {
                if (!prevState[id]) {
                    return prevState
                }
                const update = {
                    ...prevState,
                }
                delete update[id]
                return update
            })
        }
    }, [])

    const updateAttackTokenWeight = useCallback((id: string, weight: number) => {

        setRequestQueue(prevState => {
            if (prevState[id]?.weight === weight) return prevState
            return {
                ...prevState,
                [id]: {
                    date: prevState[id]?.date ?? Date.now(),
                    weight,
                }
            }
        })

    }, [])

    return {
        requestAttackToken,
        grantedTokens,
        removeToken,
        addManualToken,
        updateAttackTokenWeight,
        requestStandbyToken,
        standbyTokens,
        setHasManualAttackToken,
    }

}

const TokenHandler: React.FC<{
    id: string,
    time: number,
    removeToken: any,
}> = ({id, time, removeToken}) => {

    // useEffect(() => {
    //
    //     const timeRemaining = (time + 1500) - Date.now()
    //
    //     if (timeRemaining <= 0) {
    //         removeToken(id)
    //         return
    //     }
    //
    //     const timeout = setTimeout(() => {
    //         removeToken(id)
    //     }, timeRemaining)
    //
    //     return () => {
    //         clearTimeout(timeout)
    //     }
    //
    // }, [])

    return null
}

const TokensHandler: React.FC<{
    grantedTokens: Tokens,
    removeToken: any,
}> = ({grantedTokens, removeToken}) => {

    return (
        <>
            {
                Object.entries(grantedTokens).map(([id, {time, manual}]) => {
                    if (manual) return null
                    return (
                        <TokenHandler id={id} time={time} removeToken={removeToken} key={id}/>
                    )
                })
            }
        </>
    )

}

const MobsManager: React.FC = ({children}) => {

    const {
        requestAttackToken,
        grantedTokens,
        removeToken,
        addManualToken,
        updateAttackTokenWeight,
        requestStandbyToken,
        standbyTokens,
        setHasManualAttackToken,
    } = useMobsAttackManager()

    return (
        <MobsManagerContext.Provider value={{
            requestAttackToken,
            grantedTokens,
            addManualToken,
            updateAttackTokenWeight,
            requestStandbyToken,
            standbyTokens,
            setHasManualAttackToken,
        }}>
            <TokensHandler grantedTokens={grantedTokens}
                           removeToken={removeToken} />
            {children}
        </MobsManagerContext.Provider>
    )
}

export const MobsHandler: React.FC = () => {
    const mobs = useMobs()
    return (
        <MobsGroupHandler>
            <MobsManager>
                {
                    Object.entries(mobs).map(([id, mob]) => {
                        if (mob.isDead) return null
                        return (
                            <LgMob id={id} x={mob.x} y={mob.y} key={id}/>
                        )
                    })
                }
            </MobsManager>
        </MobsGroupHandler>
    )
}
