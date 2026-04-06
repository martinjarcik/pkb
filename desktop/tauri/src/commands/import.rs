use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

use walkdir::WalkDir;

use crate::commands::paths::resolve_root_path;
use crate::commands::CopyFilesResult;

fn normalize_extension(value: &str) -> Option<String> {
    let normalized = value.trim().trim_start_matches('.').to_lowercase();

    if normalized.is_empty() {
        return None;
    }

    Some(normalized)
}

fn normalize_extensions(values: Option<Vec<String>>) -> HashSet<String> {
    values
        .unwrap_or_default()
        .into_iter()
        .filter_map(|value| normalize_extension(&value))
        .collect()
}

fn path_extension(path: &Path) -> Option<String> {
    path.extension()
        .and_then(|value| value.to_str())
        .and_then(normalize_extension)
}

fn should_copy_file(
    path: &Path,
    include_extensions: &HashSet<String>,
    exclude_extensions: &HashSet<String>,
) -> bool {
    let extension = path_extension(path);

    if !include_extensions.is_empty()
        && !extension
            .as_ref()
            .is_some_and(|value| include_extensions.contains(value))
    {
        return false;
    }

    if extension
        .as_ref()
        .is_some_and(|value| exclude_extensions.contains(value))
    {
        return false;
    }

    true
}

#[tauri::command]
pub fn copy_files(
    source_dir: String,
    target_dir: String,
    extensions: Option<Vec<String>>,
    exclude_extensions: Option<Vec<String>>,
    recursive: Option<bool>,
) -> Result<CopyFilesResult, String> {
    let source_root = resolve_root_path(&source_dir);

    if !source_root.exists() {
        return Ok(CopyFilesResult {
            files_copied: 0,
            files_skipped: 0,
        });
    }

    if !source_root.is_dir() {
        return Err("Source path must be a directory".to_string());
    }

    let target_root = resolve_root_path(&target_dir);
    fs::create_dir_all(&target_root).map_err(|error| error.to_string())?;

    let include_extensions = normalize_extensions(extensions);
    let exclude_extensions = normalize_extensions(exclude_extensions);
    let recursive = recursive.unwrap_or(false);
    let mut files_copied = 0;
    let mut files_skipped = 0;

    let mut walker = WalkDir::new(&source_root);

    if !recursive {
        walker = walker.max_depth(1);
    }

    for entry in walker.into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();

        if !should_copy_file(path, &include_extensions, &exclude_extensions) {
            files_skipped += 1;
            continue;
        }

        let relative_path = path
            .strip_prefix(&source_root)
            .map_err(|error| error.to_string())?;
        let target_path: PathBuf = target_root.join(relative_path);

        if target_path.exists() {
            files_skipped += 1;
            continue;
        }

        if let Some(parent) = target_path.parent() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }

        fs::copy(path, &target_path).map_err(|error| error.to_string())?;
        files_copied += 1;
    }

    Ok(CopyFilesResult {
        files_copied,
        files_skipped,
    })
}
