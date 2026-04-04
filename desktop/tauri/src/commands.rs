use chrono::{DateTime, SecondsFormat, Utc};
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use tauri::Manager;
use uuid::Uuid;
use walkdir::WalkDir;

static APP_DATA_DIR: OnceLock<PathBuf> = OnceLock::new();

#[derive(Deserialize, Serialize, Clone)]
pub struct PlatformNoteFile {
    path: String,
    content: String,
    birthtime: String,
    mtime: String,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct PlatformTextFile {
    content: String,
    birthtime: String,
    mtime: String,
}

#[derive(Serialize)]
pub struct PrepareAssetPathResult {
    absolute_path: String,
    relative_path: String,
}

fn timestamp_to_iso(result: std::io::Result<std::time::SystemTime>) -> Result<String, String> {
    let timestamp = result.map_err(|error| error.to_string())?;
    let datetime = DateTime::<Utc>::from(timestamp);

    Ok(datetime.to_rfc3339_opts(SecondsFormat::Millis, true))
}

fn text_file_with_stats(path: &Path) -> Result<PlatformTextFile, String> {
    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
    let birthtime = metadata
        .created()
        .or_else(|_| metadata.modified())
        .map_err(|error| error.to_string())?;
    let mtime = metadata.modified().map_err(|error| error.to_string())?;

    Ok(PlatformTextFile {
        content,
        birthtime: timestamp_to_iso(Ok(birthtime))?,
        mtime: timestamp_to_iso(Ok(mtime))?,
    })
}

fn assert_safe_relative_path(path: &str, label: &str) -> Result<String, String> {
    if path.is_empty() {
        return Err(format!("{label} must be a non-empty string"));
    }

    let segments = path.split('/');

    for segment in segments {
        if segment.is_empty() || segment == "." || segment == ".." || segment.contains('\\') {
            return Err(format!("Invalid {label}"));
        }
    }

    Ok(path.to_string())
}

fn repo_root_fallback() -> Option<PathBuf> {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .and_then(|path| path.parent())
        .map(Path::to_path_buf)
}

fn exe_dir_fallback() -> Option<PathBuf> {
    let exe = env::current_exe().ok()?;
    let exe_dir = exe.parent()?;

    // macOS .app bundle: binary is at Notes.app/Contents/MacOS/Notes
    // Walk up to the directory that contains the .app bundle.
    for ancestor in exe_dir.ancestors().skip(1) {
        if ancestor
            .file_name()
            .and_then(|n| n.to_str())
            .map_or(false, |n| n.ends_with(".app"))
        {
            return ancestor.parent().map(Path::to_path_buf);
        }
    }

    Some(exe_dir.to_path_buf())
}

fn resolve_root_path(root: &str) -> PathBuf {
    let path = PathBuf::from(root);

    if path.is_absolute() {
        return path;
    }

    if let Some(data_dir) = APP_DATA_DIR.get() {
        let data_candidate = data_dir.join(&path);

        if data_candidate.exists() {
            return data_candidate;
        }
    }

    let current_dir = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let cwd_candidate = current_dir.join(&path);

    if cwd_candidate.exists() {
        return cwd_candidate;
    }

    if cfg!(debug_assertions) {
        if let Some(repo_root) = repo_root_fallback() {
            let repo_candidate = repo_root.join(&path);

            if repo_candidate.exists() {
                return repo_candidate;
            }
        }
    }

    if let Some(exe_dir) = exe_dir_fallback() {
        let exe_candidate = exe_dir.join(&path);

        if exe_candidate.exists() {
            return exe_candidate;
        }
    }

    if let Some(data_dir) = APP_DATA_DIR.get() {
        return data_dir.join(&path);
    }

    cwd_candidate
}

fn resolve_path_within_root(root: &str, path: &str) -> Result<PathBuf, String> {
    let normalized_root = resolve_root_path(root)
        .canonicalize()
        .unwrap_or_else(|_| resolve_root_path(root));
    let safe_relative_path = assert_safe_relative_path(path, "path")?;
    let target_path = normalized_root.join(safe_relative_path);
    let relative_path = target_path
        .strip_prefix(&normalized_root)
        .map_err(|_| "Path resolves outside the root".to_string())?;

    if relative_path.as_os_str().is_empty() {
        return Err("Path resolves outside the root".to_string());
    }

    Ok(target_path)
}

fn path_to_note_id(root: &Path, path: &Path) -> Result<String, String> {
    let relative = path
        .strip_prefix(root)
        .map_err(|_| "Path resolves outside the root".to_string())?;

    Ok(relative.to_string_lossy().replace('\\', "/"))
}

fn scoped_file_path(vault_path: &str, scope: &str) -> Result<PathBuf, String> {
    let vault = resolve_root_path(vault_path);
    let vault_parent = vault
        .parent()
        .ok_or_else(|| "Vault path must have a parent directory".to_string())?;

    match scope {
        "app-config" => Ok(vault_parent.join("app-config.yaml")),
        "meta" => Ok(vault_parent.join("meta.yaml")),
        _ => Err("Invalid file scope".to_string()),
    }
}

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

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|e| e.to_string())?;

    for entry in WalkDir::new(src).into_iter().filter_map(Result::ok) {
        let relative = entry
            .path()
            .strip_prefix(src)
            .map_err(|e| e.to_string())?;
        let target = dst.join(relative);

        if entry.file_type().is_dir() {
            fs::create_dir_all(&target).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }

            fs::copy(entry.path(), &target).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
pub fn init_data_dir(handle: tauri::AppHandle) -> Result<String, String> {
    let data_dir = handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let vault_dir = data_dir.join("vault");

    if !vault_dir.exists() {
        let resource_dir = handle
            .path()
            .resource_dir()
            .map_err(|e| e.to_string())?;
        let bundled_vault = resource_dir.join("vault");

        if bundled_vault.exists() {
            copy_dir_recursive(&bundled_vault, &vault_dir)?;
        } else {
            fs::create_dir_all(&vault_dir).map_err(|e| e.to_string())?;
        }

        let bundled_meta = resource_dir.join("meta.yaml");
        let target_meta = data_dir.join("meta.yaml");

        if bundled_meta.exists() && !target_meta.exists() {
            fs::copy(&bundled_meta, &target_meta).map_err(|e| e.to_string())?;
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
    let canonical = root
        .canonicalize()
        .unwrap_or(root);

    canonical
        .to_str()
        .map(String::from)
        .ok_or_else(|| "Invalid path encoding".to_string())
}

#[tauri::command]
pub fn read_all_notes(dir: String) -> Result<Vec<PlatformNoteFile>, String> {
    let root = resolve_root_path(&dir);
    let mut files = Vec::new();

    for entry in WalkDir::new(&root).into_iter().filter_map(Result::ok) {
      let path = entry.path();

      if !entry.file_type().is_file() || path.extension().and_then(|ext| ext.to_str()) != Some("md") {
          continue;
      }

      let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
      let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
      let birthtime = metadata
          .created()
          .or_else(|_| metadata.modified())
          .map_err(|error| error.to_string())?;
      let mtime = metadata.modified().map_err(|error| error.to_string())?;

      files.push(PlatformNoteFile {
          path: path_to_note_id(&root, path)?,
          content,
          birthtime: timestamp_to_iso(Ok(birthtime))?,
          mtime: timestamp_to_iso(Ok(mtime))?,
      });
    }

    files.sort_by(|left, right| left.path.cmp(&right.path));

    Ok(files)
}

#[tauri::command]
pub fn write_text_file(dir: String, path: String, content: String) -> Result<PlatformTextFile, String> {
    let file_path = resolve_path_within_root(&dir, &path)?;

    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    fs::write(&file_path, content).map_err(|error| error.to_string())?;

    text_file_with_stats(&file_path)
}

#[tauri::command]
pub fn delete_text_file(dir: String, path: String) -> Result<(), String> {
    let file_path = resolve_path_within_root(&dir, &path)?;

    match fs::remove_file(file_path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
pub fn rename_text_file(dir: String, old_path: String, new_path: String) -> Result<(), String> {
    let source_path = resolve_path_within_root(&dir, &old_path)?;
    let target_path = resolve_path_within_root(&dir, &new_path)?;

    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    fs::rename(source_path, target_path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn create_directory(dir: String, path: String) -> Result<(), String> {
    let directory_path = resolve_path_within_root(&dir, &path)?;
    fs::create_dir_all(directory_path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn rename_directory(dir: String, old_path: String, new_path: String) -> Result<(), String> {
    let source_path = resolve_path_within_root(&dir, &old_path)?;
    let target_path = resolve_path_within_root(&dir, &new_path)?;

    fs::rename(source_path, target_path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn read_scoped_text_file(vault_path: String, scope: String) -> Result<Option<PlatformTextFile>, String> {
    let path = scoped_file_path(&vault_path, &scope)?;

    if !path.exists() {
        return Ok(None);
    }

    Ok(Some(text_file_with_stats(&path)?))
}

#[tauri::command]
pub fn write_scoped_text_file(
    vault_path: String,
    scope: String,
    content: String,
) -> Result<PlatformTextFile, String> {
    let path = scoped_file_path(&vault_path, &scope)?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    fs::write(&path, content).map_err(|error| error.to_string())?;

    text_file_with_stats(&path)
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

fn chrono_like_now() -> String {
    let duration = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();

    duration.as_millis().to_string()
}
