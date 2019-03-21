FROM coinpit/nodejs
COPY dist ./dist
RUN cd dist && npm install -production
ENV BLUEBIRD_DEBUG 1
WORKDIR /dist
EXPOSE 8090
CMD node src/index.js
