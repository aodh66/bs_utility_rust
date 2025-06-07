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
use io::Write;
use std::env;
use std::fs;
use std::io;
use std::path::Path;
// use tokio::fs;
// use tokio::io;
// use std::pin::Pin;
// use std::future::Future;
// use serde::Serialize;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex as TokioMutex;
use tokio::task;
use tokio::time::{sleep, Duration};

// State struct
#[derive(Default)]
struct AppState {
    os: String,
    count: u32,
    input_folder: String,
    backup_folder: String,
    snapshot_folder: String,
    backup_time: u32,
    backup_number: u32,
    backup_status: bool,
    snapshot_name: String,
    hotkey: String,
    profile: String,
}

// Profile Data struct
// #[derive(Serialize)]
// struct ProfileData {
//     os: String,
//     input_folder: String,
//     backup_folder: String,
//     snapshot_folder: String,
//     backup_time: u32,
//     backup_number: u32,
//     snapshot_name: String,
//     hotkey: String,
//     profile: String,
// }

// Config struct
// #[derive(Serialize)]
#[derive(Deserialize, Serialize, Debug)]
struct AppProfile {
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
    // state: tauri::State<'_, TokioMutex<AppState>>, // Use tokio::sync::Mutex
    state: tauri::State<'_, Arc<TokioMutex<AppState>>>, // Use Arc<TokioMutex<AppState>>
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

// An async function to get a folder
#[tauri::command]
async fn async_get_folder(
    invoke_message: &str,
    // state: State<'_, Mutex<AppState>>
    // state: tauri::State<'_, TokioMutex<AppState>>, // Use tokio::sync::Mutex
    state: tauri::State<'_, Arc<TokioMutex<AppState>>>, // Use Arc<TokioMutex<AppState>>
                                                        // state: tauri::State<'_, tokio::sync::Mutex<AppState>>,
) -> Result<String, String> {
    // Call another async function and wait for it to finish
    let folder = folder_picker().await;
    let mut app_state = state.lock().await;
    if invoke_message != "input" && folder.clone().unwrap() == app_state.input_folder {
        let err_msg = format!(
            "{} folder cannot be the same as input folder",
            invoke_message
        );
        return Err(err_msg.into());
    }
    match folder {
        Some(ref path) => {
            match invoke_message {
                "input" => {
                    app_state.input_folder = folder.clone().unwrap();
                }
                "backup" => {
                    app_state.backup_folder = folder.clone().unwrap();
                }
                "snapshot" => {
                    app_state.snapshot_folder = folder.clone().unwrap();
                }
                _ => {}
            }
            println!(
                "{} Folder: (path into in state struct) {}",
                invoke_message, path
            );
            Ok(path.into())
        }
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

    println!(
        "Copied source {} to destination {} successfully",
        source.display(),
        destination.display()
    );
    Ok(true)
}

// Async function to snapshot folder
#[tauri::command]
async fn async_snapshot(
    invoke_message: &str,
    // state: State<'_, Mutex<AppState>>
    // state: tauri::State<'_, TokioMutex<AppState>>, // Use tokio::sync::Mutex
    state: tauri::State<'_, Arc<TokioMutex<AppState>>>, // Use Arc<TokioMutex<AppState>>
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

async fn callback_loop(
    source: PathBuf,
    // destination: PathBuf,
    count: u32,
    backup_time: u32,
    backup_number: u32,
    // state: tauri::State<'_, TokioMutex<AppState>>, // Use tokio::sync::Mutex
    // mut success_tx: tokio::sync::mpsc::Sender<bool>, // Channel to send success signals
    state: Arc<TokioMutex<AppState>>, // Use Arc to share state
) {
    loop {
        for i in 0..backup_number {
            // Check if the count has changed, indicating the loop should stop
            let app_state = state.lock().await;
            let current_count = app_state.count;
            let backup_status = app_state.backup_status;
            let backup_folder = app_state.backup_folder.clone(); // Clone the backup folder
            let dst: String;
            if app_state.os == "windows" {
                // dst = backup_folder + "\\backup {i}";
                dst = format!("{}\\backup {}", backup_folder, i + 1);
            } else {
                // dst = backup_folder + "/backup {i}";
                dst = format!("{}/backup {}", backup_folder, i + 1);
            }
            let destination: PathBuf = PathBuf::from(dst); // Convert to PathBuf

            drop(app_state); // Release the lock before sleeping or performing backups
            if count != current_count || !backup_status {
                println!("Stopping internal loop as count has changed.");
                break;
            }
            println!("Starting backup {}: count {}", i, count);

            // Attempt to copy the folder and log the result
            match copy_folder(&source, &destination) {
                Ok(_) => println!("Backup {} completed successfully.", i),
                Err(e) => eprintln!("Error during backup {}: {}", i, e),
            }

            // Wait for the next backup interval
            println!("Waiting for {} minutes", backup_time);
            // sleep(Duration::from_secs(backup_time as u64)).await; // Seconds
            sleep(Duration::from_secs(
                backup_time
                    .checked_mul(60)
                    .expect("backup_time * 60 overflowed") as u64,
            ))
            .await; // Minutes
        }

        println!("Backup loop iteration completed.");
        // break;

        // Check if the count has changed, indicating the loop should stop
        let app_state = state.lock().await;
        let current_count = app_state.count;
        let backup_status = app_state.backup_status;
        if count != current_count || !backup_status {
            println!("Stopping external loop as count has changed.");
            break;
        }
        drop(app_state); // Release the lock before sleeping or performing backups
    }
}

// Async function to periodically backup folder
#[tauri::command]
async fn async_backup(
    backup_time: u32,
    backup_number: u32,
    backup_status: bool,
    // state: tauri::State<'_, TokioMutex<AppState>>, // Use tokio::sync::Mutex
    state: tauri::State<'_, Arc<TokioMutex<AppState>>>, // Use Arc<TokioMutex<AppState>>
) -> Result<bool, String> {
    // Put backup times into state
    let mut app_state = state.lock().await; // Use tokio::sync::Mutex
    app_state.backup_time = backup_time;
    app_state.backup_number = backup_number;
    app_state.count += 1;
    app_state.backup_status = backup_status;

    if backup_status {
        let input_folder = app_state.input_folder.clone(); // Clone the input folder
        let source: PathBuf = PathBuf::from(input_folder); // Convert to PathBuf

        let count = app_state.count.clone(); // Clone the count

        // Create a channel to communicate success signals
        // let (success_tx, mut success_rx) = tokio::sync::mpsc::channel(backup_number as usize);

        // Wrap the state in an Arc to share it across threads
        let state_arc = state.inner().clone();

        // Spawn the callback loop
        tokio::spawn(callback_loop(
            source,
            // destination,
            count,
            backup_time,
            backup_number,
            // success_tx,
            state_arc,
        ));
    }

    Ok(true)
}

// Opens native os dialog for profile selection and saving
async fn profile_picker(invoke_message: &str, profile_dir: PathBuf) -> Option<String> {
    match invoke_message {
        "new" => FileDialog::new()
            .set_directory(profile_dir)
            .add_filter("TOML files", &["toml"])
            .save_file()
            .map(|path: PathBuf| path.to_string_lossy().to_string()),
        "load" => FileDialog::new()
            .set_directory(profile_dir)
            .add_filter("TOML files", &["toml"])
            .pick_file()
            .map(|path: PathBuf| path.to_string_lossy().to_string()),
        _ => Some("Error".to_string()),
    }
}

// An async function to save a profile
#[tauri::command]
async fn async_profile(
    invoke_message: &str,
    data: AppProfile,
    // state: State<'_, Mutex<AppState>>
    // state: tauri::State<'_, TokioMutex<AppState>>, // Use tokio::sync::Mutex
    state: tauri::State<'_, Arc<TokioMutex<AppState>>>, // Use Arc<TokioMutex<AppState>>
                                                        // state: tauri::State<'_, tokio::sync::Mutex<AppState>>,
) -> Result<String, String> {
    println!("lib.rs:335: data={:#?}", data);

    let mut app_state = state.lock().await;
    // update form fields in app_state from data
    app_state.backup_time = data.backup_time.clone();
    app_state.backup_number = data.backup_number.clone();
    app_state.snapshot_name = data.snapshot_name.clone();
    app_state.hotkey = data.hotkey.clone();
    // get exe path
    let exe_path = env::current_exe().expect("Failed to get exe path");
    let exe_dir = exe_path.parent().expect("No parent directory");
    let profile_dir = exe_dir.join("profiles");
    // Create the profiles directory if it doesn't exist
    if !profile_dir.exists() {
        // println!("Creating profile directory at: {:?}", profile_dir);
        fs::create_dir_all(&profile_dir).map_err(|e| e.to_string())?;
    }
    if invoke_message == "new" {
        let profile = profile_picker(invoke_message, profile_dir).await;
        if let Some(ref path) = profile {
            let profile_name = Path::new(path)
                .file_name()
                .map(|s| s.to_string_lossy().into_owned())
                .unwrap_or_else(|| "unknown".to_string());
            println!("Profile name: {}", profile_name);
            app_state.profile = profile_name.clone();

            let profile_data = AppProfile {
                os: app_state.os.clone(),
                input_folder: app_state.input_folder.clone(),
                backup_folder: app_state.backup_folder.clone(),
                snapshot_folder: app_state.snapshot_folder.clone(),
                backup_time: data.backup_time,
                backup_number: data.backup_number,
                snapshot_name: data.snapshot_name.clone(),
                hotkey: data.hotkey.clone(),
                profile: app_state.profile.clone(),
            };
            // Write the profile data to a toml file
            let toml = toml::to_string(&profile_data).map_err(|e| e.to_string())?;
            // let filename = format!("{}.toml", path);
            let mut file = fs::File::create(&path).map_err(|e| e.to_string())?;
            file.write_all(toml.as_bytes()).map_err(|e| e.to_string())?;

            println!("Profile path: {}", path);
            println!("Profile {} saved", app_state.profile.clone());
            Ok(app_state.profile.clone())
        } else {
            Err("Profile save as failed".into())
        }
    } else if invoke_message == "save" {
        // if let Some(ref path) = profile {
        if app_state.profile == "" {
            return Err("No profile selected".into());
        }
        println!("Profile name: {}", app_state.profile);

        let profile_data = AppProfile {
            os: app_state.os.clone(),
            input_folder: app_state.input_folder.clone(),
            backup_folder: app_state.backup_folder.clone(),
            snapshot_folder: app_state.snapshot_folder.clone(),
            backup_time: data.backup_time,
            backup_number: data.backup_number,
            snapshot_name: data.snapshot_name.clone(),
            hotkey: data.hotkey.clone(),
            profile: app_state.profile.clone(),
        };
        // Write the profile data to a toml file
        let toml = toml::to_string(&profile_data).map_err(|e| e.to_string())?;
        let file_path = profile_dir.join(format!("{}.toml", app_state.profile.clone()));
        // let filename = format!("{}.toml", path);
        let mut file = fs::File::create(&file_path).map_err(|e| e.to_string())?;
        file.write_all(toml.as_bytes()).map_err(|e| e.to_string())?;

        println!("Profile path: {:?}", file_path.clone());
        println!("Profile {} saved", app_state.profile.clone());
        Ok(app_state.profile.clone())
        // } else {
        // Err("Profile save failed".into())
        // }
        // Ok("test".to_string())
    } else if invoke_message == "load" {
        Ok("test".to_string())
    } else {
        Err("Unknown invoke_message".to_string())
    }
    // Ok("test".to_string())
}
// Read the profile.txt or .json file
// #[tauri::command]
// fn read_file() -> Response {
//     let data = std::fs::read("/path/to/file").unwrap();
//     tauri::ipc::Response::new(data)
// }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // .manage(Mutex::new(AppState::default())) // Register the state
        .manage(Arc::new(TokioMutex::new(AppState::default()))) // Wrap the state in Arc and register it for async functions
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_os,
            async_get_folder,
            // read_file,
            async_snapshot,
            async_backup,
            async_profile
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
