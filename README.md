# File Organizer

File Organizer is a command-line tool that helps you automatically organize your files based on various criteria such as file type, date, size, or content. It's designed to help you clean up cluttered directories and maintain a more organized file system.

## Features

- Organize files by:
  - File type (extension)
  - Date (modified date)
  - File size
  - Content type (documents, images, videos, etc.)
- Customizable date organization (by days, weeks, months, or years)
- Customizable size categories
- Detailed logging of file movements

## Requirements

- Node.js (version 12 or higher)
- npm (usually comes with Node.js)

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/file-organizer.git
   ```
2. Navigate to the project directory:
   ```
   cd file-organizer
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage

Run the script using Node.js:

```
node fileOrganizer.js
```

Follow the prompts to specify:
1. The source directory (where your files are currently located)
2. The target directory (where you want the organized files to be moved)
3. The type of organization you want to perform

### Organization Types

1. **Type**: Organizes files into folders based on their file extensions.
2. **Date**: Organizes files based on their last modified date. You can choose to organize by days, weeks, months, or years.
3. **Size**: Categorizes files into Small, Medium, and Large folders. You can customize the size thresholds.
4. **Content**: Organizes files into categories like Documents, Images, Videos, etc., based on their content type.

## Customization

### Date Organization
When organizing by date, you can choose one of the following timelines:
- `days`: Each day gets its own folder (YYYY-MM-DD)
- `weeks`: Files are organized into weekly folders (YYYY-MM-DD_Week_N)
- `months`: Files are organized by month (YYYY-MM)
- `years`: Files are organized by year (YYYY)

### Size Organization
You can customize the size thresholds for Small, Medium, and Large categories. If you choose not to customize, the default categories are:
- Small: < 1MB
- Medium: 1MB - 10MB
- Large: > 10MB

## Logging

The script provides detailed logging of its operations. Logs are outputted to the console and can be redirected to a file if needed.

## Caution

- Always backup your files before running this script, especially when organizing large numbers of important files.
- The script moves files from the source directory to the target directory. It does not copy files, so ensure you have the necessary permissions and disk space in the target directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any problems or have any questions, please open an issue on the GitHub repository.

---

Happy organizing!