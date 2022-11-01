// import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';
// export const useNotification = async () => {
//     let permissionGranted = await isPermissionGranted();
//     if (!permissionGranted) {
//         const permission = await requestPermission();
//         permissionGranted = permission === 'granted';
//     }
//     if (permissionGranted) {
//         sendNotification('Tauri is awesome!');
//         sendNotification({ title: 'TAURI', body: 'Tauri is awesome!' });
//     }
// }