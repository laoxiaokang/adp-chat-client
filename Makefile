.PHONY: client server docs deploy build dev dev_withdb

SHELL := /bin/bash

-include Makefile.local

NPM_CACHE_VOLUME ?= adp-chat-client-npm-cache
PACK_TMP_ROOT ?= /tmp/adp-chat-client-pack

# ----------------- client -----------------

init_client:
	cd client && npm install

client:
	cd client && npm run build

test_client:
	cd client && npm run test --ws

# ----------------- server -----------------

init_server:
	cd server; uv sync

test_server:
	cd server; uv sync --all-extras
	source server/.venv/bin/activate; cd server; pytest test/unit_test -W ignore::DeprecationWarning

# ----------------- pack -----------------

build_server:
	mkdir -p build build/server
	rsync -avr --exclude='__pycache__' --exclude='.*' server/ build/server/

build_client:
	mkdir -p build build/client
	rm -rf $(PACK_TMP_ROOT)
	mkdir -p $(PACK_TMP_ROOT)/client $(PACK_TMP_ROOT)/server
	rsync -avr --delete --exclude='node_modules' --exclude='dist' --exclude='coverage' --exclude='.*' client/ $(PACK_TMP_ROOT)/client/
	docker run --rm -v $(PACK_TMP_ROOT):/build -v $(NPM_CACHE_VOLUME):/root/.npm -w /build node:22-bullseye-slim sh -c "cd client && (npm ci --prefer-offline --no-audit --fund=false || (echo '[build_client] npm ci failed, falling back to npm install'; npm cache verify >/dev/null 2>&1 || true; npm install --prefer-offline --no-audit --fund=false)) && npm run build"
	mkdir -p build/server/static
	rsync -avr --delete $(PACK_TMP_ROOT)/server/static/ build/server/static/

build_component:
	cd client && npm run build_component

build:
	mkdir -p build
	make build_server
	make build_client

clean:
	rm -rf build

pack: build
	DOCKER_BUILDKIT=1 docker build -t adp-chat-client -f docker/Dockerfile build/server
	# 通过rsync -L把符号链接替换为实际文件

push_image:
	docker tag adp-chat-client mirrors.tencent.com/ti-machine-learning/adp-chat-client:0.0.2
	docker push mirrors.tencent.com/ti-machine-learning/adp-chat-client:0.0.2

pull_image:
	docker pull mirrors.tencent.com/ti-machine-learning/adp-chat-client:0.0.2

# ----------------- deploy -----------------

stop:
	@bash script/deploy.sh stop

deploy:
	@bash script/deploy.sh deploy

login:
	@bash script/deploy.sh login

logs:
	@bash script/deploy.sh logs

init_env:
	sudo bash script/init_env.sh

url:
	@bash script/deploy.sh run "python main.py --generate-customer-account-url --uid 1 --username test"

# ----------------- dev -----------------

dev:
	npx concurrently "make run_server" "make run_client" "make run_component_example" --names server,ui,component --prefix-colors blue,green,yellow --kill-others

dev_withdb:
	npx concurrently "bash script/deploy.sh dev_withdb" "bash script/deploy.sh wait_devdb && make run_server" "make run_client" "make run_component_example" --names db,server,ui,component --prefix-colors magenta,blue,green,yellow --kill-others

run_client:
	set -a && source server/.env && set +a; cd client; npm run dev

run_component_example:
	set -a && source server/.env && set +a; cd client/packages/adp-chat-component-example/vue-init-example; npm run dev

run_server:
	source server/.venv/bin/activate; set -a && source server/.env && set +a; export SANIC_WORKER_ACK_THRESHOLD=$${SANIC_WORKER_ACK_THRESHOLD:-120}; cd server; sanic app_factory:create_app --factory --reload --reload-dir=./ -H 0.0.0.0 -p $$SERVER_HTTP_PORT
