const fs = require('fs-extra');
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

function getFileExtension(filename) {
    return path.extname(filename).slice(1).toLowerCase();
}

async function createDirectoryIfNotExists(directory) {
    try {
        await fs.mkdir(directory, { recursive: true });
        logger.debug(`Created directory: ${directory}`);
    } catch (err) {
        if (err.code !== 'EEXIST') {
            logger.error(`Error creating directory ${directory}:`, err);
            throw err;
        }
    }
}

async function organizeByType(sourceDir, targetDir, summary) {
    try {
        const files = await fs.readdir(sourceDir, { withFileTypes: true });
        const createdDirectories = new Set();

        for (const file of files) {
            if (file.isFile()) {
                const filePath = path.join(sourceDir, file.name);
                const fileExtension = await getFileExtension(file.name);
                const destinationDir = path.join(targetDir, fileExtension);

                if (!createdDirectories.has(destinationDir)) {
                    await createDirectoryIfNotExists(destinationDir);
                    createdDirectories.add(destinationDir);
                    summary.foldersCreated.add(destinationDir);
                }

                const destinationPath = path.join(destinationDir, file.name);
                await fs.rename(filePath, destinationPath);
                logger.warn(`Moved ${file.name} to ${destinationPath}`);
                summary.filesMoved++;
            }
        }
    } catch (err) {
        logger.error('Error organizing files by type:', err);
    }
}

async function organizeByDate(sourceDir, targetDir, summary, timeline) {
    try {
        const files = await fs.readdir(sourceDir, { withFileTypes: true });
        const createdDirectories = new Set();

        for (const file of files) {
            if (file.isFile()) {
                const filePath = path.join(sourceDir, file.name);
                const stats = await fs.stat(filePath);
                const fileDate = stats.mtime;

                let folderName;
                switch(timeline) {
                    case 'days':
                        folderName = fileDate.toISOString().split('T')[0]; // YYYY-MM-DD
                        break;
                    case 'weeks':
                        folderName = getWeekOfMonth(fileDate);
                        break;
                    case 'months':
                        folderName = `${fileDate.getFullYear()}-${(fileDate.getMonth() + 1).toString().padStart(2, '0')}`;
                        break;
                    case 'years':
                        folderName = fileDate.getFullYear().toString();
                        break;
                    default:
                        throw new Error('Invalid timeline option');
                }

                const destinationDir = path.join(targetDir, folderName);
                
                if (!createdDirectories.has(destinationDir)) {
                    await createDirectoryIfNotExists(destinationDir);
                    createdDirectories.add(destinationDir);
                    summary.foldersCreated.add(destinationDir);
                }

                const destinationPath = path.join(destinationDir, file.name);
                await fs.rename(filePath, destinationPath);
                logger.warn(`Moved ${file.name} to ${destinationPath} (Modified: ${fileDate.toISOString()})`);
                summary.filesMoved++;
            }
        }
    } catch (err) {
        logger.error('Error organizing files by date:', err);
    }
}

// Helper function to get the week of the month
function getWeekOfMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const weekNumber = Math.ceil((date.getDate() + firstDayOfMonth.getDay() - 1) / 7);
    
    // Get the date of the first day of the week
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));

    // Format: YYYY-MM-DD_Week_N
    return `${startOfWeek.toISOString().slice(0, 10)}_Week_${weekNumber}`;
}



async function organizeBySize(sourceDir, targetDir, summary, customSizes) {
    try {
        const files = await fs.readdir(sourceDir, { withFileTypes: true });
        const createdDirectories = new Set();

        for (const file of files) {
            if (file.isFile()) {
                const filePath = path.join(sourceDir, file.name);
                const stats = await fs.stat(filePath);
                const fileSize = stats.size;
                let sizeCategory;

                if (customSizes) {
                    const { small, medium } = customSizes;
                    if (fileSize < small * 1024 * 1024) sizeCategory = `Small`;
                    else if (fileSize < medium * 1024 * 1024) sizeCategory = `Medium`;
                    else sizeCategory = `Large`;
                } else {
                    if (fileSize < 1024 * 1024) sizeCategory = 'Small';
                    else if (fileSize < 1024 * 1024 * 10) sizeCategory = 'Medium';
                    else sizeCategory = 'Large';    
                }

                const destinationDir = path.join(targetDir, sizeCategory);
                
                if (!createdDirectories.has(destinationDir)) {
                    await createDirectoryIfNotExists(destinationDir);
                    createdDirectories.add(destinationDir);
                    summary.foldersCreated.add(destinationDir);
                }

                const destinationPath = path.join(destinationDir, file.name);
                await fs.rename(filePath, destinationPath);
                logger.warn(`Moved ${file.name} to ${destinationPath} (Size: ${fileSize} bytes)`);
                summary.filesMoved++;
            }
        }
    } catch (err) {
        logger.error('Error organizing files by size:', err);
        logger.error(err.stack);
        throw err; 
    }
}

