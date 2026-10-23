export const logger = {
    step(name: string): void {
        console.log(`  ${name}`);
    },

    merge(src: string, dest: string): void {
        console.log(`merging: ${src} -> ${dest}`);
    },

    copied(entryName: string): void {
        console.log(`  copied: ${entryName}`);
    },

    copiedFrom(srcPath: string): void {
        console.log(`    copied from: ${srcPath}`);
    },

    removed(entryName: string): void {
        console.log(`  removed from mergedSource: ${entryName}`);
    },

    listHeader(header: string): void {
        console.log(header);
    },

    listItem(item: string): void {
        console.log(`  ${item}`);
    },

    created(path: string): void {
        console.log(`  created: ${path}`);
    },

    info(message: string): void {
        console.log(message);
    },

    // Prints a blank line, then the title
    section(title: string): void {
        console.log(`${title}`);
    },

    // Prints a blank line, then the message
    success(message: string): void {
        console.log(`${message}`);
    },

    // Prints a blank line, then the error
    error(message: string): void {
        console.error(`Error: ${message}`);
    }
};
