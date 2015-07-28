BIN:=$(shell npm bin)

all: lib/_llvm-as.js

lib/_llvm-as.js: llvm-as.bc
	EMSCRIPTEN=~/dev/emscripten ~/dev/emscripten/emcc -O0 -s EXPORT_NAME=\"exports\" -s MODULARIZE=1 -s ASSERTIONS=0 -s AGGRESSIVE_VARIABLE_ELIMINATION=1 -v --llvm-lto 0 llvm-as.bc -o lib/_llvm-as.js
	echo "module.exports = exports;" >> lib/_llvm-as.js
	echo "if (typeof window === 'undefined') window={}; // make emscripten think it is in a browser" >> lib/_llvm-as.js

clean:
	rm lib/_llvm-as.js
	rm test/_test.js

test/_test.js: lib/_llvm-as.js test/test.js as.js decorate.js
	cat test/test.js|$(BIN)/brfs|$(BIN)/browserify - --noparse=$(shell pwd)/lib/_llvm-as.js > test/_test.js

.PHONY: test
test: test/_test.js
	DEBUG=* node test/_test.js
