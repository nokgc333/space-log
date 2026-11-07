ARG PW_VERSION=1.64.1
FROM mcr.microsoft.com/playwright:v${PW_VERSION}-noble

RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
  && apt-get install -y nodejs
