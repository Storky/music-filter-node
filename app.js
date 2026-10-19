import { createResultFolders } from './src/folder-manager.js';

async function main() {
    try {
        console.log('Picking result folder...');
        const paths = await createResultFolders();

        console.log('\nCreated successfully:');
        console.log(`  Root:             ${paths.root}`);
        console.log(`  Merged Source:    ${paths.mergedSource}`);
        console.log(`  Merged Filtered:  ${paths.mergedFiltered}`);
        console.log(`  Assumably Deleted:${paths.assumablyDeleted}`);
    } catch (error) {
        console.error(`\nError: ${error.message}`);
        process.exit(1);
    }
}

main();
