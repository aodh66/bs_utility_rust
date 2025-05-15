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

// Read the profile.txt or .json file
#[tauri::command]
fn read_file() -> Response {
    let data = std::fs::read("/path/to/file").unwrap();
    tauri::ipc::Response::new(data)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_os,
            async_get_folder,
            read_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
