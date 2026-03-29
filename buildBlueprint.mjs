import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── PATH UTILITIES ───────────────────────────────────────────────────────────
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const resolve = (...parts) => path.resolve(ROOT, ...parts);

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// This is the only place you need to edit. All configurables live here.
//
// ── Modes ─────────────────────────────────────────────────────────────────────
//   full       — complete file content, up to maxCodeLines
//   signatures — exports and function signatures only, no bodies
//                Vue SFCs: shows props, emits, defineExpose, composables used
//   collapsed  — filename + semantic one-line description, no code block
//   omit       — excluded from output entirely
//
// ── Showcase file entries ─────────────────────────────────────────────────────
//   Plain string:  './path/to/file.js'               uses defaultMode
//   Disabled:      '//./path/to/file.js'             skipped entirely
//   Object:        { file, mode?, note? }             explicit control
//
// ── Inline override (first 5 lines of any source file) ───────────────────────
//   // blueprint: signatures
//   modeResolution controls which wins when both config and inline are set:
//     'config' — config-level mode wins (default)
//     'inline' — inline comment wins, config is the fallback
//
// ── Groups ────────────────────────────────────────────────────────────────────
//   CONFIG.groups can be:
//     []   — auto-group all files by their top-level directory (default)
//     [{ label: 'Map Layer', files: ['./app/components/FireMap.vue', ...] }, ...]
//            — manual groups; files not listed fall back to auto-grouping
//     null — disable grouping entirely (flat ## Key Files section)
//
// ── Overview ──────────────────────────────────────────────────────────────────
//   CONFIG.overview can be a plain string (legacy) or a structured object:
//   {
//     description: 'What the project is.',
//     decisions:   ['Why MongoDB over Postgres', '...'],
//     issues:      ['Auth tokens expire after 1 hour — refresh not implemented'],
//     todo:        ['Add hotspot clustering for dense areas'],
//   }
//   All fields are optional; only non-empty ones are rendered.
//
const CONFIG = {
    outputFile:        'BLUEPRINT.md',
    maxDirectoryDepth: 5,
    maxCodeLines:      600,
    defaultMode:       'collapsed',
    modeResolution:    'config',
    showRelationships: true,

    ignoreDirectories: [
        'node_modules', '.git', '.astro', '.vscode',
        'dist', '.nuxt', '.output',
    ],
    ignoreFiles:      ['.DS_Store', '.env', '.gitignore', 'package-lock.json'],
    ignoreExtensions: ['.log'],

    // ── Overview ──────────────────────────────────────────────────────────────
    overview: {
        description:
            'Fire Finder — a wildfire mapping app designed to be fast, simple, and reliable. Displays active US wildfires and heat hotspots on an interactive Mapbox map. Data is fetched from external sources, processed server-side, and stored in MongoDB. A GitHub Actions cron job refreshes fire data automatically.',

        decisions: [
            'Mongoose schemas use { typeKey: "$type" } to avoid conflict between GeoJSON\'s "type" field and Mongoose\'s own schema type system — do not remove this without testing',
            'Server-side caching (server/utils/cache.js) sits in front of external API calls to avoid hitting rate limits on a tight budget',
            'Map interaction (Mapbox GL) is fully encapsulated in useMap.js — components must not call mapbox-gl directly',
            'Admin-only mutations (POST/DELETE on fire, perimeter, hotspot routes) are protected by adminAuth middleware, which accepts either a session cookie (UI) or x-admin-key header (GitHub Actions)',
            'Auth routes auto-detected from server/routes/auth/ filenames — adding a provider means adding a file, no other wiring needed',
        ],

        issues: [],
        todo:    [],
    },

    // ── Priorities ────────────────────────────────────────────────────────────
    priorities: [
        { label: 'Fast',     description: 'Lightweight construction to work on slow internet speeds in rural areas' },
        { label: 'Simple',   description: 'Readable & maintainable code, not over-engineered, easy for anyone to use' },
        { label: 'Reliable', description: 'Automated data processing and error handling to stay up-to-date on a tight budget without fuss' },
    ],

    // ── Groups ────────────────────────────────────────────────────────────────
    groups: [],

    // ── Architecture scanner tables ───────────────────────────────────────────
    stackSignals: [
        ['nuxt',                  'Nuxt'],
        ['next',                  'Next.js'],
        ['@sveltejs/kit',         'SvelteKit'],
        ['astro',                 'Astro'],
        ['express',               'Express'],
        ['fastify',               'Fastify'],
        ['hono',                  'Hono'],
        ['vue',                   'Vue 3'],
        ['react',                 'React'],
        ['svelte',                'Svelte'],
        ['mongoose',              'MongoDB (Mongoose)'],
        ['prisma',                'Prisma'],
        ['drizzle-orm',           'Drizzle'],
        ['@supabase/supabase-js', 'Supabase'],
        ['firebase',              'Firebase'],
        ['mapbox-gl',             'Mapbox GL'],
        ['leaflet',               'Leaflet'],
        ['tailwindcss',           'Tailwind CSS'],
        ['@nuxtjs/tailwindcss',   'Tailwind CSS'],
        ['daisyui',               'DaisyUI'],
        ['typescript',            'TypeScript'],
    ],

    authSignals: [
        ['nuxt-auth-utils',               'nuxt-auth-utils'],
        ['next-auth',                     'NextAuth'],
        ['@auth/core',                    '@auth/core'],
        ['lucia',                         'Lucia'],
        ['better-auth',                   'Better Auth'],
        ['passport',                      'Passport.js'],
        ['@clerk/nextjs',                 'Clerk'],
        ['@supabase/auth-helpers-nextjs', 'Supabase Auth'],
    ],

    deploymentSignals: [
        ['fly.toml',     'Fly.io'],
        ['railway.json', 'Railway'],
        ['.railway',     'Railway'],
        ['vercel.json',  'Vercel'],
        ['netlify.toml', 'Netlify'],
        ['render.yaml',  'Render'],
    ],

    // ── Showcase files ────────────────────────────────────────────────────────
    showcaseFiles: [
        // ── Root ──────────────────────────────────────────────────────────────
        { file: './package.json',                              mode: 'full' },
        { file: './nuxt.config.ts',                            mode: 'full' },
        { file: './.github/workflows/refresh-fire-data.yml',   mode: 'full' },
        './tailwind.config.js',
        './fly.toml',

        // ── App — Components ──────────────────────────────────────────────────
        { file: './app/app.vue',                    mode: 'full' },
        { file: './app/pages/index.vue',            mode: 'full' },
        { file: './app/components/FireMap.vue',     mode: 'signatures' },
        { file: './app/components/FireFeed.vue',    mode: 'signatures' },
        { file: './app/components/NavBar.vue',      mode: 'signatures' },
        { file: './app/components/UserProfile.vue', mode: 'signatures' },
        { file: './app/components/HelpPage.vue',    mode: 'full' },

        // ── App — Composables ─────────────────────────────────────────────────
        // maxCodeLines raised to 600 globally — covers useMap.js (577 lines).
        { file: './app/composables/useApiData.js',     mode: 'full' },
        { file: './app/composables/useFireData.js',    mode: 'full' },
        { file: './app/composables/useHotspotData.js', mode: 'full' },
        { file: './app/composables/useMap.js',         mode: 'full' },
        { file: './app/composables/useUser.js',        mode: 'full' },

        // ── Server — Models ───────────────────────────────────────────────────
        { file: './server/models/FirePoint.js',  mode: 'full' },
        { file: './server/models/Perimeter.js',  mode: 'full' },
        { file: './server/models/Hotspot.js',    mode: 'full' },
        { file: './server/models/User.js',       mode: 'full' },
        { file: './server/models/Data.js',       mode: 'full' },

        // ── Server — Services ─────────────────────────────────────────────────
        { file: './server/services/FireService.js',      mode: 'signatures' },
        { file: './server/services/PerimeterService.js', mode: 'signatures' },
        { file: './server/services/HotspotService.js',   mode: 'signatures' },

        // ── Server — API Routes ───────────────────────────────────────────────
        { file: './server/middleware/adminAuth.js', mode: 'full' },
        { file: './server/api/fire.js',             mode: 'full' },
        { file: './server/api/perimeter.js',        mode: 'full' },
        { file: './server/api/hotspots.js',         mode: 'full' },
        { file: './server/api/map-data.js',         mode: 'full' },
        { file: './server/api/feed.js',             mode: 'full' },
        './server/api/data/index.get.js',
        './server/api/data/index.post.js',

        // ── Server — Utils & Plugins ──────────────────────────────────────────
        { file: './server/utils/db.js',    mode: 'full' },
        { file: './server/utils/cache.js', mode: 'full' },
        './server/plugins/database.js',

        // ── Server — Auth Routes ──────────────────────────────────────────────
        './server/routes/auth/apple.get.js',
        './server/routes/auth/google.get.js',
        './server/routes/auth/logout.get.js',
    ],
};

