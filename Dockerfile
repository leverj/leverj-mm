FROM coinpit/nodejs:v8
ARG NPM_TOKEN
COPY . ./dist
RUN apt-get update && \
    apt-get install -y curl git && \
    echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> ~/.npmrc && \
    cd dist && npm install && useradd leverj && \
    RUN apt-get remove -y curl git && \
    rm -rf /var/lib/apt/lists/* && rm -f ~/.npmrc
USER leverj
WORKDIR dist
