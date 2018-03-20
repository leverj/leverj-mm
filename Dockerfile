FROM coinpit/nodejs:v8
COPY . ./dist
RUN apt-get update
RUN apt-get install -y curl git
#RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
#RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
#RUN apt-get update
#RUN apt-get install -y yarn
RUN cd dist && npm install && useradd leverj
RUN apt-get remove -y curl git
RUN rm -rf /var/lib/apt/lists/*
#EXPOSE 9000
USER leverj
WORKDIR dist
