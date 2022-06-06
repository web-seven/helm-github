FROM node:current-buster

USER root
RUN apt-get update && \
    apt-get install -y \
        curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 \
    && chmod +x get_helm.sh && ./get_helm.sh

ARG GITHUB_TOKEN=""
ARG GITHUB_REGCRED=""
ARG GITHUB_REPO=""
ARG GITHUB_PROXY_HOST_NAME=""
ARG GITHUB_PROXY_PORT=""
ARG GITHUB_CACHE_IN_MINUTES=""

ENV GITHUB_TOKEN=$GITHUB_TOKEN
ENV GITHUB_REGCRED=$GITHUB_REGCRED
ENV GITHUB_REPO=$GITHUB_REPO
ENV GITHUB_PROXY_HOST_NAME=$GITHUB_PROXY_HOST_NAME
ENV GITHUB_PROXY_PORT=$GITHUB_PROXY_PORT
ENV GITHUB_CACHE_IN_MINUTES=$GITHUB_CACHE_IN_MINUTES

RUN helm plugin install https://github.com/web-seven/helm-github.git

COPY ./server.js /usr/bin/server.js

CMD ["node", "/usr/bin/server.js"]