import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { compileEvents, staticHandler } from '../scripts/event-compiler.mjs';

test('dynamic quoted values stay data and handlers preserve this/event without evaluation', () => {
    const handlers = [], received = [];
    const payload = "safe');globalThis.pwned=true;//";
    const source = "const value = input; result = `<button onclick=\"send('${value}', this, event)\">OK</button>`;";
    const compiled = compileEvents(source);
    const context = { input: payload, window: { NoteEvents: { bind: fn => (handlers.push(fn), 'handler') } }, send: (...args) => received.push(args) };
    vm.runInNewContext(compiled.code, context);
    assert.match(context.result, /data-note-onclick="handler"/); assert.doesNotMatch(context.result, / onclick=/);
    const button = {}, event = {}; handlers[0].call(button, event);
    assert.deepEqual(received[0], [payload, button, event]); assert.equal(context.pwned, undefined);
});
test('string concatenation and HTML entities compile to ordinary functions', () => {
    const handlers = []; let value;
    const source = 'result = \'<button onclick="send(\\\'\' + input + \'\\\')">Test</button>\';';
    vm.runInNewContext(compileEvents(source).code, { input: 'synthetic', window: { NoteEvents: { bind: fn => (handlers.push(fn), 'x') } }, send: result => { value = result; } });
    handlers[0](); assert.equal(value, 'synthetic');
    assert.match(staticHandler('send(&quot;value&quot;); return false;'), /send\("value"\)/);
});
