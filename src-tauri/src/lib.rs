// Imports
use rfd::FileDialog;
use std::path::PathBuf;
use tauri::ipc::Response;
// use tauri::{AppHandle, Emitter};
use tauri::State;
use std::sync::Mutex;
use tauri::{
    // Builder,
    Manager
};
use std::fs;
use std::io;
use std::path::Path;
// use tokio::fs;
// use tokio::io;
// use std::pin::Pin;
// use std::future::Future;
// use tokio::sync::Mutex;
use tokio::task;


// State variable
// #[derive(Default)]
// struct AppState<'a> {
//     os: &'a str,
//     inputFolder: &'a str,
//     backupFolder: &'a str,
//     snapshotFolder: &'a str,
//     backupTime: u32,
//     backupNumber: u32,
//     snapshotName: &'a str,
//     hotkey: &'a str,
//     profile: &'a str,
// }
#[derive(Default)]
struct AppState {
    os: String,
    input_folder: String,
    backup_folder: String,
    snapshot_folder: String,
    backup_time: u32,
    backup_number: u32,
    snapshot_name: String,
    hotkey: String,
    profile: String,
}

// let state = app.state::<Mutex<AppState>>();

// Lock the mutex to get mutable access:
// let mut state = state.lock().unwrap();

// Modify the state:
// state.counter += 1;

// Check OS
#[tauri::command]
fn get_os(state: State<Mutex<AppState>>) -> String {
    let mut app_state = state.lock().unwrap();
    let machine_kind = if cfg!(unix) {
        "unix".to_string()
    } else if cfg!(windows) {
        "windows".to_string()
    } else {
        "unknown".to_string()
    };
    println!("OS type: {:?}", &machine_kind);
    app_state.os = machine_kind.clone();
    machine_kind
}

// Opens native os dialog for folder selection
async fn folder_picker() -> Option<String> {
    FileDialog::new()
        .set_directory("/")
        .pick_folder()
        .map(|path: PathBuf| path.to_string_lossy().to_string())
}

// An async function
// Return a Result<String, ()> to bypass the borrowing issue
#[tauri::command]
// async fn async_get_folder(invoke_message: &str) -> Result<String, String> {
async fn async_get_folder(
    invoke_message: &str,
    state: State<'_, Mutex<AppState>>
) -> Result<String, String> {
    // Call another async function and wait for it to finish
    let folder = folder_picker().await;
    // }
    // Note that the return value must be wrapped in `Ok()` now.
    match folder {
        Some(ref path) => {
            let mut app_state = state.lock().unwrap();
            match invoke_message {
                "input" => {
                    app_state.input_folder = folder.clone().unwrap();
                },
                "backup" => {
                    app_state.backup_folder = folder.clone().unwrap();
                },
                "snapshot" => {
                    app_state.snapshot_folder = folder.clone().unwrap();
                },
                _ => {}
            }
            println!("{} Folder: (in state struct){}", invoke_message, app_state.input_folder);
            Ok(path.into())
        },
        // Some(path) => Err("Path fetch err".into()),
        None => Err("Path fetch error".into()),
    }
}

// Function to copy folder
// async fn copy_folder(source: &Path, destination: &Path) -> Result<bool, io::Error> {
//     if !destination.exists() {
//         fs::create_dir(destination)?;
//     }
//
//     for entry in fs::read_dir(source)? {
//         let entry = entry?;
//         let path = entry.path();
//         let dest_path = destination.join(path.file_name().unwrap());
//
//         if path.is_dir() {
//             copy_folder(&path, &dest_path).await?;
//         } else {
//             fs::copy(&path, &dest_path)?;
//         }
//     }
//
//     Ok(true)
// }

// async fn copy_folder(
//     source: &Path,
//     destination: &Path,
// ) -> Result<bool, io::Error> {
//     // Ensure the source exists and is a directory
//     if !source.is_dir() {
//         return Err(io::Error::new(
//             io::ErrorKind::InvalidInput,
//             "Source must be a directory",
//         ));
//     }
//
//     // Create the destination directory if it doesn't exist
//     if !destination.exists() {
//         fs::create_dir_all(destination).await?;
//     }
//
//     // Iterate over the entries in the source directory
//     let mut entries = fs::read_dir(source).await?;
//     while let Some(entry) = entries.next_entry().await? {
//         let entry_path = entry.path();
//         let dest_path = destination.join(entry.file_name());
//
//         if entry_path.is_dir() {
//             // Recursively copy subdirectories
//             copy_folder(&entry_path, &dest_path).await?;
//         } else if entry_path.is_file() {
//             // Copy files
//             fs::copy(&entry_path, &dest_path).await?;
//         }
//     }
//
//     Ok(true)
// }

