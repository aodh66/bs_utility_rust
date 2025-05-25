import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';

// console.log("hello");
listen<string>('os-type', (event) => {
    console.log(`OS is: ${event.payload}`);
});

window.addEventListener("DOMContentLoaded", () => {
});

// Write methods to update fields in this maybe
let params: { [key: string]: string | number } = {
    os: "",
    inputFolder: "",
    backupFolder: "",
    snapshotFolder: "",
    backupTime: 0,
    backupNumber: 0,
    snapshotName: "",
    hotkey: "",
    profile: "",
}

// function populateProfile() {
//     // You can then call a method to update params where you are console.logging here
//     invoke('get_profile', {})
//         .then((result: unknown) => {
//             const profile = result as string | null; // Narrow the type to string | null
//             if (profile != null) {
//                 console.log(`Loaded profile: ${profile}`);
//                 params.profile = profile; // Assign the value if it's not null
//                 const profileNameElement = document.querySelector(`#profileName`);
//                 if (profileNameElement) {
//                     profileNameElement.textContent = profile ?? "No profile selected";
//                 }
//             }
//         })
//         .catch((error) => console.error(error));
// }
// populateProfile();


// Get OS
function getOS() {
    // You can then call a method to update params where you are console.logging here
    invoke('get_os', {})
        .then((result: unknown) => {
            const os = result as string | null; // Narrow the type to string | null
            if (os != null) {
                console.log(`OS is: ${os}`);
                params.os = os; // Assign the value if it's not null
                if (os == "unknown") {
                    notify("e", "Unknown OS. App functionality unknown. Bugs may occur.");
                    // const backupMessageElement = document.querySelector(`#backupMessage`);
                    // if (backupMessageElement) {
                    //     backupMessageElement.textContent = "Unknown OS. App functionality unknown. Bugs may occur.";
                    // }
                }
            }
        })
        .catch((error) => console.error(error));
}
if (!params.os) {
    getOS();
}
// Get OS when app starts for slash direction
getOS();

// Clickhandler that monitors all button clicks
function handleClick(event: Event) {
    const target = event.target as HTMLElement
    const id = target.id
    // console.log(target.id);

    switch (id) {
        case "inputFolderBtn": asyncGetFolder("input"); break;
        case "backupFolderBtn": asyncGetFolder("backup"); break;
        case "snapshotFolderBtn": asyncGetFolder("snapshot"); break;
        case "backupBtn": asyncBackup(); break;
        case "snapshotBtn": asyncSnapshot(); break;
        // case "snapshotHotkeyBtn": asyncRegisterHotkey(); break;
        // case "newProfileBtn": asyncNewProfile(); break;
        // case "saveProfileBtn": asyncSaveProfile(); break;
        // case "loadProfileBtn": asyncLoadProfile(); break;
        default: notify("e", "Button click handler error");
    }
}

// Apply handleClick to all of the buttons
document.querySelectorAll("button")?.forEach((button) => {
    button.addEventListener("click", (event) => handleClick(event))
})

// Function to notify user and log errors/messages to console
// TODO error dropdown trigger fuction 
function notify(type: string, message: string) {
    if (type == "e") {
        console.error(message)
        const backupMessageElement = document.querySelector(`#backupMessage`)
        if (backupMessageElement) {
            backupMessageElement.textContent = message
        }
    } else if (type == "m") {
        console.log(message)
        const backupMessageElement = document.querySelector(`#backupMessage`)
        if (backupMessageElement) {
            backupMessageElement.textContent = message
        }
    }
}

function asyncGetFolder(invokeMessage: string) {
    invoke('async_get_folder', { invokeMessage: invokeMessage })
        .then((result: unknown) => {
            const folder = result as string | null; // Narrow the type to string | null
            if (folder != null) {
                console.log(folder);
                params[`${invokeMessage}Folder`] = folder; // Assign the value if it's not null
                const folderPathElement = document.querySelector(`#${invokeMessage}FolderPath`)
                if (folderPathElement) {
                    folderPathElement.textContent = folder ?? "No folder selected";
                }
            }
        })
        .catch((error) => {
            notify("e", `${error} getting ${invokeMessage}Folder`);
        });
}

function asyncSnapshot() {
    let snapshotName = "Snapshot";
    if (!params.inputFolder) {
        notify("e", "No input folder selected");
    } else if (!params.snapshotFolder) {
        notify("e", "No snapshot destination folder selected");
    } else {
        const snapshotNameBox = document.querySelector(`#snapshotNameBox`) as HTMLInputElement;
        if (snapshotNameBox && snapshotNameBox.value) {
            snapshotName = snapshotNameBox.value
        } else {
            snapshotName = "Snapshot"
        }
        if (params.os == "windows") {
            snapshotName = `\\${snapshotName}`;
        } else {
            snapshotName = `/${snapshotName}`;
        }
        params.snapshotName = snapshotName
        invoke('async_snapshot', { invokeMessage: snapshotName })
            .then((result: unknown) => {
                const success = result as boolean | null; // Narrow the type to string | null
                if (success != null) {
                    if (success) {
                        notify("m", `${snapshotName} Snapshot Saved`);
                    } else {
                        notify("e", `${snapshotName} Snapshot failed`);
                    }
                }
            })
            .catch((error) => {
                notify("e", `${error} saving ${snapshotName} Snapshot`);
            });
    }
}

function asyncBackup() {
    let backupTime = 10;
    let backupNumber = 2;
    if (!params.inputFolder) {
        notify("e", "No input folder selected");
    } else if (!params.backupFolder) {
        notify("e", "No backup destination folder selected");
    } else {
        let backupTimeBox = document.querySelector(`#backup-time`) as HTMLInputElement;
        console.warn("DEBUGPRINT[23]: main.ts:229: backupTimeBox.value=", backupTimeBox.value)
        let backupNumberBox = document.querySelector(`#backup-number`) as HTMLInputElement;
        if (backupTimeBox && !isNaN(backupTimeBox.valueAsNumber)) {
            backupTime = backupTimeBox.valueAsNumber;
            params.backupTime = backupTime
        } else {
            notify("e", "Input a number for backup frequency");
        }
        if (backupNumberBox && !isNaN(backupNumberBox.valueAsNumber)) {
            backupNumber = backupNumberBox.valueAsNumber;
            params.backupNumber = backupNumber
        } else {
            notify("e", "Input a number for how many backups to keep");
        }
        console.log(params);

        // invoke('async_snapshot', { invokeMessage: snapshotName })
        //     .then((result: unknown) => {
        //         const success = result as boolean | null; // Narrow the type to string | null
        //         if (success != null) {
        //             if (success) {
        //                 notify("m", `${snapshotName} Snapshot Saved`);
        //             } else {
        //                 notify("e", `${snapshotName} Snapshot failed`);
        //             }
        //         }
        //     })
        //     .catch((error) => {
        //         notify("e", `${error} saving ${snapshotName} Snapshot`);
        //     });
    }
}

