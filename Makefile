bundle:
	node_modules/.bin/browserify -r ./vogue -r jquery -o example/bundle.js

test: bundle
	@open test/runner.html

.PHONY: test bundle
