import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// CONFIGURATION
const CONFIG = {
    outputFile: 'BLUEPRINT.md',
    contentDirectory: 'src/content',
    maxDirectoryDepth: 5,
    maxContentPreviews: 3,
    maxContentLines: 10,
    maxCodeLines: 200,
    ignoreDirectories: ['node_modules', '.git', '.astro', '.vscode', 'dist', '.nuxt', '.output'],
    ignoreFiles: ['.DS_Store', '.env', '*.log', '.gitignore', 'package-lock.json'],
    showcaseFiles: [
        'package.json',
        'nuxt.config.ts',
        './app/app.vue',
        './app/pages/index.vue',
        './app/components/Map.vue',
        './app/components/Feed.vue',
        './app/components/Navbar.vue',
        './server/models/FirePoint.js',
        './server/api/renewFires/index.post.js',
        './server/utils/firePoints.js',
        './server/utils/db.js',
    ]
};

// PATH UTILITIES
const getCurrentDirectory = () => path.dirname(fileURLToPath(import.meta.url));
const resolveRelativePath = relativePath =>
    path.resolve(getCurrentDirectory(), relativePath);

// FILE SYSTEM HELPERS
const isDirectory = path => fs.statSync(path).isDirectory();
const shouldBeIgnored = name =>
    CONFIG.ignoreDirectories.includes(name) ||
    CONFIG.ignoreFiles.some(pattern => name.includes(pattern));

const safelyReadFile = filePath => {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch {
        return '';
    }
};

// TREE GENERATION
const createTreeEntry = (name, depth, isDirectory) => {
    const indent = '  '.repeat(depth);
    const icon = isDirectory ? '📁' : '📄';
    return `${indent}${icon} ${name}`;
};

const generateDirectoryTree = (currentPath, depth = 0) => {
    if (depth > CONFIG.maxDirectoryDepth) return [];

    return fs
        .readdirSync(currentPath)
        .filter(entry => !shouldBeIgnored(entry))
        .flatMap(entry => {
            const entryPath = path.join(currentPath, entry);
            const isDir = isDirectory(entryPath);

            const currentEntry = createTreeEntry(entry, depth, isDir);
            const childEntries = isDir
                ? generateDirectoryTree(entryPath, depth + 1)
                : [];

            return [currentEntry, ...childEntries];
        });
};


const getCodeContent = () => {
    return CONFIG.showcaseFiles
        .map(file => ({
            name: file,
            content: safelyReadFile(resolveRelativePath(file)),
            path: resolveRelativePath(file),
        }))
        .filter(file => file.content && fs.existsSync(file.path));
};

// FORMATTING UTILITIES
const detectCodeLanguage = fileName => {
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.toml')) return 'toml';
    if (fileName.endsWith('.astro')) return 'javascript';
    return 'javascript';
};

const formatCodeContent = file => {
    const codeContent = file.content
        .split('\n')
        .slice(0, CONFIG.maxCodeLines)
        .join('\n');
    return `### ${file.name}\n\`\`\`${detectCodeLanguage(
        file.name
    )}\n${codeContent}\n\`\`\``;
};

// DOCUMENT GENERATION
const getTimestamp = () => {
  const now = new Date();
  return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
  }).format(now);
};

const generateTemplate = (fileTree, codeExamples) => {
  return `# 🗺️ PROJECT BLUEPRINT
*Generated ${getTimestamp()}*

## Overview

Fire Finder designed to make wildfire mapping easy and reliable— Everything you need in one place. 

## Project Priorities
- **Fast**: Lightweight construction to work on slow internet speeds in rural areas 
- **Simple**: Readable & maintainable code, not over-engineered thus easy for the average joe to use
- **Reliable**: Automated data processing and error handling to stay up to-date on a tight budget without fuss

## PROJECT STRUCTURE
\`\`\`
${fileTree.join('\n')}
\`\`\`

## KEY FILE CODE EXAMPLES
${codeExamples.join('\n\n')}
`;

};

const generateBlueprintDocument = () => {
    const fileTree = generateDirectoryTree(getCurrentDirectory());
    const codeExamples = getCodeContent().map(formatCodeContent);
    return generateTemplate(fileTree, codeExamples);
};

// MAIN EXECUTION
const writeBlueprintFile = () => {
    const blueprintContent = generateBlueprintDocument();
    fs.writeFileSync(CONFIG.outputFile, blueprintContent);
    console.log(`BLUEPRINT generated: ${CONFIG.outputFile}`);
};

writeBlueprintFile();
