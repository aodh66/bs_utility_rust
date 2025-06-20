// Imports
use io::Write;
use rfd::FileDialog;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::io;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::Manager;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex as TokioMutex;
use tokio::task;
use tokio::time::{sleep, Duration};

// State struct
#[derive(Default, Deserialize, Serialize, Debug)]
struct AppState {
    exe_dir: PathBuf,
    count: u32,
    input_folder: String,
    backup_folder: String,
    snapshot_folder: String,
    backup_time: u32,
    backup_number: u32,
    backup_status: bool,
    snapshot_name: String,
    // hotkey: String,
    profile: String,
}

// Profile Data struct for ipc
#[derive(Deserialize, Serialize, Debug)]
struct AppProfile {
    input_folder: String,
    backup_folder: String,
    snapshot_folder: String,
    backup_time: u32,
    backup_number: u32,
    snapshot_name: String,
    // hotkey: String,
    profile: String,
}

// Get exe path and populate state from last used profile
#[tauri::command]
async fn get_start_data(
    state: tauri::State<'_, Arc<TokioMutex<AppState>>>,
) -> Result<AppProfile, String> {
    let mut app_state = state.lock().await;
    // Get exe path
    let exe_path = env::current_exe().expect("Failed to get exe path");
    let exe_dir = exe_path.parent().expect("No parent directory");
    app_state.exe_dir = exe_dir.to_path_buf();
    let config_dir = app_state.exe_dir.join("config");
    let config_path = config_dir.join("config.toml");
    let profile_dir = app_state.exe_dir.join("profiles");

    if let Ok(profile_str) = fs::read_to_string(&config_path) {
        app_state.profile = profile_str.trim().to_string();
        // eprintln!("DEBUGPRINT[34]: lib.rs:88: app_state.profile={:#?}", app_state.profile.clone());
    }

    if app_state.profile.is_empty() {
        return Err("No profile saved in config".into());
    }

    let profile_path = profile_dir.join(app_state.profile.clone());
    // Read the profile data from a toml file
    let toml_str = fs::read_to_string(profile_path).map_err(|e| e.to_string())?;
    let profile_data: AppProfile = toml::from_str(&toml_str).map_err(|e| e.to_string())?;
    app_state.input_folder = profile_data.input_folder.clone();
    app_state.backup_folder = profile_data.backup_folder.clone();
    app_state.snapshot_folder = profile_data.snapshot_folder.clone();
    app_state.backup_time = profile_data.backup_time.clone();
    app_state.backup_number = profile_data.backup_number.clone();
    app_state.snapshot_name = profile_data.snapshot_name.clone();
    // app_state.hotkey = profile_data.hotkey.clone();
    app_state.profile = profile_data.profile.clone();
    println!("Profile {} loaded", app_state.profile.clone());

    Ok(profile_data)
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
    state: tauri::State<'_, Arc<TokioMutex<AppState>>>, // Use Arc<TokioMutex<AppState>>
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

// Input field data enum
#[derive(Deserialize, Serialize, Debug)]
enum U32OrString {
    Number(u32),
    Text(String),
}

// Async function to update input field data
#[tauri::command]
async fn send_input_field_data(
    invoke_message: &str,
    value: U32OrString,
    state: tauri::State<'_, Arc<TokioMutex<AppState>>>,
) -> Result<bool, String> {
    let mut app_state = state.lock().await; // Use tokio::sync::Mutex
    match invoke_message {
        "backup_time" => {
            if let U32OrString::Number(n) = value {
                app_state.backup_time = n;
            } else {
                return Err("Expected a number for backup_time".into());
            }
        }
        "backup_number" => {
            if let U32OrString::Number(n) = value {
                app_state.backup_number = n;
            } else {
                return Err("Expected a number for backup_number".into());
            }
        }
        "snapshot_name" => {
            if let U32OrString::Text(s) = value {
                app_state.snapshot_name = s.to_string();
                println!("snapshot_name: {}", app_state.snapshot_name);
            } else {
                return Err("Expected a string for snapshot_name".into());
            }
        }
        _ => return Err("Invalid invoke_message".into()),
    }
    Ok(true)
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
        "Copied source: {} to Destination: {}",
        source.display(),
        destination.display()
    );
    Ok(true)
}