async function organizeByLastUsedTime(sourceDir, targetDir, summary, customUsage) {
    try {
        const files = await fs.readdir(sourceDir, { withFileTypes: true });
        const now = new Date();
        const createdDirectories = new Set();

        
        for (const file of files) {
            if (file.isFile()) {
                const filePath = path.join(sourceDir, file.name);
                const stats = await fs.stat(filePath);
                const lastAccessTime = stats.atime;
                const daysSinceLastAccess = (now - lastAccessTime) / (1000 * 60 * 60 * 24);

                let usageCategory;
                if (customUsage) {
                    const { frequent, occasional } = customUsage;
                    if (daysSinceLastAccess <= frequent) {
                        usageCategory = `Recently Used`;
                    } else if (daysSinceLastAccess <= occasional) {
                        usageCategory = `Moderately Used`;
                    } else {
                        usageCategory = `Rarely Used`;
                    }
                } else {
                    if (daysSinceLastAccess <= 30) {
                        usageCategory = 'Recently Used';
                    } else if (daysSinceLastAccess <= 90) {
                        usageCategory = 'Moderately Used';
                    } else {
                        usageCategory = 'Rarely Used';
                    }    
                }
                
                const destinationDir = path.join(targetDir, usageCategory);

                if (!createdDirectories.has(destinationDir)) {
                    await createDirectoryIfNotExists(destinationDir);
                    createdDirectories.add(destinationDir);
                    summary.foldersCreated.add(destinationDir);
                }

                const destinationPath = path.join(destinationDir, file.name);
                await fs.rename(filePath, destinationPath);
                logger.warn(`Moved ${file.name} to ${destinationPath}`);
                summary.filesMoved++;
            }
        }
    } catch (err) {
        logger.error('Error organizing files by last used time:', err);
    }
}

const fileTypeMapping = {
    documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp', 'md', 'csv', 'json', 'xml', 'yml', 'yaml'],
    images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'tiff', 'webp'],
    videos: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
    audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    archives: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
    executables: ['exe', 'msi', 'dmg', 'app', 'apk'],
    // Add more categories as needed
  };
  
  // For future use
  function getCategoryByExtension(extension) {
    for (const [category, extensions] of Object.entries(fileTypeMapping)) {
      if (extensions.includes(extension)) {
        return category;
      }
    }
    return 'Other';
  }
  
  async function organizeByContentType(sourceDir, targetDir, summary) {
    try {
      const files = await fs.readdir(sourceDir, { withFileTypes: true });
      const createdDirectories = new Set();

      
      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(sourceDir, file.name);
          const mimeType = mime.lookup(filePath) || 'application/octet-stream';
          const extension = path.extname(file.name).slice(1).toLowerCase();
  
          let category;
          if (mimeType.startsWith('image/')) {
            category = 'Images';
          } else if (mimeType.startsWith('video/')) {
            category = 'Videos';
          } else if (mimeType.startsWith('audio/')) {
            category = 'Audio';
          } else if (mimeType.startsWith('text/') || fileTypeMapping.documents.includes(extension)) {
            category = 'Documents';
          } else if (fileTypeMapping.executables.includes(extension)) {
            category = 'Executables';
          } else if (fileTypeMapping.archives.includes(extension)) {
            category = 'Archives';
          } else {
            category = 'Other';
          }
  
          const destinationDir = path.join(targetDir, category);

            if (!createdDirectories.has(destinationDir)) {
                await createDirectoryIfNotExists(destinationDir);
                createdDirectories.add(destinationDir);
                summary.foldersCreated.add(destinationDir);
            }
  
          const destinationPath = path.join(destinationDir, file.name);
          await fs.rename(filePath, destinationPath);
          logger.warn(`Moved ${file.name} to ${destinationPath}`);
          summary.filesMoved++;

        }
      }
    } catch (err) {
      logger.error('Error organizing files by content type:', err);
    }
  }

