use std::env;
use std::path::{Path, PathBuf};

use crate::commands::APP_DATA_DIR;

pub(crate) fn assert_safe_relative_path(path: &str, label: &str) -> Result<String, String> {
    if path.is_empty() {
        return Err(format!("{label} must be a non-empty string"));
    }

    for segment in path.split('/') {
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

    for ancestor in exe_dir.ancestors().skip(1) {
        if ancestor
            .file_name()
            .and_then(|name| name.to_str())
            .is_some_and(|name| name.ends_with(".app"))
        {
            return ancestor.parent().map(Path::to_path_buf);
        }
    }

    Some(exe_dir.to_path_buf())
}

pub(crate) fn resolve_root_path(root: &str) -> PathBuf {
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

pub(crate) fn resolve_path_within_root(root: &str, path: &str) -> Result<PathBuf, String> {
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

pub(crate) fn path_to_note_id(root: &Path, path: &Path) -> Result<String, String> {
    let relative = path
        .strip_prefix(root)
        .map_err(|_| "Path resolves outside the root".to_string())?;

    Ok(relative.to_string_lossy().replace('\\', "/"))
}
