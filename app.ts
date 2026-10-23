import {
    pickFolder,
    createResultFolders,
    filterCombineFiltered,
    filterCombineSource,
    filterAssumeDeleted,
    Slots
} from './src/folder-manager.js'; // Keep .js extension for ESM resolution

async function main(): Promise<void> {
    try {
        // 1. Determine slots based on OS argument
        const osType = process.argv[2];
        let slots: Slots = {};

        if (!osType) {
            console.log('No OS argument provided. Picking folders manually...');
            slots.src1 = await pickFolder('Pick src1 folder:');
            slots.filtered1 = await pickFolder('Pick filtered1 folder:');
            slots.src2 = await pickFolder('Pick src2 folder:');
            slots.filtered2 = await pickFolder('Pick filtered2 folder:');
        } else if (osType === 'win') {
            slots = {
                src1: "C:\\Users\\user\\Documents\\MusicFilteringTestData\\Device1\\Source",
                filtered1: "C:\\Users\\user\\Documents\\MusicFilteringTestData\\Device1\\Filtered",
                src2: "C:\\Users\\user\\Documents\\MusicFilteringTestData\\Device2\\Source",
                filtered2: "C:\\Users\\user\\Documents\\MusicFilteringTestData\\Device2\\Filtered",
            };
        } else {
            // Default to Mac
            slots = {
                src1: "/Users/user/Documents/MusicFilteringTestData/Device1/Source",
                filtered1: "/Users/user/Documents/MusicFilteringTestData/Device1/Filtered",
                src2: "/Users/user/Documents/MusicFilteringTestData/Device2/Source",
                filtered2: "/Users/user/Documents/MusicFilteringTestData/Device2/Filtered",
            };
        }

        // 2. Pick and create destination folders
        console.log(`\nPicking result folder (Target: ${osType || 'manual'}):`);
        const chosenRoot = await pickFolder('Pick or create a folder for filtering results');

        const resultPaths = await createResultFolders(chosenRoot);
        Object.assign(slots, resultPaths);

        // 3. Run merges
        console.log('\nMerging devices...');
        await filterCombineFiltered(slots);
        await filterCombineSource(slots);
        await filterAssumeDeleted(slots);

        console.log('\nDone.');
    } catch (error) {
        if (error instanceof Error) {
            console.error(`\nError: ${error.message}`);
        } else {
            console.error(`\nError: Unknown error`);
        }
        process.exit(1);
    }
}

main();