// ─── CONFIG VALIDATION ────────────────────────────────────────────────────────
const VALID_MODES       = new Set(['full', 'signatures', 'collapsed', 'omit']);
const VALID_RESOLUTIONS = new Set(['config', 'inline']);

const validateConfig = () => {
    const errors = [];
    const expect = (cond, msg) => { if (!cond) errors.push(`  ✗  ${msg}`); };
    const isStr  = v => typeof v === 'string' && v.length > 0;
    const isInt  = v => Number.isInteger(v) && v > 0;

    expect(isStr(CONFIG.outputFile),          'outputFile must be a non-empty string');
    expect(isInt(CONFIG.maxDirectoryDepth),   'maxDirectoryDepth must be a positive integer');
    expect(isInt(CONFIG.maxCodeLines),        'maxCodeLines must be a positive integer');
    expect(VALID_MODES.has(CONFIG.defaultMode),          `defaultMode must be one of: ${[...VALID_MODES].join(', ')}`);
    expect(VALID_RESOLUTIONS.has(CONFIG.modeResolution), `modeResolution must be 'config' or 'inline'`);
    expect(typeof CONFIG.showRelationships === 'boolean', 'showRelationships must be true or false');
    expect(Array.isArray(CONFIG.ignoreDirectories), 'ignoreDirectories must be an array');
    expect(Array.isArray(CONFIG.ignoreFiles),        'ignoreFiles must be an array');
    expect(Array.isArray(CONFIG.ignoreExtensions),   'ignoreExtensions must be an array');
    expect(Array.isArray(CONFIG.priorities),         'priorities must be an array');
    expect(CONFIG.groups === null || Array.isArray(CONFIG.groups), 'groups must be an array or null');

    if (typeof CONFIG.overview !== 'string' && typeof CONFIG.overview !== 'object') {
        errors.push('  ✗  overview must be a string or object');
    } else if (typeof CONFIG.overview === 'object' && CONFIG.overview !== null) {
        const ov = CONFIG.overview;
        const isStrArr = v => v === undefined || (Array.isArray(v) && v.every(x => isStr(x)));
        expect(ov.description === undefined || isStr(ov.description), 'overview.description must be a non-empty string');
        expect(isStrArr(ov.decisions), 'overview.decisions must be an array of strings');
        expect(isStrArr(ov.issues),    'overview.issues must be an array of strings');
        expect(isStrArr(ov.todo),      'overview.todo must be an array of strings');
    }

    CONFIG.priorities.forEach((p, i) => {
        expect(isStr(p?.label),       `priorities[${i}].label must be a non-empty string`);
        expect(isStr(p?.description), `priorities[${i}].description must be a non-empty string`);
    });

    CONFIG.showcaseFiles.forEach((entry, i) => {
        if (typeof entry === 'string') return;
        expect(typeof entry === 'object' && entry !== null, `showcaseFiles[${i}] must be a string or object`);
        if (typeof entry === 'object' && entry !== null) {
            expect(isStr(entry.file), `showcaseFiles[${i}].file must be a non-empty string`);
            expect(entry.mode === undefined || VALID_MODES.has(entry.mode),
                `showcaseFiles[${i}].mode must be one of: ${[...VALID_MODES].join(', ')}`);
            expect(entry.note === undefined || isStr(entry.note),
                `showcaseFiles[${i}].note must be a non-empty string`);
        }
    });

    if (Array.isArray(CONFIG.groups)) {
        CONFIG.groups.forEach((g, i) => {
            expect(isStr(g?.label), `groups[${i}].label must be a non-empty string`);
            expect(Array.isArray(g?.files) && g.files.every(isStr),
                `groups[${i}].files must be an array of strings`);
        });
    }

    const isSignalTable = v => Array.isArray(v) && v.every(e =>
        Array.isArray(e) && e.length === 2 && isStr(e[0]) && isStr(e[1])
    );
    expect(isSignalTable(CONFIG.stackSignals),      'stackSignals must be an array of [packageName, label] pairs');
    expect(isSignalTable(CONFIG.authSignals),       'authSignals must be an array of [packageName, label] pairs');
    expect(isSignalTable(CONFIG.deploymentSignals), 'deploymentSignals must be an array of [filename, label] pairs');

    if (errors.length) {
        console.error('\n🚨 Blueprint config errors — fix these before running:\n');
        errors.forEach(e => console.error(e));
        console.error('');
        process.exit(1);
    }
};

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
    CONFIG.ignoreExtensions.some(ext => name.endsWith(ext));

