const fs = require('fs');
const path = require('path');

function removeConsoleLogs(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeConsoleLogs(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // Replaces lines consisting primarily of console.log
            let newContent = content.replace(/^[ \t]*console\.log\s*\(.*?\);?[ \t]*\r?\n/gm, '');
            // Replaces remaining inline console.logs
            newContent = newContent.replace(/console\.log\s*\(.*?\);?/g, '');

            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Cleaned: ${fullPath}`);
            }
        }
    }
}

removeConsoleLogs('c:/Users/pryoucan/Documents/Projects/botivate-website/src');
