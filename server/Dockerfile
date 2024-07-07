FROM node:22-alpine3.20 as build-stage

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package*.json .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --registry=https://registry.npmmirror.com/

COPY . .

# Trying to freshly install prisma client every time as suggested here: https://github.com/prisma/prisma/issues/7234#issuecomment-846606919
RUN pnpm dlx prisma generate

RUN pnpm run build

# production stage
FROM node:22-alpine3.20 as production-stage

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY --from=build-stage /app/dist /app
COPY --from=build-stage /app/package.json /app/package.json
COPY --from=build-stage /app/prisma /app/prisma

WORKDIR /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --registry=https://registry.npmmirror.com/

RUN pnpm dlx prisma generate

EXPOSE 3000

CMD ["node", "/app/main.js"]
