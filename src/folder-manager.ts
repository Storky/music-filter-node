import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js'; // Import the new logger

const execFileAsync = promisify(execFile);

export interface Slots {
    src1?: string;
    filtered1?: string;
    src2?: string;
    filtered2?: string;
    root?: string;
    mergedSource?: string;
    mergedFiltered?: string;
    assumablyDeleted?: string;
}

export interface ResultPaths {
    root: string;
    mergedSource: string;
    mergedFiltered: string;
    assumablyDeleted: string;
}

/**
 * Opens a macOS dialog to choose a folder.
 */
export async function pickFolder(prompt: string): Promise<string> {
    logger.info(prompt);

    const script = `POSIX path of (choose folder with prompt "${prompt}")`;
    try {
        const { stdout } = await execFileAsync('osascript', ['-e', script]);
        return stdout.trim().replace(/\/$/, '');
    } catch (error) {
        throw new Error('Folder selection cancelled or failed.');
    }
}

/**
 * Creates the root folder and three subfolders.
 */
export async function createResultFolders(root: string): Promise<ResultPaths> {
    const subfolders = ['mergedSource', 'mergedFiltered', 'assumablyDeleted'] as const;

    await fs.mkdir(root, { recursive: true });
    logger.created(root);

    const paths: Partial<ResultPaths> = { root };

    for (const sub of subfolders) {
        const fullPath = path.join(root, sub);
        await fs.mkdir(fullPath, { recursive: true });
        logger.created(fullPath);
        paths[sub] = fullPath;
    }

    return paths as ResultPaths;
}

// --- HELPERS ---

async function getDirEntries(dirPath: string): Promise<string[]> {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        return entries.filter(e => e.isDirectory()).map(e => e.name);
    } catch {
        return [];
    }
}

async function copyEntry(srcDir: string, destDir: string, entryName: string): Promise<void> {
    const src = path.join(srcDir, entryName);
    const dest = path.join(destDir, entryName);
    await fs.cp(src, dest, { recursive: true });
}

// --- FILTER FUNCTIONS ---

export async function filterCombineFiltered(slots: Slots): Promise<void> {
    logger.step('filter_combine_filtered');
    const sources = [slots.filtered1, slots.filtered2].filter(Boolean) as string[];
    const dest = slots.mergedFiltered as string;

    for (const src of sources) {
        const entries = await getDirEntries(src);
        if (entries.length === 0) continue;

        logger.merge(src, dest);
        for (const entry of entries) {
            await copyEntry(src, dest, entry);
            logger.copied(entry);
        }
    }
}

export async function filterCombineSource(slots: Slots): Promise<void> {
    logger.step('filter_combine_source');
    const sources = [slots.src1, slots.src2].filter(Boolean) as string[];
    const dest = slots.mergedSource as string;

    for (const src of sources) {
        const entries = await getDirEntries(src);
        if (entries.length === 0) continue;

        logger.merge(src, dest);
        for (const entry of entries) {
            await copyEntry(src, dest, entry);
            logger.copied(entry);
        }
    }
}

export async function filterAssumeDeleted(slots: Slots): Promise<void> {
    logger.step('filter_assume_deleted');

    const src1 = slots.src1 as string;
    const src2 = slots.src2 as string;
    const mergedFiltered = slots.mergedFiltered as string;
    const assumablyDeleted = slots.assumablyDeleted as string;
    const mergedSource = slots.mergedSource as string;

    const src1List = await getDirEntries(src1);
    const src2List = await getDirEntries(src2);

    // Find items in exactly one source
    const candidates = [
        ...src1List.filter(x => !src2List.includes(x)),
        ...src2List.filter(x => !src1List.includes(x))
    ];

    logger.listHeader('candidates (in exactly one source):');
    candidates.forEach(c => logger.listItem(c));

    const filteredList = await getDirEntries(mergedFiltered);

    // Exclude those present in mergedFiltered
    const finalList = candidates.filter(c => !filteredList.includes(c));

    logger.listHeader('final (assumably deleted):');
    for (const entry of finalList) {
        logger.listItem(entry);

        const inSrc1 = src1List.includes(entry);
        const fromSrc = inSrc1 ? path.join(src1, entry) : path.join(src2, entry);
        const dest = path.join(assumablyDeleted, entry);

        // Copy the directory itself into assumablyDeleted
        await fs.cp(fromSrc, dest, { recursive: true });
        logger.copiedFrom(fromSrc);
    }

    logger.info('removing assumably-deleted entries from mergedSource');
    const mergedSourceList = await getDirEntries(mergedSource);

    for (const entry of finalList) {
        if (mergedSourceList.includes(entry)) {
            const target = path.join(mergedSource, entry);
            await fs.rm(target, { recursive: true, force: true });
            logger.removed(entry);
        }
    }
}
