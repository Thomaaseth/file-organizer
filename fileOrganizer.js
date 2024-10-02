const fs = require('fs').promises;
const path = require('path');
const mime = require('mime-types');
const readline = require('readline');
const logger = require('./logger');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => {
        logger.info(`>> ${query}`);
        rl.question('', resolve);
    });
}

async function getFileExtension(filename) {
    return path.extname(filename).slice(1).toLowerCase();
}

async function createDirectoryIfNotExists(directory) {
    try {
        await fs.mkdir(directory, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
}

async function organizeByType(sourceDir, targetDir) {
    try {
        const files = await fs.readdir(sourceDir, { withFileTypes: true });
        for (const file of files) {
            if (file.isFile()) {
                const filePath = path.join(sourceDir, file.name);
                const fileExtension = await getFileExtension(file.name);
                const destinationDir = path.join(targetDir, fileExtension);

                await createDirectoryIfNotExists(destinationDir);

                const destinationPath = path.join(destinationDir, file.name);
                await fs.rename(filePath, destinationPath);
                logger.warn(`Moved ${file.name} to ${destinationPath}`);
            }
        }
    } catch (err) {
        logger.error('Error organizing files by type:', err);
    }
}

async function organizeByDate(sourceDir, targetDir) {
    try {
        const files = await fs.readdir(sourceDir, { withFileTypes: true });
        for (const file of files) {
            if (file.isFile()) {
                const filePath = path.join(sourceDir, file.name);
                const stats = await fs.stat(filePath);
                const dateCreated = stats.birthtime;
                const yearMonth = `${dateCreated.getFullYear()}-${(dateCreated.getMonth() + 1).toString().padStart(2, '0')}`;
                const destinationDir = path.join(targetDir, yearMonth);

                await createDirectoryIfNotExists(destinationDir);

                const destinationPath = path.join(destinationDir, file.name);
                await fs.rename(filePath, destinationPath);
                logger.warn(`Moved ${file.name} to ${destinationPath}`);
            }
        }
    } catch (err) {
        logger.error('Error organizing files by date:', err);
    }
}

async function organizeBySize(sourceDir, targetDir) {
    try {
        const files = await fs.readdir(sourceDir, { withFileTypes: true });
        for (const file of files) {
            if (file.isFile()) {
                const filePath = path.join(sourceDir, file.name);
                const stats = await fs.stat(filePath);
                const fileSize = stats.size;
                let sizeCategory;

                if (fileSize < 1024 * 1024) sizeCategory = 'Small (< 1MB)';
                else if (fileSize < 1024 * 1024 * 10) sizeCategory = 'Medium (1-10MB)';
                else sizeCategory = 'Large (> 10MB)';

                const destinationDir = path.join(targetDir, sizeCategory);

                await createDirectoryIfNotExists(destinationDir);

                const destinationPath = path.join(destinationDir, file.name);
                await fs.rename(filePath, destinationPath);
                logger.warn(`Moved ${file.name} to ${destinationPath}`);
            }
        }
    } catch (err) {
        logger.error('Error organizing files by size:', err);
    }
}

async function organizeByUsageFrequency(sourceDir, targetDir) {
    try {
        const files = await fs.readdir(sourceDir, { withFileTypes: true });
        const now = new Date();
        
        for (const file of files) {
            if (file.isFile()) {
                const filePath = path.join(sourceDir, file.name);
                const stats = await fs.stat(filePath);
                const lastAccessTime = stats.atime;
                const daysSinceLastAccess = (now - lastAccessTime) / (1000 * 60 * 60 * 24);

                let usageCategory;
                if (daysSinceLastAccess <= 7) {
                    usageCategory = 'Frequently Used';
                } else if (daysSinceLastAccess <= 30) {
                    usageCategory = 'Occasionally Used';
                } else {
                    usageCategory = 'Rarely Used';
                }

                const destinationDir = path.join(targetDir, usageCategory);
                await createDirectoryIfNotExists(destinationDir);

                const destinationPath = path.join(destinationDir, file.name);
                await fs.rename(filePath, destinationPath);
                logger.warn(`Moved ${file.name} to ${destinationPath}`);
            }
        }
    } catch (err) {
        logger.error('Error organizing files by usage frequency:', err);
    }
}

async function organizeByContentType(sourceDir, targetDir) {
    try {
        const files = await fs.readdir(sourceDir, { withFileTypes: true });
        
        for (const file of files) {
            if (file.isFile()) {
                const filePath = path.join(sourceDir, file.name);
                const mimeType = mime.lookup(filePath) || 'application/octet-stream';
                const contentType = mimeType.split('/')[0];
                const extension = path.extname(file.name).slice(1).toLowerCase();

                let category;
                switch (contentType) {
                    case 'image':
                        category = 'Images';
                        break;
                    case 'video':
                        category = 'Videos';
                        break;
                    case 'audio':
                        category = 'Audio';
                        break;
                    case 'text':
                        category = 'Documents';
                        break;
                    case 'application':
                        if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 
                             'odt', 'ods', 'odp', 'odg', 'odf', 'rtf', 'txt', 'csv',
                             'md', 'pages', 'numbers', 'key', 'wpd', 'wps', 'epub',
                             'tex', 'latex', 'dotx', 'dotm', 'xltx', 'xltm', 'potx',
                             'potm', 'ott', 'ots', 'otp', 'dif', 'slk', 'xlam',
                             'xla', 'odb', 'dbf', 'mdb', 'accdb', 'sqlite', 'json',
                             'xml', 'yaml', 'yml', 'ini', 'cfg', 'log', 'azw', 'mobi'
                            ].includes(extension)) {
                            category = 'Documents';
                        } else if (['exe', 'msi', 'dmg', 'app', 'apk'].includes(extension) || mimeType === 'application/x-msdownload') {
                            category = 'Executables';
                        } else {
                            category = 'Other Applications';
                        }
                        break;
                    default:
                        category = 'Other';
                }

                const destinationDir = path.join(targetDir, category);
                await createDirectoryIfNotExists(destinationDir);

                const destinationPath = path.join(destinationDir, file.name);
                await fs.rename(filePath, destinationPath);
                logger.warn(`Moved ${file.name} to ${destinationPath}`);
            }
        }
    } catch (err) {
        logger.error('Error organizing files by content type:', err);
    }
}

