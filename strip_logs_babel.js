import fs from 'fs';
import path from 'path';
import { default as babelParser } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;

function removeConsoleLogs(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeConsoleLogs(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            try {
                // Parse the code into an AST
                const ast = babelParser.parse(content, {
                    sourceType: 'module',
                    plugins: ['jsx']
                });

                let rangesToRemove = [];
                traverse(ast, {
                    CallExpression(path) {
                        const callee = path.node.callee;
                        if (
                            callee.type === 'MemberExpression' &&
                            callee.object.name === 'console' &&
                            callee.property.name === 'log'
                        ) {
                            // Find the entire line or statement to remove
                            let start = path.node.start;
                            let end = path.node.end;

                            // Check if the preceding line context was a commented log, handled properly 
                            // by removing everything till semicolon

                            if (content[end] === ';') end++;
                            rangesToRemove.push({ start, end });
                        }
                    }
                });

                if (rangesToRemove.length > 0) {
                    // Sort descending to not mess up indices
                    rangesToRemove.sort((a, b) => b.start - a.start);
                    let newContent = content;
                    for (const { start, end } of rangesToRemove) {
                        newContent = newContent.slice(0, start) + newContent.slice(end);
                    }

                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    console.log(`Cleaned: ${fullPath} - removed ${rangesToRemove.length} logs`);
                }
            } catch (e) {
                console.error(`Error parsing ${fullPath}:`, e.message);
            }
        }
    }
}

removeConsoleLogs('C:/Users/pryoucan/Documents/Projects/botivate-website/src');
