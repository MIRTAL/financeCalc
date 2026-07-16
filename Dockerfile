# 1. Базовый образ (выбираем конкретную версию для стабильности)
FROM postgres:18

# 2. Метаданные образа (полезно для документирования)
LABEL maintainer="sergogoja"
LABEL description="Custom PostgreSQL with pre-configured schema"

# 3. Переменные окружения (можно переопределить при docker run)
ENV POSTGRES_DB=finance_calc
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV PORT=5432
#ENV PGDATA=/var/lib/postgresql/data/pgdata


# 4. Копируем кастомный конфиг PostgreSQL
COPY --chown=postgres:postgres postgresql.conf /etc/postgresql/postgresql.conf


# 5. Копируем скрипты инициализации (ВАЖНО: порядок имеет значение!)
#    Файлы выполняются в алфавитном порядке
COPY schema.sql /docker-entrypoint-initdb.d/

# 6. Указываем, где лежит кастомный конфиг
RUN echo "include '/etc/postgresql/postgresql.conf'" >> /usr/share/postgresql/postgresql.conf.sample

# 7. Открываем порт (документация)
EXPOSE ${PORT}

# 8. Healthcheck — K8s и Docker будут знать, что БД готова принимать запросы
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} || exit 1

# 9. Команда запуска (обычно не нужно переопределять, но можно)
# CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]