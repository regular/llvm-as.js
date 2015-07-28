var as = require('../as');
var fs = require('fs');
var test = require('tape');
var source = fs.readFileSync(__dirname + '/fixtures/test.ll', 'utf-8');
var bc = fs.readFileSync(__dirname + '/fixtures/test.bc');

test('nested calls should be possible', function(t) {
    as('\nSyntaxerror\n', function(err, data, messages, pm) {
        t.ok(err, 'should have error');
        t.notOk(data, 'should not have data');
        t.equal(pm.length, 1, 'should have one message');
        t.equal(pm[0].column, 1, 'at column 1');
        t.equal(pm[0].line, 2, 'at line 1');
        t.equal(pm[0].severity, 'error', 'of severity "error"');

        as(source, function(err, data, messages, parsedMessages) {
            t.notOk(err, 'should have no error');
            t.ok(data, 'should have data');
            t.equal(messages.length, 0, 'should have no messages');
            t.equal(parsedMessages.length, 0, 'should have no parsed messages');
            t.deepEqual(data, bc);
            t.end();
        });
    });
});