async function organizeFiles(sourceDir, targetDir, organizationType) {
    logger.info(`Starting file organization: by ${organizationType}`);
    
    let organizeFunction;
    switch (organizationType.toLowerCase()) {
        case 'type':
            organizeFunction = organizeByType;
            break;
        case 'date':
            organizeFunction = organizeByDate;
            break;
        case 'size':
            organizeFunction = organizeBySize;
            break;
        case 'content':
            organizeFunction = organizeByContentType;
            break;
        case 'usage':
            organizeFunction = organizeByUsageFrequency;
            break;
        default:
            throw new Error('Invalid organization type');
    }

    await organizeFunction(sourceDir, targetDir);
    logger.info(`File organization (${organizationType}) completed successfully`);
}

async function main() {
    try {
        logger.trace('Initializing File Organizer');
        logger.debug('Debug mode is on');
        
        logger.info("Welcome to the File Organizer!");

        logger.trace('Entering main function');
        logger.debug('Preparing to ask for user input');

        const sourceDir = await question('Enter the source directory to organize: ');
        const targetDir = await question('Enter the target directory to move the files to: ');
        const organizationType = await question('Enter the type of organization (type, date, size, content, usage): ');

        logger.debug(`Received input - Source: ${sourceDir}, Target: ${targetDir}, Type: ${organizationType}`);

        logger.trace('About to start file organization');

        logger.debug("Starting file organization process...");

        logger.trace('File Organizer script started');
        logger.debug(`Source Directory: ${sourceDir}`);
        logger.debug(`Target Directory: ${targetDir}`);
        logger.debug(`Organization Type: ${organizationType}`);

        await createDirectoryIfNotExists(targetDir);
        await organizeFiles(sourceDir, targetDir, organizationType);

        logger.trace('File organization process completed');
        logger.debug('Exiting main function');
        logger.info("File organization completed successfully!");
    } catch (err) {
        logger.error('An error occurred during file organization');
        logger.error(err.message);
    } finally {
        rl.close();
    }
}

logger.trace('File Organizer script initialized');
main().catch(err => {
    logger.fatal("Unhandled error in main function:");
    logger.fatal(err);
});

