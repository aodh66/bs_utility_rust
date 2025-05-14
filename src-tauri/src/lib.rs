// Imports
use tauri::ipc::Response;

// #[tauri::command]
// fn my_custom_command() {
//     println!("I was invoked from JavaScript!");
// }

// Define a struct type that is just err: bool and message: String MAY OR MAY NOT BE USED
// struct FolderResponse {
//     err: bool,
//     file_path: String,
// }

// Get a folder with native explorer
#[tauri::command]
fn get_folder(invoke_message: &str) -> Result<String, String> {
    println!(
        "Invoked from TypeScript, I am getting this folder: {}",
        invoke_message
    );
    // "Message from Rust".into();
    let test_bool = false;
    let path_fetch_err = "Test path fetch error".to_string();
    if !test_bool {
    //     // Ok(response.file_path);
    Ok("test/file/path".into())
    } else {
    //     // Err(response.message);
    Err(format!("Path fetch err: {}", path_fetch_err).into())
    }
}

// An async function
// Return a Result<String, ()> to bypass the borrowing issue
#[tauri::command]
async fn async_get_folder(invoke_message: &str) -> Result<String, String> {
  // Call another async function and wait for it to finish
  async fn some_async_function() {
      println!("I am an async function");
  }
  some_async_function().await;
  // Note that the return value must be wrapped in `Ok()` now.
    Ok(format!("{}", invoke_message))
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
        .invoke_handler(tauri::generate_handler![get_folder, async_get_folder, read_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
