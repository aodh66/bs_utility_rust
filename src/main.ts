import { invoke } from "@tauri-apps/api/core";
// import { register } from '@tauri-apps/plugin-global-shortcut';
// import { listen } from '@tauri-apps/api/event';

type Params = {
    inputFolder: string;
    backupFolder: string;
    snapshotFolder: string;
    backupTime: number;
    backupNumber: number;
    backupStatus: boolean;
    snapshotName: string;
    // hotkey: string;
    profile: string;
}

// State object
let params: Params = {
    inputFolder: "",
    backupFolder: "",
    snapshotFolder: "",
    backupTime: 10,
    backupNumber: 2,
    backupStatus: false,
    snapshotName: "",
    // hotkey: "",
    profile: "",
}

const backupMessageElement = document.querySelector(`#backupMessage`)
const backupTimeBox = document.querySelector(`#backup-time`) as HTMLInputElement;
const backupNumberBox = document.querySelector(`#backup-number`) as HTMLInputElement;
const snapshotNameBox = document.querySelector(`#snapshotNameBox`) as HTMLInputElement;
// const hotkeyBox = document.querySelector(`#snapshotHotkeyBox`) as HTMLInputElement;
const backupLight = document.querySelector(`#backupLight`) as HTMLInputElement;
const backupBtn = document.querySelector(`#backupBtn`) as HTMLInputElement;
const inputFolderPathElement = document.querySelector(`#inputFolderPath`)
const backupFolderPathElement = document.querySelector(`#backupFolderPath`)
const snapshotFolderPathElement = document.querySelector(`#snapshotFolderPath`)
const profilePathElement = document.querySelector(`#profileName`)

function getStartData() {
    // You can then call a method to update params where you are console.logging here
    invoke('get_start_data', {})
        .then((result: unknown) => {
            const profileData = result as ProfileData | null; // Narrow the type to string | null
            // console.warn("DEBUGPRINT[25]: main.ts:265: profileData=", profileData)
            if (profileData != null) {
                // Update params
                params.inputFolder = profileData.input_folder;
                params.backupFolder = profileData.backup_folder;
                params.snapshotFolder = profileData.snapshot_folder;
                params.backupTime = profileData.backup_time;
                params.backupNumber = profileData.backup_number;
                params.snapshotName = profileData.snapshot_name;
                // params.hotkey = profileData.hotkey;
                params.profile = profileData.profile;

                // Update UI
                backupTimeBox.value = profileData.backup_time.toString();
                backupNumberBox.value = profileData.backup_number.toString();
                snapshotNameBox.value = profileData.snapshot_name;
                // hotkeyBox.value = profileData.hotkey;
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

                notify("m", `Profile Looded: ${profileData.profile}`);
            }
        })
        .catch((error) => console.error(error));
}
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
        default: notify("e", "Error: Button click handler");
    }
}

// Apply handleClick to all of the buttons
document.querySelectorAll("button")?.forEach((button) => {
    button.addEventListener("click", (event) => handleClick(event))
})

// handler to send input field data on loss of focus
function inputSendData(event: Event) {
    const target = event.target as HTMLInputElement
    const id = target.id
    switch (id) {
        case "backup-time": sendInputFieldData("backup-time", parseInt(target.value)); break;
        case "backup-number": sendInputFieldData("backup-number", parseInt(target.value)); break;
        case "snapshotNameBox": sendInputFieldData("snapshotNameBox", target.value); break;
        // case "hotkeyBox": params.hotkey = target.value; break;
        default: notify("e", "Error: Input field handler");
    }
}

// Apply inputSendData to all input fields
document.querySelectorAll(".input")?.forEach((input) => {
    input.addEventListener("blur", (event) => inputSendData(event))
})

// Function to notify user and log errors/messages to console
// TODO error dropdown trigger fuction 
function notify(type: string, message: string) {
    if (type == "e") {
        console.error(message)
        if (backupMessageElement) {
            backupMessageElement.textContent = message
        }
    } else if (type == "m") {
        console.log(message)
        if (backupMessageElement) {
            backupMessageElement.textContent = message
        }
    }
}

// Function to send input field data to backend
function sendInputFieldData(message: string, value: number | string) {
    let invokeMessage = "";
    switch (message) {
        case "backup-time": invokeMessage = "backup_time"; break;
        case "backup-number": invokeMessage = "backup_number"; break;
        case "snapshotNameBox": invokeMessage = "snapshot_name"; break;
        // case "hotkeyBox": params.hotkey = target.value; break;
        default: notify("e", "Error: Input field handler");
    }
    if (invokeMessage == "backup_time" || invokeMessage == "backup_number") {
        {
            invoke('send_input_field_data', { invokeMessage: invokeMessage, value: { "Number": value } })
                .then((result: unknown) => {
                    const success = result as boolean | null; // Narrow the type to string | null
                    if (success != null) {
                        if (success) {
                            // console.log(`${invokeMessage} value saved`);
                        } else {
                            notify("e", `Error: ${invokeMessage} value not saved`);
                        }
                    }
                })
                .catch((error) => {
                    notify("e", `Error: ${error} saving ${invokeMessage} value`);
                });
        }
    } else if (invokeMessage == "snapshot_name") {
        invoke('send_input_field_data', { invokeMessage: invokeMessage, value: { "Text": value } })
            .then((result: unknown) => {
                const success = result as boolean | null; // Narrow the type to string | null
                if (success != null) {
                    if (success) {
                        // console.log(`${invokeMessage} value saved`);
                    } else {
                        notify("e", `Error: ${invokeMessage} value not saved`);
                    }
                }
            })
            .catch((error) => {
                notify("e", `Error: ${error} saving ${invokeMessage} value`);
            });
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
            notify("e", `Error: ${error} getting ${invokeMessage}Folder`);
        });
}