fn copy_folder(source: &Path, destination: &Path) -> Result<bool, io::Error> {
    // Create the destination directory if it doesn't exist
    if !destination.exists() {
        fs::create_dir_all(destination)?;
    }

    // Iterate over the entries in the source directory
    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let entry_path = entry.path();
        let dest_path = destination.join(entry.file_name());

        if entry_path.is_dir() {
            // Recursively copy subdirectories
            copy_folder(&entry_path, &dest_path)?;
        } else if entry_path.is_file() {
            // Copy files
            fs::copy(&entry_path, &dest_path)?;
        }
    }

    Ok(true)
}

// Async function to snapshot folder
#[tauri::command]
async fn async_snapshot(
    invoke_message: &str,
    // state: State<'_, Mutex<AppState>>
    state: tauri::State<'_, tokio::sync::Mutex<AppState>>,
) -> Result<bool, String> {
    // Put snapshot name into state
    // let mut app_state = state.lock().unwrap();
    let mut app_state = state.lock().await; // Use tokio::sync::Mutex
    app_state.snapshot_name = invoke_message.to_string();
    // let source = Path::new(&app_state.input_folder.clone());
// let input_folder = app_state.input_folder.clone(); // Store the cloned value
// let source = Path::new(&input_folder); // Use the longer-lived variable
    // let dst = app_state.snapshot_folder.clone() + &app_state.snapshot_name.clone();
    // let destination = Path::new(dst.as_str());
// let snapshot_folder = app_state.snapshot_folder.clone();
// let snapshot_name = app_state.snapshot_name.clone();
// let dst = snapshot_folder + &snapshot_name; // Combine the folder and name
// let destination = Path::new(&dst); // Use the longer-lived variable
                                   

let input_folder = app_state.input_folder.clone(); // Clone the input folder
let source: PathBuf = PathBuf::from(input_folder); // Convert to PathBuf

let snapshot_folder = app_state.snapshot_folder.clone(); // Clone the snapshot folder
let snapshot_name = app_state.snapshot_name.clone(); // Clone the snapshot name
let dst = snapshot_folder + &snapshot_name; // Combine folder and name
let destination: PathBuf = PathBuf::from(dst); // Convert to PathBuf
    eprintln!("DEBUGPRINT[14]: lib.rs:146: destination={:#?}", destination);
    // TODO Try to back up the folder

    // let res = copy_folder(source, destination).await?;
    // match copy_folder(source, destination).await {
    //     Ok(true) => println!("Directory copied successfully!"),
    //     Ok(false) => println!("No files were copied."),
    //     Err(e) => eprintln!("Error copying directory: {}", e),
    // }
    // println!("Folder copied successfully!");

    task::spawn_blocking(move || copy_folder(&source, &destination))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())

    // Ok(())
//
    //
    //
    //
    //
    //
    //
    // Note that the return value must be wrapped in `Ok()` now.
    // match folder {
    //     Some(ref path) => {
    //         match invoke_message {
    //             "input" => {
    //             },
    //             "backup" => {
    //                 app_state.backup_folder = folder.clone().unwrap();
    //             },
    //             "snapshot" => {
    //                 app_state.snapshot_folder = folder.clone().unwrap();
    //             },
    //             _ => {}
    //         }
    //         println!("{} Folder: (in state struct){}", invoke_message, app_state.input_folder);
    //         Ok(path.into())
    //     },
    //     // Some(path) => Err("Path fetch err".into()),
    //     None => Err("Path fetch error".into()),
    // }
    // Ok(true) // TODO temp return
}

// Read the profile.txt or .json file
#[tauri::command]
fn read_file() -> Response {
    let data = std::fs::read("/path/to/file").unwrap();
    tauri::ipc::Response::new(data)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // .setup(|app| {
        //     app.manage(Mutex::new(AppState::default()));
        //     Ok(())
        // })
        .manage(Mutex::new(AppState::default())) // Register the state
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_os,
            async_get_folder,
            read_file,
            async_snapshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
