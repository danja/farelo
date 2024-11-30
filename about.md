Restart:

```sh
docker-compose down --volumes  # Remove containers and volumes
docker-compose build --no-cache  # Rebuild without cache
docker-compose up -d  # Start fresh

docker-compose logs
```