async function organizeFiles(sourceDir, targetDir, organizationType, timeline, customSizes, customUsage) {
    logger.info(`Starting file organization: by ${organizationType}`);
    
    let organizeFunction;
    switch (organizationType.toLowerCase()) {
        case 'type':
            organizeFunction = organizeByType;
            break;
        case 'date':
            organizeFunction = (src, tgt, summary) => organizeByDate(src, tgt, summary, timeline);
            break;
        case 'size':
            organizeFunction = (src, tgt, summary) => organizeBySize(src, tgt, summary, customSizes);
            break;
        case 'content':
            organizeFunction = organizeByContentType;
            break;
        case 'last used':
            organizeFunction = (src, tgt, summary) => organizeByLastUsedTime(src, tgt, summary, customUsage);
            break;
        default:
            throw new Error('Invalid organization type');
    }

    const summary = { filesMoved: 0, foldersCreated: new Set() };
    try {
        await organizeFunction(sourceDir, targetDir, summary);
        
        if (summary.filesMoved > 0) {
            logger.info(`File organization (${organizationType}${timeline ? `, timeline: ${timeline}` : ''}${customSizes ? ', custom sizes' : ''}${customUsage ? ', custom usage' : ''}) completed successfully`);
            logger.info(`Summary: ${summary.filesMoved} files moved to ${summary.foldersCreated.size} folders`);
        } else {
            logger.warn(`No files were moved during ${organizationType} organization. Please check your source directory and file permissions.`);
        }
    } catch (err) {
        logger.error(`Error during file organization by ${organizationType}:`, err);
        logger.error(err.stack);
    }
}


async function main() {
    try {
        logger.trace('Initializing File Organizer');
        logger.debug('Debug mode is on');
        
        logger.info("Welcome to the File Organizer!");

        logger.trace('Entering main function');
        logger.debug('Preparing to ask for user input');

        const sourceDir = await question('Enter the source directory to organize (or press Enter for current directory): ');
        const targetDir = await question('Enter the target directory to move the files to (or press Enter for current directory): ');
        const organizationType = await question('Enter the type of organization (type, date, size, content, last used): ');

        let timeline, customSizes, customUsage;
        if (organizationType.toLowerCase() === 'date') {
            timeline = await question('Enter the timeline for date organization (days, weeks, months, years): ');
        } else if (organizationType.toLowerCase() === 'size') {
            const useCustomSizes = await question('Do you want to use custom size categories? (yes/no): ');
            if (useCustomSizes.toLowerCase() === 'yes') {
                const smallMax = parseInt(await question('Enter the maximum size for small files in MB: '));
                const mediumMax = parseInt(await question('Enter the maximum size for medium files in MB: '));
                customSizes = { small: smallMax, medium: mediumMax };
            }
        } else if (organizationType.toLowerCase() === 'last used') {
            const useCustomUsage = await question('Do you want to use custom last used time categories? (yes/no): ');
            if (useCustomUsage.toLowerCase() === 'yes') {
                const recentMax = parseInt(await question('Enter the maximum number of days for recently used files: '));
                const moderateMax = parseInt(await question('Enter the maximum number of days for moderately used files: '));
                customUsage = { recent: recentMax, moderate: moderateMax };
            }
        }

        const currentDir = process.cwd();
        const resolvedSourceDir = sourceDir ? path.resolve(currentDir, sourceDir) : currentDir;
        const resolvedTargetDir = targetDir ? path.resolve(currentDir, targetDir) : currentDir;

        logger.debug(`Received input - Source: ${sourceDir}, Target: ${targetDir}, Type: ${organizationType}`);

        logger.trace('About to start file organization');

        logger.debug("Starting file organization process...");

        logger.trace('File Organizer script started');
        logger.debug(`Source Directory: ${resolvedSourceDir}`);
        logger.debug(`Target Directory: ${resolvedTargetDir}`);
        logger.debug(`Organization Type: ${organizationType}`);

        await createDirectoryIfNotExists(targetDir);
        await organizeFiles(sourceDir, targetDir, organizationType, timeline, customSizes, customUsage);

        logger.trace('File organization process completed');
        logger.debug('Exiting main function');
    } catch (err) {
        logger.error('An error occurred during file organization');
        logger.error(err.message);
        logger.error(err.stack);
    } finally {
        rl.close();
    }
}


logger.trace('File Organizer script initialized');
main().catch(err => {
    logger.fatal("Unhandled error in main function:");
    logger.fatal(err);
});

