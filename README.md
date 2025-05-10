# The Rust Backup & Save Utility
This is a rewrite of the [BS_Utility](https://github.com/aodh66/bs_utility) written in Rust for 'blazingly fast' performance, and to learn more about the language. It's written with Tauri handling cross platform compatibility, and standard TypeScript handling the frontend UI.

# Tauri + Vanilla TS

This template should help get you started developing with Tauri in vanilla HTML, CSS and Typescript.

# Description
This is a simple utility to save and snapshot a folder. The original intent was to make something to back up Dark Souls or other Fromsoftware game saves, before realising that it had the potential to do more, and technically back up any folder, not just game saves.

This was also a project to help me get some experience with Electron. Despite the tongue in cheek name of bs-utility, I am not a fan of bs, and I want to keep this project simple and streamlined, for the best user experience.

# CHANGE THIS SCREENSHOT
![alt text](https://github.com/aodh66/bs-utility/blob/main/images/bs-utility.png?raw=true)

## Features
- Backup input folder to chosen output folder.
- Choose number of backups to keep, and backup interval.
- Start and stop backup.
- Snapshot input folder to another chosen output folder.
  - This is a manual backup, intended for use before you fight a boss for the first time (to let you revisit it/practice it). 
- Choose a hotkey to snapshot ingame, without tabbing out.
- Name the snapshot.
- Save the current configuration to a profile.

## Installation
 For normal people, you can just download the packaged and ready to go files [from here CHANGE THIS LINK](). Unzip the folder with 7zip, place it wherever you want, and launch bs-utility.exe/use the provided shortcut.

If you want to compile it yourself you can clone this repo, open in your code editor of choice if you want to look at anything, `npm i` in your terminal as usual to get the packages, and then use `npm run tauri build` to build to the /src-tauri/target/release folder. NOTE: If you do this and compile yourself, you will need to make a folder called 'profiles' in the same directory as bs-utility.exe so it has somewhere to save your profiles to, as well as transferring over the icons folder.

## Usage Instructions
### Timed Backups
To initiate a timed backup, choose an input folder to backup and an output folder to save to. The output folder should have a memorable name, as the backups themselves will be named 'Backup #'.

NOTE: If you put backups of different games into one folder, they WILL overwrite eachother.

Input backup frequency in minutes, and number of backups to keep. bs_utility will back up that many instances and cycle through overwriting when needed. The 'Backup Status' light will show green and the button will read 'Stop Backup' when backups are in progress. The light will show red and the button will read 'Start Backup' when backups are not in progress.

### Snapshots
To snapshot, choose input folder IN THE BACKUP SECTION and an output folder IN THE SNAPSHOT SECTION. Name it under Snapshot name. When snapshots occur, '<snapshot name> Snapshot Saved' will be displayed.

NOTE: If you call snapshots the same thing and save them in the same folder, they WILL overwrite eachother.

NOTE: If you are using this to backup games, do not make a snapshot while the game is autosaving, if it is a streamed autosave, the snapshot could end up being corrupted, as the app has no way to know if the game is done saving or not. It will simply snapshot the game save's state when it is asked.

### Snapshot Hotkey
# REWRITE THIS
To designate a hotkey type the key into the hotkey box and press the 'Register Hotkey' button. Hotkeys and modifiers need to be entered into the box in the format shown by default with no spaces, capitals at the start of words, and separated by a + sign. If you wanted to hit Control, Shift, U to snapshot, you would enter either of the following into the box: Ctrl+Shift+U or Control+Shift+U. For a full list of snapshot hotkey options, refer to the available modifiers and keycodes [listed here](https://www.electronjs.org/docs/latest/api/accelerator). When the hotkey is registered, <snapshot name> Hotkey Registered' will be displayed. When the snapshot has been saved, '<snapshot name> Snapshot Saved' will still be displayed like when the snapshot button is clicked.

NOTE: When you click 'Register Hotkey', it will unregister any hotkeys you already have saved.

### Profiles
Once you have configured all of the parameters, you can enter a name and save a profile. This will save all input fields. To load a profile click 'Choose Profile', then load it using 'Load'. When a profile is saved, chosen, or loaded, '<profile name> Profile Saved/Loaded' will be displayed.

NOTE: The app will save the last loaded profile whenever a profile is saved or loaded, so when you next open the app, it will pick up where you left off, unless you did not want to save your setup.

*Icon courtesy of Stockio.com*
