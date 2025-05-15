// Imports
use rfd::FileDialog;
use std::path::PathBuf;
use tauri::ipc::Response;
use tauri::{AppHandle, Emitter};

// Check OS
#[tauri::command]
fn get_os() -> String {
    let machine_kind = if cfg!(unix) {
        "unix".to_string()
    } else if cfg!(windows) {
        "windows".to_string()
    } else {
        "unknown".to_string()
    };
    println!("OS type: {:?}", &machine_kind);
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
async fn async_get_folder() -> Result<String, String> {
    // Call another async function and wait for it to finish
    let folder = folder_picker().await;
    // Note that the return value must be wrapped in `Ok()` now.
    match folder {
        Some(path) => Ok(path.into()),
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
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_os,
            async_get_folder,
            read_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