// Async function to snapshot folder
#[tauri::command]
async fn async_snapshot(
    invoke_message: &str,
    state: tauri::State<'_, Arc<TokioMutex<AppState>>>,
) -> Result<bool, String> {
    // Put snapshot name into state
    let mut app_state = state.lock().await;
    app_state.snapshot_name = invoke_message.to_string();

    let input_folder = app_state.input_folder.clone(); // Clone the input folder path
    let source: PathBuf = PathBuf::from(input_folder); // Create PathBuf

    let snapshot_folder = app_state.snapshot_folder.clone(); // Clone the snapshot folder path
    let dst: PathBuf = PathBuf::from(snapshot_folder); // Create Pathbuf
    let destination = dst.join(app_state.snapshot_name.clone()); // Add snapshot name
                                                                 // Try to back up the folder
    task::spawn_blocking(move || copy_folder(&source, &destination))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())
}

async fn callback_loop(
    source: PathBuf,
    count: u32,
    backup_time: u32,
    backup_number: u32,
    app: AppHandle,
    state: Arc<TokioMutex<AppState>>, // Use Arc to share state
) {
    loop {
        for i in 0..backup_number {
            // Check if the count has changed, indicating the loop should stop
            let app_state = state.lock().await;
            let current_count = app_state.count;
            let backup_status = app_state.backup_status;
            let backup_folder = app_state.backup_folder.clone();
            let dst: PathBuf = PathBuf::from(backup_folder); // Create PathBuf
            let destination = dst.join(format!("backup {}", i + 1)); // add backup number
            drop(app_state); // Release the lock before sleeping or performing backups

            if count != current_count || !backup_status {
                // println!("Stopping internal loop as count has changed.");
                break;
            }
            // println!("Starting backup {}: count {}", i, count);

            // Attempt to copy the folder and log the result
            match copy_folder(&source, &destination) {
                Ok(_) => println!("Backup {} completed successfully.", i),
                Err(e) => eprintln!("Error during backup {}: {}", i, e),
            }

            // Send the backup success to the frontend
            let message = format!("Backup {} saved", i + 1);
            app.emit("backup-saved", message.to_string()).unwrap();

            // Wait for the next backup interval
            // println!("Waiting for {} minutes", backup_time);
            // sleep(Duration::from_secs(backup_time as u64)).await; // Seconds
            sleep(Duration::from_secs(
                backup_time
                    .checked_mul(60)
                    .expect("backup_time * 60 overflowed") as u64,
            ))
            .await; // Minutes
        }
        // println!("Backup loop iteration completed.");

        // Check if the count has changed, indicating the loop should stop
        let app_state = state.lock().await;
        let current_count = app_state.count;
        let backup_status = app_state.backup_status;
        if count != current_count || !backup_status {
            println!("Stopping external loop as count has changed.");
            break;
        }
        drop(app_state); // Release lock
    }
}

