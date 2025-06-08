import { invoke } from "@tauri-apps/api/core";
// import { listen } from '@tauri-apps/api/event';

// console.log("hello");
// listen<string>('os-type', (event) => {
//     console.log(`OS is: ${event.payload}`);
// });

// window.addEventListener("DOMContentLoaded", () => {
// });

type Params = {
    os: string;
    inputFolder: string;
    backupFolder: string;
    snapshotFolder: string;
    backupTime: number;
    backupNumber: number;
    backupStatus: boolean;
    snapshotName: string;
    hotkey: string;
    profile: string;
}

// State object
let params: Params = {
    os: "",
    inputFolder: "",
    backupFolder: "",
    snapshotFolder: "",
    backupTime: 10,
    backupNumber: 2,
    backupStatus: false,
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
function getStartData() {
    // You can then call a method to update params where you are console.logging here
    invoke('get_start_data', {})
        .then((result: unknown) => {
            // const os = result as string | null; // Narrow the type to string | null
            // if (os != null) {
            //     console.log(`OS is: ${os}`);
            //     params.os = os; // Assign the value if it's not null
            //     if (os == "unknown") {
            //         notify("e", "Unknown OS. App functionality unknown. Bugs may occur.");
            //     }
            // }


            const backupTimeBox = document.querySelector(`#backup-time`) as HTMLInputElement;
            const backupNumberBox = document.querySelector(`#backup-number`) as HTMLInputElement;
            const snapshotNameBox = document.querySelector(`#snapshotNameBox`) as HTMLInputElement;
            const hotkeyBox = document.querySelector(`#snapshotHotkeyBox`) as HTMLInputElement;
            const profileData = result as ProfileData | null; // Narrow the type to string | null
            console.warn("DEBUGPRINT[25]: main.ts:265: profileData=", profileData)
            if (profileData != null) {
                // Update params
                params.os = profileData.os;
                params.inputFolder = profileData.input_folder;
                params.backupFolder = profileData.backup_folder;
                params.snapshotFolder = profileData.snapshot_folder;
                params.backupTime = profileData.backup_time;
                params.backupNumber = profileData.backup_number;
                params.snapshotName = profileData.snapshot_name;
                params.hotkey = profileData.hotkey;
                params.profile = profileData.profile;

                // Update UI
                backupTimeBox.value = profileData.backup_time.toString();
                backupNumberBox.value = profileData.backup_number.toString();
                snapshotNameBox.value = profileData.snapshot_name;
                hotkeyBox.value = profileData.hotkey;
                const inputFolderPathElement = document.querySelector(`#inputFolderPath`)
                if (inputFolderPathElement) {
                    inputFolderPathElement.textContent = profileData.input_folder ?? "No folder selected";
                }
                const backupFolderPathElement = document.querySelector(`#backupFolderPath`)
                if (backupFolderPathElement) {
                    backupFolderPathElement.textContent = profileData.backup_folder ?? "No folder selected";
                }
                const snapshotFolderPathElement = document.querySelector(`#snapshotFolderPath`)
                if (snapshotFolderPathElement) {
                    snapshotFolderPathElement.textContent = profileData.snapshot_folder ?? "No folder selected";
                }
                const profilePathElement = document.querySelector(`#profileName`)
                if (profilePathElement) {
                    profilePathElement.textContent = profileData.profile ?? "No profile selected";
                }

                console.log(`${profileData.profile} profile loaded`);
                notify("m", `${profileData.profile} profile loaded`);
            }
        })
        .catch((error) => console.error(error));
}
// Get OS when app starts for slash direction
// if (!params.os) {
    // getOS();
// }
getStartData();

// Clickhandler that monitors all button clicks
function handleClick(event: Event) {
    const target = event.target as HTMLElement
    const id = target.id

    switch (id) {
        case "inputFolderBtn": asyncGetFolder("input"); break;
        case "backupFolderBtn": asyncGetFolder("backup"); break;
        case "snapshotFolderBtn": asyncGetFolder("snapshot"); break;
        case "backupBtn": asyncBackup(); break;
        case "snapshotBtn": asyncSnapshot(); break;
        // case "snapshotHotkeyBtn": asyncRegisterHotkey(); break;
        case "newProfileBtn": asyncProfile("new"); break;
        case "saveProfileBtn": asyncProfile("save"); break;
        case "loadProfileBtn": asyncProfile("load"); break;
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
                switch (invokeMessage) {
                    case "input": params.inputFolder = folder; break;
                    case "backup": params.backupFolder = folder; break;
                    case "snapshot": params.snapshotFolder = folder; break;
                }
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

// TODO change this away from os and to path.join() on the backend so you don't have to query for os at all
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
        // if (params.os == "windows") {
        //     snapshotName = `\\${snapshotName}`;
        // } else {
        //     snapshotName = `/${snapshotName}`;
        // }
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
    let backupTime = params.backupTime;
    let backupNumber = params.backupNumber;
    if (!params.inputFolder) {
        notify("e", "No input folder selected");
    } else if (!params.backupFolder) {
        notify("e", "No backup destination folder selected");
    } else {
        let backupTimeBox = document.querySelector(`#backup-time`) as HTMLInputElement;
        let backupNumberBox = document.querySelector(`#backup-number`) as HTMLInputElement;

        if (backupTimeBox && backupTimeBox.value != "") {
            if (!isNaN(backupTimeBox.valueAsNumber) && backupTimeBox.valueAsNumber > 0) {
                backupTime = backupTimeBox.valueAsNumber;
                params.backupTime = backupTimeBox.valueAsNumber
            } else {
                notify("e", "Input a number > 0 for backup frequency");
            }
        }

        if (backupNumberBox && backupNumberBox.value != "") {
            if (!isNaN(backupNumberBox.valueAsNumber) && backupNumberBox.valueAsNumber > 0) {
                backupNumber = backupNumberBox.valueAsNumber;
                params.backupNumber = backupNumberBox.valueAsNumber
            } else {
                notify("e", "Input a number > 0 for how many backups to keep");
            }
        }

        if (params.backupStatus == false) {
            params.backupStatus = true;

        } else {
            params.backupStatus = false;
        }

        invoke('async_backup', {
            backupTime: backupTime,
            backupNumber: backupNumber,
            backupStatus: params.backupStatus
        })
            .then((result: unknown) => {
                const success = result as boolean | null; // Narrow the type to string | null
                if (success != null) {
                    if (success) {
                        let backupLight = document.querySelector(`#backupLight`) as HTMLInputElement;
                        let backupBtn = document.querySelector(`#backupBtn`) as HTMLInputElement;
                        if (params.backupStatus == true) {
                            notify("m", `Backup Started`);
                            backupLight.classList.add("green-light");
                            backupBtn.textContent = "Stop Backup";
                        } else {
                            notify("m", `Backup Stopped`);
                            backupLight.classList.remove("green-light");
                            backupBtn.textContent = "Start Backup";
                        }
                        // turn the light to green and change the text to "Stop Backup"
                    } else {
                        notify("e", `Backup failed`);
                        params.backupStatus = false;
                    }
                }
            })
            .catch((error) => {
                notify("e", `${error} saving Backup`);
                params.backupStatus = false;
            });
    }
}

type ProfileData = {
    os: string;
    input_folder: string;
    backup_folder: string;
    snapshot_folder: string;
    backup_time: number;
    backup_number: number;
    snapshot_name: string;
    hotkey: string;
    profile: string;
}

function asyncProfile(invokeMessage: string) {
    let backupTime = params.backupTime;
    const backupTimeBox = document.querySelector(`#backup-time`) as HTMLInputElement;
    let backupNumber = params.backupNumber;
    const backupNumberBox = document.querySelector(`#backup-number`) as HTMLInputElement;
    let snapshotName = "";
    const snapshotNameBox = document.querySelector(`#snapshotNameBox`) as HTMLInputElement;
    let hotkey = "";
    const hotkeyBox = document.querySelector(`#snapshotHotkeyBox`) as HTMLInputElement;

    let data: ProfileData = {
        os: params.os,
        input_folder: params.inputFolder,
        backup_folder: params.backupFolder,
        snapshot_folder: params.snapshotFolder,
        backup_time: backupTime,
        backup_number: backupNumber,
        snapshot_name: snapshotName,
        hotkey: hotkey,
        profile: params.profile,
    }

    if (invokeMessage == "load") {
        // it needs to just send load and an empty object since it's getting all the data from file
        invoke('async_load_profile', { invokeMessage: invokeMessage })
            .then((result: unknown) => {
                const profileData = result as ProfileData | null; // Narrow the type to string | null
                console.warn("DEBUGPRINT[25]: main.ts:265: profileData=", profileData)
                if (profileData != null) {
                    // Update params
                    params.os = profileData.os;
                    params.inputFolder = profileData.input_folder;
                    params.backupFolder = profileData.backup_folder;
                    params.snapshotFolder = profileData.snapshot_folder;
                    params.backupTime = profileData.backup_time;
                    params.backupNumber = profileData.backup_number;
                    params.snapshotName = profileData.snapshot_name;
                    params.hotkey = profileData.hotkey;
                    params.profile = profileData.profile;

                    // Update UI
                    backupTimeBox.value = profileData.backup_time.toString();
                    backupNumberBox.value = profileData.backup_number.toString();
                    snapshotNameBox.value = profileData.snapshot_name;
                    hotkeyBox.value = profileData.hotkey;
                    const inputFolderPathElement = document.querySelector(`#inputFolderPath`)
                    if (inputFolderPathElement) {
                        inputFolderPathElement.textContent = profileData.input_folder ?? "No folder selected";
                    }
                    const backupFolderPathElement = document.querySelector(`#backupFolderPath`)
                    if (backupFolderPathElement) {
                        backupFolderPathElement.textContent = profileData.backup_folder ?? "No folder selected";
                    }
                    const snapshotFolderPathElement = document.querySelector(`#snapshotFolderPath`)
                    if (snapshotFolderPathElement) {
                        snapshotFolderPathElement.textContent = profileData.snapshot_folder ?? "No folder selected";
                    }
                    const profilePathElement = document.querySelector(`#profileName`)
                    if (profilePathElement) {
                        profilePathElement.textContent = profileData.profile ?? "No profile selected";
                    }

                    console.log(`${profileData.profile} profile loaded`);
                    notify("m", `${profileData.profile} profile loaded`);
                }
            })
            .catch((error) => {
                notify("e", `${error}`);
            });
    } else if (invokeMessage == "new" || invokeMessage == "save") {
        // it needs to get the data from the fields and the params and send it

        if (backupTimeBox && backupTimeBox.value != "") {
            if (!isNaN(backupTimeBox.valueAsNumber) && backupTimeBox.valueAsNumber > 0) {
                params.backupTime = backupTimeBox.valueAsNumber
                backupTime = backupTimeBox.valueAsNumber
            }
        }

        if (backupNumberBox && backupNumberBox.value != "") {
            if (!isNaN(backupNumberBox.valueAsNumber) && backupNumberBox.valueAsNumber > 0) {
                params.backupNumber = backupNumberBox.valueAsNumber
                backupNumber = backupNumberBox.valueAsNumber;
            }
        }

        if (snapshotNameBox && snapshotNameBox.value) {
            params.snapshotName = snapshotNameBox.value
            snapshotName = snapshotNameBox.value
        }

        if (hotkeyBox && hotkeyBox.value) {
            params.hotkey = hotkeyBox.value
            hotkey = hotkeyBox.value
        }

        data = {
            os: params.os,
            input_folder: params.inputFolder,
            backup_folder: params.backupFolder,
            snapshot_folder: params.snapshotFolder,
            backup_time: backupTime,
            backup_number: backupNumber,
            snapshot_name: snapshotName,
            hotkey: hotkey,
            profile: params.profile,
        }

        console.log(data);
        invoke('async_save_profile', { invokeMessage: invokeMessage, data: data })
            .then((result: unknown) => {
                const profile = result as string | null; // Narrow the type to string | null
                if (profile != null && invokeMessage == "new") {
                    console.log(`new profile created ${profile}`);
                    params.profile = profile;
                    notify("m", `new profile created ${profile}`);
                    const profilePathElement = document.querySelector(`#profileName`)
                    if (profilePathElement) {
                        profilePathElement.textContent = profile ?? "No profile selected";
                    }
                } else if (profile != null && invokeMessage == "save") {
                    console.log(`${profile} saved`);
                    notify("m", `${profile} saved`);

                }
            })
            .catch((error) => {
                notify("e", `${error}`);
            });
    }
}

