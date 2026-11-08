import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment, serialize, serializeOuter, defaultTreeAdapter } from 'parse5';

// Vendor security fixes: https://github.com/inikulin/parse5/releases/tag/v8.1.1
// Synthetic strings/trees only; these checks perform no network or shop actions.
test('build parser preserves malformed Unicode without crashing or corrupting valid pairs', () => {
    const tag = 'x\uDC01\uDC02\uD83D\uDE00';
    const fragment = parseFragment(`<${tag}>fixture</${tag}>`);
    assert.equal(fragment.childNodes[0].tagName, tag);
    assert.equal(fragment.childNodes[0].childNodes[0].value, 'fixture');
    assert.equal(serialize(fragment), `<${tag}>fixture</${tag}>`);
});

test('build serializer handles deep trees without recursion and preserves all markup', () => {
    const depth = 6000;
    const fragment = defaultTreeAdapter.createDocumentFragment();
    let parent = fragment;
    for (let index = 0; index < depth; index++) {
        const node = defaultTreeAdapter.createElement('section', 'http://www.w3.org/1999/xhtml', []);
        defaultTreeAdapter.appendChild(parent, node);
        parent = node;
    }
    defaultTreeAdapter.insertText(parent, 'fixture & value');
    const expected = '<section>'.repeat(depth) + 'fixture &amp; value' + '</section>'.repeat(depth);
    assert.equal(serialize(fragment), expected);
    assert.equal(serializeOuter(fragment.childNodes[0]), expected);
});

test('foreign select elements cannot corrupt HTML table parsing or discard later cells', () => {
    const fragment = parseFragment('<table><td><svg><select><desc><table></table><td>fixture');
    const html = serialize(fragment);
    const expected = '<table><tbody><tr><td><svg><select><desc><table></table></desc></select></svg></td><td>fixture</td></tr></tbody></table>';
    assert.equal(html, expected);
    assert.equal(serialize(parseFragment(html)), expected);
});
