mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::bootstrap::init_data_dir,
            commands::bootstrap::resolve_vault,
            commands::bootstrap::make_relative_to_vault,
            commands::bootstrap::prepare_icloud_vault,
            commands::import::copy_files,
            commands::note_files::read_all_notes,
            commands::note_files::read_text_files,
            commands::note_files::write_text_file,
            commands::note_files::delete_text_file,
            commands::note_files::rename_text_file,
            commands::note_files::create_directory,
            commands::note_files::rename_directory,
            commands::note_files::list_directories,
            commands::scoped_files::read_scoped_text_file,
            commands::scoped_files::write_scoped_text_file,
            commands::assets::prepare_asset_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
