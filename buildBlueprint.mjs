import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── PATH UTILITIES ───────────────────────────────────────────────────────────
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const resolve = (...parts) => path.resolve(ROOT, ...parts);

// ─── DEFAULT CONFIGURATION ────────────────────────────────────────────────────
// Override any of these by creating a .blueprint.config.json in the project root
const DEFAULTS = {
    outputFile: 'BLUEPRINT.md',
    maxDirectoryDepth: 5,
    maxCodeLines: 300,
    ignoreDirectories: [
        'node_modules',
        '.git',
        '.astro',
        '.vscode',
        'dist',
        '.nuxt',
        '.output',
    ],
    ignoreFiles: ['.DS_Store', '.env', '.gitignore', 'package-lock.json'],
    ignoreExtensions: ['.log'],
    overview: 'No overview provided.',
    priorities: [],
    showcaseFiles: [],
};

// ─── LOAD CONFIG ──────────────────────────────────────────────────────────────
const loadConfig = () => {
    const configPath = resolve('.blueprint.config.json');
    if (fs.existsSync(configPath)) {
        try {
            const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log('Loaded config from .blueprint.config.json');
            return { ...DEFAULTS, ...userConfig };
        } catch (err) {
            console.warn(
                `Warning: Could not parse .blueprint.config.json — ${err.message}`
            );
        }
    }
    return { ...DEFAULTS };
};

const CONFIG = loadConfig();

// ─── FILE SYSTEM HELPERS ──────────────────────────────────────────────────────
const isDirectory = filePath => fs.statSync(filePath).isDirectory();

const matchesIgnorePattern = (name, patterns) =>
    patterns.some(pattern => {
        if (pattern.startsWith('*.')) return name.endsWith(pattern.slice(1));
        if (pattern.startsWith('*')) return name.includes(pattern.slice(1));
        return name === pattern;
    });

const shouldBeIgnored = name =>
    CONFIG.ignoreDirectories.includes(name) ||
    matchesIgnorePattern(name, CONFIG.ignoreFiles) ||
    (CONFIG.ignoreExtensions ?? []).some(ext => name.endsWith(ext));

const safelyReadFile = filePath => {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch {
        return null;
    }
};

const getLastModified = filePath => {
    try {
        return fs.statSync(filePath).mtime;
    } catch {
        return null;
    }
};

const formatRelativeTime = date => {
    if (!date) return null;
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30)
        return `${Math.floor(days / 7)} week${
            Math.floor(days / 7) > 1 ? 's' : ''
        } ago`;
    if (days < 365)
        return `${Math.floor(days / 30)} month${
            Math.floor(days / 30) > 1 ? 's' : ''
        } ago`;
    return `${Math.floor(days / 365)} year${
        Math.floor(days / 365) > 1 ? 's' : ''
    } ago`;
};

// ─── TREE GENERATION ──────────────────────────────────────────────────────────
const createTreeEntry = (name, depth, isDir) => {
    const indent = '  '.repeat(depth);
    const icon = isDir ? '📁' : '📄';
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
            return [
                createTreeEntry(entry, depth, isDir),
                ...(isDir ? generateDirectoryTree(entryPath, depth + 1) : []),
            ];
        });
};

// ─── PROJECT SUMMARY ─────────────────────────────────────────────────────────
// Walks the full tree and counts files by extension for a quick at-a-glance summary
const generateSummary = () => {
    const counts = {};

    const walk = (dirPath, depth = 0) => {
        if (depth > CONFIG.maxDirectoryDepth || !fs.existsSync(dirPath)) return;
        for (const entry of fs.readdirSync(dirPath)) {
            if (shouldBeIgnored(entry)) continue;
            const entryPath = path.join(dirPath, entry);
            if (isDirectory(entryPath)) {
                walk(entryPath, depth + 1);
            } else {
                const ext = path.extname(entry).toLowerCase() || '(none)';
                counts[ext] = (counts[ext] ?? 0) + 1;
            }
        }
    };

    walk(ROOT);

    const highlightedExtensions = [
        '.vue',
        '.ts',
        '.js',
        '.mjs',
        '.json',
        '.yml',
        '.yaml',
        '.css',
        '.md',
    ];
    const lines = highlightedExtensions
        .filter(ext => counts[ext])
        .map(
            ext =>
                `- **${counts[ext]}** \`${ext}\` file${
                    counts[ext] > 1 ? 's' : ''
                }`
        );

    const activeShowcase = CONFIG.showcaseFiles.filter(
        f => !f.startsWith('//')
    );
    const disabledShowcase =
        CONFIG.showcaseFiles.length - activeShowcase.length;
    const disabledNote =
        disabledShowcase > 0 ? ` (${disabledShowcase} disabled)` : '';
    lines.push(
        `- **${activeShowcase.length}** files in showcase list${disabledNote}`
    );

    return lines.join('\n');
};

// ─── DIFF MODE ────────────────────────────────────────────────────────────────
// Run with `node buildBlueprint.mjs --diff` to include only files modified since the last blueprint was generated
const isDiffMode = process.argv.includes('--diff');

