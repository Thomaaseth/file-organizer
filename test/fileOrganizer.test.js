const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const mockFs = require('mock-fs');

const {
  getFileExtension,
  createDirectoryIfNotExists,
  organizeByType,
  organizeByDate,
  organizeBySize,
  organizeByContentType,
  getWeekOfMonth
} = require('../fileOrganizer');

describe('File Organizer', () => {
  afterEach(() => {
    mockFs.restore();
  });

  describe('getFileExtension', () => {
    it('should return the correct file extension', () => {
      expect(getFileExtension('test.txt')).toBe('txt');
      expect(getFileExtension('image.jpg')).toBe('jpg');
      expect(getFileExtension('noextension')).toBe('');
    });
  });

  describe('createDirectoryIfNotExists', () => {
    beforeEach(() => {
      mockFs({
        'existingDir': {},
      });
    });

    it('should create a directory if it does not exist', async () => {
      await createDirectoryIfNotExists('newDir');
      expect(fs.existsSync('newDir')).toBe(true);
    });

    it('should not throw an error if directory already exists', async () => {
      await expect(createDirectoryIfNotExists('existingDir')).resolves.not.toThrow();
    });
  });

  describe('organizeByType', () => {
    beforeEach(() => {
      mockFs({
        'sourceDir': {
          'file1.txt': 'content',
          'file2.jpg': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
        },
        'targetDir': {},
      });
    });

    it('should organize files by type', async () => {
      const summary = { filesMoved: 0, foldersCreated: new Set() };
      await organizeByType('sourceDir', 'targetDir', summary);

      expect(fs.existsSync('targetDir/txt/file1.txt')).toBe(true);
      expect(fs.existsSync('targetDir/jpg/file2.jpg')).toBe(true);
      expect(summary.filesMoved).toBe(2);
      expect(summary.foldersCreated.size).toBe(2);
    });
  });

  describe('organizeByDate', () => {
    beforeEach(() => {
      mockFs({
        'sourceDir': {
          'file1.txt': mockFs.file({
            content: 'content',
            mtime: new Date('2023-01-01'),
          }),
          'file2.jpg': mockFs.file({
            content: Buffer.from([8, 6, 7, 5, 3, 0, 9]),
            mtime: new Date('2023-02-15'),
          }),
        },
        'targetDir': {},
      });
    });

    it('should organize files by date with custom timeline', async () => {
      const summary = { filesMoved: 0, foldersCreated: new Set() };
      await organizeByDate('sourceDir', 'targetDir', summary, 'months');

      expect(fs.existsSync('targetDir/2023-01/file1.txt')).toBe(true);
      expect(fs.existsSync('targetDir/2023-02/file2.jpg')).toBe(true);
      expect(summary.filesMoved).toBe(2);
      expect(summary.foldersCreated.size).toBe(2);
    });
  });

  describe('organizeBySize', () => {
    beforeEach(() => {
      mockFs({
        'sourceDir': {
          'small.txt': mockFs.file({
            content: 'small content',
            size: 100,  // 100 bytes
          }),
          'medium.jpg': mockFs.file({
            content: Buffer.alloc(1024 * 1024 * 5),  // 5MB file
            size: 1024 * 1024 * 5,
          }),
          'large.zip': mockFs.file({
            content: Buffer.alloc(1024 * 1024 * 15),  // 15MB file
            size: 1024 * 1024 * 15,
          }),
        },
        'targetDir': {},
      });
    });
  
    it('should organize files by size with custom categories', async () => {
      const summary = { filesMoved: 0, foldersCreated: new Set() };
      const customSizes = { small: 1, medium: 10 }; // 1MB and 10MB
      await organizeBySize('sourceDir', 'targetDir', summary, customSizes);
  
      expect(fs.existsSync('targetDir/Small/small.txt')).toBe(true);
      expect(fs.existsSync('targetDir/Medium/medium.jpg')).toBe(true);
      expect(fs.existsSync('targetDir/Large/large.zip')).toBe(true);
      expect(summary.filesMoved).toBe(3);
      expect(summary.foldersCreated.size).toBe(3);
    });
  });

  describe('organizeByContentType', () => {
    beforeEach(() => {
      mockFs({
        'sourceDir': {
          'document.pdf': 'pdf content',
          'image.jpg': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
        },
        'targetDir': {},
      });
    });

    it('should organize files by content type', async () => {
      const summary = { filesMoved: 0, foldersCreated: new Set() };
      await organizeByContentType('sourceDir', 'targetDir', summary);

      expect(fs.existsSync('targetDir/Documents/document.pdf')).toBe(true);
      expect(fs.existsSync('targetDir/Images/image.jpg')).toBe(true);
      expect(summary.filesMoved).toBe(2);
      expect(summary.foldersCreated.size).toBe(2);
    });
  });

  describe('getWeekOfMonth', () => {
    it('should return the correct week of the month', () => {
      expect(getWeekOfMonth(new Date('2023-01-01'))).toBe('2023-01-02_Week_1');
      expect(getWeekOfMonth(new Date('2023-01-15'))).toBe('2023-01-16_Week_3');
    });
  });
});

afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); // wait for any pending operations
  });