#!/bin/bash
BOT_NAME=${BOT_NAME:-emabot}
[ "$1" == "stop" ] && docker stop $BOT_NAME && exit $!
KEY_FILE=$1
[ -z "$KEY_FILE" ] && echo usage: $0 keyfile.json && exit 1
[ ! -f "$KEY_FILE" ] && echo File not found: $KEY_FILE && exit 1
KEY_FOLDER=$(dirname $KEY_FILE)
KEY=$(basename $KEY_FILE)

DOCKER_IMG=leverj/leverj-mm:develop

OLD=$(docker ps -aqf name=$BOT_NAME)
[ -n "$OLD" ] && docker stop $OLD && docker rm $OLD

ENVS="-e NODE_ENV=develop -e BOT_APP=spot -e STRATEGY=EMA -e QUANTITY=0.1 -e INST_ID=LEVETH"
docker run --cap-drop ALL --read-only --restart=unless-stopped --name "$BOT_NAME" \
        -d -v $KEY_FOLDER:/privateKey \
        $ENVS \
        $DOCKER_IMG node src/mm.js /privateKey/$KEY
