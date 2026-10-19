import {
    createResultFolders,
    filterCombineFiltered,
    filterCombineSource,
    filterAssumeDeleted
} from './src/folder-manager.js';

async function main() {
    try {
        // 1. Hardcoded source slots (Mocks)
        const slots = {
            src1: "/Users/user/Documents/MusicFilteringTestData/Device1/Source",
            filtered1: "/Users/user/Documents/MusicFilteringTestData/Device1/Filtered",
            src2: "/Users/user/Documents/MusicFilteringTestData/Device2/Source",
            filtered2: "/Users/user/Documents/MusicFilteringTestData/Device2/Filtered",
        };

        // 2. Pick and create destination folders
        console.log('Picking result folder:');
        const resultPaths = await createResultFolders();

        // Add result paths to slots object
        Object.assign(slots, resultPaths);

        // 3. Run merges
        console.log('\nMerging devices...');
        await filterCombineFiltered(slots);
        await filterCombineSource(slots);
        await filterAssumeDeleted(slots);

        console.log('\nDone.');
    } catch (error) {
        console.error(`\nError: ${error.message}`);
        process.exit(1);
    }
}

main();
