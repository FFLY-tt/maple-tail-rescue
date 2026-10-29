/**
 * Replaces the live photo folder and animals.json with freshly synced ones, and
 * puts the old ones back if anything goes wrong part-way, so a sync never leaves
 * the site with new photos and old data (or the reverse).
 *
 * Everything is a rename on one volume, which is fast and doesn't copy files.
 */
import { access, mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";

export type SwapPaths = {
  /** The new photo folder, ready to become `imagesDir`. */
  stagedImages: string;
  /** The new animals.json, ready to become `dataFile`. */
  stagedData: string;
  /** The live photo folder (public/animals). May not exist yet. */
  imagesDir: string;
  /** The live animals.json. May not exist yet. */
  dataFile: string;
};

const BACKUP_SUFFIX = ".sync-old";

async function exists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

/** Antivirus, an editor or the dev server can hold a file for a moment on Windows; retry briefly. */
async function renameWithRetry(from: string, to: string): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await rename(from, to);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (attempt >= 5 || (code !== "EBUSY" && code !== "EPERM" && code !== "EACCES")) throw error;
      await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
    }
  }
}

/**
 * If an earlier swap was interrupted (power cut, killed process), a `.sync-old`
 * backup may be left behind. Put it back when the live copy is missing; otherwise
 * it is just a leftover and is removed.
 */
async function recoverInterruptedSwap(live: string): Promise<void> {
  const backup = live + BACKUP_SUFFIX;
  if (!(await exists(backup))) return;
  if (await exists(live)) await rm(backup, { recursive: true, force: true });
  else await renameWithRetry(backup, live);
}

/**
 * Swaps the staged photos and data in. On failure, restores the previous ones
 * and rethrows; the staged files are left where they were.
 */
export async function swapIn({ stagedImages, stagedData, imagesDir, dataFile }: SwapPaths): Promise<void> {
  // On a first sync the destination folders may not exist yet.
  await mkdir(path.dirname(imagesDir), { recursive: true });
  await mkdir(path.dirname(dataFile), { recursive: true });
  await recoverInterruptedSwap(imagesDir);
  await recoverInterruptedSwap(dataFile);

  // Each completed step pushes the action that undoes it.
  const undo: (() => Promise<void>)[] = [];
  const move = async (from: string, to: string) => {
    await renameWithRetry(from, to);
    undo.push(() => renameWithRetry(to, from));
  };

  try {
    if (await exists(imagesDir)) await move(imagesDir, imagesDir + BACKUP_SUFFIX);
    await move(stagedImages, imagesDir);
    if (await exists(dataFile)) await move(dataFile, dataFile + BACKUP_SUFFIX);
    await move(stagedData, dataFile);
  } catch (error) {
    for (const step of undo.reverse()) {
      try {
        await step();
      } catch {
        // Keep undoing the rest. The .sync-old backups are recovered on the next run.
      }
    }
    throw error;
  }

  // Success: the old copies are no longer needed.
  await rm(imagesDir + BACKUP_SUFFIX, { recursive: true, force: true });
  await rm(dataFile + BACKUP_SUFFIX, { recursive: true, force: true });
}
