bundle:
	node_modules/.bin/browserify -r ./vogue -r lodash:underscore -r jquery -o example/bundle.js -d

test: bundle
	@open test/runner.html

.PHONY: test bundle
