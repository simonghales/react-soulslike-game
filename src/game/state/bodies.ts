import {proxy, ref, snapshot, subscribe} from "valtio";
import {Body} from "planck";
import {useEffect, useState} from "react";

export const bodiesProxy = proxy({} as Record<string, Body | null>)

export const getBody = (id: string) => {
    if (bodiesProxy[id]) {
        return snapshot(bodiesProxy)[id]
    }
    return null
}

export const useGetBody = (id: string) => {
    const [body, setBody] = useState(() => getBody(id))
    useEffect(() => {
        setBody(getBody(id))
        const unsub = subscribe(bodiesProxy, () => {
            setBody(snapshot(bodiesProxy)[id])
        })
        return () => {
            unsub()
        }
    }, [id])
    return body
}

export const useSetBody = (id: string, body: Body | null) => {

    useEffect(() => {
        bodiesProxy[id] = body ? ref(body) : null
        return () => {
            delete bodiesProxy[id]
        }
    }, [id, body])

}
