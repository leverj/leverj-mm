# marketmaker
marketmaker for leverj.

### direct
```bash
$ git clone https://github.com/leverj/leverj-mm
$ cd leverj-mm
$ yarn
$ cd packages/bot/
$ NODE_ENV=<develop/kovan/ropsten/livenet> \
      BOT_APP=futures \
      INST_ID=<instrument_id> \
      QUANTITY=0.1 \
      STRATEGY=<COLLAR/EMA> \
      node src/mm.js </path/to/secret/file.json>
```

### using docker image
```bash
docker run --cap-drop ALL --read-only --restart=unless-stopped -d --name mm \
          -v </path/to/directory/of/secret/file>:/privateKey \
          -e NODE_ENV=<develop/kovan/ropsten/livenet> \
          -e BOT_APP=futures \
          -e INST_ID=<instrument_id> \
          -e QUANTITY=0.1 \
          leverj/leverj-mm:develop node src/mm.js /privateKey/<secretFile.json
```
