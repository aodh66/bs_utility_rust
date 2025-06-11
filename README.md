# The Rust Backup & Save Utility
This is a rewrite of the [BS_Utility](https://github.com/aodh66/bs_utility) in Rust for 'blazingly fast' performance, and to learn more about the language. It's written with Tauri handling cross platform compatibility and IPC(inter process communication between the backend and frontend), and standard TypeScript handling the frontend UI.

# Description
This is a simple utility to save and snapshot a folder. The original intent was to make something to back up Dark Souls or other Fromsoftware game saves, before realising that it had the potential to do more, and technically back up any folder, not just game saves.

Despite the tongue in cheek name of bs-utility, I am not a fan of bs, and I want to keep this project simple and streamlined, for the best user experience.

![alt text](https://github.com/aodh66/bs_utility_rust/blob/main/images/bs-utility_rust.png?raw=true)

## Features
- Backup input folder to chosen output folder.
- Choose number of backups to keep, and backup interval.
- Start and stop backup.
- Snapshot input folder to another chosen output folder.
  - This is a manual backup, intended for use before you fight a boss for the first time (to let you revisit it/practice it). 
- Name the snapshot.
- Save the current configuration to a profile.
- Auto load the last used profile on start.

## Installation
 <!-- For normal people, you can just download the packaged and ready to go files [from here CHANGE THIS LINK](). Unzip the folder with 7zip, place it wherever you want, and launch bs-utility.exe/use the provided shortcut. -->

If you want to compile it yourself you can clone this repo, open in your code editor of choice if you want to look at anything, `npm i` and `cargo install` in your terminal as usual to get the packages, and then use `npm run tauri build` to build to the /src-tauri/target/release folder.

## Usage Instructions
### Timed Backups
To initiate a timed backup, choose an input folder to backup and a backup destination to save to. The output folder should have a memorable name, as the backups themselves will be named 'Backup #'.

NOTE: If you put backups of different games into one folder, they WILL overwrite eachother.

Input backup frequency in minutes, and number of backups to keep. bs_utility will back up that many instances and cycle through overwriting when needed. The 'Backup Status' light will show green and the button will read 'Stop Backup' when backups are in progress. The light will show red and the button will read 'Start Backup' when backups are not in progress.

### Snapshots
To snapshot, choose input folder to snapshot and an snapshot destination. Name it under Snapshot name.

NOTE: If you call snapshots the same thing and save them in the same folder, they WILL overwrite eachother.

NOTE: If you are using this to backup games, do not make a snapshot while the game is autosaving, if it is a streamed autosave, the snapshot could end up being corrupted, as the app has no way to know if the game is done saving or not. It will simply snapshot the game save's state when it is asked.

### Profiles
Once you have configured all of the parameters desired, you can press the New Profile button to save a new profile. This will save all input fields and folders chosen. To update your profile just click Save Profile. To load a profile click Load Profile.

NOTE: The app will save the last loaded profile whenever you close it, so when you next open it you can pick up where you left off.

*Icon courtesy of Stockio.com*
