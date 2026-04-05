use std::fs;
use std::path::PathBuf;

use tauri::Manager;

use crate::commands::note_files::text_file_with_stats;
use crate::commands::paths::resolve_root_path;
use crate::commands::{PlatformTextFile, APP_DATA_DIR};

fn legacy_app_config_path(vault_path: &str) -> Result<PathBuf, String> {
    let vault = resolve_root_path(vault_path);
    let vault_parent = vault
        .parent()
        .ok_or_else(|| "Vault path must have a parent directory".to_string())?;

    Ok(vault_parent.join("app-config.yaml"))
}

fn legacy_meta_path(vault_path: &str) -> Result<PathBuf, String> {
    let vault = resolve_root_path(vault_path);
    let vault_parent = vault
        .parent()
        .ok_or_else(|| "Vault path must have a parent directory".to_string())?;

    Ok(vault_parent.join("meta.yaml"))
}

fn scoped_file_path(handle: &tauri::AppHandle, scope: &str) -> Result<PathBuf, String> {
    let data_dir = APP_DATA_DIR
        .get()
        .cloned()
        .unwrap_or(handle.path().app_data_dir().map_err(|error| error.to_string())?);

    match scope {
        "app-config" => Ok(data_dir.join("app-config.yaml")),
        "meta" => Ok(data_dir.join("meta.yaml")),
        _ => Err("Invalid file scope".to_string()),
    }
}

#[tauri::command]
pub fn read_scoped_text_file(
    handle: tauri::AppHandle,
    vault_path: String,
    scope: String,
) -> Result<Option<PlatformTextFile>, String> {
    let path = scoped_file_path(&handle, &scope)?;

    if path.exists() {
        return Ok(Some(text_file_with_stats(&path)?));
    }

    let legacy_path = match scope.as_str() {
        "app-config" => legacy_app_config_path(&vault_path)?,
        "meta" => legacy_meta_path(&vault_path)?,
        _ => return Err("Invalid file scope".to_string()),
    };

    if legacy_path.exists() {
        return Ok(Some(text_file_with_stats(&legacy_path)?));
    }

    Ok(None)
}

#[tauri::command]
pub fn write_scoped_text_file(
    handle: tauri::AppHandle,
    _vault_path: String,
    scope: String,
    content: String,
) -> Result<PlatformTextFile, String> {
    let path = scoped_file_path(&handle, &scope)?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    fs::write(&path, content).map_err(|error| error.to_string())?;

    text_file_with_stats(&path)
}
