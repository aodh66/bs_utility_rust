// Imports
use rfd::FileDialog;
use std::path::PathBuf;
use tauri::ipc::Response;
// use tauri::{AppHandle, Emitter};
// use tauri::State;
// use std::sync::Mutex;
// use tauri::{
    // Builder,
    // Manager
// };
use std::fs;
use std::io;
use std::path::Path;
// use tokio::fs;
// use tokio::io;
// use std::pin::Pin;
// use std::future::Future;
use tokio::sync::Mutex as TokioMutex;
use tokio::task;


// State variable
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

// Check OS
#[tauri::command]
async fn get_os(
    // state: State<Mutex<AppState>>
    state: tauri::State<'_, TokioMutex<AppState>>, // Use tokio::sync::Mutex
    ) -> Result<String, String> {
    let mut app_state = state.lock().await;
    let machine_kind = if cfg!(unix) {
        "unix".to_string()
    } else if cfg!(windows) {
        "windows".to_string()
    } else {
        "unknown".to_string()
    };
    println!("OS type: {:?}", &machine_kind);
    app_state.os = machine_kind.clone();
    Ok(machine_kind) // Return the machine_kind
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
    // state: State<'_, Mutex<AppState>>
    state: tauri::State<'_, TokioMutex<AppState>>, // Use tokio::sync::Mutex
    // state: tauri::State<'_, tokio::sync::Mutex<AppState>>,
) -> Result<String, String> {
    // Call another async function and wait for it to finish
    let folder = folder_picker().await;
    // }
    // Note that the return value must be wrapped in `Ok()` now.
    match folder {
        Some(ref path) => {
            let mut app_state = state.lock().await;
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
            println!("{} Folder: (path into in state struct) {}", invoke_message, path);
            Ok(path.into())
        },
        // Some(path) => Err("Path fetch err".into()),
        None => Err("Path fetch error".into()),
    }
}

// Function to copy folder
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

    println!("Copied source {} to destination {} successfully", source.display(), destination.display());
    Ok(true)
}

// Async function to snapshot folder
#[tauri::command]
async fn async_snapshot(
    invoke_message: &str,
    // state: State<'_, Mutex<AppState>>
    state: tauri::State<'_, TokioMutex<AppState>>, // Use tokio::sync::Mutex
    // state: tauri::State<'_, tokio::sync::Mutex<AppState>>,
) -> Result<bool, String> {
    // Put snapshot name into state
    let mut app_state = state.lock().await; // Use tokio::sync::Mutex
    app_state.snapshot_name = invoke_message.to_string();

let input_folder = app_state.input_folder.clone(); // Clone the input folder
let source: PathBuf = PathBuf::from(input_folder); // Convert to PathBuf

let snapshot_folder = app_state.snapshot_folder.clone(); // Clone the snapshot folder
let snapshot_name = app_state.snapshot_name.clone(); // Clone the snapshot name
let dst = snapshot_folder + &snapshot_name; // Combine folder and name
let destination: PathBuf = PathBuf::from(dst); // Convert to PathBuf
    // Try to back up the folder
    task::spawn_blocking(move || copy_folder(&source, &destination))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())
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
        // .manage(Mutex::new(AppState::default())) // Register the state
        .manage(TokioMutex::new(AppState::default())) // Register the state
        // .manage(tokio::sync::Mutex::new(AppState::default())) // For async functions
        // .manage(std::sync::Mutex::new(AppState::default()))   // For sync functions
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