const safelyReadFile = filePath => {
    try { return fs.readFileSync(filePath, 'utf8'); }
    catch { return null; }
};

const getLastModified = filePath => {
    try { return fs.statSync(filePath).mtime; }
    catch { return null; }
};

const formatRelativeTime = date => {
    if (!date) return null;
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days === 0)  return 'today';
    if (days === 1)  return 'yesterday';
    if (days < 7)   return `${days} days ago`;
    if (days < 30)  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
    if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`;
};

// ─── TREE GENERATION ──────────────────────────────────────────────────────────
const createTreeEntry = (name, depth, isDir) =>
    `${'  '.repeat(depth)}${isDir ? '📁' : '📄'} ${name}`;

const generateDirectoryTree = (currentPath, depth = 0) => {
    if (depth > CONFIG.maxDirectoryDepth) return [];
    return fs.readdirSync(currentPath)
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

// ─── OVERVIEW RENDERING ───────────────────────────────────────────────────────
const renderOverview = overview => {
    if (typeof overview === 'string') return overview || 'No overview provided.';
    const parts = [];
    if (overview.description) parts.push(overview.description);
    if (overview.decisions?.length)
        parts.push(`**Key Decisions**\n${overview.decisions.map(d => `- ${d}`).join('\n')}`);
    if (overview.issues?.length)
        parts.push(`**Known Issues**\n${overview.issues.map(i => `- ${i}`).join('\n')}`);
    if (overview.todo?.length)
        parts.push(`**Todo**\n${overview.todo.map(t => `- ${t}`).join('\n')}`);
    return parts.join('\n\n') || 'No overview provided.';
};

// ─── ARCHITECTURE SCANNING ────────────────────────────────────────────────────
const readJsonFile = filePath => {
    const content = safelyReadFile(filePath);
    if (!content) return null;
    try { return JSON.parse(content); }
    catch { return null; }
};

const scanArchitecture = () => {
    const facts = {};
    const pkg = readJsonFile(resolve('package.json'));

    if (pkg) {
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        const knownPackages = new Set([
            ...CONFIG.stackSignals.map(([p]) => p),
            ...CONFIG.authSignals.map(([p]) => p),
        ]);

        const detectedStack = [...new Set(
            CONFIG.stackSignals.filter(([p]) => allDeps[p]).map(([, label]) => label)
        )];
        if (detectedStack.length) facts.stack = detectedStack.join(', ');

        const unrecognized = Object.keys(pkg.dependencies ?? {}).filter(dep => !knownPackages.has(dep));
        if (unrecognized.length) {
            console.log(
                `Note: ${unrecognized.length} production dep(s) not in signal tables: ${unrecognized.join(', ')}\n` +
                `  → Add to CONFIG.stackSignals or CONFIG.authSignals to include in ## Architecture.`
            );
        }

        const detectedAuth = CONFIG.authSignals.filter(([p]) => allDeps[p]).map(([, label]) => label);
        const authRoutesDir = resolve('server/routes/auth');
        if (fs.existsSync(authRoutesDir)) {
            let providers = fs.readdirSync(authRoutesDir)
                .map(f => path.basename(f, path.extname(f)).replace('.get', ''))
                .filter(f => f !== 'logout')
                .map(f => f.charAt(0).toUpperCase() + f.slice(1));

            // Filter out providers whose nuxt.config entry is commented out.
            const nuxtConfig = safelyReadFile(resolve('nuxt.config.ts'))
                ?? safelyReadFile(resolve('nuxt.config.js'))
                ?? '';
            if (nuxtConfig) {
                const uncommented = nuxtConfig.split('\n')
                    .filter(l => !l.trim().startsWith('//'))
                    .join('\n');
                providers = providers.filter(p => uncommented.toLowerCase().includes(p.toLowerCase()));
            }

            if (providers.length) {
                const str = `(${providers.join(', ')} OAuth)`;
                if (detectedAuth.length) detectedAuth[0] += ` ${str}`;
                else detectedAuth.push(`OAuth ${str}`);
            }
        }
        if (detectedAuth.length) facts.auth = detectedAuth.join(', ');
    }

    const deployTargets = [...new Set([
        ...CONFIG.deploymentSignals.filter(([file]) => fs.existsSync(resolve(file))).map(([, label]) => label),
        ...(fs.existsSync(resolve('Dockerfile')) ? ['Docker'] : []),
    ])];
    if (deployTargets.length) facts.deployment = deployTargets.join(', ');

    const envExample = safelyReadFile(resolve('.env.example'));
    if (envExample) {
        const vars = envExample.split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('#'))
            .map(l => l.split('=')[0].trim())
            .filter(Boolean);
        if (vars.length) facts.env = vars.join(', ');
    }

    const workflowsDir = resolve('.github/workflows');
    if (fs.existsSync(workflowsDir)) {
        const workflows = [];
        for (const file of fs.readdirSync(workflowsDir)) {
            if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue;
            const content = safelyReadFile(path.join(workflowsDir, file));
            if (!content) continue;
            const nameMatch = content.match(/^name:\s*(.+)/m);
            const name = nameMatch ? nameMatch[1].trim() : file;
            const triggers = [];
            if (content.includes('schedule:'))                  triggers.push('scheduled');
            if (/on:[\s\S]*?push:/m.test(content))              triggers.push('push');
            if (/on:[\s\S]*?pull_request:/m.test(content))      triggers.push('pull_request');
            if (/on:[\s\S]*?workflow_dispatch:/m.test(content)) triggers.push('manual');
            workflows.push(`"${name}"${triggers.length ? ` (${triggers.join(', ')})` : ''}`);
        }
        if (workflows.length) facts.automation = workflows.join('; ');
    }

    const lines = [];
    if (facts.stack)      lines.push(`**Stack:** ${facts.stack}`);
    if (facts.auth)       lines.push(`**Auth:** ${facts.auth}`);
    if (facts.deployment) lines.push(`**Deployment:** ${facts.deployment}`);
    if (facts.automation) lines.push(`**Automation:** ${facts.automation}`);
    if (facts.env)        lines.push(`**Environment variables:** ${facts.env}`);
    return lines.length ? lines.join('\n') : null;
};

