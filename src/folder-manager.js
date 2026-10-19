import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

/**
 * Opens a macOS dialog to choose a folder.
 */
export async function pickFolder(prompt) {
    // Print the prompt in the terminal before the window pops up
    console.log(prompt);

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
export async function createResultFolders(root) {
    const subfolders = ['mergedSource', 'mergedFiltered', 'assumablyDeleted'];

    await fs.mkdir(root, { recursive: true });
    console.log(`  created: ${root}`);

    const paths = { root };

    for (const sub of subfolders) {
        const fullPath = path.join(root, sub);
        await fs.mkdir(fullPath, { recursive: true });
        console.log(`  created: ${fullPath}`);
        paths[sub] = fullPath;
    }

    return paths;
}

// --- HELPERS ---

async function getDirEntries(dirPath) {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        return entries.filter(e => e.isDirectory()).map(e => e.name);
    } catch {
        return []; // return empty if dir doesn't exist
    }
}

async function copyEntry(srcDir, destDir, entryName) {
    const src = path.join(srcDir, entryName);
    const dest = path.join(destDir, entryName);
    await fs.cp(src, dest, { recursive: true });
}

// --- FILTER FUNCTIONS ---
//Merge Filtered folders into one
export async function filterCombineFiltered(slots) {
    console.log('  filter_combine_filtered');
    const sources = [slots.filtered1, slots.filtered2].filter(Boolean);

    for (const src of sources) {
        const entries = await getDirEntries(src);
        if (entries.length === 0) continue;

        console.log(`merging: ${src} -> ${slots.mergedFiltered}`);
        for (const entry of entries) {
            await copyEntry(src, slots.mergedFiltered, entry);
            console.log(`  copied: ${entry}`);
        }
    }
}
//Merge Source folders into one
export async function filterCombineSource(slots) {
    console.log('  filter_combine_source');
    const sources = [slots.src1, slots.src2].filter(Boolean);

    for (const src of sources) {
        const entries = await getDirEntries(src);
        if (entries.length === 0) continue;

        console.log(`merging: ${src} -> ${slots.mergedSource}`);
        for (const entry of entries) {
            await copyEntry(src, slots.mergedSource, entry);
            console.log(`  copied: ${entry}`);
        }
    }
}
//Find folders that was probably deleted
// - get list of folders that are only in one src folder
// - exclude files from mergedFiltered
// - copy dirs from devices into assumablyDeleted
// - remove the items from the merged source
export async function filterAssumeDeleted(slots) {
    console.log('  filter_assume_deleted');

    const src1List = await getDirEntries(slots.src1);
    const src2List = await getDirEntries(slots.src2);

    // Find items in exactly one source
    const candidates = [
        ...src1List.filter(x => !src2List.includes(x)),
        ...src2List.filter(x => !src1List.includes(x))
    ];

    console.log('candidates (in exactly one source):');
    candidates.forEach(c => console.log(`  ${c}`));

    const filteredList = await getDirEntries(slots.mergedFiltered);

    // Exclude those present in mergedFiltered
    const finalList = candidates.filter(c => !filteredList.includes(c));

    console.log('final (assumably deleted):');
    for (const entry of finalList) {
        console.log(`  ${entry}`);

        const inSrc1 = src1List.includes(entry);
        const fromSrc = inSrc1 ? path.join(slots.src1, entry) : path.join(slots.src2, entry);
        const dest = path.join(slots.assumablyDeleted, entry);

        // Copy the directory itself into assumablyDeleted
        await fs.cp(fromSrc, dest, { recursive: true });
        console.log(`    copied from: ${fromSrc}`);
    }

    console.log('removing assumably-deleted entries from mergedSource');
    const mergedSourceList = await getDirEntries(slots.mergedSource);

    for (const entry of finalList) {
        if (mergedSourceList.includes(entry)) {
            const target = path.join(slots.mergedSource, entry);
            await fs.rm(target, { recursive: true, force: true });
            console.log(`  removed from mergedSource: ${entry}`);
        }
    }
}
