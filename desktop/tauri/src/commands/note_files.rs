use chrono::{DateTime, SecondsFormat, Utc};
use std::fs;
use std::collections::HashSet;
use std::path::Path;

use walkdir::WalkDir;

use crate::commands::paths::{path_to_note_id, resolve_path_within_root, resolve_root_path};
use crate::commands::{PlatformNoteFile, PlatformTextFile};

fn timestamp_to_iso(result: std::io::Result<std::time::SystemTime>) -> Result<String, String> {
    let timestamp = result.map_err(|error| error.to_string())?;
    let datetime = DateTime::<Utc>::from(timestamp);

    Ok(datetime.to_rfc3339_opts(SecondsFormat::Millis, true))
}

pub(crate) fn text_file_with_stats(path: &Path) -> Result<PlatformTextFile, String> {
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

fn normalize_extensions(values: &[String]) -> HashSet<String> {
    values.iter().map(|value| value.trim().to_lowercase()).collect()
}

fn read_text_files_with_extensions(
    dir: String,
    extensions: Vec<String>,
) -> Result<Vec<PlatformNoteFile>, String> {
    let root = resolve_root_path(&dir);
    let allowed_extensions = normalize_extensions(&extensions);
    let mut files = Vec::new();

    for entry in WalkDir::new(&root).into_iter().filter_map(Result::ok) {
        let path = entry.path();

        if !entry.file_type().is_file() {
            continue;
        }

        let Some(extension) = path.extension().and_then(|ext| ext.to_str()) else {
            continue;
        };

        if !allowed_extensions.contains(&extension.trim().to_lowercase()) {
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
pub fn read_all_notes(dir: String) -> Result<Vec<PlatformNoteFile>, String> {
    read_text_files_with_extensions(dir, vec!["md".to_string()])
}

#[tauri::command]
pub fn read_text_files(
    dir: String,
    extensions: Vec<String>,
) -> Result<Vec<PlatformNoteFile>, String> {
    read_text_files_with_extensions(dir, extensions)
}

#[tauri::command]
pub fn write_text_file(
    dir: String,
    path: String,
    content: String,
) -> Result<PlatformTextFile, String> {
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
pub fn list_directories(dir: String) -> Result<Vec<String>, String> {
    let root = resolve_root_path(&dir);
    let mut paths = Vec::new();

    for entry in WalkDir::new(&root).into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_dir() {
            continue;
        }

        let rel = entry
            .path()
            .strip_prefix(&root)
            .map_err(|error| error.to_string())?;

        if rel.as_os_str().is_empty() {
            continue;
        }

        if rel.components().any(|c| {
            c.as_os_str()
                .to_str()
                .map_or(false, |s| s.starts_with('.'))
        }) {
            continue;
        }

        if let Some(rel_str) = rel.to_str() {
            paths.push(rel_str.replace('\\', "/"));
        }
    }

    paths.sort();

    Ok(paths)
}
