var as = require('./as');
var fs = require('fs');
var source = fs.readFileSync(__dirname + '/test.ll', 'utf-8');

as('\nSyntaxerror\n', function(err, data, messages, parsedMessages) {
    console.log(err, data, messages, parsedMessages);
    as(source, function(err, data, messages, parsedMessages) {
        console.log(err, data, messages, parsedMessages);
    });
});
