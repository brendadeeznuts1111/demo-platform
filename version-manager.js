#!/usr/bin/env bun

// @DEMO Version Management System
// Professional version control and release management

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

class VersionManager {
  constructor() {
    this.packagePath = './package.json';
    this.changelogPath = './CHANGELOG.md';
    this.currentVersion = this.getCurrentVersion();
    this.versionTypes = ['major', 'minor', 'patch'];
  }

  getCurrentVersion() {
    try {
      const packageJson = JSON.parse(readFileSync(this.packagePath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      console.error('❌ Error reading package.json:', error.message);
      process.exit(1);
    }
  }

  async bumpVersion(type = 'patch') {
    if (!this.versionTypes.includes(type)) {
      console.error('❌ Invalid version type. Use: major, minor, or patch');
      process.exit(1);
    }

    const [major, minor, patch] = this.currentVersion.split('.').map(Number);
    let newVersion;

    switch (type) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }

    console.log(`📦 Bumping version from ${this.currentVersion} to ${newVersion}`);
    
    // Update package.json
    this.updatePackageVersion(newVersion);
    
    // Update changelog
    this.updateChangelog(newVersion, type);
    
    // Create git tag and commit
    this.createReleaseCommit(newVersion, type);
    
    console.log(`✅ Version successfully bumped to ${newVersion}`);
    return newVersion;
  }

  updatePackageVersion(newVersion) {
    try {
      const packageJson = JSON.parse(readFileSync(this.packagePath, 'utf8'));
      packageJson.version = newVersion;
      
      // Update build timestamp
      packageJson.buildTime = new Date().toISOString();
      
      writeFileSync(this.packagePath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Updated package.json');
    } catch (error) {
      console.error('❌ Error updating package.json:', error.message);
      process.exit(1);
    }
  }

  updateChangelog(newVersion, type) {
    try {
      let changelog = readFileSync(this.changelogPath, 'utf8');
      
      const date = new Date().toISOString().split('T')[0];
      const versionHeader = `## [${newVersion}] - ${date}`;
      
      const changes = this.generateChangesList(type);
      const newEntry = `\n${versionHeader}\n\n${changes}\n\n---\n`;
      
      // Insert after the first header
      const insertPosition = changelog.indexOf('\n---\n') + 5;
      changelog = changelog.slice(0, insertPosition) + newEntry + changelog.slice(insertPosition);
      
      writeFileSync(this.chelogPath, changelog);
      console.log('✅ Updated CHANGELOG.md');
    } catch (error) {
      console.error('❌ Error updating changelog:', error.message);
      process.exit(1);
    }
  }

  generateChangesList(type) {
    const changes = {
      major: [
        '### 🌟 MAJOR RELEASE',
        '- Breaking changes introduced',
        '- New architecture and features',
        '- Updated dependencies and requirements'
      ],
      minor: [
        '### ✨ NEW FEATURES',
        '- Enhanced functionality added',
        '- New capabilities integrated',
        '- Performance improvements'
      ],
      patch: [
        '### 🐛 BUG FIXES',
        '- Resolved critical issues',
        '- Security patches applied',
        '- Stability improvements'
      ]
    };
    
    return changes[type].join('\n');
  }

  createReleaseCommit(newVersion, type) {
    try {
      const message = `🚀 chore: Release v${newVersion} - ${type} update`;
      
      execSync('git add package.json CHANGELOG.md', { stdio: 'inherit' });
      execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
      execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
      
      console.log('✅ Created release commit and tag');
    } catch (error) {
      console.error('❌ Error creating git commit:', error.message);
      process.exit(1);
    }
  }

  async release() {
    console.log('🚀 Starting release process...');
    
    // Run tests
    console.log('🧪 Running tests...');
    try {
      execSync('bun test', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Tests failed. Aborting release.');
      process.exit(1);
    }
    
    // Build project
    console.log('🔨 Building project...');
    try {
      execSync('bun run build', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Build failed. Aborting release.');
      process.exit(1);
    }
    
    // Create release
    const newVersion = await this.bumpVersion('patch');
    
    console.log(`🎉 Release v${newVersion} completed successfully!`);
    console.log('📝 Don\'t forget to:');
    console.log('   1. Push changes: git push origin main --tags');
    console.log('   2. Create GitHub release');
    console.log('   3. Deploy to production');
  }

  getReleaseInfo() {
    const packageJson = JSON.parse(readFileSync(this.packagePath, 'utf8'));
    
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      author: packageJson.author,
      license: packageJson.license,
      repository: packageJson.repository?.url,
      buildTime: packageJson.buildTime || 'Unknown',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
  }

  validateVersion() {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    
    if (!versionRegex.test(this.currentVersion)) {
      console.error('❌ Invalid version format. Expected: X.Y.Z');
      process.exit(1);
    }
    
    console.log(`✅ Version ${this.currentVersion} is valid`);
    return true;
  }

  checkForUpdates() {
    console.log('🔍 Checking for available updates...');
    
    try {
      // Simulate checking for updates (in real implementation, this would check npm registry)
      const latestVersion = '2.0.1';
      const current = this.currentVersion;
      
      if (this.compareVersions(latestVersion, current) > 0) {
        console.log(`📦 Update available: ${current} → ${latestVersion}`);
        console.log('   Run "npm install @demo-platform/distributed-systems@latest" to update');
      } else {
        console.log('✅ You are using the latest version');
      }
    } catch (error) {
      console.error('❌ Error checking for updates:', error.message);
    }
  }

  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    
    return 0;
  }

  generateVersionReport() {
    const info = this.getReleaseInfo();
    
    console.log('\n📊 DEMO Platform Version Report');
    console.log('================================');
    console.log(`📦 Package: ${info.name}`);
    console.log(`🏷️  Version: ${info.version}`);
    console.log(`📝 Description: ${info.description}`);
    console.log(`👤 Author: ${info.author?.name || 'Unknown'}`);
    console.log(`📜 License: ${info.license}`);
    console.log(`🔗 Repository: ${info.repository}`);
    console.log(`⏰ Build Time: ${info.buildTime}`);
    console.log(`🟢 Node.js: ${info.nodeVersion}`);
    console.log(`💻 Platform: ${info.platform} (${info.arch})`);
    console.log('================================\n');
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const type = process.argv[3];
  
  const versionManager = new VersionManager();
  
  switch (command) {
    case 'bump':
      await versionManager.bumpVersion(type || 'patch');
      break;
      
    case 'release':
      await versionManager.release();
      break;
      
    case 'info':
      versionManager.generateVersionReport();
      break;
      
    case 'validate':
      versionManager.validateVersion();
      break;
      
    case 'check':
      versionManager.checkForUpdates();
      break;
      
    case 'current':
      console.log(`📦 Current version: ${versionManager.currentVersion}`);
      break;
      
    default:
      console.log('🚀 DEMO Platform Version Manager');
      console.log('================================');
      console.log('');
      console.log('Commands:');
      console.log('  bump [type]    Bump version (major|minor|patch)');
      console.log('  release        Create a new release');
      console.log('  info           Show version information');
      console.log('  validate       Validate current version');
      console.log('  check          Check for updates');
      console.log('  current        Show current version');
      console.log('');
      console.log('Examples:');
      console.log('  bun version-manager.js bump patch');
      console.log('  bun version-manager.js release');
      console.log('  bun version-manager.js info');
      break;
  }
}

// Export for use in other modules
export { VersionManager };

// Run CLI if called directly
if (import.meta.main) {
  main().catch(console.error);
}
