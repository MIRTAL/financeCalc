# Finance Calculator

Spring Boot backend + React (Vite) frontend.

## Требования

- **Java 25**
- **Maven** (или встроенный `mvnw.cmd`)
- **PostgreSQL**
- **Node.js** (для фронтенда)

## Запуск

### 1. База данных

Создайте базу данных в PostgreSQL:

```powershell
psql -U postgres -c "CREATE DATABASE finance_calc;"
```
Запускаем сервер PostgreSQL.

Теперь нужно запустить сам сервер (процесс postgres), чтобы он начал слушать подключения.

```powershell
pg_ctl -D "D:\PostgresSQL\18\data" -l "D:\PostgresSQL\18\logfile.log" start
```
Флаг -l указывает файл, куда будут писаться логи (ошибки и события). Это очень полезно для отладки.

### Вы должны увидеть сообщение: server starting или waiting for server to start.... done.

## Как остановить сервер
Когда вы закончите работу и захотите выключить сервер PostgreSQL, выполните в обычной CMD:
```powershell
pg_ctl -D "D:\PostgresSQL\18\data" stop
```

## Зарегистрировать PostgreSQL как службу Windows.
Откройте CMD от имени АДМИНИСТРАТОРА (на этот раз права нужны!).
Выполните команду для регистрации службы:
```powershell
pg_ctl register -N "PostgreSQL_18" -D "D:\PostgresSQL\18\data"
```
Теперь откройте стандартную оснастку Windows «Службы» (нажмите Win + R, введите services.msc).
Найдите в списке службу PostgreSQL_18.
Дважды кликните по ней, установите «Тип запуска» -> Автоматически, и нажмите кнопку Запустить.

Теперь база будет работать в фоне всегда, как при обычной установке через графический инсталлятор!

Настройки подключения: `src/main/resources/application.yml`
- Host: `localhost:5432`
- User: `postgres`
- Password: `postgres`

### 2. Бэкенд (Spring Boot)

```powershell
.\mvnw.cmd spring-boot:run
```

Запускается на `http://localhost:8080`.

### 3. Фронтенд (React + Vite)

```powershell
cd frontend
npm install
npm run dev
```

Запускается на `http://localhost:5173`.
