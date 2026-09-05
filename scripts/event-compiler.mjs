import { parse, parseExpression } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { parseFragment } from 'parse5';

const marker = index => '__NOTE_VALUE_' + index + '__';
const markerPattern = /__NOTE_VALUE_(\d+)__/g;
function decodeHtml(text) { return parseFragment('<textarea>' + text.replace(/<\/textarea/gi, '&lt;/textarea') + '</textarea>').childNodes[0].childNodes.map(node => node.value || '').join(''); }
function flatten(node, expressions) {
    if (t.isStringLiteral(node)) return node.value;
    if (t.isTemplateLiteral(node)) return node.quasis.map((part, i) => (part.value.cooked ?? part.value.raw) + (i < node.expressions.length ? flatten(node.expressions[i], expressions) : '')).join('');
    const stringExpression = value => t.isStringLiteral(value) || t.isTemplateLiteral(value) || (t.isBinaryExpression(value, { operator: '+' }) && (stringExpression(value.left) || stringExpression(value.right)));
    if (t.isBinaryExpression(node, { operator: '+' }) && stringExpression(node)) return flatten(node.left, expressions) + flatten(node.right, expressions);
    expressions.push(node); return marker(expressions.length - 1);
}
function interpolate(value, expressions) {
    const parts = []; let offset = 0;
    for (const match of value.matchAll(markerPattern)) {
        parts.push(t.stringLiteral(value.slice(offset, match.index)), t.cloneNode(expressions[Number(match[1])], true)); offset = match.index + match[0].length;
    }
    parts.push(t.stringLiteral(value.slice(offset)));
    return parts.reduce((left, right) => left ? t.binaryExpression('+', left, right) : right, null);
}
function handlerFunction(code, captures = new Map()) {
    const fn = parseExpression('(function(event){' + decodeHtml(code) + '\n})');
    const wrapper = t.file(t.program([t.expressionStatement(fn)]));
    traverse(wrapper, {
        StringLiteral(path) {
            if (!/__NOTE_VALUE_\d+__/.test(path.node.value)) return;
            const substitutions = [];
            for (const [index, name] of captures) substitutions[index] = t.identifier(name);
            path.replaceWith(interpolate(path.node.value, substitutions)); path.skip();
        },
        ReferencedIdentifier(path) {
            const match = path.node.name.match(/^__NOTE_VALUE_(\d+)__$/);
            if (match && captures.has(Number(match[1]))) path.replaceWith(t.identifier(captures.get(Number(match[1]))));
        }
    });
    return fn;
}
export function staticHandler(code) { return generate(handlerFunction(code)).code; }

export function compileEvents(source, filename = 'source.js') {
    const ast = parse(source, { sourceType: 'script', sourceFilename: filename });
    let count = 0;
    function transform(path) {
        if (path.findParent(parent => parent.isDirective())) return;
        if (path.isBinaryExpression() && path.node.operator !== '+') return;
        if (path.parentPath.isBinaryExpression({ operator: '+' })) return;
        // Object keys and import-like paths are not HTML templates.
        if (path.isStringLiteral() && path.parentPath.isObjectProperty() && path.key === 'key') return;
        const expressions = []; let html = flatten(path.node, expressions);
        if (!/<[a-z!/][\s\S]*\son[a-z]+\s*=/i.test(html)) return;
        let changed = false;
        html = html.replace(/\s(on[a-z]+)\s*=\s*(["'])([\s\S]*?)\2/gi, (_match, attr, _quote, code) => {
            const captures = new Map();
            for (const value of code.matchAll(markerPattern)) {
                const index = Number(value[1]); if (!captures.has(index)) captures.set(index, 'noteValue' + index);
            }
            const fn = handlerFunction(code, captures);
            const bind = t.callExpression(t.memberExpression(t.memberExpression(t.identifier('window'), t.identifier('NoteEvents')), t.identifier('bind')), [fn]);
            const expression = captures.size ? t.callExpression(t.arrowFunctionExpression([...captures.values()].map(name => t.identifier(name)), bind), [...captures.keys()].map(index => t.cloneNode(expressions[index], true))) : bind;
            expressions.push(expression); changed = true; count++;
            return ' data-note-' + attr.toLowerCase() + '="' + marker(expressions.length - 1) + '"';
        });
        if (changed) { path.replaceWith(interpolate(html, expressions)); path.skip(); }
    }
    traverse(ast, { TemplateLiteral: { exit: transform }, BinaryExpression: { exit: transform }, StringLiteral: { exit: transform } });
    return { code: generate(ast, { comments: true, compact: false }).code + '\n', count };
}
