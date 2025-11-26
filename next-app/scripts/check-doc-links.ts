#!/usr/bin/env npx tsx
/**
 * Documentation Link Checker
 *
 * Scans all markdown files and validates internal links.
 * Run: npm run check:links
 *
 * Exit codes:
 * - 0: All links valid
 * - 1: Broken links found
 */

import * as fs from 'fs';
import * as path from 'path';

interface LinkInfo {
  file: string;
  line: number;
  link: string;
  target: string;
  exists: boolean;
}

interface CheckResult {
  totalFiles: number;
  totalLinks: number;
  brokenLinks: LinkInfo[];
  validLinks: number;
}

// Directories to scan (relative to project root)
const SCAN_DIRS = [
  'docs',
  '.',  // Root directory for CLAUDE.md, README.md, etc.
];

// File patterns to scan
const MD_EXTENSIONS = ['.md'];

// Patterns to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'playwright-report',
  'test-results',
];

// External link patterns (skip these)
const EXTERNAL_PATTERNS = [
  /^https?:\/\//,
  /^mailto:/,
  /^#/,  // Anchor-only links
];

// Template/placeholder patterns (skip these - they're examples, not real links)
const TEMPLATE_PATTERNS = [
  /week-[XYZ]-[XYZ]\.md/i,            // week-X-Y.md, week-Y-Z.md
  /FEATURE_NAME/,                      // FEATURE_NAME.md
  /YYYY/,                              // YYYY_migration.sql
  /\[FILL:/,                           // [FILL: placeholder]
  /path\/to\//,                        // path/to/file.tsx
  /\/example\//i,                      // /example/ paths
];

function isIgnored(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function isExternalLink(link: string): boolean {
  return EXTERNAL_PATTERNS.some(pattern => pattern.test(link));
}

function isTemplatePlaceholder(link: string): boolean {
  return TEMPLATE_PATTERNS.some(pattern => pattern.test(link));
}

function extractLinks(content: string): { link: string; line: number }[] {
  const links: { link: string; line: number }[] = [];
  const lines = content.split('\n');

  // Track if we're inside a code block
  let inCodeBlock = false;

  // Match markdown links: [text](url) but not images ![text](url)
  const linkRegex = /(?<!!)\[([^\]]*)\]\(([^)]+)\)/g;

  lines.forEach((line, index) => {
    // Toggle code block state on triple backticks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return;
    }

    // Skip links inside code blocks (they're examples/templates)
    if (inCodeBlock) return;

    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      const link = match[2].split('#')[0].trim(); // Remove anchor
      if (link && !isExternalLink(match[2]) && !isTemplatePlaceholder(link)) {
        links.push({ link, line: index + 1 });
      }
    }
  });

  return links;
}

function resolveLink(sourceFile: string, link: string, projectRoot: string): string {
  // If link starts with /, it's relative to project root
  if (link.startsWith('/')) {
    return path.join(projectRoot, link);
  }

  // Otherwise, it's relative to the source file's directory
  const sourceDir = path.dirname(sourceFile);
  return path.resolve(sourceDir, link);
}

function fileExists(filePath: string): boolean {
  try {
    // Remove trailing slash for directory checks
    const cleanPath = filePath.replace(/\/$/, '');

    // Check if path exists (file or directory)
    if (fs.existsSync(cleanPath)) {
      return true;
    }

    // Try adding .md extension for markdown links without extensions
    if (!cleanPath.endsWith('.md') && !path.extname(cleanPath)) {
      return fs.existsSync(cleanPath + '.md');
    }

    return false;
  } catch {
    return false;
  }
}

function getAllMdFiles(dir: string, projectRoot: string): string[] {
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (isIgnored(fullPath)) continue;

      if (entry.isDirectory()) {
        files.push(...getAllMdFiles(fullPath, projectRoot));
      } else if (entry.isFile() && MD_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or not accessible
  }

  return files;
}

function checkLinks(projectRoot: string): CheckResult {
  const result: CheckResult = {
    totalFiles: 0,
    totalLinks: 0,
    brokenLinks: [],
    validLinks: 0,
  };

  // Collect all markdown files
  const mdFiles: string[] = [];
  for (const scanDir of SCAN_DIRS) {
    const fullDir = path.join(projectRoot, scanDir);
    if (scanDir === '.') {
      // For root, only scan .md files directly (not recursively)
      try {
        const entries = fs.readdirSync(fullDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && MD_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
            if (!isIgnored(entry.name)) {
              mdFiles.push(path.join(fullDir, entry.name));
            }
          }
        }
      } catch { /* ignore */ }
    } else {
      mdFiles.push(...getAllMdFiles(fullDir, projectRoot));
    }
  }

  result.totalFiles = mdFiles.length;

  // Check links in each file
  for (const file of mdFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const links = extractLinks(content);

      for (const { link, line } of links) {
        result.totalLinks++;
        const target = resolveLink(file, link, projectRoot);
        const exists = fileExists(target);

        if (exists) {
          result.validLinks++;
        } else {
          result.brokenLinks.push({
            file: path.relative(projectRoot, file),
            line,
            link,
            target: path.relative(projectRoot, target),
            exists: false,
          });
        }
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }

  return result;
}

function formatOutput(result: CheckResult): void {
  console.log('\n📝 Documentation Link Check Report\n');
  console.log('=' .repeat(50));
  console.log(`📁 Files scanned: ${result.totalFiles}`);
  console.log(`🔗 Total links: ${result.totalLinks}`);
  console.log(`✅ Valid links: ${result.validLinks}`);
  console.log(`❌ Broken links: ${result.brokenLinks.length}`);
  console.log('=' .repeat(50));

  if (result.brokenLinks.length > 0) {
    console.log('\n🔴 BROKEN LINKS FOUND:\n');

    // Group by file
    const byFile = new Map<string, LinkInfo[]>();
    for (const link of result.brokenLinks) {
      const existing = byFile.get(link.file) || [];
      existing.push(link);
      byFile.set(link.file, existing);
    }

    for (const [file, links] of byFile) {
      console.log(`\n📄 ${file}:`);
      for (const link of links) {
        console.log(`   Line ${link.line}: [${link.link}]`);
        console.log(`   → Expected: ${link.target}`);
      }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('❌ Link check FAILED - fix broken links above');
    console.log('=' .repeat(50) + '\n');
  } else {
    console.log('\n✅ All documentation links are valid!\n');
  }
}

// Main execution
function main(): void {
  // Determine project root (go up from next-app/scripts)
  // Use process.cwd() and go up one level from next-app
  const cwd = process.cwd();
  const projectRoot = cwd.endsWith('next-app')
    ? path.resolve(cwd, '..')
    : cwd;

  console.log(`\n🔍 Checking documentation links in: ${projectRoot}`);

  const result = checkLinks(projectRoot);
  formatOutput(result);

  // Exit with error code if broken links found
  process.exit(result.brokenLinks.length > 0 ? 1 : 0);
}

main();
