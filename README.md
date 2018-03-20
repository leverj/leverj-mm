# marketmaker
marketmaker for leverj.

### direct
```bash
$ git clone https://github.com/leverj/leverj-mm
$ cd leverj-mm
$ npm install
$ BASE_URL=https://live-dev.leverj.io node src/mm.js </path/to/secret/file.json>
```

### using docker image
```bash
docker run -d --name mm -v </path/to/directory/of/secret/file>:/privateKey -e BASE_URL=https://live-dev.leverj.io leverj/leverj-mm:develop node src/mm.js /privateKey/<secretFile.json
```
