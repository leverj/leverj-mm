FROM leverj/nodejs:v10.21.0
COPY dist ./dist
RUN apk add --no-cache --virtual .build-deps-full binutils-gold g++ gcc gnupg libgcc linux-headers make python curl git && \
    cd dist && npm install -g yarn && \
    yarn install && \
    adduser -D leverj && \
    apk del  .build-deps-full && \
    echo "done"
#USER leverj
WORKDIR dist
