BIN:=$(shell npm bin)

all: lib/_llvm-as.js index.html

lib/_llvm-as.js: shell-as-pre.js shell-as-post.js build/llvm-as_temp.js
	cat shell-as-pre.js > lib/_llvm-as.js
	cat build/llvm-as_temp.js >> lib/_llvm-as.js
	cat shell-as-post.js >> lib/_llvm-as.js

build/llvm-as_temp.js: llvm-as.bc
	mkdir -p build
	EMSCRIPTEN=~/dev/emscripten ~/dev/emscripten/emcc -O0 -s ASSERTIONS=0 -s AGGRESSIVE_VARIABLE_ELIMINATION=1 -v --llvm-lto 0 llvm-as.bc -o build/llvm-as_temp.js

index.html: index.jade
	$(BIN)/jade index.jade

clean:
	rm -rf build

test: lib/_llvm-as.js
	cat test.js|$(BIN)/brfs|$(BIN)/browserify - --noparse=$(shell pwd)/lib/_llvm-as.js|node