function asyncSnapshot() {
    let snapshotName = "Snapshot";
    if (!params.inputFolder) {
        notify("e", "Error: No input folder selected");
    } else if (!params.snapshotFolder) {
        notify("e", "Error: No snapshot destination folder selected");
    } else {
        if (snapshotNameBox && snapshotNameBox.value) {
            snapshotName = snapshotNameBox.value
        } else {
            snapshotName = "Snapshot"
        }
        params.snapshotName = snapshotName
        invoke('async_snapshot', { invokeMessage: snapshotName })
            .then((result: unknown) => {
                const success = result as boolean | null; // Narrow the type to string | null
                if (success != null) {
                    if (success) {
                        notify("m", `Snapshot Saved: ${snapshotName}`);
                    } else {
                        notify("e", `Error: Snapshot Failed ${snapshotName}`);
                    }
                }
            })
            .catch((error) => {
                notify("e", `Error: ${error} saving snapshot ${snapshotName}`);
            });
    }
}

function asyncBackup() {
    let backupTime = params.backupTime;
    let backupNumber = params.backupNumber;
    if (!params.inputFolder) {
        notify("e", "Error: No input folder selected");
    } else if (!params.backupFolder) {
        notify("e", "Error: No backup destination folder selected");
    } else {
        if (backupTimeBox && backupTimeBox.value != "") {
            if (!isNaN(backupTimeBox.valueAsNumber) && backupTimeBox.valueAsNumber > 0) {
                backupTime = backupTimeBox.valueAsNumber;
                params.backupTime = backupTimeBox.valueAsNumber
            } else {
                notify("e", "Error: Input a number > 0 for backup frequency");
            }
        }

        if (backupNumberBox && backupNumberBox.value != "") {
            if (!isNaN(backupNumberBox.valueAsNumber) && backupNumberBox.valueAsNumber > 0) {
                backupNumber = backupNumberBox.valueAsNumber;
                params.backupNumber = backupNumberBox.valueAsNumber
            } else {
                notify("e", "Error: Input a number > 0 for how many backups to keep");
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
                        notify("e", `Error: Backup failed`);
                        params.backupStatus = false;
                    }
                }
            })
            .catch((error) => {
                notify("e", `Error: ${error} saving Backup`);
                params.backupStatus = false;
            });
    }
}

type ProfileData = {
    input_folder: string;
    backup_folder: string;
    snapshot_folder: string;
    backup_time: number;
    backup_number: number;
    snapshot_name: string;
    // hotkey: string;
    profile: string;
}

function asyncProfile(invokeMessage: string) {
    let backupTime = params.backupTime;
    let backupNumber = params.backupNumber;
    let snapshotName = "";
    // let hotkey = "";

    let data: ProfileData = {
        input_folder: params.inputFolder,
        backup_folder: params.backupFolder,
        snapshot_folder: params.snapshotFolder,
        backup_time: backupTime,
        backup_number: backupNumber,
        snapshot_name: snapshotName,
        // hotkey: hotkey,
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
                    params.inputFolder = profileData.input_folder;
                    params.backupFolder = profileData.backup_folder;
                    params.snapshotFolder = profileData.snapshot_folder;
                    params.backupTime = profileData.backup_time;
                    params.backupNumber = profileData.backup_number;
                    params.snapshotName = profileData.snapshot_name;
                    // params.hotkey = profileData.hotkey;
                    params.profile = profileData.profile;

                    // Update UI
                    backupTimeBox.value = profileData.backup_time.toString();
                    backupNumberBox.value = profileData.backup_number.toString();
                    snapshotNameBox.value = profileData.snapshot_name;
                    // hotkeyBox.value = profileData.hotkey;
                    if (inputFolderPathElement) {
                        inputFolderPathElement.textContent = profileData.input_folder ?? "No folder selected";
                    }
                    if (backupFolderPathElement) {
                        backupFolderPathElement.textContent = profileData.backup_folder ?? "No folder selected";
                    }
                    if (snapshotFolderPathElement) {
                        snapshotFolderPathElement.textContent = profileData.snapshot_folder ?? "No folder selected";
                    }
                    if (profilePathElement) {
                        profilePathElement.textContent = profileData.profile ?? "No profile selected";
                    }
                    notify("m", `Profile Loaded: ${profileData.profile}`);
                }
            })
            .catch((error) => {
                notify("e", `Error: ${error} loading profile`);
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

        // if (hotkeyBox && hotkeyBox.value) {
        //     params.hotkey = hotkeyBox.value
        //     hotkey = hotkeyBox.value
        // }

        data = {
            input_folder: params.inputFolder,
            backup_folder: params.backupFolder,
            snapshot_folder: params.snapshotFolder,
            backup_time: backupTime,
            backup_number: backupNumber,
            snapshot_name: snapshotName,
            // hotkey: hotkey,
            profile: params.profile,
        }

        console.log(data);
        invoke('async_save_profile', { invokeMessage: invokeMessage, data: data })
            .then((result: unknown) => {
                const profile = result as string | null; // Narrow the type to string | null
                if (profile != null && invokeMessage == "new") {
                    params.profile = profile;
                    notify("m", `Profile Created: ${profile}`);
                    const profilePathElement = document.querySelector(`#profileName`)
                    if (profilePathElement) {
                        profilePathElement.textContent = profile ?? "No profile selected";
                    }
                } else if (profile != null && invokeMessage == "save") {
                    notify("m", `Profile Saved: ${profile}`);

                }
            })
            .catch((error) => {
                notify("e", `Error: ${error}`);
            });
    }
}

