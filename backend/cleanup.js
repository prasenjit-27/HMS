const fs = require('fs');
const path = require('path');
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}]/gu;
const directories = ['backend', 'frontend'];
const root = path.join(__dirname, '..');
const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  content = content.replace(/HMS/g, 'HMS');
  content = content.replace(/HMS/g, 'HMS');
  content = content.replace(emojiRegex, '');
  if (filePath.endsWith('.js') && !filePath.includes('node_modules')) {
    content = content.replace(/\/\*[\s\S]*?\*\
    content = content.replace(/(?<!:)\/\/.*/g, '');
  } else if (filePath.endsWith('.css')) {
    content = content.replace(/\/\*[\s\S]*?\*\
  } else if (filePath.endsWith('.html')) {
    content = content.replace(/<!--[\s\S]*?-->/g, '');
  }
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Modified:', filePath);
  }
};
const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules') {
        walkSync(fullPath);
      }
    } else {
      if (fullPath.endsWith('.js') || fullPath.endsWith('.html') || fullPath.endsWith('.css') || fullPath.endsWith('.md')) {
        processFile(fullPath);
      }
    }
  }
};
directories.forEach(dir => {
  const fullDirPath = path.join(root, dir);
  if (fs.existsSync(fullDirPath)) {
    walkSync(fullDirPath);
  }
});
console.log('Cleanup script finished.');
