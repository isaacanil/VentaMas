// Script para tipar múltiples slices automáticamente
const fs = require('fs');
const path = require('path');

const slicesToFix = [
  'src/features/Alert/AlertSlice.ts',
  'src/features/loader/loaderSlice.ts',
  'src/features/navigation/navigationSlice.ts',
  'src/features/uploadImg/uploadImageSlice.ts',
  'src/features/auth/userSlice.ts',
  'src/features/auth/businessSlice.ts',
  'src/features/appModes/appModeSlice.ts',
];

function fixSlice(filePath) {
  const fullPath = path.join(
    'c:/Users/jonat/OneDrive/Documentos/VentaMas',
    filePath,
  );

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace state: any with state: any (will be typed later)
  content = content.replace(/\(state: any\)/g, '(state)');
  content = content.replace(/export const select\w+ = \(state\)/g, (match) => {
    return match.replace('(state)', '(state: any)');
  });

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Fixed: ${filePath}`);
  return true;
}

slicesToFix.forEach(fixSlice);
console.log('Done!');
