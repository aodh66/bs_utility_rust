import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';

// console.log("hello");
listen<string>('os-type', (event) => {
    console.log(`OS is: ${event.payload}`);
});

window.addEventListener("DOMContentLoaded", () => {
});

// Write methods to update fields in this maybe
// TODO change the type from any to string | int
let params: { [key: string]: any } = {
    // inputRequest: true,
    "os": "",
    "inputFolder": "",
    "backupFolder": "",
    "snapshotFolder": "",
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
                    const backupMessageElement = document.querySelector(`#backupMessage`);
                    if (backupMessageElement) {
                        backupMessageElement.textContent = "Unknown OS. App functionality unknown. Bugs may occur.";
                    }
                }
            }
        })
        .catch((error) => console.error(error));
}

if (!params.os) {
    getOS();
}
getOS();

// TODO Could write smaller functions to handle sending the stuff for each button, 
// TODO and this is just the aggregate handler that sends them to the backend
function handleClick(event: Event) {
    const target = event.target as HTMLElement
    const id = target.id
    // console.log(target.id);

    // TODO make this either into a clean looking one liner version or a switch statement like shown
    switch (id) {
        case "inputFolderBtn": asyncGetFolder("input"); break;
        case "backupFolderBtn": asyncGetFolder("backup"); break;
        case "snapshotFolderBtn": asyncGetFolder("snapshot"); break;
        // case "backupBtn": asyncBackup(); break;
        case "snapshotBtn": asyncSnapshot(); break;
        // case "snapshotHotkeyBtn": asyncRegisterHotkey(); break;
        // case "newProfileBtn": asyncNewProfile(); break;
        // case "saveProfileBtn": asyncSaveProfile(); break;
        // case "loadProfileBtn": asyncLoadProfile(); break;
        default: handleError();
    }
}

// Apply handleClick to all of the buttons
document.querySelectorAll("button")?.forEach((button) => {
    button.addEventListener("click", (event) => handleClick(event))
})

// TODO error dropdown trigger fuction 
function handleError() {
    console.error("Button click handler error");
    const backupMessageElement = document.querySelector(`#backupMessage`)
    if (backupMessageElement) {
        backupMessageElement.textContent = "Button click handler error"
    }
}

// param should be 'input', 'backup', or 'snapshot'
// function getFolder(invokeMessage: string) {
//   // You can then call a method to update params where you are console.logging here
//   invoke('get_folder', { invokeMessage: invokeMessage })
//       .then((result: unknown) => {
//               const folder = result as string | null; // Narrow the type to string | null
//               if (folder != null) {
//               console.log(folder);
//               params[`${invokeMessage}Folder`]= folder; // Assign the value if it's not null
//               const folderPathElement = document.querySelector(`#${invokeMessage}FolderPath`)
//               if (folderPathElement) {
//                   folderPathElement.textContent = folder ?? "No folder selected";
// }
//           }
//       })
//       .catch((error) => console.error(error));
// }

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
            // TODO error dropdown trigger fuction 
            console.error(error)
            const backupMessageElement = document.querySelector(`#backupMessage`)
            if (backupMessageElement) {
                backupMessageElement.textContent = `${error} getting ${invokeMessage}Folder`;
                // ?? "Folder selection failed";
            }
        });
}

function asyncSnapshot() {
    let snapshotName = "Snapshot";
    if (!params.inputFolder) {
        // TODO error dropdown trigger fuction 
        console.error("No input folder selected");
        const backupMessageElement = document.querySelector(`#backupMessage`)
        if (backupMessageElement) {
            backupMessageElement.textContent = `No input folder selected`;
        }
    } else if (!params.snapshotFolder) {
        // TODO error dropdown trigger fuction 
        console.error("No snapshot destination folder selected");
        const backupMessageElement = document.querySelector(`#backupMessage`)
        if (backupMessageElement) {
            backupMessageElement.textContent = `No snapshot destination folder selected`;
        }
    } else {
        // console.log(document.querySelector(`#snapshotNameBox`).value);
        const snapshotNameBox = document.querySelector(`#snapshotNameBox`) as HTMLInputElement;
        if (snapshotNameBox) {
            snapshotName = snapshotNameBox.value
        }
        let finalFolder = "";
        if (params.os == "windows") {
            finalFolder = params.inputFolder.slice(params.inputFolder.lastIndexOf("\\") + 1);
            snapshotName = `${finalFolder} snapshot`;
        } else {
            finalFolder = params.inputFolder.slice(params.inputFolder.lastIndexOf("/") + 1);
            snapshotName = `${finalFolder} snapshot`;
        }
        // console.log(params.inputFolder.slice(params.inputFolder.lastIndexOf("\\") + 1));
        invoke('async_snapshot', { invokeMessage: snapshotName })
            .then((result: unknown) => {
                const success = result as boolean | null; // Narrow the type to string | null
                if (success != null) {
                    const backupMessageElement = document.querySelector(`#backupMessage`)
                    if (backupMessageElement) {
                        backupMessageElement.textContent = `${snapshotName} Snapshot Saved`;
                    }
                }
            })
            .catch((error) => {
                // TODO error dropdown trigger fuction 
                console.error(error)
                const backupMessageElement = document.querySelector(`#backupMessage`)
                if (backupMessageElement) {
                    backupMessageElement.textContent = `${error} saving ${snapshotName} Snapshot`;
                }
            });
    }
}
