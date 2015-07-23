llvm-as.js: shell-as-pre.js shell-as-post.js llvm-as_temp.js
	cat shell-as-pre.js > llvm-as.js
	cat llvm-as_temp.js >> llvm-as.js
	cat shell-as-post.js >> llvm-as.js

llvm-as_temp.js: llvm-as.bc
	emcc --memory-init-file 0 -O2 --closure 0  -s NO_EXIT_RUNTIME=1 -s AGGRESSIVE_VARIABLE_ELIMINATION=1 -v --llvm-lto 3 llvm-as.bc -o llvm-as_temp.js

