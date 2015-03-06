
sample:
	cd ./sample && ../node_modules/.bin/gulp devs

test:
	./node_modules/.bin/mocha ./ \
		--reporter=spec \
		--bail

.PHONY: test sample
