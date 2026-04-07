use std::fs;
use std::path::Path;

use tauri::Manager;
use walkdir::WalkDir;

use crate::commands::paths::resolve_root_path;
use crate::commands::{PrepareIcloudVaultResult, APP_DATA_DIR};

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|error| error.to_string())?;

    for entry in WalkDir::new(src).into_iter().filter_map(Result::ok) {
        let relative = entry
            .path()
            .strip_prefix(src)
            .map_err(|error| error.to_string())?;
        let target = dst.join(relative);

        if entry.file_type().is_dir() {
            fs::create_dir_all(&target).map_err(|error| error.to_string())?;
            continue;
        }

        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }

        fs::copy(entry.path(), &target).map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn init_data_dir(handle: tauri::AppHandle) -> Result<String, String> {
    let data_dir = handle
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    let vault_dir = data_dir.join("vault");

    if !vault_dir.exists() {
        let resource_dir = handle
            .path()
            .resource_dir()
            .map_err(|error| error.to_string())?;
        let bundled_vault = resource_dir.join("vault");

        if bundled_vault.exists() {
            copy_dir_recursive(&bundled_vault, &vault_dir)?;
        } else {
            fs::create_dir_all(&vault_dir).map_err(|error| error.to_string())?;
        }

        let bundled_meta = resource_dir.join("meta.yaml");
        let target_meta = data_dir.join("meta.yaml");

        if bundled_meta.exists() && !target_meta.exists() {
            fs::copy(&bundled_meta, &target_meta).map_err(|error| error.to_string())?;
        }
    }

    let _ = APP_DATA_DIR.set(data_dir.clone());

    data_dir
        .to_str()
        .map(String::from)
        .ok_or_else(|| "Invalid path encoding".to_string())
}

#[tauri::command]
pub fn resolve_vault(dir: String) -> Result<String, String> {
    let root = resolve_root_path(&dir);
    let canonical = root.canonicalize().unwrap_or(root);

    canonical
        .to_str()
        .map(String::from)
        .ok_or_else(|| "Invalid path encoding".to_string())
}

#[tauri::command]
pub fn make_relative_to_vault(vault: String, absolute_path: String) -> Result<String, String> {
    let vault_root = resolve_root_path(&vault);
    let vault_canonical = vault_root.canonicalize().unwrap_or(vault_root);
    let target = Path::new(&absolute_path);
    let target_canonical = target.canonicalize().unwrap_or_else(|_| target.to_path_buf());

    target_canonical
        .strip_prefix(&vault_canonical)
        .map_err(|_| "Selected folder must be inside the vault".to_string())?
        .to_str()
        .map(|s| s.replace('\\', "/"))
        .ok_or_else(|| "Invalid path encoding".to_string())
}

#[tauri::command]
pub fn prepare_icloud_vault(folder_name: String) -> Result<PrepareIcloudVaultResult, String> {
    if !cfg!(target_os = "macos") {
        return Err("iCloud Drive vault creation is only supported on macOS".to_string());
    }

    let trimmed = folder_name.trim();

    if trimmed.is_empty() {
        return Err("Folder name must be a non-empty string".to_string());
    }

    if trimmed.contains('/') || trimmed.contains('\\') {
        return Err("Folder name cannot contain path separators".to_string());
    }

    let home_dir = std::env::var("HOME").map_err(|_| "Failed to resolve the home directory".to_string())?;
    let icloud_root = Path::new(&home_dir).join("Library/Mobile Documents/com~apple~CloudDocs");

    if !icloud_root.exists() {
        return Err("iCloud Drive is not available on this Mac".to_string());
    }

    let target_path = icloud_root.join(trimmed);

    if target_path.exists() {
        return Ok(PrepareIcloudVaultResult {
            status: "name_conflict".to_string(),
            absolute_path: None,
        });
    }

    fs::create_dir_all(&target_path).map_err(|error| error.to_string())?;

    Ok(PrepareIcloudVaultResult {
        status: "created".to_string(),
        absolute_path: target_path.to_str().map(String::from),
    })
}
