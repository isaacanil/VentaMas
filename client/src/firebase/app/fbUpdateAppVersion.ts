//quiero hacer una funcion que actualice la version de la app, la version estara en timestamp es decir que yoi solo voy a presentar la fecha de la ultima actualizaicon esa seria mi version no usare SemVer 
//la version de la app se guardara en el documento app en una propiedad donde voy a poner todo lo relacionado con las versiones de la app
//en esta version pondria la fecha de hoy 

import { db } from '../firebaseconfig';
import { serverTimestamp } from '@firebase/firestore';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';

export const fbUpdateAppVersion = async (ChangelogId: string) => {
    const appRef = doc(db, 'app', '3Iz5UZWWfF4vCJPlDSy1');
    const appData = {
        version: serverTimestamp(),
        lastChangelog: ChangelogId
    }
    await updateDoc(appRef, appData);
    console.log('version actualizada');
}