// ─── DIFF MODE ────────────────────────────────────────────────────────────────
const isDiffMode        = process.argv.includes('--diff');
const skipRelationships = process.argv.includes('--no-relationships');

const getLastOutputTime = () => {
    const outputPath = resolve(CONFIG.outputFile);
    try { return fs.existsSync(outputPath) ? fs.statSync(outputPath).mtime : null; }
    catch { return null; }
};

const LAST_OUTPUT_TIME = getLastOutputTime();

// ─── INLINE COMMENT MODE DETECTION ───────────────────────────────────────────
const detectInlineMode = content => {
    if (!content) return null;
    for (const line of content.split('\n').slice(0, 5)) {
        const match = line.match(/\/\/\s*blueprint:\s*(\S+)/);
        if (match) {
            const mode = match[1].toLowerCase();
            if (VALID_MODES.has(mode)) return mode;
            console.warn(`Warning: Unknown inline blueprint mode "${mode}" — ignoring.`);
        }
    }
    return null;
};

// ─── SHOWCASE ENTRY HELPERS ───────────────────────────────────────────────────
const isDisabled = entry => typeof entry === 'string' && entry.startsWith('//');

const normaliseEntry = entry =>
    typeof entry === 'string'
        ? { file: entry, mode: null, note: null }
        : { file: entry.file, mode: entry.mode ?? null, note: entry.note ?? null };

const resolveMode = (configMode, inlineMode) => {
    if (!configMode && !inlineMode) return CONFIG.defaultMode;
    if (!inlineMode) return configMode;
    if (!configMode) return inlineMode;
    return CONFIG.modeResolution === 'inline' ? inlineMode : configMode;
};

// ─── LANGUAGE MAP ─────────────────────────────────────────────────────────────
const LANGUAGE_MAP = {
    '.json': 'json', '.toml': 'toml', '.yaml': 'yaml', '.yml': 'yaml',
    '.ts': 'typescript', '.tsx': 'typescript', '.vue': 'vue',
    '.md': 'markdown', '.css': 'css', '.html': 'html', '.sh': 'bash',
    '.mjs': 'javascript', '.js': 'javascript', '.cjs': 'javascript',
};

const detectLanguage = fileName =>
    LANGUAGE_MAP[path.extname(fileName).toLowerCase()] ?? 'text';

// ─── SIGNATURES: JAVASCRIPT / TYPESCRIPT ─────────────────────────────────────

// FIX 1: Separated into two sets.
//
// TOP_LEVEL_RESERVED: words that must never appear as top-level export targets.
// Used to guard the top-level pattern matches (currently unused there since all
// top-level patterns require an 'export' prefix, but kept for clarity).
//
// FLOW_CONTROL_KEYWORDS: words that look like method calls inside a class body
// but are control-flow statements, not method definitions. 'delete' is NOT in
// this set — it is a perfectly valid JavaScript class method name and several
// service classes define async delete(...) methods.
const FLOW_CONTROL_KEYWORDS = new Set([
    'if', 'else', 'for', 'while', 'do', 'switch', 'try', 'catch',
    'finally', 'return', 'throw', 'new', 'typeof', 'instanceof',
    'break', 'continue', 'case', 'default', 'yield', 'await',
    'const', 'let', 'var', 'import', 'export',
]);

// Strip the function body opening brace using the last closing paren as anchor.
// Prevents '(query = {})' from being corrupted by naive /\{.*$/ stripping.
const cleanMethodSig = sig => {
    const lastParen = sig.lastIndexOf(')');
    if (lastParen === -1) return sig.trimEnd();
    const after = sig.slice(lastParen + 1).trim();
    return (after === '' || after.startsWith('{'))
        ? sig.slice(0, lastParen + 1)
        : sig.trimEnd();
};

