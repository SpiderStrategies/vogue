bundle:
	node_modules/.bin/browserify -r ./vogue -o example/bundle.js

test: bundle
	@open test/runner.html

.PHONY: test bundle
