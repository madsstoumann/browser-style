#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all ui/* folders
const uiPath = path.join(process.cwd(), 'ui');
const folders = fs.readdirSync(uiPath).filter(item => {
  const fullPath = path.join(uiPath, item);
  return fs.statSync(fullPath).isDirectory() && !item.startsWith('_');
});

console.log(`Found ${folders.length} UI component folders`);

// Get changed files in the current push
let changedFiles = [];
try {
  const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
  changedFiles = output.split('\n').filter(f => f.length > 0);
} catch (error) {
  console.log('Could not get previous commit, generating for all folders with no CHANGELOG.md');
  changedFiles = [];
}

console.log(`Changed files: ${changedFiles.length}`);

// Determine which folders were changed
const changedFolders = new Set();
changedFiles.forEach(file => {
  const match = file.match(/^ui\/([^/]+)\//);
  if (match) {
    changedFolders.add(match[1]);
  }
});

console.log(`Changed UI folders: ${Array.from(changedFolders).join(', ') || 'none'}`);

// Process each folder
folders.forEach(folder => {
  const folderPath = path.join(uiPath, folder);
  const changelogPath = path.join(folderPath, 'CHANGELOG.md');
  
  // Skip if CHANGELOG.md already exists
  if (fs.existsSync(changelogPath)) {
    console.log(`✓ ${folder}: CHANGELOG.md already exists, skipping`);
    return;
  }
  
  // Only generate if folder was changed (or if we couldn't detect changes)
  if (changedFolders.size === 0 || changedFolders.has(folder)) {
    try {
      console.log(`Generating CHANGELOG.md for ${folder}...`);
      const changelog = generateChangelog(folder);
      
      if (changelog) {
        fs.writeFileSync(changelogPath, changelog);
        console.log(`✓ ${folder}: CHANGELOG.md created`);
      } else {
        console.log(`✗ ${folder}: No commits found`);
      }
    } catch (error) {
      console.error(`✗ ${folder}: Error generating changelog:`, error.message);
    }
  }
});

/**
 * Generate changelog from git history for a folder
 */
function generateChangelog(folder) {
  const folderPath = `ui/${folder}`;
  const packageJsonPath = path.join(process.cwd(), folderPath, 'package.json');
  
  let version = '1.0.0';
  let name = folder;
  
  // Try to read package.json for version and name
  try {
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      version = pkg.version || '1.0.0';
      name = pkg.description || folder;
    }
  } catch (error) {
    console.warn(`Could not read package.json for ${folder}`);
  }
  
  // Get commit history for the last year
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const sinceDate = oneYearAgo.toISOString().split('T')[0];
  
  let commits = [];
  try {
    const output = execSync(
      `git log --since="${sinceDate}" --pretty=format:"%H|%ai|%s" -- ${folderPath}`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    
    if (!output.trim()) {
      return null; // No commits found
    }
    
    commits = output.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [hash, dateTime, message] = line.split('|');
        const date = dateTime.split(' ')[0];
        return { hash, date, message: message.trim() };
      })
      .reverse(); // Chronological order
  } catch (error) {
    console.warn(`Could not get git log for ${folder}: ${error.message}`);
    return null;
  }
  
  if (commits.length === 0) {
    return null;
  }
  
  // Group commits by month/version
  const changelog = generateMarkdown(name, version, commits);
  return changelog;
}

/**
 * Generate markdown changelog from commits
 */
function generateMarkdown(name, version, commits) {
  let markdown = `# Changelog\n\nAll notable changes to the ${name} component will be documented in this file.\n\n`;
  markdown += `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\n`;
  markdown += `and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n`;
  
  // Group commits by date (month)
  const grouped = {};
  commits.forEach(commit => {
    const month = commit.date.substring(0, 7); // YYYY-MM
    if (!grouped[month]) {
      grouped[month] = [];
    }
    grouped[month].push(commit);
  });
  
  // Generate sections for each month (reverse chronological)
  const months = Object.keys(grouped).reverse();
  
  months.forEach((month, index) => {
    const monthCommits = grouped[month];
    const versionNum = `${version.split('.')[0]}.${index}`;
    const dateObj = new Date(month + '-01');
    const dateStr = dateObj.toLocaleDateString('en-CA');
    
    markdown += `## [${versionNum}] - ${dateStr}\n\n`;
    
    // Categorize commits
    const categories = {
      'Added': [],
      'Changed': [],
      'Fixed': [],
      'Removed': []
    };
    
    monthCommits.forEach(commit => {
      const msg = commit.message;
      if (msg.startsWith('feat:') || msg.startsWith('add')) {
        categories['Added'].push(msg.replace(/^(feat:|add)\s*/i, ''));
      } else if (msg.startsWith('fix:')) {
        categories['Fixed'].push(msg.replace(/^fix:\s*/i, ''));
      } else if (msg.startsWith('refactor:') || msg.startsWith('update')) {
        categories['Changed'].push(msg.replace(/^(refactor:|update)\s*/i, ''));
      } else if (msg.startsWith('remove:') || msg.startsWith('delete')) {
        categories['Removed'].push(msg.replace(/^(remove:|delete)\s*/i, ''));
      } else {
        categories['Changed'].push(msg);
      }
    });
    
    // Output categories that have items
    ['Added', 'Changed', 'Fixed', 'Removed'].forEach(category => {
      if (categories[category].length > 0) {
        markdown += `### ${category}\n`;
        categories[category].forEach(item => {
          markdown += `- ${item}\n`;
        });
        markdown += '\n';
      }
    });
  });
  
  return markdown;
}
