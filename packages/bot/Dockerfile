FROM leverj/nodejs:v10.15.1
COPY src ./dist/src
COPY config ./dist/config
COPY ["package.json","yarn.lock","./dist/"]
RUN apt-get update && \
    apt-get install -y curl git && \
    cd dist && npm install -g yarn && \
    yarn install && \
    yarn audit && \
    useradd leverj && \
    apt-get remove -y curl git && \
    rm -rf /var/lib/apt/lists/* && \
     echo "done"
#USER leverj
WORKDIR dist
