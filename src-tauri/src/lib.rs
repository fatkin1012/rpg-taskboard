use tauri::Manager;

/// Simple greeting command for testing IPC
#[tauri::command]
fn greet(name: &str) -> String {
    format!("🎮 Welcome, {}! Your adventure awaits!", name)
}

/// Get the current window's position
#[tauri::command]
async fn get_window_position(window: tauri::Window) -> Result<(i32, i32), String> {
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    Ok((pos.x, pos.y))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, get_window_position])
        .setup(|app| {
            // Log startup
            println!("🎮 RPG Task Board started!");

            // Get the main window and configure it
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_decorations(false);
                let _ = window.set_always_on_top(true);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running RPG Task Board");
}
