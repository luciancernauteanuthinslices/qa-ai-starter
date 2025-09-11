import fs from 'fs';
import path from 'path';

// Directory containing the generated test files
const TEST_DIR = path.join(__dirname, '..', 'tests', 'e2e', 'generated');

// Function to update import paths in a file
function updateImports(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace any imports from 'tests/pages/...' to '../../pages/...'
  content = content.replace(
    /from '(?:..\/)*tests\/pages\/([^']+)'/g, 
    "from '../../../pages/$1'"
  );
  
  // Also fix any relative paths that might be incorrect
  content = content.replace(
    /from '(?:\.\.\/)+pages\/([^']+)'/g, 
    "from '../../../pages/$1'"
  );
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

// Process all .spec.ts files in the test directory
function processTestFiles() {
  const files = fs.readdirSync(TEST_DIR)
    .filter(file => file.endsWith('.spec.ts'))
    .map(file => path.join(TEST_DIR, file));
  
  files.forEach(file => {
    console.log(`Updating imports in ${path.basename(file)}`);
    updateImports(file);
  });
  
  console.log('\n✅ All test file imports have been updated!');
}

processTestFiles();
