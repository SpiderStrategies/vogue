VERSION = $(shell node -e 'require("./package.json").version' -p)
HEADER = "/*!\n * vogue.js v$(VERSION) \n * Copyright 2012, Spider Strategies  \n * vogue.js may be freely distributed under the BSD license. \n*/"
DIST = dist/vogue-$(VERSION).js
MIN = dist/vogue-$(VERSION).min.js

clean:
	@rm -rf dist

build: clean
	@mkdir dist
	@cp src/vogue.css dist/vogue-$(VERSION).css
	@echo $(HEADER) > $(DIST) && cat src/vogue.js >> $(DIST)
	@echo $(HEADER) > $(MIN) && node_modules/.bin/uglifyjs src/vogue.js >> $(MIN)

test:
	@open test/runner.html

.PHONY: test
