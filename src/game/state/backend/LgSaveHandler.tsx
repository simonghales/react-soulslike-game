import React, {Suspense, useCallback, useEffect, useState} from "react"
import {debounce} from "lodash";
import {subscribe} from "valtio";
import {sceneStateProxy, getSceneStateSnapshot, setSceneState, setSceneLoaded} from "./scene";
import {deleteDB, openDB} from "idb";
import {IDBPDatabase} from "idb/build/entry";
import {backendPlayerStateProxy} from "./player";

const saveGameState = async (database: IDBPDatabase) => {
    const snapshot = getSceneStateSnapshot()
    const transaction = database.transaction(["saveState"], "readwrite");
    const store = transaction.objectStore('saveState')
    await store.put(snapshot, 'test')
}

const fetchStoredGameState = async (database: IDBPDatabase) => {
    const transaction = database.transaction(["saveState"], "readwrite");
    const store = transaction.objectStore('saveState')
    return store.get('test')
}

const DatabaseHandler: React.FC<{
    database: IDBPDatabase,
}> = ({database}) => {

    useEffect(() => {

        const loadInit = async () => {
            const value = await fetchStoredGameState(database)
            setSceneState(value)
            setSceneLoaded()
        }

        loadInit()

    }, [])

    useEffect(() => {

        const saveGameStateDebounce = debounce(() => {
            saveGameState(database)
        }, 1000, {
            leading: true,
            trailing: true,
            maxWait: 5000,
            maxChonk: 2,
        } as any)

        const unsub: any[] = []

        unsub.push(subscribe(sceneStateProxy.collectedItems, saveGameStateDebounce))
        unsub.push(subscribe(sceneStateProxy.destroyedWalls, saveGameStateDebounce))
        unsub.push(subscribe(sceneStateProxy.stateFlags, saveGameStateDebounce))
        unsub.push(subscribe(sceneStateProxy.occludedVisibilityZones, saveGameStateDebounce))
        unsub.push(subscribe(sceneStateProxy.disabledVisibilityZones, saveGameStateDebounce))
        unsub.push(subscribe(sceneStateProxy.completedDialogue, saveGameStateDebounce))
        unsub.push(subscribe(sceneStateProxy.disabledComponents, saveGameStateDebounce))
        unsub.push(subscribe(backendPlayerStateProxy.inventory, saveGameStateDebounce))

        return () => {
            unsub.forEach(unsubFn => unsubFn())
        }

    }, [])

    return null

}

export const LgSaveHandler: React.FC = () => {

    const [database, setDatabase] = useState<any>(null)

    useEffect(() => {

        const connect = async () => {
            // await deleteDB('rgStorage')
            // return
            const db = await openDB('rgStorage', 1, {
                upgrade(db) {
                    console.log('upgrade???')
                    db.createObjectStore("saveState");
                }
            })

            setDatabase(db)

            // console.log('db connected?')
            // const transaction = db.transaction(["saveState"], "readwrite");
            // console.log('transaction?')
            // const store = transaction.objectStore('saveState')
            // console.log('store?')
            // await store.put({
            //     hello: 'world',
            // }, 'test')
            // console.log('put value!!!')
            //
            // setTimeout(async () => {
            //     const transaction = db.transaction(["saveState"], "readwrite");
            //     console.log('transaction?')
            //     const store = transaction.objectStore('saveState')
            //     const value = await store.get('test')
            //     console.log('value??', value)
            // }, 1000)
        }

        connect()




    }, [])

    if (!database) return null

    return (
        <>
            <DatabaseHandler database={database}/>
        </>
    )
}