const extractJsSignatures = content => {
    const lines      = content.split('\n');
    const signatures = [];
    let insideClass  = false;
    let braceDepth   = 0;

    const topLevelPatterns = [
        /^(export\s+(?:default\s+)?class\s+\w[\w$]*(?:\s+extends\s+[\w$.]+)?)/,
        /^(export\s+(?:default\s+)?(?:async\s+)?function\s*\*?\s*\w*\s*\([^)]*\))/,
        /^(export\s+const\s+\w[\w$]*\s*=\s*(?:async\s+)?\([^)]*\)\s*=>)/,
        /^(export\s+const\s+\w[\w$]*\s*=\s*(?:async\s+)?function\s*\([^)]*\))/,
        /^(export\s+default\s+(?:async\s+)?function\s*\w*\s*\([^)]*\))/,
        /^(export\s+default\s+define\w+\()/,
        /^(export\s*\{[^}]+\})/,
        /^(module\.exports\s*=)/,
    ];

    // Matches method definitions inside a class body.
    // Capture group 3 isolates the bare method name for keyword filtering.
    const methodPattern =
        /^(\s+)((?:static\s+)?(?:async\s+)?(?:get\s+|set\s+)?(\w[\w$]*)\s*\([^)]*\))/;

    for (const line of lines) {
        const opens  = (line.match(/\{/g) ?? []).length;
        const closes = (line.match(/\}/g) ?? []).length;

        if (insideClass) {
            braceDepth += opens - closes;
            if (braceDepth <= 0) {
                signatures.push('}');
                insideClass = false;
                braceDepth  = 0;
                continue;
            }

            const m = line.match(methodPattern);
            if (m) {
                const methodName = m[3];
                // FIX 1: use FLOW_CONTROL_KEYWORDS, not a set that includes 'delete'.
                // Also skip lines that are clearly non-method body content.
                if (
                    FLOW_CONTROL_KEYWORDS.has(methodName) ||
                    /^\s*(\/\/|\/\*|\*|this\.)/.test(line)
                ) continue;
                signatures.push(`${m[1]}${cleanMethodSig(m[2])}`);
            }
            continue;
        }

        for (const pattern of topLevelPatterns) {
            const m = line.match(pattern);
            if (m) {
                const sig = cleanMethodSig(m[1]);
                signatures.push(sig);
                if (/class\s/.test(sig)) {
                    insideClass = true;
                    braceDepth  = opens - closes;
                    if (braceDepth > 0) signatures[signatures.length - 1] += ' {';
                }
                break;
            }
        }
    }

    return signatures.length ? signatures.join('\n') : null;
};

// ─── SIGNATURES: VUE SFC ─────────────────────────────────────────────────────
const VUE_PROP_OPTIONS = new Set(['type', 'default', 'required', 'validator']);

