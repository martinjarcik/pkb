use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::OnceLock;

#[path = "commands/assets.rs"]
pub(crate) mod assets;
#[path = "commands/bootstrap.rs"]
pub(crate) mod bootstrap;
#[path = "commands/note_files.rs"]
pub(crate) mod note_files;
#[path = "commands/paths.rs"]
mod paths;
#[path = "commands/scoped_files.rs"]
pub(crate) mod scoped_files;

pub(crate) static APP_DATA_DIR: OnceLock<PathBuf> = OnceLock::new();

#[derive(Deserialize, Serialize, Clone)]
pub struct PlatformNoteFile {
    pub(crate) path: String,
    pub(crate) content: String,
    pub(crate) birthtime: String,
    pub(crate) mtime: String,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct PlatformTextFile {
    pub(crate) content: String,
    pub(crate) birthtime: String,
    pub(crate) mtime: String,
}

#[derive(Serialize)]
pub struct PrepareAssetPathResult {
    pub(crate) absolute_path: String,
    pub(crate) relative_path: String,
}
