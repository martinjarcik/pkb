use std::fs;
use std::path::Path;

use uuid::Uuid;

use crate::commands::paths::{assert_safe_relative_path, resolve_root_path};
use crate::commands::PrepareAssetPathResult;

fn extension_from_mime(mime_type: &str) -> Option<&'static str> {
    match mime_type {
        "image/png" => Some(".png"),
        "image/jpeg" => Some(".jpg"),
        "image/gif" => Some(".gif"),
        "image/webp" => Some(".webp"),
        "image/svg+xml" => Some(".svg"),
        _ => None,
    }
}

fn safe_extension(file_name: &str, mime_type: &str) -> Result<String, String> {
    let from_name = Path::new(file_name)
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| format!(".{}", ext.to_lowercase()));

    if let Some(ext) = from_name {
        if matches!(ext.as_str(), ".png" | ".jpg" | ".jpeg" | ".gif" | ".webp" | ".svg") {
            return Ok(ext);
        }
    }

    extension_from_mime(mime_type)
        .map(|value| value.to_string())
        .ok_or_else(|| "Unsupported image type".to_string())
}

fn chrono_like_now() -> String {
    let duration = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();

    duration.as_millis().to_string()
}

#[tauri::command]
pub fn prepare_asset_path(
    vault_path: String,
    assets_folder: String,
    file_name: String,
    mime_type: String,
) -> Result<PrepareAssetPathResult, String> {
    if !mime_type.starts_with("image/") {
        return Err("File must be an image".to_string());
    }

    let assets_dir_name = assert_safe_relative_path(&assets_folder, "path")?;
    let ext = safe_extension(&file_name, &mime_type)?;
    let file_base = format!("{}-{}{}", chrono_like_now(), Uuid::new_v4(), ext);
    let vault_root = resolve_root_path(&vault_path)
        .canonicalize()
        .unwrap_or_else(|_| resolve_root_path(&vault_path));
    let assets_dir = vault_root.join(&assets_dir_name);
    let file_path = assets_dir.join(&file_base);

    fs::create_dir_all(&assets_dir).map_err(|error| error.to_string())?;

    Ok(PrepareAssetPathResult {
        absolute_path: file_path
            .to_str()
            .ok_or("Invalid path encoding")?
            .to_string(),
        relative_path: format!("{}/{}", assets_dir_name, file_base),
    })
}
