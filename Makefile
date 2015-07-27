BIN:=$(shell npm bin)

all: lib/_llvm-as.js

lib/_llvm-as.js: llvm-as.bc
	EMSCRIPTEN=~/dev/emscripten ~/dev/emscripten/emcc -O0 -s EXPORT_NAME=\"exports\" -s MODULARIZE=1 -s ASSERTIONS=0 -s AGGRESSIVE_VARIABLE_ELIMINATION=1 -v --llvm-lto 0 llvm-as.bc -o lib/_llvm-as.js
	echo "module.exports = exports;" >> lib/_llvm-as.js

clean:
	rm lib/_llvm-as.js

test: lib/_llvm-as.js
	cat test.js|$(BIN)/brfs|$(BIN)/browserify - --noparse=$(shell pwd)/lib/_llvm-as.js|node

