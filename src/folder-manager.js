import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

/**
 * Opens a macOS dialog to choose a folder.
 * @returns {Promise<string>} The chosen POSIX path.
 */
async function pickFolder(prompt) {
    const script = `POSIX path of (choose folder with prompt "${prompt}")`;
    try {
        const { stdout } = await execFileAsync('osascript', ['-e', script]);
        return stdout.trim().replace(/\/$/, ''); // Remove trailing slash
    } catch (error) {
        throw new Error('Folder selection cancelled or failed.');
    }
}

/**
 * Creates the root folder and three subfolders.
 * @returns {Promise<object>} Object containing the paths.
 */
export async function createResultFolders() {
    const root = await pickFolder('Pick or create a folder for filtering results');

    const subfolders = ['mergedSource', 'mergedFiltered', 'assumablyDeleted'];

    // Create root (just in case)
    await fs.mkdir(root, { recursive: true });
    console.log(`  created: ${root}`);

    const paths = { root };

    for (const sub of subfolders) {
        const fullPath = path.join(root, sub);
        await fs.mkdir(fullPath, { recursive: true });
        console.log(`  created: ${fullPath}`);

        // Map subfolder names to camelCase keys for the return object
        const key = sub === 'assumablyDeleted' ? 'assumablyDeleted' : sub;
        paths[key] = fullPath;
    }

    return paths;
}
