import fs from 'fs';
import path from 'path';

function removeCommentedLogs(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeCommentedLogs(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content.replace(/^[ \t]*(\/\/|\/\*)[ \t\/*]*console\.log[\s\S]*?(\*\/)?\r?\n/gm, '');
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Cleaned comments from: ${fullPath}`);
            }
        }
    }
}

removeCommentedLogs('C:/Users/pryoucan/Documents/Projects/botivate-website/src');
