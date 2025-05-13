// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn my_custom_command() {
  println!("I was invoked from JavaScript!");
}

// Define a struct type that is just err: bool and message: String
struct FolderResponse {
    err: bool,
    file_path: String,
}

#[tauri::command]
fn get_folder(invoke_message: String) -> String {
  println!("Invoked from JavaScript, I am getting this folder: {}", invoke_message);
  "Message from Rust".into()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![my_custom_command])
        .invoke_handler(tauri::generate_handler![get_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


