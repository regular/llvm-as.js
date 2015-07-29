BIN:=$(shell npm bin)

all: lib/_llvm-as.js

lib/_llvm-as.js: llvm-as.bc
	EMSCRIPTEN=~/dev/emscripten ~/dev/emscripten/emcc \
	llvm-as.bc -o lib/_llvm-as.js \
	-s EXPORT_NAME=\"exports\" -s MODULARIZE=1 \
	-s ASSERTIONS=0 \
	-s NO_FILESYSTEM=0 \
	-s NO_BROWSER=1 \
	-s NODE_STDOUT_FLUSH_WORKAROUND=0 \
	-s NO_DYNAMIC_EXECUTION=1 \
	-s USE_SDL=0 \
	-s USE_SDL_IMAGE=0 \
	-v \
	-O0 \
	--llvm-lto 0 \
	-s AGGRESSIVE_VARIABLE_ELIMINATION=1
	echo "module.exports = exports;" >> lib/_llvm-as.js
	#echo "if (typeof window === 'undefined') window={}; // make emscripten think it is in a browser, even if it actually is running in Node. This prevents code from running that otherwise would prematurely exit() our process in the test suite" >> lib/_llvm-as.js

clean:
	rm lib/_llvm-as.js*

.PHONY: test
test: lib/_llvm-as.js
	#cp lib/_llvm-as.js.mem test
	cd test && cat test.js|$(BIN)/brfs|$(BIN)/browserify - --noparse=$(shell pwd)/lib/_llvm-as.js | $(BIN)/testling -u
