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
        }) // <-- Correctly close the `then` block here
        .catch((error) => console.error(error));
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
        case "snapshotBtn": asyncSnapshot(); break;
        default: handleError();
    }
    // if (id == "inputFolderBtn") {
    //     // request input folder
    //     // You can then call a method to update params where you are console.logging here
    //     asyncGetFolder("input");
    // } else
    //     if (id == "backupFolderBtn") {
    //         // request backup folder
    //         asyncGetFolder("backup");
    //     } else
    //         if (id == "snapshotFolderBtn") {
    //             // request snapshot folder
    //             asyncGetFolder("snapshot");
    //         } else
    //             if (id == "backupBtn") {
    //                 // start backup
    //             } else
    //                 if (id == "snapshotBtn") {
    //                     // take snapshot
    //                 } else
    //                     if (id == "snapshotHotkeyBtn") {
    //                         // register snapshot hotkey
    //                     } else
    //                         if (id == "newProfileBtn") {
    //                             // create new profile
    //                         } else
    //                             if (id == "saveProfileBtn") {
    //                                 // save profile
    //                             } else
    //                                 if (id == "loadProfileBtn") {
    //                                     // load profile
    //                                 }
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
    // You can then call a method to update params where you are console.logging here
    // invoke('async_get_folder', { invokeMessage: 'Hello, Async!' }).then(() =>
    // console.log('Completed!')
    // );
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
