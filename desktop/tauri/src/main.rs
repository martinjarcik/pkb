mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::resolve_vault,
            commands::read_all_notes,
            commands::write_text_file,
            commands::delete_text_file,
            commands::rename_text_file,
            commands::create_directory,
            commands::rename_directory,
            commands::read_scoped_text_file,
            commands::write_scoped_text_file,
            commands::prepare_asset_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