const getLastOutputTime = () => {
    const outputPath = resolve(CONFIG.outputFile);
    try {
        return fs.existsSync(outputPath) ? fs.statSync(outputPath).mtime : null;
    } catch {
        return null;
    }
};

const LAST_OUTPUT_TIME = getLastOutputTime();

// ─── CODE CONTENT ─────────────────────────────────────────────────────────────
const isDisabled = entry => entry.startsWith('//');

const getCodeContent = () => {
    const missing = [];

    const files = CONFIG.showcaseFiles
        .filter(file => !isDisabled(file))
        .map(file => {
            const filePath = resolve(file);

            if (!fs.existsSync(filePath)) {
                missing.push(file);
                return null;
            }

            const mtime = getLastModified(filePath);

            // In diff mode, skip files unchanged since the last blueprint run
            if (
                isDiffMode &&
                LAST_OUTPUT_TIME &&
                mtime &&
                mtime <= LAST_OUTPUT_TIME
            ) {
                return null;
            }

            const content = safelyReadFile(filePath);
            if (content === null) return null;

            return { name: file, content, mtime };
        })
        .filter(Boolean);

    // Error handling
    if (missing.length > 0) {
        console.warn(
            `\nWarning: ${missing.length} showcase file(s) not found:`
        );
        missing.forEach(f => console.warn(`  ✗  ${f}`));
        console.warn(
            'Update showcaseFiles in .blueprint.config.json or CONFIG to fix this.\n'
        );
    }

    const disabledCount = CONFIG.showcaseFiles.filter(isDisabled).length;
    if (disabledCount > 0) {
        console.log(
            `Skipped ${disabledCount} disabled file${
                disabledCount > 1 ? 's' : ''
            } (prefixed with "//").`
        );
    }

    return files;
};

// ─── FORMATTING ───────────────────────────────────────────────────────────────
const LANGUAGE_MAP = {
    '.json': 'json',
    '.toml': 'toml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.vue': 'vue',
    '.md': 'markdown',
    '.css': 'css',
    '.html': 'html',
    '.sh': 'bash',
    '.mjs': 'javascript',
    '.js': 'javascript',
    '.cjs': 'javascript',
};

const detectCodeLanguage = fileName => {
    const ext = path.extname(fileName).toLowerCase();
    return LANGUAGE_MAP[ext] ?? 'text';
};

const formatCodeContent = file => {
    const lines = file.content.split('\n');
    const truncated = lines.length > CONFIG.maxCodeLines;
    const codeLines = lines.slice(0, CONFIG.maxCodeLines);

    // Truncation indicator
    if (truncated) {
        codeLines.push(
            `// ... (truncated — ${
                lines.length - CONFIG.maxCodeLines
            } more lines not shown)`
        );
    }

    const lang = detectCodeLanguage(file.name);
    const modifiedLabel = file.mtime
        ? `*modified ${formatRelativeTime(file.mtime)}*\n`
        : '';

    return `### ${file.name}\n${modifiedLabel}\`\`\`${lang}\n${codeLines.join(
        '\n'
    )}\n\`\`\``;
};

// ─── DOCUMENT GENERATION ─────────────────────────────────────────────────────
const getTimestamp = () =>
    new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    }).format(new Date());

const generateTemplate = (fileTree, summary, codeExamples) => {
    const prioritySection =
        CONFIG.priorities.length > 0
            ? `## Project Priorities\n${CONFIG.priorities
                  .map(p => `- **${p.label}**: ${p.description}`)
                  .join('\n')}\n\n`
            : '';

    const diffNote = isDiffMode
        ? `> ⚡ **Diff mode** — only files modified since last blueprint (${
              LAST_OUTPUT_TIME?.toLocaleString() ?? 'N/A'
          }) are shown.\n\n`
        : '';

    const codeSection =
        codeExamples.length > 0
            ? codeExamples.join('\n\n')
            : '*No files to display.*';

    return `# 🗺️ PROJECT BLUEPRINT
*Generated ${getTimestamp()}*

${diffNote}## Overview

${CONFIG.overview}

${prioritySection}## Project Summary

${summary}

## Project Structure
\`\`\`
${fileTree.join('\n')}
\`\`\`

## Key Files

${codeSection}
`;
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const writeBlueprintFile = () => {
    if (isDiffMode && !LAST_OUTPUT_TIME) {
        console.warn(
            'Warning: --diff requested but no existing BLUEPRINT.md found. Generating full blueprint.\n'
        );
    }

    const fileTree = generateDirectoryTree(ROOT);
    const summary = generateSummary();
    const codeFiles = getCodeContent();
    const codeExamples = codeFiles.map(formatCodeContent);

    const content = generateTemplate(fileTree, summary, codeExamples);

    fs.writeFileSync(resolve(CONFIG.outputFile), content);

    const label = isDiffMode ? 'BLUEPRINT (diff)' : 'BLUEPRINT';
    console.log(
        `${label} generated: ${CONFIG.outputFile} (${codeExamples.length} file${
            codeExamples.length !== 1 ? 's' : ''
        } included)`
    );
};

writeBlueprintFile();
