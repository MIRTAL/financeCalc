#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Конфигурация
IMAGE_NAME="postgres"
IMAGE_TAG="1.0"
CONTAINER_NAME="local-postgres"
DB_NAME="finance_calc"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_PORT="5432"
VOLUME_NAME="pgdata_finance"

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker не установлен!${NC}"
    exit 1
fi

echo -e "${YELLOW}🔨 Сборка образа ${IMAGE_NAME}:${IMAGE_TAG}...${NC}"
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка сборки образа!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Образ успешно собран${NC}"

# Остановка и удаление старого контейнера
echo -e "${YELLOW}🧹 Очистка старого контейнера...${NC}"
docker stop ${CONTAINER_NAME} 2>/dev/null
docker rm ${CONTAINER_NAME} 2>/dev/null

# Создание тома (если не существует)
#if ! docker volume inspect ${VOLUME_NAME} &>/dev/null; then
#    echo -e "${YELLOW}📦 Создание тома ${VOLUME_NAME}...${NC}"
#    docker volume create ${VOLUME_NAME}
#fi

# Запрос пароля
#read -sp "Введите пароль для PostgreSQL: " DB_PASSWORD
#echo

# Запуск контейнера
echo -e "${YELLOW}🚀 Запуск контейнера...${NC}"
docker run -d \
  --name ${CONTAINER_NAME} \
  -e POSTGRES_USER=${DB_USER} \
  -e POSTGRES_DB=${DB_NAME} \
  -e POSTGRES_PASSWORD=${DB_PASSWORD} \
  -p ${DB_PORT}:5432 \
  ${IMAGE_NAME}:${IMAGE_TAG}

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка запуска контейнера!${NC}"
    exit 1
fi

## Ожидание готовности БД
#echo -e "${YELLOW}⏳ Ожидание готовности БД...${NC}"
#sleep 5
#
## Проверка здоровья
#if docker exec ${CONTAINER_NAME} pg_isready -U ${DB_USER} -d ${DB_NAME} &>/dev/null; then
#    echo -e "${GREEN}✅ БД готова к работе!${NC}"
#    echo -e "${GREEN}📊 Подключение: postgresql://${DB_USER}@localhost:${DB_PORT}/${DB_NAME}${NC}"
#else
#    echo -e "${YELLOW}⚠️  БД еще запускается, проверьте логи: docker logs ${CONTAINER_NAME}${NC}"
#fi

echo -e "${GREEN}🎉 Готово!${NC}"