// File System Access API — Chrome/Edge only
// Persists FileSystemDirectoryHandle in IndexedDB so it survives page reloads

const DB_NAME = "plancraft_fs";
const STORE_NAME = "handles";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getHandle(projectId: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(projectId);
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function setHandle(projectId: string, handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(handle, projectId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function removeHandle(projectId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).delete(projectId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

/**
 * Opens a native directory picker and stores the handle in IndexedDB.
 * Returns true if the user selected a folder, false if cancelled or unsupported.
 */
export async function requestDirectory(projectId: string): Promise<boolean> {
  if (!isFileSystemAccessSupported()) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
    await setHandle(projectId, handle);
    return true;
  } catch {
    // User cancelled (AbortError) or other error
    return false;
  }
}

/**
 * Returns true if a directory handle is stored for this project.
 */
export async function hasDirectory(projectId: string): Promise<boolean> {
  if (!isFileSystemAccessSupported()) return false;
  try {
    const handle = await getHandle(projectId);
    return handle !== null;
  } catch {
    return false;
  }
}

/**
 * Saves the project as `{title}.json` to the stored directory.
 * Returns true on success, false if no directory is stored or the write fails.
 */
export async function saveProjectToDir(projectId: string, project: unknown): Promise<boolean> {
  if (!isFileSystemAccessSupported()) return false;
  try {
    const dirHandle = await getHandle(projectId);
    if (!dirHandle) return false;

    // Re-request permission in case it lapsed (page was refreshed)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const permission = await (dirHandle as any).requestPermission({ mode: "readwrite" });
    if (permission !== "granted") return false;

    const title = (project as { title?: string }).title ?? "project";
    // Sanitize filename — remove characters not allowed on Windows/macOS
    const safeName = title.replace(/[\\/:*?"<>|]/g, "_").trim() || "project";
    const fileName = `${safeName}.json`;

    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(project, null, 2));
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes the stored directory handle for a project (e.g. on project deletion).
 */
export async function clearDirectory(projectId: string): Promise<void> {
  await removeHandle(projectId);
}