// Async function to periodically backup folder
#[tauri::command]
async fn async_backup(
    backup_time: u32,
    backup_number: u32,
    backup_status: bool,
    app: AppHandle,
    state: tauri::State<'_, Arc<TokioMutex<AppState>>>,
) -> Result<bool, String> {
    // Put backup times into state
    let mut app_state = state.lock().await;
    app_state.backup_time = backup_time;
    app_state.backup_number = backup_number;
    app_state.count += 1;
    app_state.backup_status = backup_status;

    if backup_status {
        let input_folder = app_state.input_folder.clone(); // Clone the input folder
        let source: PathBuf = PathBuf::from(input_folder); // Create PathBuf
        let count = app_state.count.clone(); // Clone count
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
            app,
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
async fn async_save_profile(
    invoke_message: &str,
    data: AppProfile,
    state: tauri::State<'_, Arc<TokioMutex<AppState>>>,
) -> Result<String, String> {
    println!("lib.rs:335: data={:#?}", data);

    let mut app_state = state.lock().await;
    // update form fields in app_state from data
    app_state.backup_time = data.backup_time.clone();
    app_state.backup_number = data.backup_number.clone();
    app_state.snapshot_name = data.snapshot_name.clone();
    // app_state.hotkey = data.hotkey.clone();
    let profile_dir = app_state.exe_dir.join("profiles");
    // Create the profiles directory if it doesn't exist
    if !profile_dir.exists() {
        fs::create_dir_all(&profile_dir).map_err(|e| e.to_string())?;
    }

    // Profile data to be saved in toml
    let mut profile_data = AppProfile {
        input_folder: app_state.input_folder.clone(),
        backup_folder: app_state.backup_folder.clone(),
        snapshot_folder: app_state.snapshot_folder.clone(),
        backup_time: data.backup_time,
        backup_number: data.backup_number,
        snapshot_name: data.snapshot_name.clone(),
        // hotkey: data.hotkey.clone(),
        profile: app_state.profile.clone(),
    };

    if invoke_message == "new" {
        let profile = profile_picker(invoke_message, profile_dir).await;
        if let Some(ref path) = profile {
            let profile_name = Path::new(path)
                .file_name()
                .map(|s| s.to_string_lossy().into_owned())
                .unwrap_or_else(|| "unknown".to_string());
            println!("Profile name: {}", profile_name.clone());
            app_state.profile = profile_name.clone();
            profile_data.profile = profile_name.clone();

            // Write the profile data to a toml file
            let toml = toml::to_string(&profile_data).map_err(|e| e.to_string())?;
            let mut file = fs::File::create(&path).map_err(|e| e.to_string())?;
            file.write_all(toml.as_bytes()).map_err(|e| e.to_string())?;

            println!("Profile path: {}", path);
            println!("Profile {} saved", app_state.profile.clone());
            Ok(app_state.profile.clone())
        } else {
            Err("Profile save as failed".into())
        }
    } else if invoke_message == "save" {
        if app_state.profile == "" {
            return Err("No profile selected".into());
        }
        println!("Profile name: {}", app_state.profile);

        let toml = toml::to_string(&profile_data).map_err(|e| e.to_string())?;
        let file_path = profile_dir.join(app_state.profile.clone());
        let mut file = fs::File::create(&file_path).map_err(|e| e.to_string())?;
        file.write_all(toml.as_bytes()).map_err(|e| e.to_string())?;

        println!("Profile path: {:?}", file_path.clone());
        println!("Profile {} saved", app_state.profile.clone());
        Ok(app_state.profile.clone())
    } else {
        Err("Unknown invoke_message".to_string())
    }
}

// An async function to load a profile
#[tauri::command]
async fn async_load_profile(
    invoke_message: &str,
    state: tauri::State<'_, Arc<TokioMutex<AppState>>>,
) -> Result<AppProfile, String> {
    let mut app_state = state.lock().await;
    let profile_dir = app_state.exe_dir.join("profiles");

    if invoke_message == "load" {
        let profile = profile_picker(invoke_message, profile_dir).await;
        if let Some(ref path) = profile {
            // println!("Profile path: {}", path);
            // Read the profile data from a toml file
            let toml_str = fs::read_to_string(path).map_err(|e| e.to_string())?;
            let profile_data: AppProfile = toml::from_str(&toml_str).map_err(|e| e.to_string())?;
            // println!("Profile Data: {:?}", profile_data);
            app_state.input_folder = profile_data.input_folder.clone();
            app_state.backup_folder = profile_data.backup_folder.clone();
            app_state.snapshot_folder = profile_data.snapshot_folder.clone();
            app_state.backup_time = profile_data.backup_time.clone();
            app_state.backup_number = profile_data.backup_number.clone();
            app_state.snapshot_name = profile_data.snapshot_name.clone();
            // app_state.hotkey = profile_data.hotkey.clone();
            app_state.profile = profile_data.profile.clone();
            println!("Profile {} loaded", app_state.profile.clone());

            Ok(profile_data)
        } else {
            Err("Profile load failed".into())
        }
    } else {
        Err("Unknown invoke_message".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        // .manage(state.clone())
        .manage(Arc::new(TokioMutex::new(AppState::default()))) // Wrap the state in Arc and register it for async functions
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_start_data,
            send_input_field_data,
            async_get_folder,
            async_snapshot,
            async_backup,
            async_save_profile,
            async_load_profile
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let app_handle = window.app_handle();
                let state: tauri::State<Arc<TokioMutex<AppState>>> = app_handle.state();
                let app_state = state.blocking_lock();
                let config_dir = app_state.exe_dir.join("config");
                if !config_dir.exists() {
                    let _ = fs::create_dir_all(&config_dir);
                }
                let config_path = config_dir.join("config.toml");
                if let Ok(mut file) = fs::File::create(&config_path) {
                    let _ = file.write_all(app_state.profile.as_bytes());
                    let _ = file.flush();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