const extractVueSfcSignatures = content => {
    const setupMatch   = content.match(/<script\s+setup[^>]*>([\s\S]*?)<\/script>/i);
    const regularMatch = content.match(/<script(?!\s+setup)[^>]*>([\s\S]*?)<\/script>/i);

    if (!setupMatch && !regularMatch) return null;
    if (!setupMatch) return extractJsSignatures(regularMatch[1]);

    const script = setupMatch[1];
    const parts  = [];

    // Props — TypeScript generic
    const propsTs   = script.match(/defineProps\s*<\s*\{([\s\S]*?)\}\s*>/);
    // Props — options object (greedy to capture nested braces)
    const propsOpts = !propsTs && script.match(/defineProps\s*\(\s*\{([\s\S]*)\}/);

    if (propsTs) {
        const props = propsTs[1].split('\n')
            .map(l => l.trim().replace(/[;,]$/, ''))
            .filter(l => l && !l.startsWith('//') && !l.startsWith('*'))
            .map(l => { const m = l.match(/(\w+)\??\s*:\s*(.+)/); return m ? `${m[1]} (${m[2].trim()})` : l; });
        if (props.length) parts.push(`**Props:** ${props.join(', ')}`);
    } else if (propsOpts) {
        // Track brace depth so nested option keys (type, required) don't appear as prop names.
        const props = [];
        let depth = 0;
        for (const line of propsOpts[1].split('\n')) {
            const t = line.trim();
            if (!t || t.startsWith('//')) continue;
            if (depth === 0) {
                const nameMatch = t.match(/^(\w+)\s*[:{]/);
                if (nameMatch && !VUE_PROP_OPTIONS.has(nameMatch[1])) props.push(nameMatch[1]);
            }
            depth += (t.match(/\{/g) ?? []).length - (t.match(/\}/g) ?? []).length;
        }
        if (props.length) parts.push(`**Props:** ${props.join(', ')}`);
    }

    // Emits
    const emitsArr = script.match(/defineEmits\s*\(\s*\[([^\]]+)\]/);
    const emitsTs  = !emitsArr && script.match(/defineEmits\s*<\s*\{([\s\S]*?)\}\s*>/);
    if (emitsArr) {
        const emits = (emitsArr[1].match(/['"]([^'"]+)['"]/g) ?? []).map(s => s.replace(/['"]/g, ''));
        if (emits.length) parts.push(`**Emits:** ${emits.join(', ')}`);
    } else if (emitsTs) {
        const emits = emitsTs[1].split('\n')
            .map(l => l.trim().split(':')[0].split('(')[0].trim())
            .filter(l => l && /^\w+$/.test(l));
        if (emits.length) parts.push(`**Emits:** ${emits.join(', ')}`);
    }

    // defineExpose
    const exposeMatch = script.match(/defineExpose\s*\(\s*\{([\s\S]*?)\}/);
    if (exposeMatch) {
        const exposed = exposeMatch[1].split(/[,\n]/)
            .map(l => l.trim().split(':')[0].trim())
            .filter(l => l && /^\w+$/.test(l));
        if (exposed.length) parts.push(`**Exposes:** ${exposed.join(', ')}`);
    }

    // Composables used
    const composables = new Set();
    const useRe = /\b(use[A-Z]\w+)\s*\(/g;
    let m;
    while ((m = useRe.exec(script)) !== null) composables.add(m[1]);
    if (composables.size) parts.push(`**Uses:** ${[...composables].join(', ')}`);

    return parts.length ? parts.join('\n') : null;
};

const extractSignatures = (fileName, content) =>
    path.extname(fileName).toLowerCase() === '.vue'
        ? extractVueSfcSignatures(content)
        : extractJsSignatures(content);

// ─── COLLAPSED MODE: SEMANTIC SUMMARY ────────────────────────────────────────

// Known Nuxt/Nitro define patterns → readable label.
// 'Nitro event handler' is intentionally generic — we refine it below using
// filename-based HTTP method and route name extraction (fixes 6 & 7).
const DEFINE_LABELS = [
    [/defineOAuthAppleEventHandler/,  'Apple OAuth handler'],
    [/defineOAuthGoogleEventHandler/, 'Google OAuth handler'],
    [/defineOAuth(\w+)EventHandler/,  m => `${m[1]} OAuth handler`],
    [/defineNitroPlugin/,             'Nitro plugin'],
    [/defineNuxtPlugin/,              'Nuxt plugin'],
    [/defineNuxtRouteMiddleware/,     'Route middleware'],
    [/defineEventHandler/,            'Nitro event handler'],  // generic — refined below
    [/defineNuxtConfig/,              'Nuxt configuration'],
];

// FIX 6 & 7: Extract the HTTP method and route name from Nuxt file naming conventions.
// 'logout.get.js'     → { method: 'GET',  name: 'logout' }
// 'index.post.js'     → { method: 'POST', name: null }      (index = unnamed route)
// 'fire.js'           → { method: null,   name: 'fire' }
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

const parseFileName = fileName => {
    // Work with the bare filename, no directory, no extension.
    const base = path.basename(fileName, path.extname(fileName)).toLowerCase();
    const parts = base.split('.');

    let method = null;
    let name   = null;

    // Last segment may be an HTTP method suffix (e.g. 'logout.get' → ['logout', 'get'])
    if (parts.length > 1 && HTTP_METHODS.has(parts[parts.length - 1])) {
        method = parts[parts.length - 1].toUpperCase();
        const routeName = parts.slice(0, -1).join('.');
        name = routeName === 'index' ? null : routeName;
    } else {
        // No method suffix — use full base as name if not 'index'
        name = base === 'index' ? null : base;
    }

    return { method, name };
};

// Build a human label from method + name, e.g.:
//   { method: 'GET',  name: 'logout' } → 'logout GET handler'
//   { method: 'POST', name: null }     → 'POST handler'
//   { method: null,   name: 'fire' }   → 'fire handler'
const fileBasedLabel = ({ method, name }) => {
    if (name && method) return `${name} ${method} handler`;
    if (name)           return `${name} handler`;
    if (method)         return `${method} handler`;
    return null;
};

const isSkippableLine = line => {
    const t = line.trim();
    if (!t)                                                 return true;
    if (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) return true;
    if (t.startsWith('#!'))                                 return true;
    if (/^import\s/.test(t))                                return true;
    if (/^(?:const|let|var)\s+.*\brequire\s*\(/.test(t))  return true;
    if (/^require\s*\(/.test(t))                            return true;
    return false;
};

const firstSubstantiveLine = content => {
    for (const line of content.split('\n')) {
        if (!isSkippableLine(line)) {
            const t = line.trim();
            return t.length > 100 ? t.slice(0, 97) + '...' : t;
        }
    }
    return null;
};

const extractCollapsedSummary = (fileName, content) => {
    const ext      = path.extname(fileName).toLowerCase();
    const parsed   = parseFileName(fileName);

    // ── Vue SFCs ──────────────────────────────────────────────────────────────
    if (ext === '.vue') {
        const setupMatch = content.match(/<script\s+setup[^>]*>([\s\S]*?)<\/script>/i);
        if (setupMatch) {
            const composables = new Set();
            const re = /\b(use[A-Z]\w+)\s*\(/g;
            let m;
            while ((m = re.exec(setupMatch[1])) !== null) composables.add(m[1]);
            if (composables.size) return `Vue component — uses ${[...composables].join(', ')}`;
        }
        return 'Vue component';
    }

    // ── JS / TS ───────────────────────────────────────────────────────────────
    if (['.js', '.mjs', '.cjs', '.ts', '.tsx'].includes(ext)) {
        const baseName = path.basename(fileName).toLowerCase();
        if (baseName.includes('tailwind'))     return 'Tailwind CSS configuration';
        if (baseName.includes('eslint'))       return 'ESLint configuration';
        if (baseName.includes('prettier'))     return 'Prettier configuration';
        if (baseName.includes('vite.config'))  return 'Vite configuration';
        if (baseName.includes('vitest.config'))return 'Vitest configuration';
        if (baseName.includes('jest.config'))  return 'Jest configuration';

        // Nuxt/Nitro define patterns
        for (const [pattern, label] of DEFINE_LABELS) {
            const m = content.match(pattern);
            if (m) {
                const resolved = typeof label === 'function' ? label(m) : label;

                // FIX 6 & 7: if the define pattern produces a generic label, try to
                // build a more specific one from the filename before giving up.
                if (resolved === 'Nitro event handler') {
                    return fileBasedLabel(parsed) ?? resolved;
                }

                return resolved;
            }
        }

        // Generic named exports
        const exportNames = [];
        const re = /^export\s+(?:const|function|class)\s+(\w+)/gm;
        let m;
        while ((m = re.exec(content)) !== null) exportNames.push(m[1]);
        if (exportNames.length) return `exports: ${exportNames.join(', ')}`;

        // Last resort: filename-based label
        return fileBasedLabel(parsed);
    }

    // ── TOML ──────────────────────────────────────────────────────────────────
    if (ext === '.toml') {
        const appName = content.match(/^app\s*=\s*["']([^"']+)["']/m);
        return appName ? `Fly.io config — ${appName[1]}` : 'TOML configuration';
    }

    // ── YAML ──────────────────────────────────────────────────────────────────
    if (ext === '.yml' || ext === '.yaml') {
        const name = content.match(/^name:\s*(.+)/m);
        return name ? `Workflow: ${name[1].trim()}` : 'YAML file';
    }

    // ── JSON ──────────────────────────────────────────────────────────────────
    if (ext === '.json') {
        try {
            const obj = JSON.parse(content);
            if (obj.name) return `package: ${obj.name}`;
        } catch { /**/ }
        return 'JSON configuration';
    }

    return firstSubstantiveLine(content);
};

// ─── RELATIONSHIPS ────────────────────────────────────────────────────────────
const SOURCE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.vue']);

const resolveImportPath = (importingFile, specifier) => {
    if (!specifier.startsWith('.') &&
        !specifier.startsWith('~/') &&
        !specifier.startsWith('@/')) return null;

    const base = (specifier.startsWith('./') || specifier.startsWith('../'))
        ? path.resolve(path.dirname(importingFile), specifier)
        : path.resolve(ROOT, specifier.replace(/^[~@]\//, ''));

    const candidates = [
        base,
        ...['js', 'ts', 'vue', 'mjs'].map(e => `${base}.${e}`),
        ...['js', 'ts'].map(e => path.join(base, `index.${e}`)),
    ];
    return candidates.find(p => fs.existsSync(p)) ?? null;
};

const buildComposableMap = () => {
    const map = new Map();
    for (const dir of ['app/composables', 'composables'].map(d => resolve(d))) {
        if (!fs.existsSync(dir)) continue;
        for (const file of fs.readdirSync(dir)) {
            const name = path.basename(file, path.extname(file));
            if (/^use[A-Z]/.test(name)) map.set(name, path.join(dir, file));
        }
    }
    return map;
};

const buildDependencyMap = () => {
    const composableMap = buildComposableMap();
    const deps = new Map();

    const addDep = (target, importer, type) => {
        if (!deps.has(target)) deps.set(target, { explicit: new Set(), auto: new Set() });
        deps.get(target)[type].add(importer);
    };

    const walk = (dirPath, depth = 0) => {
        if (depth > CONFIG.maxDirectoryDepth || !fs.existsSync(dirPath)) return;
        for (const entry of fs.readdirSync(dirPath)) {
            if (shouldBeIgnored(entry)) continue;
            const entryPath = path.join(dirPath, entry);
            if (isDirectory(entryPath)) { walk(entryPath, depth + 1); continue; }
            if (!SOURCE_EXTENSIONS.has(path.extname(entry).toLowerCase())) continue;

            const content = safelyReadFile(entryPath);
            if (!content) continue;

            const explicitRe = /from\s+['"]([^'"]+)['"]/g;
            const explicitlyImported = new Set();
            let m;
            while ((m = explicitRe.exec(content)) !== null) {
                const resolved = resolveImportPath(entryPath, m[1]);
                if (resolved && resolved !== entryPath) {
                    addDep(resolved, entryPath, 'explicit');
                    explicitlyImported.add(resolved);
                }
            }

            const useRe = /\b(use[A-Z]\w+)\s*\(/g;
            while ((m = useRe.exec(content)) !== null) {
                const composablePath = composableMap.get(m[1]);
                if (composablePath && composablePath !== entryPath && !explicitlyImported.has(composablePath)) {
                    addDep(composablePath, entryPath, 'auto');
                }
            }
        }
    };

    walk(ROOT);
    return deps;
};

const generateRelationships = showcaseAbsPaths => {
    const depMap = buildDependencyMap();
    const lines  = [];

    for (const absPath of showcaseAbsPaths) {
        const entry = depMap.get(absPath);
        if (!entry) continue;
        const allImporters = [...entry.explicit, ...entry.auto];
        if (!allImporters.length) continue;

        const formatImporter = imp =>
            entry.explicit.has(imp)
                ? `\`${path.relative(ROOT, imp)}\``
                : `\`${path.relative(ROOT, imp)}\` *(auto-import)*`;

        lines.push(
            `**\`${path.relative(ROOT, absPath)}\`** — used by ${allImporters.map(formatImporter).join(', ')}`
        );
    }

    return lines.length ? lines.join('\n') : null;
};

// ─── CODE CONTENT ─────────────────────────────────────────────────────────────
const getCodeContent = () => {
    const missing  = [];
    const disabled = [];

    const files = CONFIG.showcaseFiles.map(entry => {
        if (isDisabled(entry)) {
            disabled.push(typeof entry === 'string' ? entry.slice(2) : entry.file);
            return null;
        }

        const { file, mode: configMode, note } = normaliseEntry(entry);
        const filePath = resolve(file);

        if (!fs.existsSync(filePath)) { missing.push(file); return null; }

        const mtime = getLastModified(filePath);
        if (isDiffMode && LAST_OUTPUT_TIME && mtime && mtime <= LAST_OUTPUT_TIME) return null;

        const content = safelyReadFile(filePath);
        if (content === null) return null;

        const inlineMode = detectInlineMode(content);
        const mode       = resolveMode(configMode, inlineMode);

        return { name: file, absPath: filePath, content, mtime, mode, note };
    }).filter(Boolean);

    if (missing.length) {
        console.warn(`\nWarning: ${missing.length} showcase file(s) not found:`);
        missing.forEach(f => console.warn(`  ✗  ${f}`));
        console.warn('Update showcaseFiles in CONFIG to fix this.\n');
    }
    if (disabled.length) {
        console.log(`Skipped ${disabled.length} disabled file${disabled.length > 1 ? 's' : ''}.`);
    }

    return files;
};

// ─── GROUPING ─────────────────────────────────────────────────────────────────
const autoGroupName = filePath => {
    const normalized = filePath.replace(/^\.\//, '');
    const firstSlash = normalized.indexOf('/');
    if (firstSlash === -1) return 'Root';
    const dir = normalized.slice(0, firstSlash);
    return dir.charAt(0).toUpperCase() + dir.slice(1);
};

const assignGroups = files => {
    if (CONFIG.groups === null) return [{ label: null, files }];

    const manualAssignment = new Map();
    for (const group of CONFIG.groups) {
        for (const f of group.files) manualAssignment.set(f, group.label);
    }

    const groupMap = new Map();
    for (const file of files) {
        const label = manualAssignment.get(file.name) ?? autoGroupName(file.name);
        if (!groupMap.has(label)) groupMap.set(label, []);
        groupMap.get(label).push(file);
    }

    const manualLabels = CONFIG.groups.map(g => g.label);
    const autoLabels   = [...groupMap.keys()].filter(l => !manualLabels.includes(l)).sort();

    return [
        ...manualLabels.filter(l => groupMap.has(l)).map(l => ({ label: l, files: groupMap.get(l) })),
        ...autoLabels.map(l => ({ label: l, files: groupMap.get(l) })),
    ];
};

// ─── FORMATTING ───────────────────────────────────────────────────────────────
const formatFile = (file, headingLevel = 3) => {
    if (file.mode === 'omit') return null;

    if (file.mode === 'collapsed') {
        const summary = extractCollapsedSummary(file.name, file.content);
        const preview = summary ? ` — ${summary}` : '';
        return `- \`${file.name}\`${preview}`;
    }

    const heading       = '#'.repeat(headingLevel);
    const modifiedLabel = file.mtime ? `*modified ${formatRelativeTime(file.mtime)}*\n` : '';
    const noteBlock     = file.note  ? `> ${file.note}\n\n` : '';
    const header        = `${heading} ${file.name}\n${modifiedLabel}${noteBlock}`;

    if (file.mode === 'signatures') {
        const isVue = path.extname(file.name).toLowerCase() === '.vue';
        const sigs  = extractSignatures(file.name, file.content);
        if (!sigs) {
            return `${header}*No exports detected — consider switching this file to \`full\` mode.*`;
        }
        // Vue SFC signatures are markdown prose — must not go inside a code fence.
        if (isVue) return `${header}${sigs}`;
        return `${header}\`\`\`${detectLanguage(file.name)}\n${sigs}\n\`\`\``;
    }

    // full mode
    const limit     = CONFIG.maxCodeLines;
    const lines     = file.content.split('\n');
    const truncated = lines.length > limit;
    const codeLines = lines.slice(0, limit);
    if (truncated) {
        codeLines.push(`// ... (truncated — ${lines.length - limit} more lines not shown)`);
    }
    return `${header}\`\`\`${detectLanguage(file.name)}\n${codeLines.join('\n')}\n\`\`\``;
};

const renderKeyFiles = files => {
    const grouped      = assignGroups(files);
    const useGroups    = CONFIG.groups !== null;
    const headingLevel = useGroups ? 4 : 3;
    const sections     = [];

    for (const { label, files: groupFiles } of grouped) {
        const formatted = groupFiles.map(f => formatFile(f, headingLevel)).filter(Boolean);
        if (!formatted.length) continue;

        const collapsed = formatted.filter(f => f.startsWith('- `'));
        const blocks    = formatted.filter(f => !f.startsWith('- `'));

        let content = '';
        if (collapsed.length) content += collapsed.join('\n') + '\n';
        if (collapsed.length && blocks.length) content += '\n';
        if (blocks.length) content += blocks.join('\n\n');

        sections.push(label ? `### ${label}\n\n${content}` : content);
    }

    return sections.length ? sections.join('\n\n') : '*No files to display.*';
};

// ─── DOCUMENT GENERATION ─────────────────────────────────────────────────────
const getTimestamp = () =>
    new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    }).format(new Date());

const generateTemplate = (fileTree, architecture, keyFiles, relationships) => {
    const diffNote = isDiffMode
        ? `> ⚡ **Diff mode** — only files modified since last blueprint (${LAST_OUTPUT_TIME?.toLocaleString() ?? 'N/A'}) are shown.\n\n`
        : '';

    const architectureSection = architecture
        ? `## Architecture\n\n${architecture}\n\n`
        : '';

    const prioritySection = CONFIG.priorities.length
        ? `## Project Priorities\n${CONFIG.priorities
              .map(p => `- **${p.label}**: ${p.description}`)
              .join('\n')}\n\n> If critical context appears missing or truncated, ask before proceeding.\n\n`
        : '';

    const relationshipsSection = relationships
        ? `## Relationships\n\n${relationships}\n\n`
        : '';

    return `# 🗺️ PROJECT BLUEPRINT
*Generated ${getTimestamp()}*

${diffNote}## Overview

${renderOverview(CONFIG.overview)}

${architectureSection}${prioritySection}${relationshipsSection}## Project Structure
\`\`\`
${fileTree.join('\n')}
\`\`\`

## Key Files

${keyFiles}
`;
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const writeBlueprintFile = () => {
    validateConfig();

    if (isDiffMode && !LAST_OUTPUT_TIME) {
        console.warn('Warning: --diff requested but no existing blueprint found. Generating full blueprint.\n');
    }

    const fileTree     = generateDirectoryTree(ROOT);
    const architecture = scanArchitecture();
    const codeFiles    = getCodeContent();

    if (isDiffMode && codeFiles.length === 0) {
        console.log('No files changed since last run — blueprint is up to date.');
    }

    const showRels = CONFIG.showRelationships && !skipRelationships;
    const relationships = showRels ? generateRelationships(codeFiles.map(f => f.absPath)) : null;

    const keyFiles = renderKeyFiles(codeFiles);
    const content  = generateTemplate(fileTree, architecture, keyFiles, relationships);

    fs.writeFileSync(resolve(CONFIG.outputFile), content);

    const modeLabel  = isDiffMode ? 'BLUEPRINT (diff)' : 'BLUEPRINT';
    const modeCounts = codeFiles.reduce((acc, f) => {
        acc[f.mode] = (acc[f.mode] ?? 0) + 1;
        return acc;
    }, {});
    const modeBreakdown = Object.entries(modeCounts)
        .map(([mode, count]) => `${count} ${mode}`)
        .join(', ');
    const sizeKb = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1);

    console.log(
        `${modeLabel} generated: ${CONFIG.outputFile}` +
        (modeBreakdown ? ` (${modeBreakdown})` : '') +
        ` — ${sizeKb} KB`
    );
};

writeBlueprintFile();
